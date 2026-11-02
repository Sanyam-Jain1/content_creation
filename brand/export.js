// Render the brand board and every asset to PNG.  node brand/export.js
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const dir = __dirname, out = path.join(dir, 'export'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1200 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(dir, 'board.html'));
  await p.evaluate(async () => { await Promise.all(['900 84px "Montserrat"', '400 40px "Courier Prime"', '700 42px "Playfair Display"'].map(f => document.fonts.load(f))); });
  await p.evaluate(() => { const s = document.createElement('script'); s.src = 'brand.js'; document.body.appendChild(s); });
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(out, 'brand_board.png'), fullPage: true });
  const assets = [['pfp_A_cliffhanger', 'BRAND.pfpCliff(1080)', 1080, 1080], ['pfp_B_storyhook', 'BRAND.pfpHook(1080)', 1080, 1080], ['pfp_C_monogram', 'BRAND.pfpBubble(1080)', 1080, 1080],
    ['cover_part1', 'BRAND.coverPart1(1080,false)', 1080, 1920]].concat(
    ['GARBO', 'SOURCES', 'NEXT', 'ABOUT'].map(n => [`highlight_${n.replace(' ', '').toLowerCase()}`, `BRAND.highlight(${JSON.stringify(n)},1080)`, 1080, 1080]));
  for (const [name, expr, w, h] of assets) {
    await p.setViewportSize({ width: w, height: h });
    await p.evaluate((e) => { document.body.innerHTML = `<div style="width:${0}">` + eval(e) + '</div>'; document.body.style.margin = 0; document.body.style.width = 'auto'; }, expr);
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(out, name + '.png'), clip: { x: 0, y: 0, width: w, height: h } });
  }
  console.log('done', errs); await b.close();
})();
