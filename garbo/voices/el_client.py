"""ElevenLabs client. The key is read from ELEVENLABS_API_KEY, which is loaded
from garbo/.env.local (git-ignored) if not already set. The key never appears in code."""
import os
from pathlib import Path

ENV = Path(__file__).resolve().parent.parent / ".env.local"


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
