#!/usr/bin/env python3
"""Build an episode: voice every line, time every shot, place SFX, fit the score, mix.

    python3 engine/build.py episodes/01_time_freeze             # reuse cached score if any
    python3 engine/build.py episodes/01_time_freeze --rescore   # compose a new score

Writes <episode>/build/: timeline.json, mix.wav, preview.html
Then: node engine/render.js <episode>  ->  <episode>/export/<slug>.mp4

script.json (per episode):
  slug, title, fps, hook {line1, line2, pulse}, badge, endCard {shot, cue, title, sub}
  sfx {kind: [prompt, seconds]}   extra sound prompts (shared library otherwise)
  score {A: prompt, B: ...}        music section prompts; shots name their section in "music"
  shots[]: id, scene, music, lead, tail, minDur, musicGain, flash, punch,
           cues {name: anchor}, sfx [anchor + kind, gain], fx [anchor + type ...],
           shakeWords [[word, occ]], lines [{text, gap, emph, show, pitch, take}]
  anchor = {"word": "through", "occ": 1, "offset": -0.05} or {"at": seconds-from-shot-start}
"""
import json
import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

ENGINE = Path(__file__).resolve().parent
sys.path.insert(0, str(ENGINE))
import voice  # noqa: E402
import assets  # noqa: E402

SR = 48000
TEMPO = 1.12  # pitch-preserving speed-up for reel pacing


def decode(path, sr=SR):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def write_wav(path, x, sr=SR):
    x = np.clip(x, -1, 1)
    st = np.stack([x, x], 1)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((st * 32767).astype(np.int16).tobytes())


def faster(r, pitch=1.0):
    src = Path(r["audio"])
    tag = f"_x{TEMPO:.2f}" + (f"_p{pitch:.2f}" if pitch != 1 else "")
    dst = src.with_name(f"{src.stem}{tag}.wav")
    if not dst.exists():
        af = f"atempo={TEMPO}"
        if pitch != 1:  # raise pitch, keep timing (helium / tiny-person voice)
            af = f"asetrate=44100*{pitch},aresample=44100,atempo={1 / pitch:.4f},atempo={TEMPO}"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af", af, "-ar", str(SR), "-ac", "1", str(dst)], check=True)
    a = decode(dst)
    nz = np.where(np.abs(a) > 0.01)[0]
    s0 = max(0, nz[0] - int(0.03 * SR)) if len(nz) else 0
    s1 = min(len(a), nz[-1] + int(0.08 * SR)) if len(nz) else len(a)
    off = s0 / SR
    words = [dict(w, start=max(0, w["start"] / TEMPO - off), end=max(0, w["end"] / TEMPO - off))
             for w in r["words"] if w.get("start") is not None]
    return {"samples": a[s0:s1], "words": words, "dur": (s1 - s0) / SR}


def norm(x):
    return re.sub(r"[^\w']", "", x.lower())


def build(ep, rescore=False):
    ep = Path(ep).resolve()
    script = json.loads((ep / "script.json").read_text())
    fps = script.get("fps", 30)
    out = ep / "build"
    out.mkdir(exist_ok=True)

    t = 0.0
    shots, lines, sfx, audio = [], [], [], []
    idx = 0
    for si, shot in enumerate(script["shots"]):
        start = t
        cursor = start + shot.get("lead", 0.05)
        mine = []
        for i, L in enumerate(shot.get("lines", [])):
            r = faster(voice.synth(L["text"], take=L.get("take", 0)), L.get("pitch", 1.0))
            if i > 0:
                cursor += L.get("gap", 0.1)
            show = L.get("show", {})
            words = [dict(w, text=show.get(w["text"], w["text"])) for w in r["words"]]
            rec = {"shot": shot["id"], "idx": idx, "text": voice.strip_tags(L["text"]), "emph": L.get("emph", []),
                   "words": words, "raw": [w["text"] for w in r["words"]],
                   "start": round(cursor, 3), "end": round(cursor + r["dur"], 3)}
            lines.append(rec)
            mine.append(rec)
            audio.append((cursor, r["samples"]))
            idx += 1
            cursor += r["dur"]
        end = max(cursor + shot.get("tail", 0.2), start + shot.get("minDur", 0))

        def anchor(e, _mine=mine, _start=start, _id=shot["id"]):
            if "word" not in e:
                return dict(e)
            want, occ, k = norm(e["word"]), e.get("occ", 1), 0
            for L in _mine:
                for w, raw in zip(L["words"], L["raw"]):
                    if norm(raw) == want:
                        k += 1
                        if k == occ:
                            return dict(e, at=round(L["start"] + w["start"] - _start + e.get("offset", 0), 3))
            print(f"  ! word anchor {want!r} #{occ} not found in shot {_id}")
            return dict(e, at=e.get("at", 0))

        cues = {k: float(anchor(v)["at"]) for k, v in shot.get("cues", {}).items()}
        fxs = []
        for e in shot.get("fx", []):
            e = anchor(e)
            if "word_end" in e:
                e["dur"] = anchor({"word": e["word_end"]})["at"] - e["at"] + 0.5
            fxs.append(e)
        s = {k: v for k, v in shot.items() if k not in ("lines", "cues", "fx", "sfx", "shakeWords")}
        s.update(start=round(start, 3), end=round(end, 3), cues=cues, fx=fxs,
                 shakeAt=[float(anchor({"word": w, "occ": o})["at"]) for w, o in shot.get("shakeWords", [])])
        shots.append(s)
        if si > 0 and shot.get("whoosh", True):
            sfx.append({"kind": "whoosh", "at": max(0, start - 0.15), "gain": 0.45})
        for e in shot.get("sfx", []):
            e = anchor(e)
            sfx.append({"kind": e["kind"], "at": start + e["at"], "gain": e.get("gain", 1.0)})
        t = end

    duration = round(t, 3)
    meta = {k: script[k] for k in ("slug", "title", "hook", "badge", "endCard", "hud") if k in script}
    timeline = dict(meta, fps=fps, duration=duration, frames=int(np.ceil(duration * fps)), shots=shots, lines=lines)
    (out / "timeline.json").write_text(json.dumps(timeline))

    # ---------------- score ----------------
    n = int((duration + 0.5) * SR)
    music = np.zeros(n, np.float32)
    if script.get("score"):
        sections = []
        for s in shots:
            if sections and sections[-1][0] == s["music"]:
                sections[-1][2] = s["end"]
            else:
                sections.append([s["music"], s["start"], s["end"]])
        sections[-1][2] = duration + 0.5
        plan = [(m, b - a) for m, a, b in sections]
        existing = sorted((ep / "assets").glob("score_*.mp3"), key=lambda p: p.stat().st_mtime) if (ep / "assets").exists() else []
        score = assets.score_path(ep, script["score"], plan, script.get("scoreStyles")) if (rescore or not existing) else existing[-1]
        if score:
            sm = decode(score)
            sm /= max(1e-6, np.max(np.abs(sm)))
            chunks = json.loads(score.with_suffix(".json").read_text())
            pos, fade = 0, int(0.06 * SR)
            for (m, a, b), ch in zip(sections, chunks):
                ln = int(ch["duration_ms"] / 1000 * SR)
                seg = sm[pos: pos + ln]
                pos += ln
                i0, want = int(a * SR), int((b - a) * SR)
                if 0 < len(seg) < want:
                    seg = np.concatenate([seg, np.tile(seg[-SR:], int(np.ceil((want - len(seg)) / SR)) + 1)])
                seg = seg[:want].copy()
                if len(seg) > 2 * fade:
                    seg[:fade] *= np.linspace(0, 1, fade)
                    seg[-fade:] *= np.linspace(1, 0, fade)
                music[i0:i0 + len(seg)] += seg[: max(0, n - i0)]
        tt = np.arange(n) / SR
        music *= np.clip((duration + 0.5 - tt) / 1.2, 0, 1)
    # per-shot music gain (e.g. 0 for a dead-silent beat), with short ramps
    mg = np.ones(n, np.float32)
    for s in shots:
        if "musicGain" in s:
            mg[int(s["start"] * SR): int(s["end"] * SR)] = s["musicGain"]
    k = np.ones(SR // 10) / (SR // 10)
    mg = np.convolve(mg, k, mode="same")

    # ---------------- mix ----------------
    dia = np.zeros(n, np.float32)
    for st, a in audio:
        i = int(st * SR)
        dia[i:i + len(a)] += a[: max(0, n - i)]
    fx = np.zeros(n, np.float32)
    cache = {}
    for e in sfx:
        if e["kind"] not in cache:
            p = assets.sfx_path(e["kind"], script.get("sfx"))
            a = decode(p) if p else np.zeros(10, np.float32)
            cache[e["kind"]] = a / max(1e-6, np.max(np.abs(a))) * 0.9
        a = cache[e["kind"]] * e["gain"]
        i = int(e["at"] * SR)
        fx[i:i + len(a)] += a[: max(0, n - i)]
    hop = SR // 50
    lvl = np.array([np.sqrt(np.mean(dia[i:i + hop] ** 2)) for i in range(0, n, hop)])
    duck = np.repeat(np.where(lvl > 0.01, 0.45, 1.0), hop)[:n]
    duck = np.convolve(duck, np.ones(SR // 6) / (SR // 6), mode="same")
    peak = max(1e-6, np.percentile(np.abs(dia[dia != 0]), 99.5))
    dia = dia / peak * 0.85
    mix = dia + fx * 0.6 + music * duck * mg * 0.32
    mix /= max(1.0, np.max(np.abs(mix)) / 0.97)
    write_wav(out / "mix.wav", mix)

    (out / "preview.html").write_text(f"""<!doctype html><html><head><meta charset="utf-8"><title>{script.get('title', 'preview')}</title>
<link href="../../../assets/fonts/fonts.css" rel="stylesheet">
<style>body{{margin:0;background:#111;display:flex;flex-direction:column;align-items:center}}
#stage svg{{width:min(100vw,56.25vh);height:auto}}button{{margin:8px;padding:8px 18px}}</style></head><body>
<div id="stage"></div><button id="go">Play</button><audio id="a" src="mix.wav"></audio>
<script src="../../../engine/kit.js"></script><script src="../scenes.js"></script><script src="../../../engine/player.js"></script>
<script>Player.load({json.dumps(timeline)});Player.ready().then(()=>renderFrame(0));
document.getElementById('go').onclick=()=>Player.play(document.getElementById('a'));</script></body></html>""")
    talk = sum(L["end"] - L["start"] for L in lines)
    print(f"{ep.name}: {len(shots)} shots, {len(lines)} lines, {duration:.1f}s, speech {talk / duration:.0%}")
    for s in shots:
        print(f"  {s['id']:<10} {s['start']:6.2f}-{s['end']:6.2f}  cues {s['cues']}")


if __name__ == "__main__":
    build(sys.argv[1], "--rescore" in sys.argv)
