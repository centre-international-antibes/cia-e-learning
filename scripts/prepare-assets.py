#!/usr/bin/env python3
"""Prepare media for the CIA presentation film.

Reads assets-src/ (never modified) and writes clean, renamed, render-friendly
copies into public/:
  - photos  : renamed, EXIF-rotated, max 2560 px wide, JPEG q88
  - video   : selected extracts, muted, CIA watermark / third-party badges
              removed by a <= 1.08 crop (+ delogo on the last sliver)
  - fonts   : Nunito Sans / Noto (OFL, from @fontsource) + Avenir Next /
              Better Together when present in assets-src/fonts/
Writes src/presentation/assets.generated.json (which fonts are available).

Usage: python3 scripts/prepare-assets.py
"""
import json
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
PUB = ROOT / "public"

# ---------------------------------------------------------------- photos ---
# original name -> clean name. Only the photos the film can use (see README).
PHOTOS = {
    "le-port-balcony-view-port-vauban.jpg": "le-port-balcony-view-port-vauban.jpg",
    "le-port-class-adults-groupwork.jpg": "le-port-class-adults-groupwork.jpg",
    "le-port-class-adults-a.jpg": "le-port-class-adults-a.jpg",
    "cooking-workshop-chef-b.jpg": "cooking-workshop-chef-b.jpg",
    "cooking-pastry-fraisier-vertical.jpg": "cooking-pastry-fraisier-vertical.jpg",
    "castel-arabel-facade-tower.jpg": "castel-arabel-facade-tower.jpg",
    "castel-arabel-arches-vertical.jpg": "castel-arabel-arches-vertical.jpg",
    "Photos CHATEAU Haute résolution-22.JPG": "le-chateau-garden-a.jpg",
    "Photos CHATEAU Haute résolution-23.JPG": "le-chateau-terrace-b.jpg",
    "Photos CHATEAU Haute résolution-41.JPG": "le-chateau-terrace-c.jpg",
    "test (10 sur 27).jpg": "juniors-class-teacher-whiteboard.jpg",
}
# Free-licence media downloaded by scripts/download-media.sh
DOWNLOADED = {
    "cannes-vieux-port-wikimedia.jpg": "cannes-vieux-port-wikimedia.jpg",
}

# ----------------------------------------------------------------- video ---
V1 = "centre_international_antibes_cours_de_français_v1 (1080p).mp4"
V3 = "junior_program_centre_international_antibes_v1 (1080p).mp4"

# Crop windows (source 1920x1080). Scale back to 1080p = zoom 1.08.
# v1 carries the CIA watermark bottom-left (x 20-280, y 985-1050):
# delogo the whole mark on the full frame, then keep the top-right 1778x1000 window.
CROP_TR = "delogo=x=12:y=972:w=284:h=90,crop=1778:1000:142:0,scale=1920:1080:flags=lanczos"
NO_CROP = "scale=1920:1080:flags=lanczos"
# v3 opening shot: "40 ans" badge bottom-left (x 15-420, y 855-1005) → delogo + same top-right crop
CROP_V3 = "delogo=x=10:y=850:w=420:h=170,crop=1778:1000:142:0,scale=1920:1080:flags=lanczos"
# NB: the catamaran close-up (v3 8.6-10 s) shows a legible boat brand mid-shot → not used.

CLIPS = [
    # name, source, start, end, filter, slow factor (1 = real time)
    ("riviera-aerial-bay.mp4", V1, 0.00, 4.30, CROP_TR, 1.70),
    ("learn-hand-writing.mp4", V1, 32.24, 33.36, CROP_TR, 1.0),
    ("live-antibes-ramparts-aerial.mp4", V1, 53.90, 56.30, CROP_TR, 1.45),
    # catamarans sailing offshore; the "40 ans" CIA badge sits bottom-left on blurred rocks
    ("sail-catamarans-offshore.mp4", V3, 0.04, 1.96, CROP_V3, 1.0),
    ("juniors-beach-from-back.mp4", V3, 30.78, 33.00, NO_CROP, 1.0),
]


def run(cmd):
    print("  $", " ".join(str(c) for c in cmd)[:160])
    subprocess.run(cmd, check=True)


def prep_photos():
    out = PUB / "photos"
    out.mkdir(parents=True, exist_ok=True)
    for src_dir, table in ((SRC / "photos", PHOTOS), (ROOT / "media-free", DOWNLOADED)):
        for src_name, dst_name in table.items():
            src = src_dir / src_name
            if not src.exists():
                print("  ! missing", src)
                continue
            dst = out / dst_name
            im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
            if im.width > 2560:
                im = im.resize((2560, round(im.height * 2560 / im.width)), Image.LANCZOS)
            im.save(dst, "JPEG", quality=88, optimize=True, progressive=True)
            print(f"  photo {src_name} -> {dst_name} {im.size}")


def prep_video():
    out = PUB / "video"
    out.mkdir(parents=True, exist_ok=True)
    for name, src, t0, t1, vf, slow in CLIPS:
        dst = out / name
        if dst.exists():
            print("  video exists", name)
            continue
        f = vf
        if slow != 1.0:
            # optical-flow slow motion, output 30 fps
            f += f",setpts={slow}*PTS,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"
        else:
            f += ",fps=30"
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0}", "-to", f"{t1}", "-i", str(SRC / "video" / src),
             "-vf", f, "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "14",
             "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst)])


def prep_fonts():
    out = PUB / "fonts"
    out.mkdir(parents=True, exist_ok=True)
    fs = ROOT / "node_modules" / "@fontsource"
    copies = {
        "nunito-sans/files/nunito-sans-latin-400-normal.woff2": "NunitoSans-400.woff2",
        "nunito-sans/files/nunito-sans-latin-500-normal.woff2": "NunitoSans-500.woff2",
        "nunito-sans/files/nunito-sans-latin-700-normal.woff2": "NunitoSans-700.woff2",
        "nunito-sans/files/nunito-sans-latin-ext-400-normal.woff2": "NunitoSans-ext-400.woff2",
        "nunito-sans/files/nunito-sans-latin-ext-700-normal.woff2": "NunitoSans-ext-700.woff2",
        "noto-sans/files/noto-sans-cyrillic-500-normal.woff2": "NotoSans-cyrillic-500.woff2",
        "noto-sans/files/noto-sans-latin-500-normal.woff2": "NotoSans-latin-500.woff2",
        "noto-sans-jp/files/noto-sans-jp-japanese-500-normal.woff2": "NotoSansJP-500.woff2",
        "noto-sans-sc/files/noto-sans-sc-chinese-simplified-500-normal.woff2": "NotoSansSC-500.woff2",
    }
    for s, d in copies.items():
        p = fs / s
        if p.exists():
            shutil.copy(p, out / d)
        else:
            print("  ! font not found", p)

    # Brand fonts (commercial): used automatically when dropped in assets-src/fonts/
    brand = {}
    for f in sorted((SRC / "fonts").glob("*")):
        n = f.name.lower()
        if f.suffix.lower() not in (".otf", ".ttf", ".woff", ".woff2"):
            continue
        key = None
        if "avenir" in n:
            if "bold" in n and "demi" not in n and "italic" not in n:
                key = "avenir-700"
            elif "medium" in n and "italic" not in n:
                key = "avenir-500"
            elif ("regular" in n or n.endswith(("next.otf", "next.ttf"))) and "italic" not in n:
                key = "avenir-400"
        elif "better" in n and "together" in n:
            key = "better-together"
        if key and key not in brand:
            dst = f"brand-{key}{f.suffix.lower()}"
            shutil.copy(f, out / dst)
            brand[key] = f"fonts/{dst}"
            print("  brand font", f.name, "->", dst)
    return brand


def main():
    print("photos…")
    prep_photos()
    print("video…")
    prep_video()
    print("fonts…")
    brand = prep_fonts()
    gen = {
        "brandFonts": brand,
        "avenirAvailable": all(k in brand for k in ("avenir-400", "avenir-500", "avenir-700")),
        "betterTogetherAvailable": "better-together" in brand,
    }
    p = ROOT / "src" / "presentation" / "assets.generated.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(gen, indent=2) + "\n")
    print("wrote", p.relative_to(ROOT), gen)


if __name__ == "__main__":
    main()
