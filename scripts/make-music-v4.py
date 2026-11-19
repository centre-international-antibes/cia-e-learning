#!/usr/bin/env python3
"""V4 music edit + beat grid + mix (MUSIC-EDIT.md, CORRECTIONS-V4.md).

1. Track the beats of assets-src/audio/kulakovka-ambient-house-624653.mp3 (librosa).
2. Assemble the 90 s edit from the map in MUSIC-EDIT.md, every splice snapped to the
   nearest tracked beat (bar starts), 25 ms equal-power crossfades (no clicks),
   1.5 s fade-out at the end.
3. Film beat grid = tracked source beats mapped through the edit → src/presentation/v4/beats.json
   (times in s and frames rounded to the nearest frame at 30 fps). Cross-checked by
   re-tracking the edited audio.
4. Discreet SFX (whoosh centred on each whip pan, impact on the drop and the re-drop),
   mixed under the music, then EBU R128 normalisation to −14 LUFS, true peak ≤ −1 dBTP.

Outputs: public/audio/v4-music-edit.wav (music only), public/audio/v4-mix.wav (music + sfx),
         src/presentation/v4/beats.json
Usage: python3 scripts/make-music-v4.py
"""
import json
import subprocess
from pathlib import Path

import librosa
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src/audio/kulakovka-ambient-house-624653.mp3"
OUT = ROOT / "public/audio"
SR = 44100
FPS = 30
FILM = 90.0
XF = 0.025  # crossfade length (s)

# MUSIC-EDIT.md map: (source start, source end) in seconds, approximate (snapped below)
MAP = [
    (25.612, 48.112),  # build-up → drop at ≈ 6.18 s of the film
    (39.962, 48.112),  # 4 bars repeated (extends the groove)
    (48.112, 96.920),  # groove: chapters 01–05
    (96.920, 103.050),  # 3 bars of the break: finale words
    (113.197, None),  # re-drop: "Live it." then end card (runs to 90 s)
]
# whip pans between chapters (film beat indices, see src/presentation/v4/script.ts)
WHIP_BEATS = [40, 69, 104, 128, 142]
DROP_BEAT, REDROP_BEAT = 12, 168


def track(y_mono):
    oenv = librosa.onset.onset_strength(y=y_mono, sr=SR, hop_length=128, aggregate=np.median)
    tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=SR, hop_length=128, start_bpm=117.45, tightness=800, units="time")
    return float(np.atleast_1d(tempo)[0]), np.asarray(beats)


def main():
    y, _ = librosa.load(SRC, sr=SR, mono=False)  # (2, n)
    y = y.astype(np.float64)
    tempo, b = track(librosa.to_mono(y))
    snap = lambda t: float(b[np.argmin(abs(b - t))])
    segs = []
    for s, e in MAP:
        s2 = snap(s)
        e2 = snap(e) if e is not None else None
        segs.append((s2, e2))
    print(f"source tempo (librosa) {tempo:.2f} BPM; groove period {(snap(96.92) - snap(48.112)) / 96:.5f} s")
    for (s, e), (s2, e2) in zip(MAP, segs):
        print(f"  splice {s:8.3f} → {s2:8.3f} ({1000 * (s2 - s):+.0f} ms)   end {e} → {e2}")

    # assemble with equal-power crossfades centred on each splice point
    n_film = int(FILM * SR)
    out = np.zeros((2, n_film))
    xf = int(XF * SR)
    film_t = 0.0
    film_starts = []
    for i, (s, e) in enumerate(segs):
        if e is None:
            e = s + (FILM - film_t)
        film_starts.append(film_t)
        a, z = int(round(s * SR)) - xf // 2, int(round(e * SR)) + xf // 2
        piece = y[:, max(0, a):z].copy()
        L = piece.shape[1]
        ramp = np.sin(np.linspace(0, np.pi / 2, xf)) ** 2  # equal power on amplitude² → use sqrt below
        fin, fout = np.sqrt(ramp), np.sqrt(ramp[::-1])
        if i > 0:
            piece[:, :xf] *= fin
        if i < len(segs) - 1:
            piece[:, -xf:] *= fout
        p0 = int(round(film_t * SR)) - xf // 2
        if p0 < 0:
            piece = piece[:, -p0:]
            p0 = 0
        p1 = min(n_film, p0 + piece.shape[1])
        out[:, p0:p1] += piece[:, : p1 - p0]
        film_t += e - s
    # 1.5 s fade-out
    fo = int(1.5 * SR)
    out[:, -fo:] *= np.linspace(1, 0, fo) ** 1.5

    # film beat grid: source beats mapped through the edit
    grid = []
    for (s, e), f0 in zip(segs, film_starts):
        e = e if e is not None else s + (FILM - f0)
        for t in b[(b >= s - 1e-3) & (b < e - 1e-3)]:
            grid.append(f0 + (t - s))
    grid = sorted(g for g in grid if g < FILM)
    frames = [int(round(g * FPS)) for g in grid]

    # cross-check: re-track the edited audio
    _, b_edit = track(librosa.to_mono(out.astype(np.float32)))
    dev = [min(abs(np.asarray(grid) - t)) * FPS for t in b_edit if 1 < t < 88]
    print(f"film grid: {len(grid)} beats; re-tracked edit vs grid: max {max(dev):.2f} f, mean {np.mean(dev):.2f} f")
    print(f"drop at {grid[DROP_BEAT]:.3f} s (frame {frames[DROP_BEAT]}), break at {grid[156]:.3f} s, re-drop at {grid[REDROP_BEAT]:.3f} s")

    OUT.mkdir(parents=True, exist_ok=True)
    music = out.T.astype(np.float32)
    wavfile.write(OUT / "v4-music-edit.wav", SR, music)

    # --- SFX -------------------------------------------------------------
    rng = np.random.default_rng(90)

    def bp(x, lo, hi):
        return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)

    def whoosh(dur=0.42):
        n = int(dur * SR)
        t = np.arange(n) / SR
        noise = rng.normal(0, 1, n)
        sig = np.zeros(n)
        for k, (lo, hi) in enumerate([(300, 1200), (900, 3000), (2000, 7000)]):
            sig += bp(noise, lo, hi) * np.exp(-((t - dur * (0.35 + 0.15 * k)) / (dur * 0.22)) ** 2)
        return sig * np.sin(np.pi * t / dur) ** 1.2

    def impact(dur=0.9):
        n = int(dur * SR)
        t = np.arange(n) / SR
        f = 45 + 60 * np.exp(-t * 18)
        body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5)
        air = bp(rng.normal(0, 1, n), 2500, 9000) * np.exp(-t * 14) * 0.25
        return sosfilt(butter(2, 2000, "low", fs=SR, output="sos"), body) + air

    sfx = np.zeros((n_film, 2))

    def place(sig, t, gain, pan=0.0):
        i = int(round(t * SR))
        j = min(n_film, i + len(sig))
        sig = sig / (np.max(np.abs(sig)) + 1e-9) * gain
        sfx[i:j, 0] += sig[: j - i] * np.cos((pan + 1) * np.pi / 4)
        sfx[i:j, 1] += sig[: j - i] * np.sin((pan + 1) * np.pi / 4)

    for k in WHIP_BEATS:  # whoosh centred on the cut
        place(whoosh(), grid[k] - 0.21, 0.22, 0.2)
    place(impact(), grid[DROP_BEAT], 0.30)
    place(impact(), grid[REDROP_BEAT], 0.30)
    mix = music + sfx.astype(np.float32)
    mix /= max(1.0, np.max(np.abs(mix)) / 0.98)
    tmp = OUT / "v4-mix.tmp.wav"
    wavfile.write(tmp, SR, mix.astype(np.float32))
    # EBU R128: −14 LUFS integrated, true peak −1.5 dBTP target (≤ −1 dBTP)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:linear=true",
                    "-ar", str(SR), "-c:a", "pcm_s16le", str(OUT / "v4-mix.wav")], check=True)
    tmp.unlink()
    # second pass: exact −14 LUFS (single-pass loudnorm lands ~1 dB off on this material)
    meas = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(OUT / "v4-mix.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"],
                          capture_output=True, text=True).stderr
    integ = float(meas.split("Integrated loudness:")[1].split("I:")[1].split("LUFS")[0])
    fixed = OUT / "v4-mix.fix.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(OUT / "v4-mix.wav"), "-af", f"volume={-14 - integ:.2f}dB",
                    "-c:a", "pcm_s16le", str(fixed)], check=True)
    fixed.replace(OUT / "v4-mix.wav")

    beats_path = ROOT / "src/presentation/v4/beats.json"
    beats_path.parent.mkdir(parents=True, exist_ok=True)
    beats_path.write_text(json.dumps({
        "source": SRC.name, "tempoSource": round(tempo, 2),
        "splices": [{"src": [round(s, 4), round(e, 4) if e else None], "film": round(f, 4)} for (s, e), f in zip(segs, film_starts)],
        "times": [round(g, 4) for g in grid], "frames": frames,
    }, indent=1))
    print("wrote", beats_path.relative_to(ROOT), "and public/audio/v4-mix.wav")


if __name__ == "__main__":
    main()
