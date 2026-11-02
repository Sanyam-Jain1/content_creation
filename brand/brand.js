// Brand assets for the page: profile pictures, highlight covers, reel cover.
// Every function returns an SVG string; the board and the exporter both use them.
(function () {
  'use strict';
  const Y = '#ffd23f', RED = '#ff3b2f', INK = '#0f0e0c', PAPER = '#efe6cf', MANILA = '#d9c08a';
  const svg = (w, h, inner, size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${size || w}" height="${size ? size * h / w : h}">${inner}</svg>`;

  // 1. Mascot: faceless agent in a fedora, a censor bar across the eyes ("eyes only")
  function pfpAgent(size) {
    let g = `<rect width="1080" height="1080" fill="${Y}"/>`;
    g += `<path d="M180,1080 Q200,820 400,760 L540,800 L680,760 Q880,820 900,1080Z" fill="${INK}"/>`;           // coat
    g += `<path d="M400,760 L540,980 L680,760 L620,740 L540,840 L460,740Z" fill="#2a2622"/>`;                  // collar V
    g += `<ellipse cx="540" cy="560" rx="175" ry="215" fill="${INK}"/>`;                                       // head
    g += `<ellipse cx="540" cy="372" rx="330" ry="62" fill="${INK}"/>`;                                       // brim
    g += `<path d="M330,380 Q330,170 540,160 Q750,170 750,380Z" fill="${INK}"/>`;                              // crown
    g += `<path d="M335,330 L745,330 L748,372 L332,372Z" fill="${RED}"/>`;                                    // hat band
    g += `<rect x="300" y="500" width="480" height="96" fill="${Y}"/>`;                                       // censor bar
    return svg(1080, 1080, g, size);
  }

  // 2. Character: Juan (Garbo) with a censor bar, ties the page to the launch series
  function pfpCharacter(size) {
    const st = { smile: 0.35, lookX: 0, brow: 0.2 };
    let g = `<rect width="1080" height="1080" fill="${INK}"/>`;
    g += `<circle cx="540" cy="540" r="500" fill="none" stroke="${Y}" stroke-width="26"/>`;
    g += `<g transform="translate(540,600) scale(2.25) translate(-300,-300)">${GarboRig.draw(GarboCast.juan1941, st)}</g>`;
    g += `<rect x="250" y="520" width="580" height="88" fill="${INK}" transform="rotate(-3 540 564)"/>`;
    g += `<text x="540" y="585" text-anchor="middle" font-family="'Courier Prime',monospace" font-size="52" fill="${Y}" letter-spacing="10" transform="rotate(-3 540 564)">CLASSIFIED</text>`;
    return svg(1080, 1080, `<defs><clipPath id="cc"><circle cx="540" cy="540" r="487"/></clipPath></defs><g clip-path="url(#cc)">${g}</g><circle cx="540" cy="540" r="500" fill="none" stroke="${Y}" stroke-width="26"/>`, size);
  }

  // 3. Wordmark stamp on a manila file
  function pfpStamp(size) {
    let g = `<rect width="1080" height="1080" fill="${MANILA}"/>`;
    for (let i = 0; i < 60; i++) g += `<circle cx="${(i * 389) % 1080}" cy="${(i * 617) % 1080}" r="${3 + (i % 6)}" fill="#8a6a3a" opacity="0.15"/>`;
    g += `<g transform="rotate(-12 540 540)">`;
    g += `<rect x="150" y="300" width="780" height="480" rx="24" fill="none" stroke="${RED}" stroke-width="30"/>`;
    g += `<text x="540" y="520" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="210" fill="${RED}">EYES</text>`;
    g += `<text x="540" y="730" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="210" fill="${RED}">ONLY</text>`;
    g += `</g>`;
    return svg(1080, 1080, g, size);
  }

  // Highlight covers: yellow icon on ink
  const ICONS = {
    'FILE 001': `<path d="M330,380 L470,380 L510,430 L750,430 L750,720 L330,720Z" fill="${Y}"/><text x="540" y="640" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="110" fill="${INK}">001</text>`,
    'SOURCES': `<rect x="380" y="320" width="320" height="420" fill="${Y}"/><line x1="430" y1="420" x2="650" y2="420" stroke="${INK}" stroke-width="20"/><line x1="430" y1="490" x2="650" y2="490" stroke="${INK}" stroke-width="20"/><line x1="430" y1="560" x2="600" y2="560" stroke="${INK}" stroke-width="20"/><circle cx="660" cy="660" r="70" fill="${INK}" stroke="${Y}" stroke-width="20"/><line x1="710" y1="710" x2="780" y2="780" stroke="${Y}" stroke-width="30"/>`,
    'NEXT': `<circle cx="540" cy="540" r="220" fill="none" stroke="${Y}" stroke-width="34"/><path d="M490,430 L640,540 L490,650Z" fill="${Y}"/>`,
    'ABOUT': `<ellipse cx="540" cy="600" rx="120" ry="150" fill="${Y}"/><ellipse cx="540" cy="470" rx="230" ry="44" fill="${Y}"/><path d="M400,475 Q400,330 540,325 Q680,330 680,475Z" fill="${Y}"/><rect x="400" y="570" width="280" height="60" fill="${INK}"/>`,
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

  window.BRAND = { pfpAgent, pfpCharacter, pfpStamp, highlight, coverPart1, HIGHLIGHTS: Object.keys(ICONS) };

  // ---- fill the board if present ----
  const pf = document.getElementById('pfps');
  if (pf) {
    const opts = [['A · Agent mascot', pfpAgent], ['B · Garbo character', pfpCharacter], ['C · Stamp wordmark', pfpStamp]];
    pf.innerHTML = opts.map(([label, fn]) => `<div class="pfp">${fn(280)}<div class="small">${fn(110)}${fn(56)}${fn(32)}</div><div class="cap">${label}</div></div>`).join('');
    document.getElementById('pfpMini').innerHTML = pfpAgent(170).replace('<svg', '<svg style="border-radius:50%"');
    document.getElementById('hls').innerHTML = BRAND.HIGHLIGHTS.map((n) => `<div>${highlight(n, 120)}${n}</div>`).join('');
    document.getElementById('cover').innerHTML = coverPart1(380, true);
  }
})();
