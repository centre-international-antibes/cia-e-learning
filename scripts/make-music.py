#!/usr/bin/env python3
"""Original score + sound effects for the CIA presentation film (no licensed music).

100 BPM, D major, soft piano + pizzicato strings + light pad; light percussion from
scene 3, a clear lift on scene 6, stop on "Live it." (beat 90 = 54.0 s) then a held
D-major chord fading over 2.5 s. 44.1 kHz stereo WAV, normalised by ffmpeg loudnorm.

Writes public/audio/:
  cia-presentation-music.wav      60 s master score
  cia-presentation-music-20s.wav  20 s cutdown score
  sfx-whoosh.wav sfx-tick.wav sfx-pop.wav sfx-pen.wav
Usage: python3 scripts/make-music.py
"""
import subprocess
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
BPM = 100
BEAT = 60 / BPM  # 0.6 s = 18 frames at 30 fps
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio"
rng = np.random.default_rng(1985)  # deterministic

# ------------------------------------------------------------------ helpers --
def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, hz, order=2):
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x)


def hp(x, hz, order=2):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def env_adsr(n, a, d, s, r, total=None):
    total = total or n
    e = np.ones(total) * s
    ai, di, ri = int(a * SR), int(d * SR), int(r * SR)
    e[:ai] = np.linspace(0, 1, ai, endpoint=False) if ai else e[:ai]
    e[ai:ai + di] = np.linspace(1, s, di, endpoint=False)[: len(e[ai:ai + di])]
    rs = max(0, n - ri)
    e[rs:n] = np.linspace(e[rs] if rs < total else s, 0, n - rs)
    e[n:] = 0
    return e


def piano(freq, dur, vel=0.5):
    n = int((dur + 2.5) * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for k in range(1, 8):
        inh = k * np.sqrt(1 + 0.0004 * k * k)  # slight inharmonicity
        y += (1 / k ** 1.6) * np.sin(2 * np.pi * freq * inh * t + rng.uniform(0, 6.28)) * np.exp(-t * (1.1 + 0.9 * k))
    att = np.minimum(1, t / 0.004)
    rel = np.where(t > dur, np.exp(-(t - dur) * 6), 1)
    return y * att * rel * vel * 0.35


def pizz(freq, vel=0.5):
    """Karplus-Strong pluck, warm."""
    n = int(0.9 * SR)
    p = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, p) * 0.6
    buf = lp(np.concatenate([buf, np.zeros(1)]), 3000)[:p]
    y = np.zeros(n)
    for i in range(n):
        y[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.994
    return lp(y, 2600) * vel * 0.5


def pad(freqs, dur, vel=0.18, bright=1400):
    n = int((dur + 1.5) * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            ph = 2 * np.pi * f * (1 + det / 100) * t + rng.uniform(0, 6.28)
            y += (2 / np.pi) * np.arctan(3 * np.sin(ph)) * 0.33  # soft saw-ish
    y = lp(y, bright, 2)
    e = env_adsr(int(dur * SR), 0.9, 0.5, 0.85, 1.2, n)
    return y * e * vel / max(1, len(freqs))


def kick(vel=0.6):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 48 + 70 * np.exp(-t * 32)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)
    return lp(y, 900) * vel


def shaker(vel=0.25):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    y = bp(rng.uniform(-1, 1, n), 5000, 11000) * (np.minimum(1, t / 0.012)) * np.exp(-t * 45)
    return y * vel


def place(buf, sig, t, pan=0.0, gain=1.0):
    i = int(round(t * SR))
    if i >= buf.shape[0]:
        return
    j = min(buf.shape[0], i + len(sig))
    s = sig[: j - i] * gain
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[i:j, 0] += s * l
    buf[i:j, 1] += s * r


def reverb(x, seconds=2.2, wet=0.22):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.normal(0, 1, n) * np.exp(-t * 3.2)
        ir = lp(ir, 5000)
        ir /= np.sqrt(np.sum(ir ** 2))
        out[:, ch] = fftconvolve(x[:, ch], ir)[: len(x)]
    return x * (1 - wet) + out * wet * 1.4


# ---------------------------------------------------------------- harmony --
# I – V – vi – IV in D major (bass midi, chord tones)
CHORDS = {
    "D": (38, [62, 66, 69, 74]),
    "A": (45, [61, 64, 69, 73]),
    "Bm": (47, [62, 66, 71, 74]),
    "G": (43, [62, 67, 71, 74]),
}
PROG = ["D", "A", "Bm", "G"]


def score(total_s, live_beat, perc_from_beat, lift_from_beat, start_bar_chord=0, bonjour_beat=None):
    n = int((total_s + 0.5) * SR)
    mix = np.zeros((n, 2))
    nbars = int(np.ceil(live_beat / 4))
    for bar in range(nbars):
        b0 = bar * 4
        name = PROG[(bar + start_bar_chord) % 4]
        if bar == nbars - 1 or (b0 + 4 >= live_beat):
            name = "A"  # dominant → resolves on "Live it."
        bass, tones = CHORDS[name]
        bar_end = min(b0 + 4, live_beat)
        dur = (bar_end - b0) * BEAT
        lifted = b0 >= lift_from_beat
        # pad
        place(mix, pad([midi(x) for x in tones[:3]], dur, vel=0.16 if not lifted else 0.2, bright=1300 if not lifted else 2200), b0 * BEAT, 0.0)
        # bass (soft piano low)
        place(mix, piano(midi(bass), dur * 0.95, 0.42), b0 * BEAT, -0.1)
        # piano arpeggio: quarters, eighths once lifted
        step = 0.5 if lifted else 1.0
        k = 0
        b = b0
        pattern = [0, 2, 1, 3, 2, 1]
        while b < bar_end - 1e-6:
            note = tones[pattern[k % len(pattern)]] + (12 if lifted and k % 4 == 3 else 0)
            place(mix, piano(midi(note), step * BEAT * 1.6, 0.30 + 0.06 * (k % 2 == 0)), b * BEAT, 0.25)
            b += step
            k += 1
        # pizzicato strings from scene 3
        if b0 >= perc_from_beat:
            for e in range(int((bar_end - b0) * 2)):
                if lifted or e % 2 == 0:
                    note = tones[(e * 2) % 4] - 12
                    place(mix, pizz(midi(note), 0.32 if not lifted else 0.42), (b0 + e * 0.5) * BEAT, -0.35)
        # percussion
        for beat in range(b0, bar_end):
            if beat >= perc_from_beat:
                if lifted or beat % 4 == 0:
                    place(mix, kick(0.55 if lifted else 0.35), beat * BEAT, 0.0)
                place(mix, shaker(0.18 if not lifted else 0.24), (beat + 0.5) * BEAT, 0.3)
                if lifted:
                    place(mix, shaker(0.12), (beat + 0.25) * BEAT, 0.35)
                    place(mix, shaker(0.12), (beat + 0.75) * BEAT, 0.35)
    if bonjour_beat is not None:  # a bright, gentle accent on "Bonjour"
        place(mix, piano(midi(86), 1.4, 0.32), bonjour_beat * BEAT, 0.2)
        place(mix, piano(midi(81), 1.4, 0.22), bonjour_beat * BEAT, -0.2)

    # "Live it.": music stops, held D-major chord fading over 2.5 s
    t_live = live_beat * BEAT
    cut = int(t_live * SR)
    fade = int(0.04 * SR)
    mix[cut - fade:cut] *= np.linspace(1, 0, fade)[:, None]
    mix[cut:] = 0
    chord = np.zeros((n, 2))
    for m in (50, 57, 62, 66, 69, 74):
        place(chord, piano(midi(m), 2.5, 0.34), t_live, (m - 62) / 30)
    place(chord, pad([midi(62), midi(66), midi(69)], 2.6, 0.22, 1600), t_live, 0.0)
    tt = np.arange(n) / SR - t_live
    chord *= np.clip(1 - tt / 2.5, 0, 1)[:, None] ** 1.5
    mix += chord
    mix = reverb(mix)
    # make sure the tail ends before the file end, tiny fades at both ends (no clicks)
    mix = mix[: int(total_s * SR)]
    e = int(0.01 * SR)
    mix[:e] *= np.linspace(0, 1, e)[:, None]
    mix[-e:] *= np.linspace(1, 0, e)[:, None]
    return mix


def write(path, x, peak_db=-1.0):
    x = x / (np.max(np.abs(x)) + 1e-9) * 10 ** (peak_db / 20)
    wavfile.write(path, SR, (x * 32767).astype(np.int16))


def loudnorm(path, target=-16.0):
    """Two-pass-ish EBU R128 normalisation with ffmpeg (true peak ≤ -1.5 dBTP)."""
    tmp = path.with_suffix(".tmp.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-af",
                    f"loudnorm=I={target}:TP=-1.5:LRA=11:linear=true", "-ar", str(SR), str(tmp)], check=True)
    tmp.replace(path)


# -------------------------------------------------------------------- sfx --
def sfx():
    # soft breath / whoosh for the brand wipe (0.7 s)
    n = int(0.75 * SR)
    t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    sweep = np.zeros(n)
    for i, (lo, hi) in enumerate([(300, 900), (600, 1800), (1200, 3600), (2000, 6000)]):
        seg = bp(noise, lo, hi)
        w = np.exp(-((t - (0.15 + i * 0.12)) / 0.16) ** 2)
        sweep += seg * w
    sweep *= np.sin(np.pi * np.clip(t / 0.75, 0, 1)) ** 1.5
    st = np.stack([sweep * np.linspace(1, 0.4, n), sweep * np.linspace(0.4, 1, n)], 1)
    write(OUT / "sfx-whoosh.wav", st, -3)

    # tiny tick for map points
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * 2600 * t) * 0.6 + np.sin(2 * np.pi * 5200 * t) * 0.2) * np.exp(-t * 90)
    write(OUT / "sfx-tick.wav", np.stack([y, y], 1), -3)

    # felt "pop" for counters
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    f = 260 + 380 * np.exp(-t * 40)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28) * np.minimum(1, t / 0.003)
    y = lp(y, 2500)
    write(OUT / "sfx-pop.wav", np.stack([y, y], 1), -3)

    # pen on paper under "Live it." (1.1 s)
    n = int(1.1 * SR)
    t = np.arange(n) / SR
    scratch = bp(rng.normal(0, 1, n), 2500, 7000)
    strokes = 0.5 + 0.5 * np.sin(2 * np.pi * 6.5 * t + np.sin(2 * np.pi * 1.7 * t) * 2)
    y = scratch * strokes * np.sin(np.pi * np.clip(t / 1.1, 0, 1)) ** 0.7
    write(OUT / "sfx-pen.wav", np.stack([y, y * 0.9], 1), -3)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    # 60 s master. Scenes (frames→beats): sc3 starts 380 f ≈ beat 21, sc6 1325 f ≈ beat 73.6,
    # "Live it." = frame 1620 = beat 90. Bonjour = frame 90 = beat 5.
    m = score(60.0, live_beat=90, perc_from_beat=21, lift_from_beat=72, bonjour_beat=5)
    p = OUT / "cia-presentation-music.wav"
    write(p, m)
    loudnorm(p)
    # 20 s cutdown: Bonjour on beat 0, liveIt from 200 f ≈ beat 11, "Live it." = 390+60 = 450 f = beat 25.
    c = score(20.0, live_beat=25, perc_from_beat=4, lift_from_beat=12, bonjour_beat=0)
    p2 = OUT / "cia-presentation-music-20s.wav"
    write(p2, c)
    loudnorm(p2)
    sfx()
    print("wrote", *sorted(x.name for x in OUT.glob("*.wav")))


if __name__ == "__main__":
    main()
