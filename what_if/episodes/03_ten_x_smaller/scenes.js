// EP03 "What if you shrank 10x smaller?" scene art.
(function (root) {
  'use strict';
  const K = root.Kit;
  const { W, H, INK, C, clamp, lerp, ease, easeOut, easeIn, back, hash, p, rad, R, ink, g, shade, limb, circ, person, sidePerson, burst, vignette, halftone, rays, text, speedLines } = K;
  const HERO = { skin: C.skin[0], shirt: '#4d7cfe', pants: '#3a4a8a', hair: 'tuft', hairColor: '#3b2a20', pj: true };
  const cue = (shot, k, d = 99) => (shot.cues && shot.cues[k] != null ? shot.cues[k] : d);
  const cam = (z, cx, cy, inner) => `<g transform="translate(540,960) scale(${z}) translate(${-cx},${-cy})">${inner}</g>`;
  const CAT = '#f4a259', CAT_D = '#d9822b';

  function catFace(cx, cy, r, o = {}) {
    let s = '';
    for (const sd of [-1, 1]) s += `<path d="M${cx + sd * r * 0.85},${cy - r * 0.35} L${cx + sd * r * 0.75},${cy - r * 1.25} L${cx + sd * r * 0.2},${cy - r * 0.8}Z" fill="${CAT}" ${ink(10)}/><path d="M${cx + sd * r * 0.72},${cy - r * 0.5} L${cx + sd * r * 0.68},${cy - r * 1.0} L${cx + sd * r * 0.38},${cy - r * 0.78}Z" fill="#ffb3c1"/>`;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.86}" fill="${CAT}" ${ink(10)}/>`;
    for (let i = 0; i < 3; i++) s += `<path d="M${cx - 40 + i * 40},${cy - r * 0.85} l${10 - i * 10},${r * 0.25}" stroke="${CAT_D}" stroke-width="18" stroke-linecap="round"/>`;
    const sq = o.squint || 0;
    for (const sd of [-1, 1]) {
      const ex = cx + sd * r * 0.38, ey = cy - r * 0.08;
      s += `<ellipse cx="${ex}" cy="${ey}" rx="${r * 0.2}" ry="${r * 0.2 * (1 - sq * 0.6)}" fill="#c6e83a" ${ink(8)}/>`;
      s += `<ellipse cx="${ex + (o.look || 0) * r * 0.06}" cy="${ey}" rx="${r * 0.04}" ry="${r * 0.16 * (1 - sq * 0.6)}" fill="${INK}"/>`;
    }
    s += `<path d="M${cx - r * 0.08},${cy + r * 0.2} L${cx + r * 0.08},${cy + r * 0.2} L${cx},${cy + r * 0.3}Z" fill="#ff8fa3" ${ink(6)}/>`;
    s += `<path d="M${cx},${cy + r * 0.3} q${-r * 0.12},${r * 0.14} ${-r * 0.24},${r * 0.04} M${cx},${cy + r * 0.3} q${r * 0.12},${r * 0.14} ${r * 0.24},${r * 0.04}" ${ink(7)} fill="none"/>`;
    if (o.lick) s += `<ellipse cx="${cx + r * 0.12}" cy="${cy + r * 0.42}" rx="${r * 0.08}" ry="${r * 0.1 * o.lick}" fill="#ff6f8a" ${ink(5)}/>`;
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) s += `<line x1="${cx + sd * r * 0.3}" y1="${cy + r * 0.25 + i * 16}" x2="${cx + sd * r * 1.1}" y2="${cy + r * 0.15 + i * 34}" stroke="${INK}" stroke-width="5"/>`;
    return s;
  }
  function sock(x, y, w, h, col, rot = 0) {
    return `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${col}" ${ink(6)}/>` +
      `<rect x="${x - w / 2 + w * 0.15}" y="${y - h / 2}" width="${w * 0.12}" height="${h}" fill="#fff" opacity="0.6"/><rect x="${x - w / 2 + w * 0.35}" y="${y - h / 2}" width="${w * 0.12}" height="${h}" fill="#fff" opacity="0.6"/></g>`;
  }

  // ======================= hook: 17 cm tall =======================
  function pillow(st, shot) {
    const tn = cue(shot, 'tenth', 1.7), tl = cue(shot, 'tall', 3.6);
    const k = easeIn(clamp((st - tn + 0.6) / 0.5, 0, 1));
    const sc = lerp(1.05, 0.2, k);
    let w = R(0, 0, W, H, '#22305e');
    for (let x = 0; x < W; x += 72) w += R(x, 0, 36, H, '#26356a', 'opacity="0.6"');
    w += `<rect x="-40" y="1300" width="1160" height="700" rx="40" fill="#4d7cfe" ${ink(8)}/>`;
    w += `<path d="M60,1320 C40,1120 200,1060 540,1080 C880,1060 1040,1120 1020,1320 Z" fill="#fffaf0" ${ink(8)}/>`;
    w += `<path d="M300,1150 q240,-40 480,0" stroke="#e6dfd2" stroke-width="8" fill="none"/>`;
    const P = person(Object.assign({}, HERO, { x: 540, y: 1320, s: sc, expr: k < 1 ? 'shock' : st > tl ? 'shock' : 'worried', armL: [40, 60], armR: [40, 60] }));
    w += P.svg;
    if (k > 0 && k < 1) w += burst(540, 1320 - 200 * sc, 140 * sc + 60, 10, '#ffd23f', st * 90);
    if (st > tl) {
      const a = back(clamp((st - tl) / 0.3, 0, 1));
      const rx = 640, base = 1320, hpx = 470 * 0.2;
      w += `<g transform="translate(${rx},${base}) scale(1,${a}) translate(${-rx},${-base})"><rect x="${rx}" y="${base - hpx * 1.3}" width="36" height="${hpx * 1.3}" fill="#ffd23f" ${ink(4)}/>`;
      for (let i = 0; i <= 12; i++) w += `<line x1="${rx}" y1="${base - i * hpx / 10}" x2="${rx + (i % 5 ? 12 : 22)}" y2="${base - i * hpx / 10}" stroke="${INK}" stroke-width="2"/>`;
      w += `<line x1="${rx - 60}" y1="${base - hpx}" x2="${rx + 40}" y2="${base - hpx}" stroke="${C.red}" stroke-width="4" stroke-dasharray="6 4"/></g>`;
      w += text(rx + 110, base - hpx + 10, '17 CM', 30, '#ff4d3d', { stroke: 5 });
    }
    const z = lerp(1.0, 2.6, ease(clamp((st - tn) / 1.2, 0, 1)));
    return cam(z, lerp(540, 590, clamp(z - 1, 0, 1)), lerp(1050, 1260, clamp((z - 1) / 1.6, 0, 1)), w);
  }

  // ======================= the cat is bigger than a horse =======================
  function cat(st, shot) {
    const hr = cue(shot, 'horse', 1.4), sn = cue(shot, 'snack', 2.9);
    let s = R(0, 0, W, H, '#f6d6a2');
    s += R(0, 1300, W, 620, '#c98f5a', ink(6));
    const bob = Math.sin(st * 2) * 10;
    s += `<path d="M300,1320 C260,1000 380,820 640,800 C960,790 1120,960 1100,1320Z" fill="${CAT}" ${ink(10)}/>`;
    s += catFace(640, 640 + bob, 360, { squint: st > sn ? 0.6 : 0, lick: st > sn ? Math.abs(Math.sin((st - sn) * 6)) : 0, look: -1 });
    // paw
    s += `<ellipse cx="560" cy="1300" rx="150" ry="70" fill="${CAT}" ${ink(10)}/>` + [0, 1, 2].map((i) => `<line x1="${500 + i * 50}" y1="1260" x2="${500 + i * 50}" y2="1320" stroke="${INK}" stroke-width="6"/>`).join('');
    // tiny you
    s += person(Object.assign({}, HERO, { x: 180, y: 1330, s: 0.32, expr: 'shock', sweat: st > sn })).svg;
    if (st > hr) {
      const k = back(clamp((st - hr) / 0.3, 0, 1));
      s += `<g transform="translate(200,1060) scale(${k * 0.9})"><path d="M-110,-20 Q-100,-70 0,-70 Q80,-70 90,-30 L130,-120 L170,-110 L150,-40 Q120,0 100,0 L100,80 L80,80 L76,10 L-60,10 L-64,80 L-84,80 L-90,0 Q-120,-6 -110,-20Z" fill="#8a5a3c" ${ink(7)}/><path d="M130,-120 q-30,30 -20,60" stroke="#3b2a20" stroke-width="12" fill="none"/></g>`;
      s += text(200, 980, 'HORSE', 52, '#fff');
      s += `<line x1="330" y1="1050" x2="330" y2="420" stroke="${C.red}" stroke-width="8" stroke-dasharray="20 14"/>` + text(330, 400, 'CAT', 60, '#ff4d3d');
    }
    if (st > sn) s += text(860, 1180, 'YUM', 100, '#ff4d3d', { extra: `transform="rotate(-8 860 1180)"` });
    return s;
  }

  // ======================= indestructible: fall off a skyscraper =======================
  function fall(st, shot) {
    const jp = cue(shot, 'jump', 2.5), wk = cue(shot, 'walk', 4.8);
    let s = R(0, 0, W, H, '#9ad7ff');
    if (st < jp) {
      s += `<path d="M0,300 q120,-40 220,0 q100,-50 200,0 h-420z" fill="#fff" opacity="0.8"/>`;
      for (let i = 0; i < 6; i++) s += R(i * 190 - 30, 1200 + (i % 2) * 120, 150, 800, ['#5b8e7d', '#bc4b51', '#8cb369'][i % 3], ink(6));
      s += R(300, 1000, 640, 920, '#6b7a99', ink(8)) + R(280, 980, 680, 40, '#4a5670', ink(6));
      for (let j = 0; j < 7; j++) for (let i = 0; i < 4; i++) s += R(340 + i * 150, 1060 + j * 130, 90, 80, '#bfe8ff', ink(4));
      const P = person(Object.assign({}, HERO, { x: 620, y: 990, s: 0.4, expr: 'determined', armL: [150, 100], armR: [150, 100] }));
      s += P.svg;
      const k = back(clamp((st - 0.5) / 0.3, 0, 1));
      s += `<g transform="translate(620,640) scale(${k})"><path d="M-110,-120 L110,-120 L110,0 Q110,110 0,150 Q-110,110 -110,0Z" fill="#8ac926" ${ink(10)}/>` + text(0, 30, '✓', 120, '#fff', { stroke: 0 }) + `</g>`;
      return cam(lerp(1.15, 1.6, ease(clamp(st / jp, 0, 1))), 620, 900, s);
    }
    if (st < wk) {
      const a = st - jp;
      const scroll = a * 900;
      s += R(200, -100, 680, 2200, '#6b7a99', ink(8));
      for (let j = -2; j < 20; j++) for (let i = 0; i < 4; i++) {
        const y = ((j * 140 - scroll) % 2800 + 2800) % 2800 - 200;
        s += R(250 + i * 160, y, 100, 90, '#bfe8ff', ink(4));
      }
      for (let i = 0; i < 12; i++) { const x = hash(i) * W, len = 160 + hash(i + 3) * 260, y = ((hash(i + 6) * 2400 - st * 2600) % 2400 + 2400) % 2400 - 300; s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + len}" stroke="#fff" stroke-width="${4 + hash(i + 1) * 6}" opacity="0.5" stroke-linecap="round"/>`; }
      const P = person(Object.assign({}, HERO, { x: 540, y: 1020 + Math.sin(st * 3) * 20, s: 0.9, rot: Math.sin(st * 2) * 10, expr: 'happy', armL: [130 + Math.sin(st * 10) * 10, 150], armR: [130 + Math.cos(st * 10) * 10, 150] }));
      s += P.svg;
      s += `<g><rect x="600" y="460" width="420" height="90" rx="16" fill="${INK}" opacity="0.9"/>` + text(810, 522, 'FLOOR ' + Math.max(1, 80 - Math.floor(a * 34)), 54, '#ffd23f', { stroke: 0 }) + `</g>`;
      return s;
    }
    const a = st - wk;
    s += R(0, 1200, W, 720, '#c9c3b8', ink(6)) + R(0, 0, 420, 1200, '#6b7a99', ink(8));
    for (let j = 0; j < 8; j++) for (let i = 0; i < 2; i++) s += R(60 + i * 170, 120 + j * 140, 100, 90, '#bfe8ff', ink(4));
    if (a < 0.6) s += circ(600, 1200, 60 + a * 260, '#efe6d8', `opacity="${0.8 * (1 - a / 0.6)}" ${ink(4)}`);
    const walkX = 600 + Math.max(0, a - 0.5) * 260;
    if (a < 0.5) s += person(Object.assign({}, HERO, { x: 600, y: 1210 - Math.abs(Math.sin(a * 10)) * 60 * (1 - a / 0.5), s: 0.9, expr: 'happy', armR: [150, 175], armL: [20, 10] })).svg;
    else s += sidePerson(Object.assign({}, HERO, { x: walkX, y: 1210, s: 0.9, mode: 'walk', phase: a * 8, lean: 2, expr: 'happy', shirt: '#4d7cfe' }));
    if (a > 0.3) s += `<g transform="translate(760,640) scale(${back(clamp((a - 0.3) / 0.3, 0, 1))}) rotate(-5)"><rect x="-230" y="-70" width="460" height="110" rx="18" fill="#8ac926" ${ink(6)}/>` + text(0, 14, 'NOT A SCRATCH', 60, '#fff', { stroke: 0 }) + `</g>`;
    return s;
  }

  // ======================= one cookie = five days =======================
  function cookie(st, shot) {
    const ck = cue(shot, 'cookie', 0.5), fv = cue(shot, 'five', 1.6);
    let s = rays(540, 1000, '#ffe08a', '#ffd23f', st * 20, 16);
    const k = back(clamp((st - ck + 0.3) / 0.35, 0, 1));
    s += `<g transform="translate(540,930) scale(${k}) rotate(${st * 6})">` + circ(0, 0, 330, '#d9a05b', ink(10));
    for (let i = 0; i < 12; i++) { const a = rad(i * 47), r = 60 + hash(i) * 220; s += `<path d="M${Math.cos(a) * r - 26},${Math.sin(a) * r} q26,-36 52,0 q-26,24 -52,0z" fill="#5a3825" ${ink(4)}/>`; }
    s += `<path d="M230,-230 q60,60 100,20 q-10,80 -60,90 q-30,-40 -40,-110z" fill="#f6d6a2"/>` + `</g>`;
    s += person(Object.assign({}, HERO, { x: 830, y: 1290, s: 0.5, expr: 'happy', armL: [120, 160], armR: [100, 140] })).svg;
    for (let i = 0; i < 8; i++) { const a = (st * 2 + i) % 1; s += circ(790 + hash(i) * 120, 1080 + a * 200, 7, '#d9a05b', ink(3)); }
    if (st > fv) {
      const kk = back(clamp((st - fv) / 0.3, 0, 1));
      const days = Math.min(5, 1 + Math.floor((st - fv) * 6));
      s += `<g transform="translate(540,560) scale(${kk}) rotate(-3)"><rect x="-330" y="-90" width="660" height="150" rx="22" fill="${INK}"/>` + text(0, 24, `1 COOKIE = ${days} DAY${days > 1 ? 'S' : ''}`, 76, '#ffd23f', { stroke: 0 }) + `</g>`;
    }
    return s;
  }

  // ======================= square-cube law =======================
  function cubes(st, shot) {
    const ht = cue(shot, 'heat', 2.1);
    let s = R(0, 0, W, H, '#14213d');
    for (let x = 0; x < W; x += 60) s += R(x, 0, 2, H, '#1d2d50');
    const cube = (x, y, a, col) => `<path d="M${x},${y} L${x + a},${y} L${x + a},${y + a} L${x},${y + a}Z" fill="${col}" ${ink(8)}/>` +
      `<path d="M${x},${y} L${x + a * 0.4},${y - a * 0.4} L${x + a * 1.4},${y - a * 0.4} L${x + a},${y}Z" fill="${shade(col, 0.25)}" ${ink(8)}/>` +
      `<path d="M${x + a},${y} L${x + a * 1.4},${y - a * 0.4} L${x + a * 1.4},${y + a * 0.6} L${x + a},${y + a}Z" fill="${shade(col, -0.25)}" ${ink(8)}/>`;
    const k = easeOut(clamp(st / 0.5, 0, 1));
    const sx = 740 + (st > ht ? Math.sin(st * 60) * 4 : 0);
    const arrow = (x, y, ang, len, op) => { const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len; return `<path d="M${x},${y} Q${(x + ex) / 2 + 12},${(y + ey) / 2 - 12} ${ex},${ey}" stroke="#ff4d3d" stroke-width="10" fill="none" stroke-linecap="round" opacity="${op}"/>` + circ(ex, ey, 8, '#ff4d3d', `opacity="${op}"`); };
    for (let i = 0; i < 4; i++) { const ph = (st * 0.8 + i / 4) % 1; s += arrow(370, 900, rad(-150 + i * 40), 330 + ph * 120, 0.7 * (1 - ph)); }
    if (st > ht) for (let i = 0; i < 12; i++) { const ph = (st * 1.6 + i / 12) % 1; s += arrow(sx + 80, 1080, rad(i * 30), 120 + ph * 140, 0.9 * (1 - ph)); }
    s += `<g opacity="${k}">` + cube(110, 800, 380, '#ff7a59') + text(300, 1310, 'BIG YOU', 64, '#fff') + `</g>`;
    const small = st > ht ? clamp((st - ht) / 0.8, 0, 1) : 0;
    s += `<g opacity="${k}">` + cube(sx, 1040, 120, small > 0.5 ? '#7fd8ff' : '#ff7a59') + text(800, 1310, 'TINY YOU', 64, '#fff') + `</g>`;
    if (st > ht + 0.3) {
      const kk = back(clamp((st - ht - 0.3) / 0.3, 0, 1));
      s += `<g transform="translate(540,560) scale(${kk}) rotate(-3)"><rect x="-370" y="-80" width="740" height="130" rx="20" fill="#ff4d3d" ${ink(6)}/>` + text(0, 20, 'LOSES HEAT 10× FASTER', 60, '#fff', { stroke: 0 }) + `</g>`;
    }
    return s;
  }

  // ======================= freezing in summer =======================
  function cold(st, shot) {
    const su = cue(shot, 'summer', 2.6);
    let s = R(0, 0, W, H, '#f6d6a2');
    s += R(140, 460, 520, 560, '#fff3dc', ink(8)) + R(160, 480, 480, 520, '#9ad7ff');
    s += circ(290, 600, 70, '#ffd23f', ink(6)) + `<path d="M160,900 q120,-60 240,0 q120,-40 240,10 L640,1000 L160,1000Z" fill="#8ac926" ${ink(5)}/>`;
    // thermometer
    s += `<rect x="800" y="460" width="80" height="460" rx="40" fill="#fff" ${ink(8)}/>` + circ(840, 960, 70, '#ff3b30', ink(8)) + `<rect x="822" y="560" width="36" height="400" fill="#ff3b30"/>`;
    s += text(840, 1080, '30°C', 64, '#ff4d3d');
    s += R(0, 1150, W, 770, '#a8693f', ink(8));
    // tiny you, wrapped in a sock, shivering
    const jx = Math.sin(st * 70) * 5;
    s += `<g transform="translate(${jx},0)">` + person(Object.assign({}, HERO, { x: 540, y: 1380, s: 0.85, expr: 'pain', armL: [10, 5], armR: [10, 5] })).svg;
    s += `<path d="M390,1400 L390,1250 Q390,1200 440,1200 L640,1200 Q690,1200 690,1250 L690,1400Z" fill="#ff595e" ${ink(8)}/>` + R(390, 1210, 300, 46, '#fff', 'opacity="0.7"');
    s += `<circle cx="540" cy="${1380 - 350 * 0.85}" r="${78 * 0.85}" fill="#7fd8ff" opacity="0.35"/>`;
    s += `<path d="M530,${1380 - 320 * 0.85} l8,30 l8,-30z" fill="#bfe8ff" ${ink(3)}/></g>`;
    for (let i = 0; i < 3; i++) { const ph = (st * 1.2 + i / 3) % 1; s += circ(620 + ph * 120, 1150 - ph * 80, 16 + ph * 26, '#fff', `opacity="${0.7 * (1 - ph)}"`); }
    for (let i = 0; i < 3; i++) s += text(260 + i * 30 + jx * 2, 1260 + i * 60, 'B' + 'R'.repeat(2 + i), 46 - i * 6, '#7fd8ff', { stroke: 6 });
    if (st > su) s += `<g transform="translate(540,410) scale(${back(clamp((st - su) / 0.25, 0, 1))}) rotate(-4)"><rect x="-200" y="-56" width="400" height="96" rx="16" fill="${INK}"/>` + text(0, 16, 'IN SUMMER', 62, '#ffd23f', { stroke: 0 }) + `</g>`;
    return s;
  }

  // ======================= squeaky voice =======================
  function voice(st, shot, ctx) {
    const sq = cue(shot, 'squeak', 1.7);
    const tiny = st > sq;
    let s = R(0, 0, W, H, tiny ? '#ffc8f0' : '#cdeefb');
    s += halftone('ht5', '#ffffff', 0.4, 30);
    const talking = ctx.lines.some((L) => ctx.t >= L.start && ctx.t <= L.end);
    const P = person(Object.assign({}, HERO, { x: 540, y: 1800, s: 1.9, expr: tiny ? (talking && Math.floor(st * 8) % 2 ? 'shock' : 'happy') : (talking && Math.floor(st * 6) % 2 ? 'shock' : 'neutral'), mouth: 0.6 }));
    s += P.svg;
    // waveform panel
    s += `<rect x="90" y="440" width="900" height="300" rx="24" fill="${INK}" opacity="0.92"/>`;
    let d = 'M130,590';
    const f = tiny ? 0.11 : 0.025, amp = talking ? (tiny ? 60 : 100) : 6;
    for (let x = 130; x <= 950; x += 6) d += ` L${x},${590 + Math.sin(x * f + st * 30) * amp * (0.6 + 0.4 * Math.sin(x * 0.01 + st * 4))}`;
    s += `<path d="${d}" fill="none" stroke="${tiny ? '#ff6fd8' : '#7fd8ff'}" stroke-width="8" stroke-linejoin="round"/>`;
    s += `<text x="130" y="490" font-family="Montserrat" font-weight="900" font-size="34" fill="#fff">PITCH: ${tiny ? 'TINY MODE' : 'NORMAL'}</text>`;
    if (tiny) for (let i = 0; i < 4; i++) { const ph = (st * 0.9 + i / 4) % 1; s += text(760 + Math.sin(ph * 8 + i) * 60, 1080 - ph * 260, '♪', 70, '#ff6fd8', { stroke: 8, extra: `opacity="${1 - ph}"` }); }
    return s;
  }

  // ======================= unlocking a phone =======================
  function tinyphone(st, shot) {
    const wo = cue(shot, 'workout', 1.5);
    let s = R(0, 0, W, H, '#a8693f');
    s += `<rect x="110" y="380" width="860" height="1500" rx="90" fill="#22252e" ${ink(10)}/><rect x="140" y="410" width="800" height="1440" rx="70" fill="#5b7cfa"/>`;
    s += text(540, 560, 'ENTER PASSCODE', 54, '#fff', { stroke: 0, font: 'Montserrat', weight: 900 });
    const pressed = Math.min(4, Math.floor(st / 0.45));
    for (let i = 0; i < 4; i++) s += circ(390 + i * 100, 650, 22, i < pressed ? '#fff' : 'none', 'stroke="#fff" stroke-width="5"');
    const keys = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) keys.push([300 + c * 240, 820 + r * 230]);
    keys.forEach(([x, y], i) => { if (i === 9 || i === 11) return; s += circ(x, y, 90, '#ffffff', 'opacity="0.25"') + text(x, y + 26, String(i === 10 ? 0 : i + 1), 80, '#fff', { stroke: 0, font: 'Montserrat', weight: 900 }); });
    // tiny you hopping key to key, landing with full-body slams
    const hop = st / 0.45, i0 = Math.floor(hop) % 4, f = hop % 1;
    const seq = [0, 4, 8, 6];
    const A = keys[seq[i0]], B = keys[seq[(i0 + 1) % 4]];
    const x = lerp(A[0], B[0], f), y = lerp(A[1], B[1], f) - Math.sin(f * Math.PI) * 220 + 40;
    if (f < 0.15) s += circ(A[0], A[1], 90 + f * 300, '#fff', `opacity="${0.5 * (1 - f / 0.15)}"`);
    s += person(Object.assign({}, HERO, { x, y, s: 0.42, expr: 'strain', sweat: true, armL: [150, 170], armR: [150, 170] })).svg;
    if (st > wo) s += `<g transform="translate(540,1560) scale(${back(clamp((st - wo) / 0.25, 0, 1))}) rotate(-4)"><rect x="-330" y="-70" width="660" height="110" rx="18" fill="#ff4d3d" ${ink(6)}/>` + text(0, 14, 'FULL-BODY WORKOUT', 62, '#fff', { stroke: 0 }) + `</g>`;
    return s;
  }

  // ======================= the sock drawer =======================
  function drawerSet(st, gap) {
    let s = R(0, 0, W, H, '#f6d6a2') + R(0, 1500, W, 420, '#c98f5a', ink(6));
    // dresser body
    s += R(60, 560, 960, 1000, '#a8693f', ink(10));
    // open drawer: inside seen from above
    s += `<path d="M120,${1020 - gap} L960,${1020 - gap} L1000,1100 L80,1100Z" fill="#6b4226" ${ink(8)}/>`;
    const cols = ['#ff595e', '#ffd23f', '#8ac926', '#1982c4', '#6a4c93', '#ff7a59', '#2ec4b6'];
    if (gap > 120) for (let i = 0; i < 9; i++) s += sock(200 + (i % 5) * 170 + (i > 4 ? 80 : 0), 1020 - gap * 0.55 + (i > 4 ? 60 : 0), 150, 70, cols[i % cols.length], hash(i) * 30 - 15);
    s += R(60, 1100, 960, 230, '#c27a45', ink(10)) + `<rect x="460" y="1190" width="160" height="40" rx="20" fill="#ffd23f" ${ink(6)}/>`;
    s += R(60, 1330, 960, 230, '#b06b3a', ink(10)) + `<rect x="460" y="1420" width="160" height="40" rx="20" fill="#ffd23f" ${ink(6)}/>`;
    return s;
  }
  function drawer(st, shot) {
    const dr = cue(shot, 'drawer', 1.7), pf = cue(shot, 'proof', 4.3);
    let s = drawerSet(st, 380);
    // tiny you tucked into a sock like a sleeping bag
    if (st > dr - 0.2) {
      const k = back(clamp((st - dr + 0.2) / 0.4, 0, 1));
      s += `<g transform="translate(560,830) scale(${k})">` + sock(0, 40, 260, 110, '#ff595e', -6) + K.head(-90, 0, 46, Object.assign({}, HERO, { expr: 'relaxed' })) +
        `<path d="M-130,-40 Q-90,-110 -40,-40Z" fill="#4d7cfe" ${ink(5)}/>` + circ(-128, -44, 12, '#fff', ink(4)) + `</g>`;
      for (let i = 0; i < 3; i++) { const ph = (st * 0.6 + i / 3) % 1; s += text(470 + i * 30, 760 - ph * 120, 'z', 40 + ph * 20, '#fff', { stroke: 6, extra: `opacity="${Math.sin(ph * Math.PI)}"` }); }
    }
    const items = [['WARM', pf - 1.25], ['SOFT', pf - 0.6], ['CAT-PROOF', pf]];
    items.forEach(([lbl, at], i) => {
      if (st < at) return;
      const k = back(clamp((st - at) / 0.25, 0, 1));
      s += `<g transform="translate(${280 + i * 260},420) scale(${k})"><rect x="-120" y="-50" width="240" height="90" rx="16" fill="#8ac926" ${ink(6)}/>` + text(0, 14, '✓ ' + lbl, lbl.length > 5 ? 34 : 44, '#fff', { stroke: 0 }) + `</g>`;
    });
    return cam(lerp(1.0, 1.08, ease(clamp(st / 5, 0, 1))), 540, 960, s);
  }
  function drawerEnd(st, shot) {
    const ey = cue(shot, 'eye', 1.5);
    let s = drawerSet(st, lerp(380, 60, easeOut(clamp(st / 0.6, 0, 1))));
    // a dark slit with a giant eye peeking through
    s += R(120, 900, 840, 150, '#0b0a12', ink(6));
    s += `<ellipse cx="260" cy="975" rx="16" ry="20" fill="#fff"/><ellipse cx="300" cy="975" rx="16" ry="20" fill="#fff"/>` + circ(266, 978, 6, INK) + circ(306, 978, 6, INK);
    if (st > ey) {
      const k = easeOut(clamp((st - ey) / 0.5, 0, 1));
      s += `<clipPath id="slit"><rect x="120" y="900" width="840" height="150"/></clipPath><g clip-path="url(#slit)"><ellipse cx="${lerp(1150, 720, k)}" cy="975" rx="210" ry="150" fill="#c6e83a" ${ink(10)}/><ellipse cx="${lerp(1150, 690, k)}" cy="975" rx="26" ry="140" fill="${INK}"/><circle cx="${lerp(1150, 650, k)}" cy="930" r="18" fill="#fff"/></g>`;
    }
    // tally marks scratched on the dresser
    if (st > ey + 1.2) {
      const n = Math.min(3, Math.floor((st - ey - 1.2) * 5) + 1);
      for (let i = 0; i < n; i++) s += `<path d="M${180 + i * 50},640 l20,140" stroke="#5a3825" stroke-width="12" stroke-linecap="round"/>`;
      s += text(330, 860, 'DAY ' + n, 56, '#fff');
    }
    s += `<g opacity="${clamp(st / 0.4, 0, 1)}"><rect x="640" y="600" width="320" height="90" rx="16" fill="${INK}"/>` + text(800, 662, 'MOSTLY ✓', 52, '#ffd23f', { stroke: 0 }) + `</g>`;
    s += vignette('vn3', 0.55);
    return cam(lerp(1.0, 1.15, ease(clamp(st / 4, 0, 1))), 620, 975, s);
  }

  root.Scenes = { pillow, cat, fall, cookie, cubes, cold, voice, tinyphone, drawer, drawerEnd };
})(window);
