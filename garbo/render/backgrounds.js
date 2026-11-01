// GARBO set designs. Each set returns { back, front } SVG strings for a
// 1080x1920 frame: `back` is drawn behind characters, `front` (desks, props in
// the foreground) is drawn over them. `t` is seconds into the shot, so sets can animate
// (rain, flicker, smoke).
(function (root) {
  'use strict';
  const W = 1080, H = 1920;
  const { shade } = root.GarboRig;

  // ---------- shared pieces ----------
  const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  function wall(color, wains, wainsY = 1180) {
    let g = rect(0, 0, W, H, color);
    // subtle vertical wallpaper stripes
    for (let x = 0; x < W; x += 54) g += rect(x, 0, 26, wainsY, shade(color, -0.04), 'opacity="0.5"');
    if (wains) {
      g += rect(0, wainsY, W, H - wainsY, wains);
      g += rect(0, wainsY - 14, W, 18, shade(wains, 0.15));
      for (let x = 30; x < W; x += 260) g += `<rect x="${x}" y="${wainsY + 50}" width="210" height="${H - wainsY - 100}" fill="none" stroke="${shade(wains, -0.25)}" stroke-width="5"/>`;
    }
    return g;
  }
  function vignette(id, strength = 0.65) {
    return `<defs><radialGradient id="${id}" cx="0.5" cy="0.45" r="0.75"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${strength}"/></radialGradient></defs>${rect(0, 0, W, H, `url(#${id})`)}`;
  }
  function lightPool(id, cx, cy, r, color, op) {
    return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>`;
  }
  function window_(x, y, w, h, sky, frame, opts = {}) {
    let g = rect(x - 18, y - 18, w + 36, h + 36, frame);
    g += rect(x, y, w, h, sky);
    if (opts.rain) {
      for (let i = 0; i < 40; i++) {
        const rx = x + ((i * 97) % w), ry = y + (((i * 151) + (opts.t || 0) * 900) % h);
        g += `<line x1="${rx}" y1="${ry}" x2="${rx - 6}" y2="${ry + 34}" stroke="#cfd8e0" stroke-width="2" opacity="0.45"/>`;
      }
    }
    if (opts.city) g += opts.city;
    g += rect(x + w / 2 - 6, y, 12, h, frame) + rect(x, y + h * 0.45 - 6, w, 12, frame);
    if (opts.blackout) g += rect(x - 60, y - 40, 110, h + 80, opts.blackout) + rect(x + w - 50, y - 40, 110, h + 80, opts.blackout);
    if (opts.shutters) {
      for (const sx of [x - 150, x + w + 18]) {
        g += rect(sx, y - 18, 132, h + 36, opts.shutters);
        for (let yy = y; yy < y + h; yy += 22) g += `<line x1="${sx + 10}" y1="${yy}" x2="${sx + 122}" y2="${yy}" stroke="${shade(opts.shutters, -0.3)}" stroke-width="5"/>`;
      }
    }
    return g;
  }
  function frame_(x, y, w, h, inner, gold = '#9c7a3c') {
    return rect(x - 16, y - 16, w + 32, h + 32, gold) + rect(x - 6, y - 6, w + 12, h + 12, shade(gold, -0.35)) + `<g>${inner}</g>`;
  }
  function desk(y, color, opts = {}) {
    let g = rect(-20, y, W + 40, 34, shade(color, 0.18));
    g += rect(-20, y + 34, W + 40, H - y, color);
    g += rect(-20, y + 34, W + 40, 16, shade(color, -0.3), 'opacity="0.6"');
    if (opts.items) g += opts.items;
    return g;
  }
  function lamp(x, y, shadeCol = '#2e5a3a') {
    return `<path d="M${x - 70},${y} L${x + 70},${y} L${x + 50},${y - 50} L${x - 50},${y - 50}Z" fill="${shadeCol}"/>` + rect(x - 6, y, 12, 120, '#8a7040') + `<ellipse cx="${x}" cy="${y + 122}" rx="46" ry="12" fill="#6a5430"/>` + `<ellipse cx="${x}" cy="${y + 6}" rx="62" ry="8" fill="#fff4c8" opacity="0.8"/>`;
  }
  function papers(x, y, n = 3, rot = -6) {
    let g = '';
    for (let i = 0; i < n; i++) g += `<rect x="${x + i * 14}" y="${y - i * 6}" width="190" height="130" fill="${['#efe8d8', '#e6dcc4', '#f4efe2'][i % 3]}" transform="rotate(${rot + i * 5} ${x} ${y})" stroke="#c8bca0" stroke-width="1.5"/>`;
    for (let k = 0; k < 6; k++) g += `<line x1="${x + 30}" y1="${y + 20 + k * 16}" x2="${x + 170}" y2="${y + 20 + k * 16}" stroke="#7a7060" stroke-width="2" opacity="0.5" transform="rotate(${rot + (n - 1) * 5} ${x} ${y})"/>`;
    return g;
  }
  function flagNazi(x, y, w, h, t) {
    const sway = Math.sin(t * 1.3) * 6;
    let g = `<path d="M${x},${y} Q${x + w / 2},${y + sway} ${x + w},${y} L${x + w},${y + h} Q${x + w / 2},${y + h + sway} ${x},${y + h}Z" fill="#a51d1d"/>`;
    g += `<path d="M${x + w * 0.25},${y + h * 0.04} L${x + w * 0.25},${y + h * 0.96} M${x + w * 0.75},${y + h * 0.04} L${x + w * 0.75},${y + h * 0.96}" stroke="#7a1010" stroke-width="6" opacity="0.5"/>`;
    // a plain white disc reads as the period flag at a glance; the hooked cross is left out deliberately
    g += `<circle cx="${x + w / 2}" cy="${y + h * 0.42}" r="${w * 0.3}" fill="#efe9dc"/>`;
    g += `<circle cx="${x + w / 2}" cy="${y + h * 0.42}" r="${w * 0.12}" fill="#1a1a1a" opacity="0.85"/>`;
    return g;
  }

  // ---------- sets ----------
  const SETS = {
    // Madrid 1941, British embassy office: dark wood, portrait of the King, frosted door
    embassy(t) {
      let back = wall('#5b4c3c', '#3a2a1c');
      back += window_(90, 260, 300, 560, '#d8c49a', '#3a2a1c', { shutters: '#4b3a2a' });
      back += frame_(640, 280, 280, 360, rect(640, 280, 280, 360, '#2e2c34') + `<path d="M670,640 Q680,540 780,525 Q880,540 890,640Z" fill="#141c30"/><path d="M760,528 L780,580 L800,528Z" fill="#e8e2d4"/><rect x="726" y="560" width="22" height="8" fill="#b02a2a"/><rect x="726" y="572" width="22" height="8" fill="#2a5aa0"/><circle cx="830" cy="600" r="8" fill="#d8b860"/><rect x="760" y="480" width="40" height="50" fill="#b8967a"/><ellipse cx="780" cy="430" rx="52" ry="66" fill="#c8a688"/><path d="M728,420 Q730,356 784,356 Q836,360 834,416 Q820,380 790,384 Q756,384 728,420Z" fill="#3a2a1e"/><path d="M760,432 l14,0 M788,432 l14,0" stroke="#3a2a1e" stroke-width="4" stroke-linecap="round"/><path d="M776,440 Q772,462 782,466" fill="none" stroke="#8a6a50" stroke-width="3"/><path d="M766,478 Q780,484 794,478" fill="none" stroke="#7a4a3a" stroke-width="3"/><ellipse cx="740" cy="440" rx="12" ry="40" fill="#5a3a24" opacity="0.25"/>`);
      back += `<text x="780" y="690" font-family="Georgia,serif" font-size="26" fill="#d9c79a" text-anchor="middle">GEORGIUS VI REX</text>`;
      back += `<path d="M0,1100 L1080,1100" stroke="#2a1c10" stroke-width="6"/>`;
      back += lightPool('emb_l', 240, 540, 520, '#ffdca0', 0.28);
      const front = desk(1500, '#3d2716', { items: papers(560, 1470, 3) + lamp(900, 1330) + `<rect x="120" y="1440" width="160" height="40" fill="#1f1a14"/><rect x="150" y="1420" width="18" height="40" fill="#d4c39a"/>` });
      return { back, front: front + vignette('emb_v') };
    },
    // the frosted-glass door for the rejection montage
    embassyDoor(t) {
      let back = wall('#4a3b2c', '#2e2216', 1300);
      back += rect(290, 260, 500, 1400, '#2e2014');
      back += rect(330, 300, 420, 620, '#c9c2b0');
      back += `<rect x="330" y="300" width="420" height="620" fill="#ffffff" opacity="0.15"/>`;
      back += `<text x="540" y="560" font-family="Georgia,serif" font-size="46" fill="#3a3024" text-anchor="middle" letter-spacing="6">BRITISH</text><text x="540" y="625" font-family="Georgia,serif" font-size="46" fill="#3a3024" text-anchor="middle" letter-spacing="6">EMBASSY</text>`;
      back += `<text x="540" y="700" font-family="Georgia,serif" font-size="26" fill="#3a3024" text-anchor="middle" letter-spacing="4">PASSPORT OFFICE · MADRID</text>`;
      back += rect(330, 980, 420, 600, '#3a2818') + rect(360, 1010, 360, 250, '#2f2012') + rect(360, 1300, 360, 250, '#2f2012');
      back += `<circle cx="720" cy="1100" r="22" fill="#b8963c"/>`;
      return { back, front: vignette('door_v', 0.75) };
    },
    // Madrid kitchen at night: tiles, single bulb
    kitchen(t) {
      let back = rect(0, 0, W, H, '#6a6050');
      for (let y = 700; y < 1300; y += 60) for (let x = 0; x < W; x += 60) back += `<rect x="${x + 2}" y="${y + 2}" width="56" height="56" fill="${(x / 60 + y / 60) % 2 ? '#d9d2bf' : '#c9c0a8'}"/>`;
      for (let x = 0; x < W; x += 60) back += `<rect x="${x + 2}" y="642" width="56" height="56" fill="#2f5a7a"/>`;
      back += window_(650, 180, 260, 380, '#1a2440', '#5a4a3a', { city: `<circle cx="760" cy="260" r="26" fill="#efe7c8" opacity="0.8"/>` });
      back += rect(80, 300, 380, 30, '#5a4630') + `<ellipse cx="160" cy="290" rx="40" ry="16" fill="#c8b48a"/><rect x="240" y="250" width="40" height="50" fill="#8a3a2a"/><rect x="320" y="240" width="70" height="60" fill="#d0c8b0"/>`;
      const flick = 0.92 + Math.sin(t * 23) * 0.03 + Math.sin(t * 7.1) * 0.03;
      back += `<line x1="540" y1="0" x2="540" y2="150" stroke="#222" stroke-width="3"/><circle cx="540" cy="170" r="22" fill="#fff6c8" opacity="${flick}"/>`;
      back += lightPool('k_l', 540, 260, 820, '#ffe2a0', 0.32 * flick);
      const front = desk(1560, '#6b4a2c', { items: `<ellipse cx="300" cy="1560" rx="80" ry="18" fill="#e9e2d0"/><ellipse cx="300" cy="1556" rx="56" ry="11" fill="#c8bfa8"/><rect x="760" y="1470" width="44" height="90" fill="#3c5a3a" opacity="0.85"/><rect x="772" y="1440" width="20" height="34" fill="#3c5a3a" opacity="0.85"/><path d="M500,1545 L620,1545 L600,1580 L520,1580Z" fill="#b8a888"/>` });
      return { back, front: front + vignette('k_v', 0.7) };
    },
    // Abwehr office in Madrid: flags, heavy desk
    abwehr(t) {
      let back = wall('#3d3e3a', '#232420');
      back += flagNazi(90, 160, 240, 640, t) + flagNazi(750, 160, 240, 640, t + 1);
      back += frame_(420, 260, 240, 300, rect(420, 260, 240, 300, '#2a2a28') + `<circle cx="540" cy="370" r="60" fill="#4a4a46"/><path d="M450,560 Q540,450 630,560Z" fill="#33332f"/>`, '#6a6a60');
      back += rect(380, 640, 320, 26, '#55524a');
      back += lightPool('ab_l', 540, 1100, 700, '#e8e0c0', 0.18);
      const front = desk(1480, '#2a1e14', { items: `<rect x="600" y="1430" width="200" height="60" fill="#5b6a4a" transform="rotate(-4 700 1460)"/><rect x="612" y="1420" width="176" height="60" fill="#6c7c58" transform="rotate(-2 700 1450)"/><text x="700" y="1460" font-size="24" fill="#2a3020" text-anchor="middle" font-family="Georgia" transform="rotate(-2 700 1450)">PESETAS</text><rect x="300" y="1400" width="34" height="80" rx="6" fill="#2a3a5a" opacity="0.8"/><rect x="306" y="1386" width="22" height="18" fill="#111"/><text x="317" y="1460" font-size="14" fill="#cfd" text-anchor="middle" font-family="monospace">INK</text>` });
      return { back, front: front + vignette('ab_v', 0.75) };
    },
    // Lisbon hotel room: shutters, sea light, maps, guidebook, newspapers
    lisbon(t) {
      let back = wall('#d6c3a0', '#a98a62', 1250);
      back += window_(560, 200, 380, 620, '#9cc4d8', '#efe6d2', { shutters: '#5f8a6a', city: `<rect x="560" y="640" width="380" height="180" fill="#5a86a4"/><path d="M560,640 Q660,610 760,640 T940,640" fill="none" stroke="#e8f0f4" stroke-width="4" opacity="0.6"/>` });
      // map of Britain pinned on the wall
      back += rect(90, 260, 330, 470, '#e8dcbc') + `<path d="M230,320 C200,360 250,400 220,440 C200,490 260,520 240,560 C230,610 290,640 300,690 L340,680 C330,620 360,580 330,520 C310,470 350,430 320,380 C300,340 270,330 230,320Z" fill="#b9c79a" stroke="#6a7a50" stroke-width="3"/><circle cx="250" cy="420" r="9" fill="#b02020"/><circle cx="300" cy="640" r="9" fill="#b02020"/><circle cx="320" cy="560" r="9" fill="#b02020"/>`;
      back += `<path d="M250,420 L300,640 L320,560" fill="none" stroke="#b02020" stroke-width="2" stroke-dasharray="8 6"/>`;
      back += lightPool('li_l', 750, 520, 900, '#fff2d0', 0.4);
      const front = desk(1540, '#7a5634', { items: papers(120, 1500, 3, -8) + `<rect x="620" y="1470" width="220" height="70" fill="#2b4a8a" transform="rotate(5 730 1500)"/><text x="730" y="1515" font-size="22" fill="#e8dcb0" text-anchor="middle" font-family="Georgia" transform="rotate(5 730 1500)">GUIDE TO BRITAIN</text><rect x="420" y="1500" width="160" height="50" fill="#e8e0cc" transform="rotate(-3 500 1520)"/><text x="500" y="1530" font-size="18" fill="#333" text-anchor="middle" font-family="Georgia" transform="rotate(-3 500 1520)">THE TIMES</text>` });
      return { back, front: front + vignette('li_v', 0.55) };
    },
    // MI5, London: blackout curtains, filing cabinets, cold light
    mi5(t) {
      let back = wall('#5a6268', '#3a4146');
      back += window_(380, 220, 320, 480, '#26303a', '#2a2f33', { blackout: '#1d2226', rain: true, t });
      for (const x of [40, 800]) { back += rect(x, 700, 240, 520, '#5f6a5a'); for (let k = 0; k < 4; k++) back += rect(x + 16, 720 + k * 125, 208, 105, '#6c7866') + rect(x + 100, 760 + k * 125, 40, 12, '#b8b8a8'); }
      back += `<text x="160" y="680" font-size="26" fill="#d8d8c8" text-anchor="middle" font-family="Georgia">SECRET</text>`;
      back += lightPool('mi_l', 540, 1200, 700, '#e0eef8', 0.22);
      const front = desk(1500, '#3a3026', { items: papers(130, 1480, 3, -4) + papers(640, 1470, 2, 6) + `<rect x="470" y="1430" width="80" height="60" fill="#e8e4dc"/><ellipse cx="510" cy="1430" rx="40" ry="10" fill="#8a6a40"/><path d="M550,1445 q26,6 0,30" fill="none" stroke="#e8e4dc" stroke-width="8"/>` });
      return { back, front: front + vignette('mi_v', 0.7) };
    },
    // sepia archive page for the "who & stakes" intro
    archive(t) {
      let back = rect(0, 0, W, H, '#cbb68e');
      for (let i = 0; i < 70; i++) back += `<circle cx="${(i * 389) % W}" cy="${(i * 617) % H}" r="${2 + (i % 5)}" fill="#8a6a3a" opacity="0.12"/>`;
      back += rect(140, 300, 800, 1180, '#e3d3b0', 'stroke="#8a6a3a" stroke-width="3"');
      back += `<text x="190" y="390" font-family="Courier New,monospace" font-size="34" fill="#4a3a24">FILE: PUJOL GARCÍA, Juan</text>`;
      back += `<text x="190" y="440" font-family="Courier New,monospace" font-size="28" fill="#4a3a24">b. 14.II.1912, BARCELONA</text>`;
      back += `<g transform="rotate(-12 720 560)"><rect x="550" y="510" width="340" height="100" fill="none" stroke="#a02424" stroke-width="7"/><text x="720" y="580" font-family="Courier New,monospace" font-size="54" font-weight="bold" fill="#a02424" text-anchor="middle">REJECTED</text></g>`;
      return { back, front: vignette('ar_v', 0.55) };
    },
    title(t) {
      return { back: rect(0, 0, W, H, '#0e0d0c') + lightPool('ti_l', 540, 860, 900, '#c8a060', 0.18), front: '' };
    },
  };

  root.GarboSets = SETS;
})(typeof window !== 'undefined' ? window : globalThis);
