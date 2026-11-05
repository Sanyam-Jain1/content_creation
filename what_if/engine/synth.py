"""Procedural score and SFX: original, royalty-free, no API key.

score(ep_dir, plan, cfg) -> mp3 path (+ .json section chunks, same format as assets.score_path)
    plan = [(section letter, seconds)], cfg = script.json "score" with engine "synth":
    {"engine": "synth", "bpm": 104, "key": "D", "seed": 1,
     "sections": {"A": {"mood": "curious", "level": 1}, "B": {"mood": "bright", "level": 2}}}
    mood: bright (I-V-vi-IV) | curious (vi-IV-I-V) | tense (i-bVI-bVII-v) | warm (I-vi-IV-V)
    level: 0 pad + pluck only, 1 + tabla + hats, 2 full groove (kick, clap, bass)

sfx(kind, out_dir) -> wav path for the kinds in SFX below (series-specific sounds).
"""
import hashlib
import json
import subprocess
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
# chord roots as scale degrees in semitones, with quality
MOODS = {
    "bright": [(0, "maj"), (7, "maj"), (9, "min"), (5, "maj")],
    "curious": [(9, "min"), (5, "maj"), (0, "maj"), (7, "maj")],
    "tense": [(0, "min"), (8, "maj"), (10, "maj"), (7, "min")],
    "warm": [(0, "maj"), (9, "min"), (5, "maj"), (7, "maj")],
}
TRIAD = {"maj": [0, 4, 7], "min": [0, 3, 7]}


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def filt(x, kind, f, order=2):
    wn = np.asarray(f, float) / (SR / 2)
    sos = butter(order, wn if wn.ndim else float(wn), btype=kind, output="sos")
    return sosfilt(sos, x)


def env(n, a=0.003, d=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def tone(f, dur, harm=((1, 1),), a=0.003, d=0.3, bend=None):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ff = f * (1 + (bend(t) if bend else 0))
    ph = 2 * np.pi * np.cumsum(ff) / SR
    s = sum(g * np.sin(k * ph) for k, g in harm)
    return s * env(n, a, d)


def noise(dur, rng):
    return rng.standard_normal(int(dur * SR))


# ---------------- instruments ----------------
def kick(rng):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.9


def clap(rng):
    x = filt(noise(0.2, rng), "band", [900, 4000]) * env(int(0.2 * SR), 0.001, 0.05)
    return x * 0.5


def hat(rng, open_=False):
    d = 0.12 if open_ else 0.03
    return filt(noise(d * 3, rng), "high", 7000) * env(int(d * 3 * SR), 0.001, d) * 0.25


def bayan(rng):  # tabla bass stroke with the palm-press pitch glide
    return tone(80, 0.5, ((1, 1), (2, 0.15)), 0.002, 0.18, bend=lambda t: 0.35 * (1 - np.exp(-t * 9))) * 0.8


def dayan(rng, f=560):  # tabla treble "na"
    s = tone(f, 0.25, ((1, 1), (2.01, 0.5), (3.02, 0.2)), 0.001, 0.07)
    click = filt(noise(0.25, rng), "high", 3000) * env(int(0.25 * SR), 0.0005, 0.006) * 0.4
    return (s + click) * 0.35


def pluck(f, rng, d=0.35):  # marimba / kalimba-ish
    return tone(f, d * 3, ((1, 1), (3.9, 0.18), (9.8, 0.05)), 0.002, d) * 0.32


def bass(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)
    return s * np.minimum(1, t / 0.01) * np.exp(-t / 0.5) * 0.45


def pad(freqs, dur, rng):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for det in (-0.004, 0.004):
            ph = (f * (1 + det) * t + rng.random()) % 1
            s += 2 * ph - 1
    s = filt(s, "low", 1400)
    a = np.minimum(1, t / 0.25) * np.minimum(1, (dur - t) / 0.25).clip(0, 1)
    return s * a * 0.035


def add(buf, x, at):
    i = int(at * SR)
    if i >= len(buf) or i < 0:
        return
    m = min(len(x), len(buf) - i)
    buf[i:i + m] += x[:m]


def compose(plan, cfg):
    bpm = cfg.get("bpm", 104)
    root = 48 + NOTE.get(cfg.get("key", "C"), 0)
    rng = np.random.default_rng(cfg.get("seed", 1))
    beat = 60.0 / bpm
    total = sum(s for _, s in plan)
    out = np.zeros(int((total + 2) * SR))
    sections = cfg.get("sections", {})
    # random-but-seeded motifs (8 sixteenth-note slots per half bar)
    motifs = [rng.choice([0, 1, 2, 3, -1, -1], 8) for _ in range(4)]
    tabla = [rng.choice(["b", "d", "-", "d"], 16) for _ in range(2)]
    for p_ in tabla:
        p_[0] = "b"
    t0 = 0.0
    step = beat / 4
    for sec, dur in plan:
        sc = sections.get(sec, {})
        prog = MOODS.get(sc.get("mood", "bright"))
        lvl = sc.get("level", 1)
        t1 = t0 + dur
        k = int(np.ceil(t0 / step))
        while k * step < t1:
            t = k * step
            bar = int(k // 16)
            s16 = k % 16
            deg, q = prog[bar % 4]
            chord = [root + deg + iv for iv in TRIAD[q]]
            if s16 == 0:
                add(out, pad([hz(n + 12) for n in chord], 16 * step, rng), t)
                if lvl >= 2:
                    add(out, bass(hz(root + deg - 12), beat * 1.5), t)
            if lvl >= 2 and s16 in (6, 10):
                add(out, bass(hz(root + deg - 12 + (7 if s16 == 10 else 0)), beat * 0.9), t)
            mot = motifs[(bar + (1 if s16 >= 8 else 0)) % 4]
            m = mot[s16 % 8]
            if m >= 0 and (s16 % 2 == 0 or lvl >= 2):
                note = chord[m % 3] + 12 * (1 + m // 3)
                add(out, pluck(hz(note), rng, 0.25 if lvl else 0.4), t)
            if lvl >= 1:
                tb = tabla[bar % 2][s16]
                if tb == "b" and s16 % 4 == 0:
                    add(out, bayan(rng), t)
                elif tb == "d" or (tb == "-" and lvl >= 2 and s16 % 2):
                    add(out, dayan(rng, 560 if s16 % 4 else 620) * (1 if s16 % 2 == 0 else 0.6), t)
                if s16 % 2 == 0:
                    add(out, hat(rng) * (0.6 if s16 % 4 else 1.0), t)
            if lvl >= 2:
                if s16 in (0, 7, 10):
                    add(out, kick(rng), t)
                if s16 in (4, 12):
                    add(out, clap(rng), t)
                if s16 == 14:
                    add(out, hat(rng, True), t)
            k += 1
        t0 = t1
    out = out[:int(total * SR)]
    # gentle glue: soft clip
    out = np.tanh(out * 1.4) / 1.4
    return out / max(1e-6, np.max(np.abs(out))) * 0.9


def score(ep_dir, plan, cfg):
    key = hashlib.sha1(json.dumps([plan, cfg], sort_keys=True).encode()).hexdigest()[:12]
    d = Path(ep_dir) / "assets"
    d.mkdir(parents=True, exist_ok=True)
    p = d / f"score_{key}.mp3"
    if not p.exists():
        for old in d.glob("score_*"):
            old.unlink()
        x = compose(plan, cfg).astype(np.float32)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "192k", str(p)],
                       input=x.tobytes(), check=True)
        p.with_suffix(".json").write_text(json.dumps([{"section": s, "duration_ms": int(round(sec * 1000))} for s, sec in plan], indent=1))
        print(f"  [music] synthesised {p.name} ({len(plan)} sections, {sum(s for _, s in plan):.1f}s)")
    return p


# ---------------- sfx ----------------
def _whistle(rng):  # pressure-cooker whistle: hiss + screaming tone that swells and wavers
    dur = 2.4
    n = int(dur * SR)
    t = np.arange(n) / SR
    swell = np.clip(t / 0.5, 0, 1) ** 1.5 * np.clip((dur - t) / 0.35, 0, 1)
    f = 2900 + 250 * np.clip(t / 0.6, 0, 1) + 40 * np.sin(2 * np.pi * 7 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tonal = (np.sin(ph) + 0.25 * np.sin(2 * ph)) * (0.7 + 0.3 * np.sin(2 * np.pi * 13 * t))
    hiss = filt(noise(dur, rng), "band", [2000, 9000]) * 0.5
    puff = filt(noise(dur, rng), "band", [300, 1500]) * np.exp(-t * 6) * 1.2  # weight lifting
    return (tonal * 0.6 + hiss) * swell + puff


def _hiss(rng):
    dur = 1.6
    t = np.arange(int(dur * SR)) / SR
    return filt(noise(dur, rng), "band", [2500, 10000]) * np.clip(t / 0.08, 0, 1) * np.exp(-t * 1.6)


def _boil(rng):
    dur = 2.5
    out = np.zeros(int(dur * SR))
    for _ in range(70):
        at = rng.random() * (dur - 0.1)
        f = 300 + rng.random() * 700
        b = tone(f, 0.06, ((1, 1),), 0.001, 0.015, bend=lambda t: 6 * t)
        add(out, b * (0.3 + 0.7 * rng.random()), at)
    return out + filt(noise(dur, rng), "low", 400) * 0.05


def _clack(rng):  # train wheels over rail joints: da-dum ... da-dum
    dur = 3.0
    out = np.zeros(int(dur * SR))
    for i in range(4):
        for off in (0.0, 0.16):
            hit = filt(noise(0.12, rng), "band", [150, 2500]) * env(int(0.12 * SR), 0.001, 0.03)
            hit += tone(110, 0.12, ((1, 1), (2.7, 0.4)), 0.001, 0.04) * 0.6
            add(out, hit, 0.1 + i * 0.72 + off)
    rumble = filt(noise(dur, rng), "low", 180) * 0.25
    return out + rumble


def _horn(rng):  # two-tone diesel horn
    dur = 1.6
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in (311.1, 392.0, 466.2):
        ph = (f * t) % 1
        s += 2 * ph - 1
    s = filt(s, "low", 2200)
    return s * np.clip(t / 0.05, 0, 1) * np.clip((dur - t) / 0.2, 0, 1) * 0.5


def _gravel(rng):
    dur = 1.2
    out = np.zeros(int(dur * SR))
    for _ in range(60):
        at = rng.random() * dur * 0.8
        add(out, filt(noise(0.04, rng), "band", [800, 6000]) * env(int(0.04 * SR), 0.0005, 0.008) * rng.random(), at)
    return out


def _flame(rng):
    dur = 1.4
    t = np.arange(int(dur * SR)) / SR
    x = filt(noise(dur, rng), "low", 900) * np.clip(t / 0.04, 0, 1) * (0.5 + 0.5 * np.exp(-t * 3))
    return x


def _chime(rng):  # soundbox "payment received" chime
    out = np.zeros(int(0.9 * SR))
    add(out, tone(1318.5, 0.9, ((1, 1), (2, 0.2)), 0.002, 0.25), 0)
    add(out, tone(1975.5, 0.7, ((1, 1), (2, 0.2)), 0.002, 0.3), 0.12)
    return out


def _thunk(rng):  # heavy load landing on the track
    return tone(55, 0.8, ((1, 1), (2, 0.3)), 0.002, 0.25, bend=lambda t: -0.3 * t) + filt(noise(0.8, rng), "low", 300) * env(int(0.8 * SR), 0.001, 0.08)


SFX = {"cooker_whistle": _whistle, "steam_hiss": _hiss, "boil": _boil, "train_clack": _clack, "train_horn": _horn,
       "gravel": _gravel, "flame": _flame, "chime": _chime, "thunk": _thunk}


def sfx(kind, out_dir):
    if kind not in SFX:
        return None
    p = Path(out_dir) / f"{kind}.wav"
    if not p.exists():
        p.parent.mkdir(parents=True, exist_ok=True)
        x = SFX[kind](np.random.default_rng(int(hashlib.sha1(kind.encode()).hexdigest()[:8], 16)))
        x = x / max(1e-6, np.max(np.abs(x))) * 0.9
        with wave.open(str(p), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((x * 32767).astype(np.int16).tobytes())
        print(f"  [sfx] synthesised {kind}")
    return p
