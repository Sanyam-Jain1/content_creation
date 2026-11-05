"""ElevenLabs narration with word timings, cached by content hash.

synth(text) -> {"audio": mp3 path, "words": [{text, start, end}], "dur": seconds}

The key is read from ELEVENLABS_API_KEY, loaded from what_if/.env.local
(git-ignored) when not already set. Every line is paid for once: re-running the
build with an unchanged line reuses voice_cache/.

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

ROOT = Path(__file__).resolve().parent.parent   # what_if/
CACHE = ROOT / "voice_cache"
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


# ---------------------------------------------------------------------------
# Free neural voices (Microsoft Edge read-aloud, via edge-tts) for the Hinglish
# series. No key needed. A line has two forms:
#   text: what the captions show (Hinglish in Latin script, word by word)
#   say:  what the voice reads (Hindi words in Devanagari, English words as is)
# Both must have the same number of words; word timings map 1:1. If the counts
# differ, timings are spread by word length across the spoken span.
EDGE_VOICES = {
    "madhur": "hi-IN-MadhurNeural",   # male narrator
    "swara": "hi-IN-SwaraNeural",     # female (mummy, the soundbox, ...)
}


def _edge_stream(say, voice, rate, pitch, mp3):
    import asyncio
    import certifi
    # behind a TLS-terminating proxy, trust its bundle (edge-tts pins certifi's)
    bundle = os.environ.get("SSL_CERT_FILE") or "/root/.ccr/ca-bundle.crt"
    if Path(bundle).exists():
        certifi.where = lambda: bundle
    import edge_tts

    async def run():
        c = edge_tts.Communicate(say, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
        words, buf = [], bytearray()
        async for ch in c.stream():
            if ch["type"] == "audio":
                buf.extend(ch["data"])
            elif ch["type"] == "WordBoundary":
                s = ch["offset"] / 1e7
                words.append({"text": ch["text"], "start": s, "end": s + ch["duration"] / 1e7})
        return bytes(buf), words

    data, words = asyncio.run(run())
    tmp = mp3.with_suffix(".24k.mp3")
    tmp.write_bytes(data)
    # resample to 44.1 kHz so the build's pitch tricks (asetrate=44100*k) hold
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(tmp), "-ar", "44100", "-b:a", "160k", str(mp3)], check=True)
    tmp.unlink()
    return words


def _map_words(caption, spoken):
    cap = caption.split()
    if not spoken:
        return [{"text": w, "start": None, "end": None} for w in cap]
    if len(cap) == len(spoken):
        return [dict(s, text=c) for c, s in zip(cap, spoken)]
    print(f"  ! word count differs ({len(cap)} caption vs {len(spoken)} spoken): {caption!r}")
    t0, t1 = spoken[0]["start"], spoken[-1]["end"]
    wts = [len(re.sub(r"\W", "", w)) + 1 for w in cap]
    tot, acc, out = sum(wts), 0, []
    for c, wt in zip(cap, wts):
        a = t0 + (t1 - t0) * acc / tot
        acc += wt
        out.append({"text": c, "start": a, "end": t0 + (t1 - t0) * acc / tot})
    return out


def synth_edge(text, say=None, voice="madhur", rate="+8%", pitch="+0Hz", cache=None):
    """text = caption form, say = spoken form (defaults to text)."""
    cache = Path(cache or CACHE)
    cache.mkdir(parents=True, exist_ok=True)
    vname = EDGE_VOICES.get(voice, voice)
    say = say or text
    k = hashlib.sha1("|".join(["edge", vname, rate, pitch, say]).encode()).hexdigest()[:16]
    mp3, meta = cache / f"{k}.mp3", cache / f"{k}.json"
    if not (mp3.exists() and meta.exists()):
        spoken = _edge_stream(strip_tags(say), vname, rate, pitch, mp3)
        meta.write_text(json.dumps({"say": say, "voice": vname, "spoken": spoken}, ensure_ascii=False))
        print(f"  [tts:{voice}] {say}")
    m = json.loads(meta.read_text())
    return {"audio": str(mp3), "words": _map_words(strip_tags(text), m["spoken"]), "dur": duration(mp3)}
