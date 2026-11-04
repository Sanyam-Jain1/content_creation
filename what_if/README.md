# WHAT IF? (animated reel series)

Fast, funny "what if" reels, 9:16, 45–62 s each. They use one formula, which tested well on Episode 00:

1. **Hook question on screen from frame 1** (works with the sound off), plus a second-person premise: "Tonight, *you*…"
2. **Fantasy beat**, then a **hard reversal** within 5–8 s ("Sounds awesome? Wrong." / "Enjoy it. You have two minutes to live.").
3. **Escalating, concrete consequences**, one visual gag every 1.5–3 s.
4. **A real science twist** at about 50–60 % ("your muscles got stronger, your bones didn't"), introduced with a record-scratch reset.
5. **A relatable punchline**, then an end-card question to drive comments. The voice ends on the joke, so the loop back to the start is clean.

| # | Episode | Length | Science twist | Retention device | Files |
| --- | --- | --- | --- | --- | --- |
| 00 | What if you woke up 10× stronger? | 61.7 s | Muscles ×10, bones ×1 | Flash-forward montage | `episodes/00_ten_x_stronger/export/` |
| 01 | What if time froze for everyone but you? | 55.9 s | Frozen light (blind) + frozen air (can't breathe or move) | Persistent **AIR LEFT** countdown, a dead-silent beat | `episodes/01_time_freeze/export/` |
| 02 | What if you could eat sunlight? | 44.3 s | Your skin covers about 1 % of your energy needs; you'd need a tennis court of skin | Time-lapse "energy today" battery | `episodes/02_eat_sunlight/export/` |
| 03 | What if you shrank 10× smaller? | 45.9 s | Square-cube law: you survive any fall, but you're always cold | Real pitched-up "tiny voice" line | `episodes/03_ten_x_smaller/export/` |

Each `export/` folder holds the MP4 (1080×1920, 30 fps, H.264/AAC, −14 LUFS) and `cover.png`.
Each episode's `NOTES.md` has the post caption, hashtags, pinned comment and science sources.
`IDEAS.md` has the researched backlog for the next episodes.

## Engine

| File | What it does |
| --- | --- |
| `engine/build.py` | Voices every line (ElevenLabs, word timestamps), times the shots, resolves word-anchored cues, places SFX, fits the score, mixes |
| `engine/voice.py` | Narrator "Brian" (eleven_v3), cached in `voice_cache/` (each line is paid for once) |
| `engine/assets.py` | Shared SFX library in `assets/sfx/` (each sound is paid for once, across all episodes) and per-episode instrumental scores |
| `engine/kit.js` | Cartoon kit: front/side characters with 10 expressions, casts, props, bursts, cracks, rays |
| `engine/player.js` | Retention layer: word-by-word captions, punch-ins, shake, slams, counters, hook title, badge, end card, per-episode HUD overlay |
| `engine/render.js` | Headless Chromium → ffmpeg MP4 with loudness normalisation |

An episode is just `script.json` (lines, cues, SFX, score prompts, hook text) plus `scenes.js` (the art).

```bash
pip install elevenlabs numpy pillow
echo "ELEVENLABS_API_KEY=sk_..." > .env.local           # git-ignored
python3 engine/build.py episodes/01_time_freeze          # voice + sfx + score + mix (cached)
node engine/render.js episodes/01_time_freeze            # -> export/time_freeze.mp4
node engine/render.js episodes/01_time_freeze --stills 2.0,9.5   # debug frames
```

Script features: `pitch` on a line (tiny or helium voice), `musicGain: 0` on a shot (a silent beat),
`show` to remap caption words (`"two" → "2"`), `[audio tags]` such as `[whispers]` and `[serious]`, `shakeWords`,
and `fx` slams, counters and tags anchored to spoken words.

Score note: scores are composed **one section at a time with `force_instrumental`**. The earlier
single composition-plan request sang the prompt text under the voice-over, which
speech-to-text caught. Episode 00 was re-scored and re-rendered for this reason. After every build, check the mix with
speech-to-text: only narration should come back.
