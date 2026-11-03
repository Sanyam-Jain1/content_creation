// Render the built reel to MP4 (1080x1920, 30 fps, H.264 + AAC).
//   node render/render.js                          -> build/ten_x_stronger.mp4
//   node render/render.js --stills 2.4,11.1,36.9   -> build/still_<t>.png (debug)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const dir = path.join(root, 'build');
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const html = `<!doctype html><html><head><meta charset="utf-8"><base href="file://${root}/render/">
  <link href="../assets/fonts/fonts.css" rel="stylesheet">
  <style>html,body{margin:0;background:#000;overflow:hidden}</style></head><body><div id="stage"></div>
  <script src="kit.js"></script><script src="scenes.js"></script><script src="player.js"></script></body></html>`;
  const tmp = path.join(dir, '_render.html');
  fs.writeFileSync(tmp, html);
  await page.goto('file://' + tmp);
  await page.evaluate(async (t) => { Player.load(t); await Player.ready(); renderFrame(0); }, tl);
  await page.waitForTimeout(300);

  const stills = opt('--stills');
  if (stills) {
    for (const s of stills.split(',')) {
      await page.evaluate((n) => renderFrame(n), Math.round(+s * tl.fps));
      await page.screenshot({ path: path.join(dir, `still_${s}.png`), scale: 'css' });
    }
    console.log('stills written', errs.slice(0, 5));
    await browser.close();
    return;
  }

  const from = +opt('--from', 0), to = +opt('--to', tl.frames);
  const out = path.join(dir, opt('--out', 'ten_x_stronger.mp4'));
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(tl.fps), '-i', '-',
    '-ss', String(from / tl.fps), '-i', path.join(dir, 'mix.wav'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
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
