"""Text-to-speech layer for GARBO.

synth(char, text, lang) -> dict(audio=<mp3 path>, words=[{text, start, end}], dur)

Results are cached in voices/cache/ by a hash of (provider, voice, model, settings, text),
so re-rendering never re-bills an unchanged line.

Providers:
  edge        free Microsoft neural voices (drafts / timing)
  elevenlabs  final voices (Eleven v4, with character-level timestamps)

Text may contain ElevenLabs audio tags like [laughs] or [whispers]; they are
performed but never shown in subtitles.
"""
import asyncio
import base64
import hashlib
import json
import os
import re
import ssl
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
CACHE = HERE / "cache"
CONFIG = json.loads((HERE / "voices.json").read_text())
CA_BUNDLE = os.environ.get("SSL_CERT_FILE") or "/root/.ccr/ca-bundle.crt"
TAG = re.compile(r"\[[^\]]*\]\s*")


def strip_tags(text):
    return TAG.sub("", text).strip()


def _key(*parts):
    return hashlib.sha1("|".join(map(str, parts)).encode()).hexdigest()[:16]


def _duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


# ---------------- edge (draft) ----------------
def _edge(voice, text, rate, pitch, out_mp3):
    import edge_tts
    import edge_tts.communicate as comm

    if os.path.exists(CA_BUNDLE):
        comm._SSL_CTX = ssl.create_default_context(cafile=CA_BUNDLE)

    async def run():
        c = edge_tts.Communicate(strip_tags(text), voice, rate=rate, pitch=pitch, boundary="WordBoundary")
        words = []
        with open(out_mp3, "wb") as f:
            async for chunk in c.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    s = chunk["offset"] / 1e7
                    words.append({"text": chunk["text"], "start": s, "end": s + chunk["duration"] / 1e7})
        return words

    return asyncio.run(run())


# ---------------- ElevenLabs (final) ----------------
def _words_from_alignment(al):
    """Character timestamps -> words, skipping [audio tags]."""
    chars, st, en = al.characters, al.character_start_times_seconds, al.character_end_times_seconds
    words, cur, s0, e0, in_tag = [], "", None, None, False
    for ch, a, b in zip(chars, st, en):
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


def _eleven(v, text, lang, out_mp3, context=None):
    sys_path = str(HERE)
    import sys
    if sys_path not in sys.path:
        sys.path.insert(0, sys_path)
    import el_client
    from elevenlabs import VoiceSettings

    c = el_client.client()
    kw = dict(
        voice_id=v["voice_id"],
        text=text,
        model_id=v.get("model", CONFIG.get("model", "eleven_v4")),
        voice_settings=VoiceSettings(stability=v.get("stability", 0.45), similarity_boost=v.get("similarity", 0.8)),
        output_format="mp3_44100_128",
    )
    if lang and v.get("language_code", True):
        kw["language_code"] = lang
    r = c.text_to_speech.convert_with_timestamps(**kw)
    Path(out_mp3).write_bytes(base64.b64decode(r.audio_base_64))
    al = r.normalized_alignment or r.alignment
    return _words_from_alignment(al) if al else []


def synth(char, text, lang="en", provider=None):
    provider = provider or CONFIG.get("provider", "edge")
    CACHE.mkdir(exist_ok=True)
    if provider == "elevenlabs" and char in CONFIG.get("final", {}):
        v = CONFIG["final"][char]
        model = v.get("model", CONFIG.get("model", "eleven_v4"))
        k = _key("eleven", v["voice_id"], model, v.get("stability"), v.get("similarity"), lang, text)
        mp3, meta = CACHE / f"{k}.mp3", CACHE / f"{k}.json"
        if not (mp3.exists() and meta.exists()):
            words = _eleven(v, text, lang, mp3)
            meta.write_text(json.dumps({"char": char, "text": text, "voice": v["voice_id"], "words": words}))
    else:
        v = CONFIG["draft"][char]
        k = _key("edge", v["voice"], v.get("rate"), v.get("pitch"), text)
        mp3, meta = CACHE / f"{k}.mp3", CACHE / f"{k}.json"
        if not (mp3.exists() and meta.exists()):
            words = _edge(v["voice"], text, v.get("rate", "+0%"), v.get("pitch", "+0Hz"), mp3)
            meta.write_text(json.dumps({"char": char, "text": text, "voice": v["voice"], "words": words}))
    m = json.loads(meta.read_text())
    return {"audio": str(mp3), "words": m["words"], "dur": _duration(mp3)}


if __name__ == "__main__":
    import sys
    r = synth(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "en")
    print(json.dumps(r, indent=1))
