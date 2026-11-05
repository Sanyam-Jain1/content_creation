# ANDAR KI BAAT (animated Hinglish explainer reels)

Everyday Indian things, explained in about 50–60 s: what is *really* going on inside.
9:16, 1080×1920, Hinglish voice-over, word-by-word Hinglish captions.

Format (modelled on the desi "how it works" reels that do well, made with our own engine, art and script):

1. **A scene everyone has lived** in the first frame, with the question on screen (works with the sound off): the chai-stall *ting*, mummy's three whistles, the stones under the track.
2. **The wrong guess, killed fast** ("Kya note udd ke gaya? Nahi." / "Sajaavat ke liye? Bilkul nahi.").
3. **The mechanism, one visual per sentence**: diagrams that build up word by word (packets, gauges, cross-sections).
4. **A twist at about 55–65 %** (only ledger entries move / Leh boils at 88 °C / the stones *must* be angular).
5. **A useful takeaway** people save and forward to family (PIN is never needed to receive money, …).
6. **A desi punchline** on a second voice ("Bhaiya, chai thandi ho gayi."), then an end card that asks for the next topic.

| # | Episode | Length | Twist | Files |
| --- | --- | --- | --- | --- |
| 01 | UPI se paisa 2 second mein kaise pahunchta hai? | 61.8 s | No money moves, only entries; PIN never needed to receive | `episodes/01_upi/export/` |
| 02 | Pressure cooker ki seeti: andar kya ho raha hai? | 60.9 s | Cooker water boils at about 120 °C; in Leh at about 88 °C | `episodes/02_pressure_cooker/export/` |
| 03 | Railway track ke neeche patthar kyun? | 51.8 s | Angular stones interlock; round ones would roll | `episodes/03_railway_gitti/export/` |

Each `export/` holds the MP4 (H.264/AAC, −14 LUFS) and `cover.png`. Each `NOTES.md` has the caption, hashtags, Shorts title, pinned comment and facts.

## How it's made (no paid APIs)

It reuses the WHAT IF? engine in `../what_if/engine/`, with three additions:

| Piece | What it does |
| --- | --- |
| `voice.synth_edge` | Free Microsoft neural voices through `edge-tts`: **Madhur** (hi-IN, narrator), **Swara** (hi-IN, mummy / soundbox), **Prabhat** (en-IN, the punchline guy). A line has `text` (Hinglish caption) and `say` (what's spoken: Hindi in Devanagari, English as is) with the **same word count**, so the word timings map 1:1. |
| `engine/synth.py` | Procedural score (marimba pluck, tabla bayan/dayan, pad, bass, kick/clap) per section with a mood (`bright`, `curious`, `tense`, `warm`) and a level (0–2). Also synthesises the series SFX: `cooker_whistle`, `steam_hiss`, `boil`, `flame`, `chime` (soundbox), `train_clack`, `train_horn`, `gravel`, `thunk`. Everything is original and royalty-free. |
| `script.json` keys | `"voice": {"engine": "edge", ...}`, `"tempo": 1.0`, `"score": {"engine": "synth", ...}`; per line `voice`, `rate`, `vpitch`; per shot `capY` (move the captions). `show: {"word": ""}` hides a spoken word in the captions. |

```bash
pip install edge-tts numpy pillow scipy
cd what_if
python3 engine/build.py ../andar_ki_baat/episodes/01_upi           # voice + sfx + score + mix (cached in andar_ki_baat/voice_cache)
node engine/render.js ../andar_ki_baat/episodes/01_upi             # -> episodes/01_upi/export/upi_kaise_chalta.mp4
node engine/render.js ../andar_ki_baat/episodes/01_upi --stills 4,20   # debug frames
```

QA: after a build, transcribe `build/mix.wav` (faster-whisper, `language="hi"`). Only the narration should come back, never lyrics from the score.

## Next topics (backlog)

- FASTag: toll katne ke liye gaadi rukti kyun nahi?
- OTP 30 second mein expire kyun hota hai?
- AC ko 24 °C pe kyun chalayein? (BEE default)
- Mobile "fast charging": phone garam kyun hota hai?
- Inverter / UPS: light jaate hi 0.01 second mein kaise switch?
- Mosquito sirf mujhe hi kyun kaatte hain? (CO₂ + heat + smell)
- Train ke peeche "X" kyun bana hota hai? (last coach marker)
- Petrol pump pe phone kyun mana hai? (myth vs real: static)
