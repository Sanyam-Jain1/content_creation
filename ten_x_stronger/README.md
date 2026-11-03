# 10× STRONGER: "What if everyone became ten times stronger?"

A vertical reel (1080×1920, 30 fps, about 62 s) for Instagram Reels, YouTube Shorts and TikTok.
The final script, the reasons for each change, and the post copy are in `SCRIPT.md`.

| File | What it is |
| --- | --- |
| `script.json` | Shots, voice lines, and word-anchored cues / SFX / text slams (edit this to change the reel) |
| `voice.py` | ElevenLabs narration with word timestamps (Brian, eleven_v3), cached in `voice/cache/` |
| `assets.py` | ElevenLabs SFX prompts and the 5-section score plan; generated once into `assets/` |
| `build.py` | Voices every line, times the shots, resolves cues, fits the score, mixes `build/mix.wav` |
| `render/kit.js` | Cartoon drawing kit: front/side-view characters with expressions, props, bursts, cracks |
| `render/scenes.js` | The 12 scenes (night, flash-forward, alarm, phone, world, door, handshake, hug, x-ray, sprint, hospital, slow-mo, couch) |
| `render/player.js` | Captions (word by word), punch-ins, shake, slams, counter, hook title, badge, end card |
| `render/render.js` | Headless Chromium → ffmpeg MP4, loudness-normalised to −14 LUFS |

## Build

```bash
pip install elevenlabs numpy pillow
echo "ELEVENLABS_API_KEY=sk_..." > .env.local     # git-ignored
python3 build.py                                  # -> build/timeline.json, mix.wav, preview.html
node render/render.js                             # -> build/ten_x_stronger.mp4
node render/render.js --stills 12.4,36.9          # debug frames
```

Everything paid for is cached: unchanged lines, SFX and the score are never regenerated.
`python3 build.py --rescore` composes a new score when the timing changes a lot. Without it,
the cached score is re-fitted section by section to the new shot times.

Fonts: Montserrat Black (OFL) for captions, Luckiest Guy (Apache 2.0) for slams. Both are bundled.
