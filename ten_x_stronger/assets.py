"""Sound effects and score, generated once with ElevenLabs and cached in assets/.

impact, whoosh, riser, heartbeat, stamp and scratch are reused from the GARBO
series (already paid for). The score is composed per build from the real shot
timings, so the music's section changes land on the cuts.
"""
import hashlib
import json
from pathlib import Path

from voice import client

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"

# kind -> (prompt, seconds)
SFX = {
    "crickets":     ("Quiet summer night ambience heard from inside a bedroom, soft crickets, calm and peaceful", 4.0),
    "pop":          ("A short bright cartoon bubble pop with a tiny sparkle", 0.5),
    "rewind":       ("A fast VHS tape rewind sound effect with a glitchy warble, cinematic flash-forward", 1.2),
    "alarm":        ("A loud digital alarm clock beeping fast, beep beep beep beep, annoying, close up", 2.5),
    "wood_smash":   ("A fist smashing straight through a wooden bedside table, huge wood crack, splinters exploding, debris hitting the floor", 2.0),
    "phone_crunch": ("A smartphone bent in half, glass screen shattering, aluminium and plastic crunching, crisp close up", 1.2),
    "gasp":         ("A single man's shocked sharp gasp, comedic", 0.8),
    "crowd_gasp":   ("A huge crowd of thousands of people gasping in shock at the same time", 1.8),
    "door_rip":     ("A wooden door violently ripped off its metal hinges, screws snapping, wood splintering, a heavy clatter", 1.6),
    "buzzer":       ("A loud game show wrong answer buzzer, comedic", 1.0),
    "squeeze":      ("A cartoon squeaky toy squeeze followed by a tiny strained squeak", 0.8),
    "siren":        ("An ambulance siren wailing close by, short burst", 2.2),
    "xray":         ("A sci-fi x-ray scanner powering on, electrical hum and a soft scanning sweep", 3.0),
    "bone_crack":   ("A sharp loud bone crack snap, crunchy and crisp, cartoon cartoonish but painful", 0.8),
    "bus":          ("A city bus pulling away from a stop, diesel engine revving and air brakes hissing", 3.0),
    "run":          ("Fast sprinting footsteps on pavement accelerating, sneakers", 1.5),
    "hospital":     ("Busy crowded hospital waiting room ambience, murmurs, people groaning, a phone ringing far away", 5.0),
    "jar":          ("A man straining hard to open a stuck glass pickle jar, grunting, the metal lid creaking but not opening", 1.8),
    "slowmo":       ("A deep slow motion time-slowing whoosh, everything drops in pitch, dreamy", 2.0),
    "tiptoe":       ("Cartoon tiptoe sneaking steps played on soft pizzicato strings, tip tip tip tip", 2.0),
    "tv":           ("A television in a living room playing a sitcom quietly with a distant studio laugh track", 5.0),
    "sigh":         ("A long, relaxed, deeply contented male sigh, lazy and satisfied", 1.6),
}

# Score: one composition plan, section lengths come from the timeline.
SECTION_PROMPTS = {
    "A": "Hushed bedtime music box and soft celesta, sleepy and magical night, a sense of wonder, gentle and quiet, then a sudden dramatic orchestral hit",
    "B": "Quirky upbeat comedic cartoon chaos: bouncy pizzicato strings, plucky bass, tuba stabs, snappy drums and claps, playful and fast, constant momentum",
    "C": "Abrupt stop into an ominous low synth drone with a slow heartbeat kick and a tense high string note, suspenseful and dark",
    "D": "Comedic chaos returns even faster: frantic bouncy brass, xylophone runs, slapstick drums, hurried and silly, constant drive",
    "E": "Slow motion: delicate tiptoe pizzicato and a soft music box over warm strings, calm, gentle and tender, ending on a lazy, resolved, sleepy chord",
}
STYLES = ["comedic cartoon score", "quirky", "playful orchestral", "instrumental", "constant rhythm"]
NEG = ["vocals", "singing", "long silence", "lo-fi"]


def sfx_path(kind):
    p = ASSETS / "sfx" / f"{kind}.mp3"
    if p.exists():
        return p
    if kind not in SFX:
        print(f"  [sfx] no prompt for {kind}")
        return None
    p.parent.mkdir(parents=True, exist_ok=True)
    prompt, dur = SFX[kind]
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


def score_path(sections):
    """sections: [(letter, seconds)] -> composed mp3 (cached by plan)."""
    chunks = []
    for i, (s, sec) in enumerate(sections):
        chunks.append({"text": SECTION_PROMPTS[s], "duration_ms": int(max(3000, round(sec * 1000))),
                       "positive_styles": STYLES, "negative_styles": NEG, "context_adherence": "high"})
    key = hashlib.sha1(json.dumps(chunks, sort_keys=True).encode()).hexdigest()[:12]
    p = ASSETS / "music" / f"score_{key}.mp3"
    if p.exists():
        return p
    p.parent.mkdir(parents=True, exist_ok=True)
    try:
        audio = client().music.compose(composition_plan={"chunks": chunks}, model_id="music_v2_5")
        with open(p, "wb") as f:
            for ch in audio:
                f.write(ch)
        (p.with_suffix(".json")).write_text(json.dumps(chunks, indent=1))
        print(f"  [music] composed {p.name}")
        return p
    except Exception as e:
        print(f"  [music] compose failed: {e}")
        return None
