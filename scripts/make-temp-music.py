#!/usr/bin/env python3
"""TEMP music for the V2 offline cut — NOT a final score (brief V2 §5).

120 BPM (1 beat = 0.5 s = 15 frames at 30 fps), 30 bars, A major, summery pop/house:
  0–4 s   intro, low-pass filter opening + riser
  4 s     DROP (kick 4/4, clap 2&4, off-beat hats, bass, guitar-like plucks)
  32 s    BREAK (no kick, pads + filtered plucks)
  43 s    build back (half-time kick, riser)
  50 s    FINAL DROP
  56 s    final hit, clean ending (short tail), silence to 60 s
Grid is exact by construction. Output: public/audio/TEMP-music-120bpm.wav
"""
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
BPM = 120
BEAT = 60 / BPM
DUR = 60.0
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio" / "TEMP-music-120bpm.wav"
rng = np.random.default_rng(2026)
N = int(DUR * SR)


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def lp(x, hz, o=2):
    return sosfilt(butter(o, hz, "low", fs=SR, output="sos"), x)


def hp(x, hz, o=2):
    return sosfilt(butter(o, hz, "high", fs=SR, output="sos"), x)


def bp(x, a, b, o=2):
    return sosfilt(butter(o, [a, b], "band", fs=SR, output="sos"), x)


def add(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:j, 0] += sig[: j - i] * gain * l
    buf[i:j, 1] += sig[: j - i] * gain * r


def kick():
    t = np.arange(int(0.4 * SR)) / SR
    f = 50 + 110 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.95


def clap():
    t = np.arange(int(0.25 * SR)) / SR
    n = bp(rng.normal(0, 1, len(t)), 900, 4000)
    env = np.exp(-t * 22) * (1 + 0.6 * (np.sin(2 * np.pi * 90 * t) > 0))
    return n * env * 0.35


def hat(open_=False):
    t = np.arange(int((0.18 if open_ else 0.06) * SR)) / SR
    return hp(rng.normal(0, 1, len(t)), 7000) * np.exp(-t * (14 if open_ else 60)) * 0.22


def shaker():
    t = np.arange(int(0.08 * SR)) / SR
    return bp(rng.normal(0, 1, len(t)), 4500, 10000) * np.minimum(1, t / 0.01) * np.exp(-t * 50) * 0.12


def pluck(freq, dur=0.35, bright=4200):
    n = int(dur * SR)
    p = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, p)
    y = np.zeros(n)
    for i in range(n):
        y[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return lp(y, bright) * 0.35


def bass(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    y = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t)
    env = np.minimum(1, t / 0.005) * np.exp(-t * 2.5)
    return lp(y * env, 600) * 0.45


def pad(freqs, dur):
    t = np.arange(int(dur * SR)) / SR
    y = sum(np.sin(2 * np.pi * f * t * (1 + d)) for f in freqs for d in (-0.002, 0.002))
    env = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.3).clip(0, 1)
    return lp(y, 1800) * env * 0.05


def riser(dur):
    t = np.arange(int(dur * SR)) / SR
    n = rng.normal(0, 1, len(t))
    out = np.zeros_like(n)
    seg = 2048
    for s in range(0, len(n), seg):
        k = s / len(n)
        out[s:s + seg] = bp(n[s:s + seg + 0], 400 + 7000 * k * k, 600 + 9000 * k * k + 1)[: len(out[s:s + seg])]
    return out * (t / dur) ** 2 * 0.25


# A major: A – F#m – D – E (one chord per bar)
PROG = [(57, [69, 73, 76]), (54, [66, 69, 73]), (50, [66, 69, 74]), (52, [68, 71, 76])]


def section(t):
    if t < 4:
        return "intro"
    if t < 32:
        return "drop"
    if t < 43:
        return "break"
    if t < 50:
        return "build"
    if t < 56:
        return "final"
    return "end"


drums = np.zeros((N, 2))
music = np.zeros((N, 2))
for beat in range(int(56 / BEAT)):
    t = beat * BEAT
    sec = section(t)
    bar, b = divmod(beat, 4)
    root, chord = PROG[bar % 4]
    if sec in ("drop", "final"):
        add(drums, kick(), t, 1.0)
    if sec == "build" and b == 0:
        add(drums, kick(), t, 0.6)
    if sec == "intro" and t >= 2 and b in (0, 2):
        add(drums, kick(), t, 0.5)
    if sec in ("drop", "final") and b in (1, 3):
        add(drums, clap(), t, 1.0, 0.05)
    if sec in ("drop", "final", "build"):
        add(drums, hat(open_=True), t + BEAT / 2, 0.9 if sec != "build" else 0.4, 0.3)
        for s in range(4):
            add(drums, shaker(), t + s * BEAT / 4, 0.8, -0.3)
    if sec in ("drop", "final"):
        add(music, bass(midi(root - 12), BEAT * 0.48), t + BEAT / 2, 1.0)
        add(music, bass(midi(root - 12), BEAT * 0.45), t, 0.7)
    # guitar-like plucks on the off-beats (8ths), all sections
    for e in range(2):
        note = chord[(beat * 2 + e) % 3] + (12 if sec == "final" and e else 0)
        bright = 1400 if sec in ("intro", "break") else 4200
        add(music, pluck(midi(note), 0.3, bright), t + e * BEAT / 2, 0.8 if sec != "break" else 0.6, 0.35 if e else -0.35)
    if b == 0 and sec in ("break", "build", "intro"):
        add(music, pad([midi(n) for n in chord], 4 * BEAT), t, 1.0)

# risers into each drop
add(music, riser(3.5), 0.5, 1.0)
add(music, riser(6.5), 43.5, 1.0)

# intro low-pass sweep 0–4 s on everything
mix = drums * 0.9 + music
k = int(4 * SR)
for s in range(0, k, 4096):
    cut = 300 + 9000 * (s / k) ** 2
    mix[s:s + 4096] = np.stack([lp(mix[s:s + 4096, c], cut) for c in range(2)], 1)

# final hit at 56 s, then clean ending
cut = int(56 * SR)
mix[cut:] = 0
hit = np.zeros((N, 2))
add(hit, kick(), 56.0, 1.3)
add(hit, clap(), 56.0, 1.2)
root, chord = PROG[0]
for n_ in chord + [root - 12]:
    add(hit, pluck(midi(n_), 1.6, 3000), 56.0, 1.0)
add(hit, pad([midi(n) for n in chord], 2.0), 56.0, 2.5)
tt = np.arange(N) / SR - 56
hit *= np.clip(1 - tt / 2.2, 0, 1)[:, None] ** 2
mix += hit

# soft bus compression + peak normalise to -1 dBFS
mix = np.tanh(mix * 1.2) / 1.2
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 10 ** (-1 / 20)
e = int(0.005 * SR)
mix[:e] *= np.linspace(0, 1, e)[:, None]
OUT.parent.mkdir(parents=True, exist_ok=True)
wavfile.write(OUT, SR, (mix * 32767).astype(np.int16))
print("wrote", OUT.relative_to(ROOT))
