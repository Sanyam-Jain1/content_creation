"""Text-to-speech layer for GARBO.

synth(char, text, lang) -> dict(audio=<mp3 path>, words=[{text, start, end}], dur)

Results are cached in voices/cache/ by a hash of (provider, voice, settings, text),
so re-rendering never re-bills or re-downloads unchanged lines.

Providers:
  edge        free Microsoft neural voices (drafts / timing)
  elevenlabs  final voices (added after ElevenLabs onboarding completes)
"""
import asyncio
import hashlib
import json
import os
import ssl
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
CACHE = HERE / "cache"
CONFIG = json.loads((HERE / "voices.json").read_text())
CA_BUNDLE = os.environ.get("SSL_CERT_FILE") or "/root/.ccr/ca-bundle.crt"


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
        c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
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


def synth(char, text, lang="en", provider=None):
    provider = provider or CONFIG.get("provider", "edge")
    CACHE.mkdir(exist_ok=True)
    if provider == "edge":
        v = CONFIG["draft"][char]
        k = _key("edge", v["voice"], v.get("rate"), v.get("pitch"), text)
        mp3, meta = CACHE / f"{k}.mp3", CACHE / f"{k}.json"
        if not (mp3.exists() and meta.exists()):
            words = _edge(v["voice"], text, v.get("rate", "+0%"), v.get("pitch", "+0Hz"), mp3)
            meta.write_text(json.dumps({"char": char, "text": text, "voice": v["voice"], "words": words}))
        m = json.loads(meta.read_text())
        return {"audio": str(mp3), "words": m["words"], "dur": _duration(mp3)}
    raise NotImplementedError(f"provider {provider!r} not configured yet")


if __name__ == "__main__":
    import sys
    r = synth(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "en")
    print(json.dumps(r, indent=1))
