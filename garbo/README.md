# GARBO — The Spy Who Fooled Hitler

A 4-part animated reel series (9:16, ~90–100 s each) about Juan Pujol García,
the Spanish double agent "GARBO". Each part stands on its own.

| Folder | What's in it |
| --- | --- |
| `story/` | `STORYLINE.md`: the revised 4-part script, the standalone rules, the language plan |
| `research/` | `CHARACTERS.md`: who looked and sounded like what, from period photos, with sources |
| `characters/` | `rig.js` (animatable vector portrait rig), `cast.js` (every character and era variant), `preview.html` (lineup) |
| `scenes/` | `partN.json`: shots, sets, camera moves, name cards, lines (language + subtitle) |
| `voices/` | `voices.json` (casting), `tts.py` (cached TTS: free edge voices for drafts, ElevenLabs for finals) |
| `render/` | sets, frame player, timeline builder, audio mix, MP4 renderer |

## Build a part

```bash
pip install -r requirements.txt
python3 render/build_timeline.py scenes/part1.json   # voices, timing, lip-sync, mix -> build/part1/
node render/render.js build/part1                    # -> build/part1/garbo_part1.mp4 (1080x1920)
```

Open `build/part1/preview.html` in a browser for an instant preview with sound.

## Credits / costs

- Draft voices: free (Microsoft neural voices via `edge-tts`).
- Final voices / SFX: ElevenLabs. The key lives in `garbo/.env.local` (git-ignored) as
  `ELEVENLABS_API_KEY`. Every generation is cached in `voices/cache/`, so a line is paid for once.
- Music bed and placeholder SFX are procedural (`render/sound.py`): free.
