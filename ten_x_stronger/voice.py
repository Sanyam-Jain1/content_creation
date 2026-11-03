"""ElevenLabs narration with word timings, cached by content hash.

synth(text) -> {"audio": mp3 path, "words": [{text, start, end}], "dur": seconds}

The key is read from ELEVENLABS_API_KEY, loaded from ten_x_stronger/.env.local
(git-ignored) when not already set. Every line is paid for once: re-running the
build with an unchanged line reuses voice/cache/.

Text may carry eleven_v3 audio tags like [whispers]; they are performed but never
shown in captions.
"""
import base64
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / "voice" / "cache"
ENV = ROOT / ".env.local"
TAG = re.compile(r"\[[^\]]*\]\s*")

# Narrator casting. Brian: deep, warm American "explainer" voice, the sound of the genre.
NARRATOR = {"voice_id": "nPczCjzI2devNBz1zQrb", "name": "Brian (premade)", "model": "eleven_v3",
            "stability": 0.5, "similarity": 0.8}


def load_env():
    if os.environ.get("ELEVENLABS_API_KEY") or not ENV.exists():
        return
    for line in ENV.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def client():
    load_env()
    from elevenlabs import ElevenLabs
    return ElevenLabs()


def strip_tags(text):
    return TAG.sub("", text).strip()


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout.strip()
    return float(out)


def _words(al):
    """Character timestamps -> words, skipping [audio tags]."""
    words, cur, s0, e0, in_tag = [], "", None, None, False
    for ch, a, b in zip(al.characters, al.character_start_times_seconds, al.character_end_times_seconds):
        if ch == "[":
            in_tag = True
            continue
        if ch == "]":
            in_tag = False
            continue
        if in_tag:
            continue
        if ch.isspace():
            if cur:
                words.append({"text": cur, "start": s0, "end": e0})
            cur, s0 = "", None
            continue
        if s0 is None:
            s0 = a
        cur += ch
        e0 = b
    if cur:
        words.append({"text": cur, "start": s0, "end": e0})
    return words


def synth(text, v=NARRATOR, take=0):
    CACHE.mkdir(parents=True, exist_ok=True)
    k = hashlib.sha1("|".join(map(str, [v["voice_id"], v["model"], v["stability"], v["similarity"], take, text])).encode()).hexdigest()[:16]
    mp3, meta = CACHE / f"{k}.mp3", CACHE / f"{k}.json"
    if not (mp3.exists() and meta.exists()):
        from elevenlabs import VoiceSettings
        r = client().text_to_speech.convert_with_timestamps(
            voice_id=v["voice_id"], text=text, model_id=v["model"], language_code="en",
            voice_settings=VoiceSettings(stability=v["stability"], similarity_boost=v["similarity"]),
            output_format="mp3_44100_128", seed=1234 + take)
        mp3.write_bytes(base64.b64decode(r.audio_base_64))
        al = r.normalized_alignment or r.alignment
        meta.write_text(json.dumps({"text": text, "voice": v["name"], "words": _words(al) if al else []}))
        print(f"  [tts] {text}")
    m = json.loads(meta.read_text())
    return {"audio": str(mp3), "words": m["words"], "dur": duration(mp3)}
