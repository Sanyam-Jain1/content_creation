"""Shared sound library and per-episode scores, generated once with ElevenLabs.

SFX live in what_if/assets/sfx/ and are shared by every episode, so a sound is
paid for once. An episode can add its own prompts in script.json under "sfx".
The score is one composition plan per episode ("score" in script.json), cached
in the episode's assets/ folder and re-fitted to the shot timings at mix time.
"""
import hashlib
import json
from pathlib import Path

from voice import client

ROOT = Path(__file__).resolve().parent.parent
SFX_DIR = ROOT / "assets" / "sfx"

# kind -> (prompt, seconds). Files that already exist are never regenerated.
SFX = {
    "pop":          ("A short bright cartoon bubble pop with a tiny sparkle", 0.5),
    "rewind":       ("A fast VHS tape rewind sound effect with a glitchy warble, cinematic flash-forward", 1.2),
    "gasp":         ("A single man's shocked sharp gasp, comedic", 0.8),
    "crowd_gasp":   ("A huge crowd of thousands of people gasping in shock at the same time", 1.8),
    "buzzer":       ("A loud game show wrong answer buzzer, comedic", 1.0),
    "squeeze":      ("A cartoon squeaky toy squeeze followed by a tiny strained squeak", 0.8),
    "siren":        ("An ambulance siren wailing close by, short burst", 2.2),
    "slowmo":       ("A deep slow motion time-slowing whoosh, everything drops in pitch, dreamy", 2.0),
    "tiptoe":       ("Cartoon tiptoe sneaking steps played on soft pizzicato strings, tip tip tip tip", 2.0),
    "sigh":         ("A long, relaxed, deeply contented male sigh, lazy and satisfied", 1.6),
    "ding":         ("A bright cartoon ding, single bell hit, positive", 0.6),
    "boing":        ("A cartoon boing spring bounce sound", 0.8),
    "thud":         ("A soft comedic body thud falling onto the floor", 0.8),
    "cash":         ("A cash register cha-ching", 1.0),
}
SCORE_STYLES = ["comedic cartoon score", "quirky", "playful orchestral", "instrumental", "constant rhythm"]
SCORE_NEG = ["vocals", "singing", "long silence", "lo-fi"]


def sfx_path(kind, extra=None):
    p = SFX_DIR / f"{kind}.mp3"
    if p.exists():
        return p
    table = dict(SFX, **{k: tuple(v) for k, v in (extra or {}).items()})
    if kind not in table:
        print(f"  [sfx] no prompt for {kind}")
        return None
    prompt, dur = table[kind]
    try:
        audio = client().text_to_sound_effects.convert(text=prompt, duration_seconds=dur, prompt_influence=0.6)
        with open(p, "wb") as f:
            for ch in audio:
                f.write(ch)
        print(f"  [sfx] generated {kind}")
        return p
    except Exception as e:
        print(f"  [sfx] {kind} failed: {e}")
        return None


def score_path(ep_dir, prompts, sections, styles=None):
    """sections: [(letter, seconds)] -> one mp3, each section composed separately with
    force_instrumental (composition plans can sing the prompt text), cached in <episode>/assets/."""
    import subprocess
    import numpy as np
    style = ", ".join(styles or SCORE_STYLES)
    plan = [{"text": f"{prompts[s]}. Style: {style}. Instrumental only, no vocals.",
             "duration_ms": int(max(3000, round(sec * 1000)))} for s, sec in sections]
    key = hashlib.sha1(json.dumps(plan, sort_keys=True).encode()).hexdigest()[:12]
    d = Path(ep_dir) / "assets"
    d.mkdir(parents=True, exist_ok=True)
    p = d / f"score_{key}.mp3"
    if p.exists():
        return p
    parts, chunks = [], []
    try:
        for i, ch in enumerate(plan):
            part = d / f"_section_{key}_{i}.mp3"
            if not part.exists():
                audio = client().music.compose(prompt=ch["text"], music_length_ms=max(10000, ch["duration_ms"]),
                                               model_id="music_v2_5", force_instrumental=True)
                with open(part, "wb") as f:
                    for c in audio:
                        f.write(c)
            raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(part), "-f", "f32le", "-ac", "1", "-ar", "48000", "-"],
                                 capture_output=True, check=True).stdout
            a = np.frombuffer(raw, np.float32)
            parts.append(a)
            chunks.append(dict(ch, duration_ms=int(len(a) / 48))) 
        allx = np.concatenate(parts)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", "48000", "-ac", "1", "-i", "-", "-b:a", "192k", str(p)],
                       input=allx.astype(np.float32).tobytes(), check=True)
        p.with_suffix(".json").write_text(json.dumps(chunks, indent=1))
        for i in range(len(plan)):
            (d / f"_section_{key}_{i}.mp3").unlink(missing_ok=True)
        print(f"  [music] composed {p.name} ({len(plan)} sections)")
        return p
    except Exception as e:
        print(f"  [music] compose failed: {e}")
        return None
