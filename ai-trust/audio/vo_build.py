"""Voice-over: Kokoro (open-source, local, free) phrase by phrase, each placed on its beat.

    <kokoro venv>/bin/python ai-trust/audio/vo_build.py <model.onnx> <voices.bin>

Writes ai-trust/audio/vo.wav (48 kHz stereo, film length) and ai-trust/audio/vo_phrases.json.
A phrase starts on its target beat; if the previous phrase is still talking it slides later, and a
phrase that would run into the next target is sped up (max 1.18x) before it is pushed.
"""
import json, sys
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt
from kokoro_onnx import Kokoro

FILM = Path(__file__).resolve().parents[1]
grid = json.loads((FILM / "beats.json").read_text())
OFF, PER, DUR = grid["offset"], grid["period"], grid["duration"]
VOICE, SPEED = "af_heart", 1.08

# [beat, text]: matches the on-screen beats in film.js / docs/shotlist.md
LINES = [
    [0, "You already trust AI."], [3.5, "Every single day."],
    [8, "Your feed."], [9.5, "Your maps."], [11, "Your bank."],
    [12.5, "So... should you?"],
    [24, "The case for."],
    [32, "It helps doctors catch disease earlier."],
    [40, "It flags fraud in milliseconds."],
    [48, "It translates, tutors, and never sleeps."],
    [52.5, "The case against."],
    [60, "It makes things up."], [66.3, "Confidently."],
    [68, "It copies our biases."],
    [71.4, "It can fake a voice."], [74, "A face."], [76, "A whole video."],
    [78, "And it's built by companies chasing your attention."],
    [84, "So, the verdict?"],
    [92, "Don't trust it blindly."], [96, "Don't fear it either."],
    [98.8, "Treat it like a brilliant intern."], [102, "Fast."], [103.5, "Tireless."], [105, "And you check its work."],
    [108, "Ask."], [109, "Who built it?"], [112, "And what happens when it's wrong?"],
    [116, "Trust."], [117.2, "But verify."],
]

SR = 48000
k = Kokoro(sys.argv[1], sys.argv[2])


def trim(x, sr, db=-40):
    env = np.abs(x)
    thr = 10 ** (db / 20) * env.max()
    idx = np.where(env > thr)[0]
    a, b = max(0, idx[0] - int(0.01 * sr)), min(len(x), idx[-1] + int(0.06 * sr))
    return x[a:b]


clips = []
for beat, line in LINES:
    y, sr = k.create(line, voice=VOICE, speed=SPEED, lang="en-us")
    y = trim(np.asarray(y, dtype=np.float32), sr)
    y = resample_poly(y, SR, sr).astype(np.float32)
    clips.append([beat, line, y])

out = np.zeros(int(DUR * SR) + SR, dtype=np.float32)
placed, cursor = [], 0.0
for i, (beat, line, y) in enumerate(clips):
    t = max(OFF + beat * PER, cursor + 0.06)
    nxt = OFF + clips[i + 1][0] * PER if i + 1 < len(clips) else DUR - 0.3
    room = nxt - t - 0.05
    d = len(y) / SR
    rate = 1.0
    if d > room and room > 0:
        rate = min(1.18, d / room)
        n = int(len(y) / rate)
        y = resample_poly(y, n, len(y)).astype(np.float32) if rate > 1.001 else y   # pitch rises a hair; ok at <=1.18
    a = int(t * SR)
    out[a:a + len(y)] += y[: len(out) - a]
    cursor = t + len(y) / SR
    placed.append({"beat": beat, "t": round(t, 3), "end": round(cursor, 3), "rate": round(rate, 3), "text": line,
                   "late_ms": round((t - (OFF + beat * PER)) * 1000)})

# voice chain: high-pass, gentle presence, soft-knee compression, normalise
out = sosfilt(butter(2, 90, "highpass", fs=SR, output="sos"), out)
pres = sosfilt(butter(2, [2500, 6000], "bandpass", fs=SR, output="sos"), out)
out = out + 0.35 * pres
env = np.sqrt(np.convolve(out ** 2, np.ones(480) / 480, mode="same")) + 1e-9
gain = np.where(env > 0.1, (0.1 / env) ** 0.5, 1.0)
out = out * gain
out = out / (np.abs(out).max() + 1e-9) * 0.7
out = out[: int(DUR * SR)]
sf.write(FILM / "audio" / "vo.wav", np.stack([out, out], 1), SR, subtype="PCM_24")
(FILM / "audio" / "vo_phrases.json").write_text(json.dumps(placed, indent=1))
for p in placed:
    flag = "  <-- late" if p["late_ms"] > 120 else ""
    print(f"b{p['beat']:<6} {p['t']:6.2f}-{p['end']:6.2f}s x{p['rate']:<5} {p['text']}{flag}")

# 100 Hz loudness envelope for the HUD waveform (normalised 0..1)
hop = SR // 100
rms = np.sqrt(np.add.reduceat(out ** 2, np.arange(0, len(out), hop)) / hop)
rms = rms / (rms.max() + 1e-9)
(FILM / "vo_env.json").write_text(json.dumps([round(float(v), 3) for v in rms]))
