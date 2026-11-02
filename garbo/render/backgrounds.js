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
    // white disc with a black eagle silhouette (period banner, simplified)
    const ex = x + w / 2, ey = y + h * 0.42, r = w * 0.32;
    g += `<circle cx="${ex}" cy="${ey}" r="${r}" fill="#efe9dc"/>`;
    g += `<path d="M${ex},${ey - r * 0.55} l${r * 0.12},${r * 0.2} l${r * 0.7},${-r * 0.25} l${-r * 0.2},${r * 0.3} l${r * 0.25},${r * 0.05} l${-r * 0.55},${r * 0.2} l${-r * 0.1},${r * 0.45} l${-r * 0.17},${-r * 0.1} l${-r * 0.17},${r * 0.1} l${-r * 0.1},${-r * 0.45} l${-r * 0.55},${-r * 0.2} l${r * 0.25},${-r * 0.05} l${-r * 0.2},${-r * 0.3} l${r * 0.7},${r * 0.25}Z" fill="#141414"/>`;
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

    // stylised map of western Europe for routes (points in SETS.MAP_POINTS)
    map(t) {
      let back = rect(0, 0, W, H, '#1c2a33');
      for (let y = 0; y < H; y += 80) back += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#2a3c48" stroke-width="2"/>`;
      for (let x = 0; x < W; x += 80) back += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#2a3c48" stroke-width="2"/>`;
      const land = '#c9b98f', edge = '#8a7a52';
      // Great Britain
      back += `<path d="M560,240 C520,300 590,340 540,400 C500,460 580,500 560,560 C540,620 600,660 640,720 L700,730 C760,700 720,640 700,600 C690,540 740,500 700,450 C670,400 700,340 650,300 C620,260 600,240 560,240Z" fill="${land}" stroke="${edge}" stroke-width="4"/>`;
      // Ireland
      back += `<path d="M400,420 C360,460 380,540 430,560 C480,560 500,500 480,450 C460,410 430,400 400,420Z" fill="${land}" stroke="${edge}" stroke-width="4"/>`;
      // France
      back += `<path d="M640,820 C700,780 820,790 900,830 L1080,820 L1080,1180 C1000,1220 900,1200 840,1230 C760,1200 700,1190 660,1150 C700,1080 640,1000 600,960 C640,920 610,860 640,820Z" fill="${land}" stroke="${edge}" stroke-width="4"/>`;
      // Iberia
      back += `<path d="M300,1250 C380,1220 520,1230 640,1240 C720,1240 800,1250 820,1290 C780,1340 760,1420 700,1500 C660,1580 560,1640 460,1640 C380,1630 330,1600 310,1540 C290,1460 280,1380 300,1250Z" fill="${land}" stroke="${edge}" stroke-width="4"/>`;
      back += `<path d="M300,1260 C330,1330 320,1440 330,1560 L290,1560 C270,1440 280,1330 300,1260Z" fill="#b8a77d" stroke="${edge}" stroke-width="3"/>`;
      back += `<text x="380" y="1700" font-family="Georgia" font-size="34" fill="#9fb0bb" font-style="italic">Atlantic Ocean</text>`;
      back += `<text x="590" y="1440" font-family="Georgia" font-size="36" fill="#6a5a36" letter-spacing="6">SPAIN</text><text x="840" y="1020" font-family="Georgia" font-size="36" fill="#6a5a36" letter-spacing="6">FRANCE</text><text x="560" y="520" font-family="Georgia" font-size="30" fill="#6a5a36" letter-spacing="4">BRITAIN</text>`;
      return { back, front: vignette('map_v', 0.6) };
    },

    // London bedroom at night (Part 1 cliffhanger / Part 2): moonlight, headboard, rain
    bedroom(t) {
      let back = wall('#2c3446', null);
      back += window_(600, 220, 330, 520, '#1a2338', '#3a3f4e', { rain: true, t, city: `<circle cx="820" cy="320" r="34" fill="#e8ecf4" opacity="0.85"/>` });
      back += `<path d="M600,740 L930,740 L1080,1500 L380,1500Z" fill="#c8d4f0" opacity="0.08"/>`;
      back += frame_(130, 330, 220, 280, rect(130, 330, 220, 280, '#3a3a44') + `<ellipse cx="240" cy="450" rx="54" ry="70" fill="#8a7a6a" opacity="0.7"/>`, '#6a5a3a');
      back += lightPool('bd_l', 760, 520, 760, '#b8c8f0', 0.22);
      // headboard + pillows behind the character, bed in the foreground
      back += `<path d="M90,1180 Q90,1040 240,1040 L840,1040 Q990,1040 990,1180 L990,1320 L90,1320Z" fill="#4a3424"/>`;
      back += `<ellipse cx="330" cy="1300" rx="190" ry="60" fill="#d8dce6"/><ellipse cx="750" cy="1300" rx="190" ry="60" fill="#cfd4de"/>`;
      const front = `<path d="M-20,1560 Q540,1480 1100,1560 L1100,1920 L-20,1920Z" fill="#7a8aa8"/><path d="M-20,1600 Q540,1530 1100,1600" fill="none" stroke="#5a6a88" stroke-width="8"/>`;
      return { back, front: front + vignette('bd_v', 0.8) };
    },

    // Hendon, north London 1943: small English kitchen, floral wallpaper, rain, gas cooker
    hendon(t, gas = false) {
      let back = wall(gas ? '#4e5a46' : '#7c8a68', '#5a4636', 1260);
      for (let y = 40; y < 1240; y += 90) for (let x = (y / 90) % 2 ? 0 : 45; x < W; x += 90) back += `<circle cx="${x}" cy="${y}" r="9" fill="${gas ? '#8a7a5a' : '#c9b48a'}" opacity="0.45"/><circle cx="${x}" cy="${y}" r="4" fill="#a04a3a" opacity="0.4"/>`;
      back += window_(110, 230, 330, 470, '#3c4a58', '#e8e2d2', { rain: true, t });
      back += `<rect x="92" y="212" width="366" height="230" fill="#f4f0e6" opacity="0.55"/>`;                    // net curtain
      for (let x = 100; x < 450; x += 18) back += `<line x1="${x}" y1="212" x2="${x}" y2="442" stroke="#fff" stroke-width="2" opacity="0.4"/>`;
      // gas cooker (right)
      back += rect(690, 760, 330, 520, '#e8e4da') + rect(690, 760, 330, 40, '#cfc9bb') + rect(720, 900, 270, 260, '#2a2a2a') + rect(740, 920, 230, 220, '#3a3a3a');
      for (const [x, y] of [[750, 730], [840, 722], [930, 730]]) back += `<ellipse cx="${x}" cy="${y}" rx="34" ry="9" fill="#2a2a2a"/>`;
      for (let i = 0; i < 4; i++) back += `<circle cx="${730 + i * 82}" cy="${830}" r="18" fill="#1d1d1d"/><rect x="${727 + i * 82}" y="${814}" width="6" height="16" fill="${gas ? '#ffd23f' : '#888'}" transform="rotate(${gas ? 90 : 0} ${730 + i * 82} ${830})"/>`;
      back += rect(60, 1000, 400, 24, '#8a6a48');                                                                  // shelf
      back += `<rect x="90" y="930" width="60" height="70" fill="#c8b890"/><rect x="180" y="950" width="80" height="50" fill="#b0503a"/><rect x="290" y="940" width="50" height="60" fill="#d8d0b8"/>`;
      back += lightPool('he_l', 540, 380, 820, gas ? '#c8f0a0' : '#ffe2b0', gas ? 0.18 : 0.26);
      let front = desk(1560, '#7a5a3c', { items: `<ellipse cx="300" cy="1556" rx="96" ry="20" fill="#f0ece2"/><ellipse cx="300" cy="1550" rx="64" ry="12" fill="#e2d28a"/><path d="M262,1546 q12,-10 24,0 q12,-10 24,0 q12,-10 24,0" stroke="#d8b860" stroke-width="5" fill="none"/><rect x="760" y="1486" width="60" height="74" rx="8" fill="#d8d4ca"/>` });
      if (gas) {
        for (let i = 0; i < 6; i++) {
          const y = 1500 - ((t * 60 + i * 260) % 1400);
          front += `<path d="M-40,${y} Q270,${y - 40 + Math.sin(t + i) * 20} 540,${y} T1120,${y}" stroke="#d8f0b0" stroke-width="70" fill="none" opacity="0.06"/>`;
        }
        front += rect(0, 0, W, H, '#b8e090', 'opacity="0.06"');
      }
      return { back, front: front + vignette('he_v', gas ? 0.85 : 0.6) };
    },
    hendonGas(t) { return SETS.hendon(t, true); },

    // front door of the Hendon house at night, seen from the hall
    frontdoor(t) {
      let back = wall('#5a5040', '#3a2e22', 1300);
      back += rect(300, 260, 480, 1140, '#1a1a22');                                                               // doorway (open)
      back += rect(300, 260, 480, 1140, '#2a3444');
      for (let i = 0; i < 50; i++) { const x = 300 + ((i * 97) % 480), y = 260 + ((i * 151 + t * 1100) % 1140); back += `<line x1="${x}" y1="${y}" x2="${x - 6}" y2="${y + 40}" stroke="#cfd8e0" stroke-width="2" opacity="0.4"/>`; }
      back += rect(280, 240, 520, 26, '#e8e2d2') + rect(280, 240, 26, 1180, '#e8e2d2') + rect(774, 240, 26, 1180, '#e8e2d2');
      back += `<path d="M800,266 L960,330 L960,1440 L800,1400Z" fill="#14281e"/><circle cx="930" cy="880" r="14" fill="#b8963c"/>`;  // door swung open
      back += lightPool('fd_l', 540, 300, 600, '#ffe2a0', 0.2);
      return { back, front: vignette('fd_v', 0.75) };
    },

    // Camp 020 (Latchmere House): bare interrogation room
    camp020(t) {
      let back = rect(0, 0, W, H, '#5c6258');
      for (let y = 0; y < 1300; y += 70) back += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#4e544a" stroke-width="3"/>`;
      back += rect(0, 1300, W, 620, '#3e423a');
      back += rect(400, 200, 280, 170, '#2a3038') + [430, 480, 530, 580, 630].map((x) => rect(x, 200, 12, 170, '#111')).join('');
      back += `<line x1="540" y1="0" x2="540" y2="440" stroke="#111" stroke-width="4"/><circle cx="540" cy="460" r="26" fill="#fff8d0"/>`;
      back += lightPool('c2_l', 540, 520, 900, '#fff4c0', 0.28);
      back += `<text x="880" y="620" font-family="Courier New,monospace" font-size="30" fill="#2a2e28" opacity="0.7">CAMP 020</text>`;
      const front = desk(1530, '#5a5e60', { items: `<rect x="420" y="1500" width="230" height="40" fill="#efe6cf" transform="rotate(-4 535 1520)"/><rect x="680" y="1500" width="12" height="70" fill="#1a1a1a" transform="rotate(30 686 1535)"/>` });
      return { back, front: front + vignette('c2_v', 0.8) };
    },

    // a wet London street at night, outside Camp 020
    street(t) {
      let back = rect(0, 0, W, H, '#151c26');
      back += `<path d="M0,500 L180,500 L180,380 L320,380 L320,520 L520,520 L520,300 L700,300 L700,460 L860,460 L860,360 L1080,360 L1080,1300 L0,1300Z" fill="#232c38"/>`;
      for (let i = 0; i < 18; i++) back += rect(40 + (i % 6) * 170, 560 + Math.floor(i / 6) * 180, 60, 90, (i * 7) % 5 ? '#2c3644' : '#d8b860', 'opacity="0.8"');
      back += rect(0, 1300, W, 620, '#1c222c');
      back += `<line x1="0" y1="1300" x2="${W}" y2="1300" stroke="#3a4656" stroke-width="6"/>`;
      back += rect(860, 520, 20, 800, '#111') + `<path d="M830,520 L910,520 L890,480 L850,480Z" fill="#111"/><circle cx="870" cy="535" r="18" fill="#ffe8a0"/>`;
      back += `<path d="M870,540 L700,1320 L1040,1320Z" fill="#ffe8a0" opacity="0.08"/>`;
      for (let i = 0; i < 60; i++) { const x = (i * 97) % W, y = (i * 151 + t * 1200) % 1300; back += `<line x1="${x}" y1="${y}" x2="${x - 8}" y2="${y + 40}" stroke="#9fb0c4" stroke-width="2" opacity="0.35"/>`; }
      back += `<ellipse cx="870" cy="1400" rx="160" ry="20" fill="#ffe8a0" opacity="0.1"/>`;
      return { back, front: vignette('st_v', 0.7) };
    },
    title(t) {
      return { back: rect(0, 0, W, H, '#0e0d0c') + lightPool('ti_l', 540, 860, 900, '#c8a060', 0.18), front: '' };
    },
  };

  SETS.MAP_POINTS = { Madrid: [560, 1390], Lisbon: [330, 1480], London: [660, 690], Glasgow: [560, 330], Berlin: [1040, 700] };
  root.GarboSets = SETS;
})(typeof window !== 'undefined' ? window : globalThis);
