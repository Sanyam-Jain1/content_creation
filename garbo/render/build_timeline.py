#!/usr/bin/env python3
"""Build a part: voice every line, time every shot, compute lip-sync, mix audio.

    python3 render/build_timeline.py scenes/part1.json

Writes build/part<N>/:
    timeline.json   shot + line timing, per-frame mouth envelopes
    mix.wav         dialogue + sfx + music, music ducked under speech
    preview.html    open in a browser to watch with audio (no render needed)
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "voices"))
sys.path.insert(0, str(ROOT / "render"))
import tts  # noqa: E402
import sound  # noqa: E402

SR = 48000
NARRATOR = {"narrator"}


def decode(path, sr=SR):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, np.float32).copy()


def envelope(samples, fps, sr=SR):
    """Per-frame mouth opening 0..1 from loudness, with attack/release smoothing."""
    hop = sr // fps
    n = int(np.ceil(len(samples) / hop))
    rms = np.array([np.sqrt(np.mean(samples[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    ref = np.percentile(rms, 92) + 1e-6
    x = np.clip((rms / ref - 0.10) * 1.25, 0, 1) ** 0.8
    out = np.zeros_like(x)
    v = 0.0
    for i, target in enumerate(x):
        v += (target - v) * (0.75 if target > v else 0.45)
        out[i] = v
    # small natural variation so long vowels don't look frozen
    out *= 0.88 + 0.12 * np.sin(np.arange(n) * 1.7)
    return [round(float(a), 3) for a in out]


def roundness(words, n, fps):
    """Rounded-lip frames for words dominated by o/u sounds."""
    r = np.zeros(n)
    for w in words:
        t = w["text"].lower()
        vow = [c for c in t if c in "aeiouáéíóú"]
        if not vow:
            continue
        val = sum(c in "ouóú" for c in vow) / len(vow)
        a, b = int(w["start"] * fps), int(w["end"] * fps) + 1
        r[a:b] = np.maximum(r[a:b], val * 0.9)
    return [round(float(v), 2) for v in r]


def build(scene_path, provider=None):
    scene = json.loads(Path(scene_path).read_text())
    fps = scene.get("fps", 30)
    part = scene["part"]
    out = ROOT / "build" / f"part{part}"
    out.mkdir(parents=True, exist_ok=True)

    t = 0.0
    shots, lines, sfx = [], [], []
    for shot in scene["shots"]:
        start = t
        cursor = start + shot.get("lead", 0.4)
        sl = []
        for i, L in enumerate(shot.get("lines", [])):
            r = tts.synth(L["who"], L["text"], L.get("lang", "en"), provider)
            if i > 0:
                cursor += L.get("gap", 0.35)
            if "at" in L:
                cursor = start + L["at"]
            samples = decode(r["audio"])
            env = envelope(samples, fps)
            line = {
                "char": None if L["who"] in NARRATOR else L["who"],
                "who": L["who"],
                "text": L["text"],
                "lang": L.get("lang", "en"),
                "sub": None if L.get("nosub") else L.get("sub", L["text"]),
                "start": round(cursor, 3),
                "end": round(cursor + r["dur"], 3),
                "audio": r["audio"],
                "env": env,
                "round": roundness(r["words"], len(env), fps),
            }
            sl.append(line)
            cursor += r["dur"]
        end = max(cursor + shot.get("tail", 0.5), start + shot.get("minDur", 0))
        s = {k: v for k, v in shot.items() if k not in ("lines",)}
        s.update(start=round(start, 3), end=round(end, 3))
        shots.append(s)
        lines += sl
        for fx in shot.get("sfx", []):
            sfx.append({"kind": fx["kind"], "at": start + fx["at"], "gain": fx.get("gain", 1.0)})
        t = end

    duration = round(t, 3)
    timeline = {"part": part, "of": scene.get("of", 4), "title": scene.get("title"), "fps": fps,
                "duration": duration, "frames": int(np.ceil(duration * fps)), "shots": shots, "lines": lines}
    (out / "timeline.json").write_text(json.dumps(timeline))

    # ---- audio mix ----
    n = int(duration * SR) + SR
    dia = np.zeros(n, np.float32)
    for L in lines:
        a = decode(L["audio"])
        i = int(L["start"] * SR)
        dia[i:i + len(a)] += a[: max(0, n - i)] * (0.95 if L["who"] in NARRATOR else 1.0)
    fx = np.zeros(n, np.float32)
    for e in sfx:
        a = sound.sfx(e["kind"], SR) * e["gain"]
        i = int(e["at"] * SR)
        fx[i:i + len(a)] += a[: max(0, n - i)]
    music = sound.music(scene.get("music", "tension"), n, SR)
    # duck music under dialogue
    hop = SR // 50
    lvl = np.array([np.sqrt(np.mean(dia[i:i + hop] ** 2)) for i in range(0, n, hop)])
    duck = np.repeat(np.where(lvl > 0.01, 0.35, 1.0), hop)[:n]
    k = np.ones(SR // 5) / (SR // 5)
    duck = np.convolve(duck, k, mode="same")
    mix = dia + fx * 0.9 + music * duck * 0.55
    mix /= max(1.0, np.max(np.abs(mix)) / 0.95)
    sound.write_wav(out / "mix.wav", mix, SR)

    # ---- preview page ----
    rel = "../.."
    (out / "preview.html").write_text(f"""<!doctype html><html><head><meta charset="utf-8"><title>GARBO Part {part} preview</title>
<style>body{{margin:0;background:#111;display:flex;flex-direction:column;align-items:center;color:#ccc;font:14px sans-serif}}
#stage svg{{width:min(100vw,56.25vh);height:auto}}button{{margin:8px;padding:8px 18px}}</style></head><body>
<div id="stage"></div><button id="go">▶ Play</button><audio id="a" src="mix.wav"></audio>
<script src="{rel}/characters/rig.js"></script><script src="{rel}/characters/cast.js"></script>
<script src="{rel}/render/backgrounds.js"></script><script src="{rel}/render/player.js"></script>
<script>window.TIMELINE={json.dumps(timeline)};GarboPlayer.load(TIMELINE);renderFrame(0);
document.getElementById('go').onclick=()=>GarboPlayer.play(document.getElementById('a'));</script></body></html>""")
    print(f"part {part}: {len(shots)} shots, {len(lines)} lines, {duration:.1f}s -> {out}")
    return out


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
