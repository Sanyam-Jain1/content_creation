// Render a built part to MP4 (1080x1920, 30 fps, H.264 + AAC).
//   node render/render.js build/part1            -> build/part1/garbo_part1.mp4
//   node render/render.js build/part1 --from 300 --to 420 --still   (debug)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

(async () => {
  const dir = path.resolve(process.argv[2]);
  const args = process.argv.slice(3);
  const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const still = args.includes('--still');
  const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));
  const root = path.resolve(__dirname, '..');
  const from = +opt('--from', 0), to = +opt('--to', tl.frames);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  const html = `<!doctype html><html><head><meta charset="utf-8"><base href="file://${root}/render/">
  <link href="../assets/fonts/fonts.css" rel="stylesheet">
  <style>html,body{margin:0;background:#000;overflow:hidden}</style></head><body><div id="stage"></div>
  <script src="../characters/rig.js"></script><script src="../characters/cast.js"></script>
  <script src="backgrounds.js"></script><script src="player.js"></script></body></html>`;
  const tmp = path.join(dir, '_render.html');
  fs.writeFileSync(tmp, html);
  await page.goto('file://' + tmp);
  await page.evaluate((t) => { GarboPlayer.load(t); renderFrame(0); }, tl);
  try { await page.evaluate(() => document.fonts.ready); } catch (e) {}
  await page.waitForTimeout(400);

  if (still) {
    for (const f of [from, Math.floor((from + to) / 2), to - 1]) {
      await page.evaluate((n) => renderFrame(n), f);
      await page.screenshot({ path: path.join(dir, `still_${f}.png`) });
    }
    console.log('stills written', errs);
    await browser.close();
    return;
  }

  const out = path.join(dir, `garbo_part${tl.part}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(tl.fps), '-i', '-',
    '-ss', String(from / tl.fps), '-i', path.join(dir, 'mix.wav'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = from; f < to; f++) {
    await page.evaluate((n) => renderFrame(n), f);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 150 === 0) process.stdout.write(`frame ${f}/${to} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  fs.unlinkSync(tmp);
  if (errs.length) console.log('page errors:', errs.slice(0, 5));
  console.log('wrote', out);
})();
