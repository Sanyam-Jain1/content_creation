"""Procedural placeholder sound design (no external assets).

Final SFX/music can be swapped for ElevenLabs sound-effect / music generations;
these exist so every draft render has a complete, timed soundtrack.
"""
import wave

import numpy as np


def write_wav(path, x, sr):
    x = np.clip(x, -1, 1)
    st = np.stack([x, x], 1)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((st * 32767).astype(np.int16).tobytes())


def _reverb(x, sr, decay=0.35, length=0.6):
    n = int(sr * length)
    rng = np.random.default_rng(3)
    ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 1, n) / decay * 3)
    ir[0] = 1.0
    y = np.convolve(x, ir * 0.12)
    return y / max(1e-6, np.max(np.abs(y))) * np.max(np.abs(x))


def sfx(kind, sr):
    rng = np.random.default_rng(abs(hash(kind)) % 2**32)
    t = np.arange(int(sr * 1.2)) / sr
    if kind == "door_slam":
        thump = np.sin(2 * np.pi * (70 + 40 * np.exp(-t * 30)) * t) * np.exp(-t * 14)
        crack = rng.standard_normal(len(t)) * np.exp(-t * 60) * 0.6
        latch = np.zeros_like(t)
        i = int(0.06 * sr)
        latch[i:i + 400] = rng.standard_normal(400) * np.exp(-np.arange(400) / 80) * 0.4
        x = _reverb(thump + crack + latch, sr, 0.3, 0.8)
        return (x / np.max(np.abs(x)) * 0.9).astype(np.float32)
    if kind == "stamp":
        x = np.sin(2 * np.pi * 120 * t) * np.exp(-t * 40) + rng.standard_normal(len(t)) * np.exp(-t * 80) * 0.5
        return (x / np.max(np.abs(x)) * 0.8).astype(np.float32)
    if kind == "whoosh":
        n = rng.standard_normal(len(t))
        env = np.sin(np.pi * np.clip(t / 0.7, 0, 1)) ** 2
        x = np.convolve(n, np.ones(40) / 40, mode="same") * env
        return (x / np.max(np.abs(x)) * 0.5).astype(np.float32)
    return np.zeros(10, np.float32)


def music(kind, n, sr):
    """Low tension bed: D-minor drone with a slow heartbeat pulse and a ticking clock."""
    t = np.arange(n) / sr
    rng = np.random.default_rng(7)
    x = np.zeros(n)
    for f, a in [(73.42, 0.5), (110.0, 0.3), (146.83, 0.22), (174.61, 0.12), (220.0, 0.08)]:
        lfo = 0.75 + 0.25 * np.sin(2 * np.pi * (0.05 + f / 4000) * t + f)
        x += a * lfo * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.003 * t))
    # pulse every 1.2 s
    beat = np.zeros(n)
    bt = np.arange(int(0.25 * sr)) / sr
    kick = np.sin(2 * np.pi * (48 + 30 * np.exp(-bt * 20)) * bt) * np.exp(-bt * 12)
    for s in np.arange(0, n / sr, 1.2):
        i = int(s * sr)
        beat[i:i + len(kick)] += kick[: max(0, n - i)]
    # clock tick every 0.6 s
    tick = np.zeros(n)
    tk = rng.standard_normal(300) * np.exp(-np.arange(300) / 40)
    for s in np.arange(0.3, n / sr, 0.6):
        i = int(s * sr)
        tick[i:i + 300] += tk[: max(0, n - i)]
    y = x * 0.12 + beat * 0.35 + np.convolve(tick, [1, -0.6], mode="same") * 0.05
    fade = np.minimum(1, t / 2.0) * np.minimum(1, (n / sr - t) / 2.5)
    return (y * fade).astype(np.float32)
