#!/usr/bin/env python3
"""Metronome click track, 120 BPM, 90 s (brief V3: edit on a click, music comes later).
Accent on beat 1 of each bar. Output: public/audio/metronome-120bpm-90s.wav"""
from pathlib import Path
import numpy as np
from scipy.io import wavfile

SR, BPM, DUR = 44100, 120, 90.0
out = Path(__file__).resolve().parent.parent / "public" / "audio" / "metronome-120bpm-90s.wav"
x = np.zeros(int(DUR * SR))
t = np.arange(int(0.03 * SR)) / SR
for b in range(int(DUR * BPM / 60)):
    f = 1760 if b % 4 == 0 else 1320
    click = np.sin(2 * np.pi * f * t) * np.exp(-t * 180) * (0.5 if b % 4 == 0 else 0.3)
    i = int(b * 60 / BPM * SR)
    x[i:i + len(click)] += click[: len(x) - i]
wavfile.write(out, SR, (np.stack([x, x], 1) * 32767).astype(np.int16))
print("wrote", out.name)
