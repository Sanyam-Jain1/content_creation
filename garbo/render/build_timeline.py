#!/usr/bin/env python3
"""Build a part: voice every line, time every shot, compute lip-sync, mix audio.

    python3 render/build_timeline.py scenes/part1.json [edge|elevenlabs]

Writes build/part<N>/:
    timeline.json   shot + line timing, word timings, per-frame mouth envelopes
    mix.wav         dialogue + sfx + music (music ducked under speech)
    preview.html    open in a browser to watch with audio (no render needed)

Pacing rules (retention): no dead air. Lines follow each other with ~0.1 s gaps,
shots carry only a short tail, every cut gets a whoosh, and music never stops.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "voices"))
sys.path.insert(0, str(ROOT / "render"))
import tts  # noqa: E402
import sound  # noqa: E402
import assets  # noqa: E402

SR = 48000
NARRATOR = {"narrator"}
# reels pacing: pitch-preserving speed-up (free, applied after TTS, cached)
TEMPO = {"narrator": 1.15}
TEMPO_DEFAULT = 1.08


def speed(r, who):
    k = TEMPO.get(who, TEMPO_DEFAULT)
    if abs(k - 1) < 1e-3:
        return r
    src = Path(r["audio"])
    dst = src.with_name(f"{src.stem}_x{k:.2f}.wav")
    if not dst.exists():
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af", f"atempo={k}", "-ar", str(SR), "-ac", "1", str(dst)], check=True)
    words = [dict(w, start=w["start"] / k, end=w["end"] / k) for w in r["words"] if w.get("start") is not None]
    return {"audio": str(dst), "words": words, "dur": r["dur"] / k}


def decode(path, sr=SR):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, np.float32).copy()


def envelope(samples, fps, sr=SR):
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
    out *= 0.88 + 0.12 * np.sin(np.arange(n) * 1.7)
    return [round(float(a), 3) for a in out]


def roundness(words, n, fps):
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


def load_sfx(kind):
    p = assets.sfx_path(kind)
    if p:
        a = decode(p)
        return a / max(1e-6, np.max(np.abs(a))) * 0.9
    return sound.sfx(kind, SR)


def build(scene_path, provider=None):
    scene = json.loads(Path(scene_path).read_text())
    fps = scene.get("fps", 30)
    part = scene["part"]
    out = ROOT / "build" / f"part{part}"
    out.mkdir(parents=True, exist_ok=True)

    t = 0.0
    shots, lines, sfx = [], [], []
    idx = 0
    for si, shot in enumerate(scene["shots"]):
        start = t
        cursor = start + shot.get("lead", 0.05)
        first = len(lines)
        for i, L in enumerate(shot.get("lines", [])):
            r = speed(tts.synth(L["who"], L["text"], L.get("lang", "en"), provider), L["who"])
            if i > 0:
                cursor += L.get("gap", 0.1)
            if "at" in L:
                cursor = start + L["at"]
            samples = decode(r["audio"])
            env = envelope(samples, fps)
            clean = tts.strip_tags(L["text"])
            lines.append({
                "shot": shot["id"], "idx": idx,
                "char": None if L["who"] in NARRATOR else L["who"],
                "who": L["who"], "text": clean, "lang": L.get("lang", "en"),
                "sub": L.get("sub", clean), "nosub": bool(L.get("nosub")),
                "emph": L.get("emph", []),
                "words": [w for w in r["words"] if w.get("start") is not None],
                "start": round(cursor, 3), "end": round(cursor + r["dur"], 3),
                "audio": r["audio"], "env": env, "round": roundness(r["words"], len(env), fps),
            })
            idx += 1
            cursor += r["dur"]
        end = max(cursor + shot.get("tail", 0.2), start + shot.get("minDur", 0))
        mine = lines[first:]

        def anchor(e):
            # {"word": "rejected", "occ": 2, "offset": 0.0} -> seconds from shot start
            if "word" not in e:
                return e
            norm = lambda x: re.sub(r"[^\w']", "", x.lower())
            want, occ, k = norm(e["word"]), e.get("occ", 1), 0
            for L in mine:
                for w in L["words"]:
                    if norm(w["text"]) == want:
                        k += 1
                        if k == occ:
                            return dict(e, at=round(L["start"] + w["start"] - start + e.get("offset", 0), 3))
            print(f"  ! word anchor {want!r} #{occ} not found in shot {shot['id']}")
            return dict(e, at=e.get("at", 0))

        fxs = []
        for e in shot.get("fx", []):
            e = anchor(e)
            if "syncLine" in e and e["syncLine"] < len(mine):
                e = dict(e, line=mine[e["syncLine"]]["idx"])
            if "word_end" in e:
                e = dict(e, dur=anchor({"word": e["word_end"]})["at"] - e.get("at", 0) + 0.6)
            fxs.append(e)
        chars = []
        for ch in shot.get("chars", []):
            ch = dict(ch, keys=[anchor(k) for k in ch.get("keys", [])])
            chars.append(ch)
        shot = dict(shot, fx=fxs, chars=chars, sfx=[anchor(e) for e in shot.get("sfx", [])])
        if shot.get("shakeWords"):
            shot["shakeAt"] = [anchor({"word": w, "occ": o})["at"] for w, o in shot["shakeWords"]]
        s = {k: v for k, v in shot.items() if k != "lines"}
        s.update(start=round(start, 3), end=round(end, 3))
        shots.append(s)
        if si > 0 and shot.get("whoosh", True):
            sfx.append({"kind": "whoosh", "at": max(0, start - 0.18), "gain": 0.55})
        for fx in shot.get("sfx", []):
            sfx.append({"kind": fx["kind"], "at": start + fx["at"], "gain": fx.get("gain", 1.0)})
        t = end

    duration = round(t, 3)
    timeline = {"part": part, "of": scene.get("of", 4), "title": scene.get("title"), "fps": fps,
                "duration": duration, "frames": int(np.ceil(duration * fps)), "shots": shots, "lines": lines}
    (out / "timeline.json").write_text(json.dumps(timeline))

    # ---- audio mix ----
    n = int(duration * SR) + SR // 2
    dia = np.zeros(n, np.float32)
    for L in lines:
        a = decode(L["audio"])
        i = int(L["start"] * SR)
        dia[i:i + len(a)] += a[: max(0, n - i)]
    fx = np.zeros(n, np.float32)
    cache = {}
    for e in sfx:
        a = cache.setdefault(e["kind"], load_sfx(e["kind"])) * e["gain"]
        i = int(e["at"] * SR)
        fx[i:i + len(a)] += a[: max(0, n - i)]
    mp = assets.music_path(scene.get("music", f"part{part}"))
    if mp:
        m = decode(mp)
        m = m / max(1e-6, np.max(np.abs(m)))
        if len(m) < n:
            m = np.tile(m, int(np.ceil(n / len(m))))
        music = m[:n]
        t_ = np.arange(n) / SR
        music = music * np.minimum(1, (duration + 0.5 - t_) / 1.5).clip(0, 1)
    else:
        music = sound.music("tension", n, SR)
    hop = SR // 50
    lvl = np.array([np.sqrt(np.mean(dia[i:i + hop] ** 2)) for i in range(0, n, hop)])
    duck = np.repeat(np.where(lvl > 0.01, 0.42, 1.0), hop)[:n]
    k = np.ones(SR // 6) / (SR // 6)
    duck = np.convolve(duck, k, mode="same")
    peak = max(1e-6, np.percentile(np.abs(dia[dia != 0]), 99.5)) if np.any(dia) else 1
    dia = dia / peak * 0.85
    mix = dia + fx * 0.75 + music * duck * 0.34 + sound.drone(n, SR) * 0.035
    mix /= max(1.0, np.max(np.abs(mix)) / 0.97)
    sound.write_wav(out / "mix.wav", mix, SR)

    rel = "../.."
    (out / "preview.html").write_text(f"""<!doctype html><html><head><meta charset="utf-8"><title>GARBO Part {part} preview</title>
<link href="{rel}/assets/fonts/fonts.css" rel="stylesheet">
<style>body{{margin:0;background:#111;display:flex;flex-direction:column;align-items:center;color:#ccc;font:14px sans-serif}}
#stage svg{{width:min(100vw,56.25vh);height:auto}}button{{margin:8px;padding:8px 18px}}</style></head><body>
<div id="stage"></div><button id="go">▶ Play</button><audio id="a" src="mix.wav"></audio>
<base href="{rel}/render/">
<script src="{rel}/characters/rig.js"></script><script src="{rel}/characters/cast.js"></script>
<script src="{rel}/render/backgrounds.js"></script><script src="{rel}/render/player.js"></script>
<script>window.TIMELINE={json.dumps(timeline)};GarboPlayer.load(TIMELINE);GarboPlayer.ready().then(()=>renderFrame(0));
document.getElementById('go').onclick=()=>GarboPlayer.play(document.getElementById('a'));</script></body></html>""")
    talk = sum(L["end"] - L["start"] for L in lines)
    print(f"part {part}: {len(shots)} shots, {len(lines)} lines, {duration:.1f}s, speech covers {talk / duration:.0%} -> {out}")
    return out


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
