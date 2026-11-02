// Brand assets for the page: profile pictures, highlight covers, reel cover.
// Every function returns an SVG string; the board and the exporter both use them.
(function () {
  'use strict';
  const Y = '#ffd23f', RED = '#ff3b2f', INK = '#0f0e0c', PAPER = '#efe6cf', MANILA = '#d9c08a';
  const svg = (w, h, inner, size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${size || w}" height="${size ? size * h / w : h}">${inner}</svg>`;

  // 1. CLIFFHANGER: a hand gripping a ledge (every part ends on one)
  function pfpCliff(size) {
    const SK = PAPER, OL = 22;
    let g = `<rect width="1080" height="1080" fill="${Y}"/>`;
    g += `<path d="M-20,-20 L1100,-20 L1100,470 L-20,470Z" fill="${INK}"/>`;                                 // cliff (solid ground above)
    g += `<path d="M-20,360 L1100,360 L1100,470 L-20,470Z" fill="#3a352e"/>`;                                // top surface of the edge
    g += `<path d="M-20,470 L1100,470" stroke="#000" stroke-width="10"/>`;
    // arm + palm hanging below the ledge
    g += `<path d="M420,1100 L440,700 Q450,560 540,560 Q630,560 640,700 L660,1100Z" fill="${SK}" stroke="${INK}" stroke-width="${OL}" stroke-linejoin="round"/>`;
    g += `<path d="M360,560 Q360,470 450,470 L640,470 Q720,470 720,560 L720,700 Q720,760 640,760 L440,760 Q360,760 360,700Z" fill="${SK}" stroke="${INK}" stroke-width="${OL}"/>`;
    // four fingers curled over the top of the ledge
    for (const [x, top] of [[372, 380], [458, 365], [544, 368], [630, 385]]) {
      g += `<rect x="${x}" y="${top}" width="80" height="${520 - top}" rx="40" fill="${SK}" stroke="${INK}" stroke-width="${OL}"/>`;
      g += `<path d="M${x + 18},${top + 40} q22,-14 44,0" stroke="${INK}" stroke-width="8" fill="none" opacity="0.5"/>`;
    }
    // thumb pressing on the ledge face
    g += `<rect x="690" y="520" width="80" height="190" rx="40" fill="${SK}" stroke="${INK}" stroke-width="${OL}" transform="rotate(28 730 615)"/>`;
    // strain lines
    g += `<path d="M310,560 L240,540 M310,640 L230,660 M790,800 L860,830" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>`;
    g += `<path d="M120,120 L180,200 M960,140 L900,210" stroke="${Y}" stroke-width="0"/>`;
    return svg(1080, 1080, g, size);
  }

  // 2. STORYHOOK: a fishing hook that is also a question mark
  function pfpHook(size) {
    let g = `<rect width="1080" height="1080" fill="${INK}"/>`;
    g += `<path d="M540,150 L540,560 Q540,800 380,800 Q250,800 250,670 L250,610" fill="none" stroke="${Y}" stroke-width="90" stroke-linecap="round"/>`;
    g += `<path d="M205,640 L250,470 L300,640Z" fill="${Y}"/>`;                                                // barb point
    g += `<circle cx="540" cy="140" r="70" fill="none" stroke="${Y}" stroke-width="40"/>`;                   // eye
    g += `<circle cx="540" cy="940" r="62" fill="${RED}"/>`;                                                 // the dot of the "?"
    return svg(1080, 1080, g, size);
  }

  // 3. Monogram speech bubble: works for any name (initials + "...")
  function pfpBubble(size, letters = 'CH') {
    let g = `<rect width="1080" height="1080" fill="${Y}"/>`;
    g += `<path d="M190,250 Q190,170 270,170 L810,170 Q890,170 890,250 L890,700 Q890,780 810,780 L470,780 L320,920 L350,780 L270,780 Q190,780 190,700Z" fill="${INK}"/>`;
    g += `<text x="540" y="560" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="300" fill="${Y}">${letters}</text>`;
    g += `<circle cx="450" cy="680" r="22" fill="${RED}"/><circle cx="540" cy="680" r="22" fill="${RED}"/><circle cx="630" cy="680" r="22" fill="${RED}"/>`;
    return svg(1080, 1080, g, size);
  }

  // Highlight covers: yellow icon on ink
  const ICONS = {
    'GARBO': `<ellipse cx="540" cy="640" rx="120" ry="150" fill="${Y}"/><ellipse cx="540" cy="480" rx="240" ry="46" fill="${Y}"/><path d="M395,485 Q395,320 540,315 Q685,320 685,485Z" fill="${Y}"/><rect x="395" y="440" width="290" height="30" fill="${RED}"/>`,
    'SOURCES': `<rect x="380" y="320" width="320" height="420" fill="${Y}"/><line x1="430" y1="420" x2="650" y2="420" stroke="${INK}" stroke-width="20"/><line x1="430" y1="490" x2="650" y2="490" stroke="${INK}" stroke-width="20"/><line x1="430" y1="560" x2="600" y2="560" stroke="${INK}" stroke-width="20"/><circle cx="660" cy="660" r="70" fill="${INK}" stroke="${Y}" stroke-width="20"/><line x1="710" y1="710" x2="780" y2="780" stroke="${Y}" stroke-width="30"/>`,
    'NEXT': `<circle cx="540" cy="540" r="220" fill="none" stroke="${Y}" stroke-width="34"/><path d="M490,430 L640,540 L490,650Z" fill="${Y}"/>`,
    'ABOUT': `<path d="M300,330 Q300,280 350,280 L730,280 Q780,280 780,330 L780,620 Q780,670 730,670 L500,670 L400,770 L420,670 L350,670 Q300,670 300,620Z" fill="${Y}"/><circle cx="440" cy="475" r="26" fill="${INK}"/><circle cx="540" cy="475" r="26" fill="${INK}"/><circle cx="640" cy="475" r="26" fill="${INK}"/>`,
  };
  function highlight(name, size) {
    return svg(1080, 1080, `<rect width="1080" height="1080" fill="${INK}"/>${ICONS[name]}`, size);
  }

  // Reel cover for Part 1, grid-safe: everything important inside the central 3:4 (1080x1440) box
  function coverPart1(size, guide) {
    let g = `<rect width="1080" height="1920" fill="#cbb68e"/>`;
    for (let i = 0; i < 80; i++) g += `<circle cx="${(i * 389) % 1080}" cy="${(i * 617) % 1920}" r="${2 + (i % 5)}" fill="#8a6a3a" opacity="0.14"/>`;
    g += `<rect x="90" y="300" width="900" height="1320" fill="#e3d3b0" stroke="#8a6a3a" stroke-width="3"/>`;
    g += `<text x="140" y="380" font-family="'Courier Prime',monospace" font-size="38" fill="#4a3a24">FILE 001 · PUJOL GARCÍA, Juan</text>`;
    g += `<g transform="translate(540,1010) scale(1.75) translate(-300,-300)">${GarboRig.draw(GarboCast.juan1941, { smile: 0.5, brow: 0.3, lookX: 0.15 })}</g>`;
    g += `<rect x="0" y="1300" width="1080" height="620" fill="url(#cv)"/>`;
    g += `<g transform="rotate(-10 780 520)"><rect x="590" y="460" width="380" height="110" fill="none" stroke="#b02424" stroke-width="9"/><text x="780" y="540" text-anchor="middle" font-family="'Courier Prime',monospace" font-size="60" font-weight="700" fill="#b02424">TOP SECRET</text></g>`;
    g += `<text x="540" y="1420" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="128" fill="#fff" stroke="${INK}" stroke-width="18" paint-order="stroke">HE FOOLED</text>`;
    g += `<text x="540" y="1550" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="150" fill="${Y}" stroke="${INK}" stroke-width="18" paint-order="stroke">HITLER</text>`;
    g += `<rect x="330" y="1592" width="420" height="64" fill="${INK}"/><text x="540" y="1636" text-anchor="middle" font-family="'Courier Prime',monospace" font-size="34" fill="${Y}" letter-spacing="3">GARBO · PART 1</text>`;
    if (guide) g += `<rect x="6" y="246" width="1068" height="1428" fill="none" stroke="#00e5ff" stroke-width="8" stroke-dasharray="30 20"/>`;
    return svg(1080, 1920, `<defs><linearGradient id="cv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/></linearGradient></defs>${g}`, size);
  }

  window.BRAND = { pfpCliff, pfpHook, pfpBubble, highlight, coverPart1, HIGHLIGHTS: Object.keys(ICONS) };

  // ---- fill the board if present ----
  const pf = document.getElementById('pfps');
  if (pf) {
    const opts = [['A · Cliffhanger hand', pfpCliff], ['B · Storyhook ?-hook', pfpHook], ['C · Monogram bubble (any name)', pfpBubble]];
    pf.innerHTML = opts.map(([label, fn]) => `<div class="pfp">${fn(280)}<div class="small">${fn(110)}${fn(56)}${fn(32)}</div><div class="cap">${label}</div></div>`).join('');
    document.getElementById('pfpMini').innerHTML = pfpCliff(170).replace('<svg', '<svg style="border-radius:50%"');
    document.getElementById('hls').innerHTML = BRAND.HIGHLIGHTS.map((n) => `<div>${highlight(n, 120)}${n}</div>`).join('');
    document.getElementById('cover').innerHTML = coverPart1(380, true);
  }
})();
