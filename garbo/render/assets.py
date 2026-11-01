"""ElevenLabs sound effects + music, generated once and cached in assets/.

Every effect is reused across all four parts, so each costs credits exactly once.
Falls back to the procedural sounds in sound.py if generation fails.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
sys.path.insert(0, str(ROOT / "voices"))

# kind -> (prompt, duration seconds)
SFX = {
    "door_slam":  ("A heavy 1940s wooden office door slammed shut hard, single loud bang with a short room echo", 1.5),
    "stamp":      ("A rubber stamp slammed down hard on paper on a wooden desk, one punchy thud", 0.8),
    "whoosh":     ("A fast cinematic whoosh transition swish, clean and short", 0.8),
    "impact":     ("A deep cinematic trailer impact hit with a sub boom and a short metallic tail", 2.0),
    "riser":      ("A short tense cinematic riser building suspense, strings and noise swelling up", 2.5),
    "typewriter": ("Fast vintage 1940s typewriter typing burst with a carriage bell at the end", 2.0),
    "camera":     ("An old 1940s film camera shutter click and flash pop", 0.7),
    "radio":      ("1940s shortwave radio static and Morse code beeps, crackling", 2.5),
    "cash":       ("A stack of paper banknotes slid across a wooden desk, then a small glass bottle set down", 1.5),
    "heartbeat":  ("Two slow deep heartbeats, cinematic, tense", 1.6),
    "tick":       ("A ticking pocket watch, close and crisp, steady seconds", 3.0),
    "glitch":     ("A quick record scratch stop, comedic freeze-frame", 0.8),
}

# Section-by-section plans so the cue never drops out (reels need constant drive).
PLANS = {
    "part1": [
        ("Cold open: an immediate hard orchestral hit, then a relentless driving pulse starts at once", 12000),
        ("Driving staccato strings and ticking percussion, steady and continuous, tension rising", 30000),
        ("Playful sly Spanish guitar motif over the same driving pulse, a trickster at work", 30000),
        ("Darker, urgent: low brass and taut snare, a manhunt closing in, constant momentum", 28000),
        ("Big reveal and cliffhanger: full orchestra swell, then a held suspenseful tension chord", 20000),
    ],
}
STYLES = ["cinematic orchestral thriller", "1940s espionage", "staccato strings", "ticking clock percussion",
          "constant driving rhythm", "no silence", "instrumental"]
NEG = ["vocals", "silence", "long pauses", "sparse intro", "fade in", "lo-fi"]

MUSIC = {
    "part1": ("Tense 1940s World War II espionage thriller underscore for a fast-paced short documentary video. "
              "Driving staccato pizzicato strings, low ticking clock pulse, muted brass stabs, taut snare rolls, "
              "subtle playful Spanish guitar motif hinting at a charming trickster. Builds steadily in intensity, "
              "no vocals, leaves space for narration.", 100000),
}


def _client():
    import el_client
    return el_client.client()


def sfx_path(kind):
    ASSETS.mkdir(exist_ok=True)
    p = ASSETS / "sfx" / f"{kind}.mp3"
    if p.exists():
        return p
    if kind not in SFX:
        return None
    p.parent.mkdir(exist_ok=True)
    prompt, dur = SFX[kind]
    try:
        audio = _client().text_to_sound_effects.convert(text=prompt, duration_seconds=dur, prompt_influence=0.6)
        with open(p, "wb") as f:
            for ch in audio:
                f.write(ch)
        return p
    except Exception as e:  # keep building with procedural fallback
        print(f"[assets] sfx {kind} failed: {e}")
        return None


def music_path(name):
    ASSETS.mkdir(exist_ok=True)
    p = ASSETS / "music" / f"{name}.mp3"
    if p.exists():
        return p
    if name not in MUSIC and name not in PLANS:
        return None
    p.parent.mkdir(exist_ok=True)
    prompt, ms = MUSIC.get(name, ("", 0))
    try:
        if name in PLANS:
            chunks = [{"text": txt, "duration_ms": dur, "positive_styles": STYLES if i == 0 else STYLES[:4],
                       "negative_styles": NEG, "context_adherence": "high"} for i, (txt, dur) in enumerate(PLANS[name])]
            audio = _client().music.compose(composition_plan={"chunks": chunks}, model_id="music_v2_5")
        else:
            audio = _client().music.compose(prompt=prompt, music_length_ms=ms, model_id="music_v2_5", force_instrumental=True)
        with open(p, "wb") as f:
            for ch in audio:
                f.write(ch)
        return p
    except Exception as e:
        print(f"[assets] music {name} failed: {e}")
        return None
