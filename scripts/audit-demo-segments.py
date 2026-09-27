"""Inspect a decoded, mono 16-bit WAV for chapter gaps and opening pitch peaks.

QA helper only (Python + NumPy), never used to infer expressive performance scores.
On macOS, decode the bundled Clementi audio with:
  afconvert -f WAVE -d LEI16@22050 -c 1 public/audio/demos/clementi-op36-no1-luis-kolodin.m4a /tmp/banpai-clementi.wav
  python3 scripts/audit-demo-segments.py /tmp/banpai-clementi.wav
"""
import json
import sys
import wave
import numpy as np

with wave.open(sys.argv[1]) as source:
    if source.getnchannels() != 1 or source.getsampwidth() != 2:
        raise ValueError("Use a mono 16-bit PCM WAV")
    sample_rate = source.getframerate()
    samples = np.frombuffer(source.readframes(source.getnframes()), dtype="<i2") / 32768

step = round(sample_rate * .1)
rms = np.array([np.sqrt(np.mean(samples[i:i + step] ** 2)) for i in range(0, len(samples), step)])
groups = []
for index in np.where(rms < .004)[0]:
    if not groups or index > groups[-1][-1] + 1:
        groups.append([int(index)])
    else:
        groups[-1].append(int(index))

names = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
openings = []
for seconds in [1.78, 2.18, 2.36, 119.58, 119.8, 120., 179.88, 180.05, 180.23]:
    size = 4096
    frame = samples[int(seconds * sample_rate):int(seconds * sample_rate) + size]
    if len(frame) != size:
        continue
    spectrum = abs(np.fft.rfft(frame * np.hanning(size)))
    frequencies = np.fft.rfftfreq(size, 1 / sample_rate)
    peaks = np.where((spectrum[1:-1] > spectrum[:-2]) & (spectrum[1:-1] > spectrum[2:]))[0] + 1
    strongest = sorted((i for i in peaks if 100 < frequencies[i] < 1200), key=lambda i: spectrum[i], reverse=True)[:7]
    values = []
    for i in strongest:
        midi = round(69 + 12 * np.log2(frequencies[i] / 440))
        values.append({"note": names[midi % 12] + str(midi // 12 - 1), "frequency": round(float(frequencies[i]), 1), "magnitude": round(float(spectrum[i]), 1)})
    openings.append({"seconds": seconds, "peaks": values})

print(json.dumps({"duration": len(samples) / sample_rate, "quietGaps": [[round(g[0] * .1, 2), round((g[-1] + 1) * .1, 2)] for g in groups if len(g) >= 8], "openingSpectra": openings}, indent=2))
