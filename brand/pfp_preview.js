// Renders the final pfp variants at full size + an Instagram-style preview strip.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const dir = __dirname, out = path.join(dir, 'export'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1080 } });
  await p.goto('file://' + path.join(dir, 'board.html'));
  for (const v of ['yellow', 'ink', 'red']) {
    await p.setViewportSize({ width: 1080, height: 1080 });
    await p.evaluate((v) => { document.body.style.margin = 0; document.body.innerHTML = BRAND.pfpTV(1080, v); }, v);
    await p.screenshot({ path: path.join(out, `pfp_waitwhattv_${v}.png`), clip: { x: 0, y: 0, width: 1080, height: 1080 } });
  }
  // preview: big circle + feed sizes, light and dark mode, with the handle
  await p.setViewportSize({ width: 1500, height: 760 });
  await p.evaluate(() => {
    const c = (v, s) => `<div style="width:${s}px;height:${s}px;border-radius:50%;overflow:hidden;display:inline-block;vertical-align:middle;flex-shrink:0">${BRAND.pfpTV(s, v)}</div>`;
    const row = (v, bg, fg) => `<div style="background:${bg};color:${fg};padding:24px 30px;display:flex;align-items:center;gap:26px;font:600 30px Arial">
      ${c(v, 300)}<div><div style="font:700 34px Arial">waitwhattv</div><div style="opacity:.7;font-size:24px;margin:6px 0 18px">Wait, What? | Unbelievable True Stories</div>
      <div style="display:flex;gap:18px;align-items:center">${c(v, 110)}${c(v, 56)}${c(v, 32)}<span style="font-size:22px;opacity:.6">110 / 56 / 32 px</span></div></div></div>`;
    document.body.style.margin = 0;
    document.body.innerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;width:1500px">${row('yellow', '#fff', '#111')}${row('yellow', '#000', '#fff')}${row('ink', '#fff', '#111')}${row('red', '#000', '#fff')}</div>`;
  });
  await p.screenshot({ path: path.join(out, 'pfp_waitwhattv_preview.png'), fullPage: true });
  await b.close(); console.log('ok');
})();
