// ANDAR KI BAAT 03: "Railway track ke neeche patthar kyun hote hain?" scene art.
(function (root) {
  'use strict';
  const K = root.Kit;
  const { W, H, INK, C, clamp, lerp, ease, easeOut, easeIn, back, hash, p, rad, R, ink, g, shade, limb, circ, burst, vignette, halftone, rays, text } = K;
  const cue = (shot, k, d = 99) => (shot.cues && shot.cues[k] != null ? shot.cues[k] : d);
  const cam = (z, cx, cy, inner) => `<g transform="translate(540,960) scale(${z}) translate(${-cx},${-cy})">${inner}</g>`;
  const pop = (st, at, d = 0.28) => back(clamp((st - at) / d, 0, 1));
  const FONT = "'Montserrat',sans-serif";
  const GREEN = '#2fbf71', STONE = ['#8e9199', '#a5a8b0', '#7b7e87', '#b4b6bc', '#9a9389'];
  const SLEEPER = '#c8c2b4', RAIL = '#6d717c';

  function tag(x, y, str, size, o = {}) {
    const ww = str.length * size * 0.66 + 50;
    return g(`translate(${x},${y}) rotate(${o.rot ?? -3}) scale(${o.k ?? 1})`, `<rect x="${-ww / 2}" y="${-size * 0.95}" width="${ww}" height="${size * 1.45}" rx="16" fill="${o.bg || INK}" ${o.bg ? ink(6) : ''}/>` + text(0, size * 0.18, str, size, o.col || '#fff', { font: FONT, weight: 900, stroke: 0 }));
  }
  // an angular stone (or a round pebble) centred at (x,y)
  function stone(x, y, r, seed, o = {}) {
    const col = STONE[Math.floor(hash(seed) * STONE.length)];
    let d = '';
    if (o.round) return `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.85}" fill="${col}" ${ink(o.w || 4)}/>`;
    const n = 5 + Math.floor(hash(seed + 1) * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + hash(seed + i * 3) * 0.6, rr = r * (0.7 + hash(seed + i * 5) * 0.45);
      d += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ',' + (y + Math.sin(a) * rr * 0.85).toFixed(1);
    }
    let s = `<path d="${d}Z" fill="${col}" ${ink(o.w || 4)}/>`;
    if (o.face) {
      const b = o.blink ? 0.1 : 1;
      s += `<ellipse cx="${x - r * 0.28}" cy="${y - r * 0.1}" rx="${r * 0.1}" ry="${r * 0.13 * b}" fill="${INK}"/><ellipse cx="${x + r * 0.28}" cy="${y - r * 0.1}" rx="${r * 0.1}" ry="${r * 0.13 * b}" fill="${INK}"/>`;
      s += o.sad ? `<path d="M${x - r * 0.2},${y + r * 0.3} Q${x},${y + r * 0.15} ${x + r * 0.2},${y + r * 0.3}" ${ink(3)} fill="none"/>` : `<path d="M${x - r * 0.22},${y + r * 0.18} Q${x},${y + r * 0.42} ${x + r * 0.22},${y + r * 0.18}" ${ink(3)} fill="none"/>`;
    }
    return s;
  }
  // ballast bed as a trapezoid full of stones (front cross-section)
  const bedCache = {};
  function bed(x0b, x1b, x0t, x1t, yt, yb, r, seed, o = {}) {
    const key = [x0b, x1b, x0t, x1t, yt, yb, r, seed].join(',');
    if (!bedCache[key]) {
      const pts = [];
      for (let y = yb - r * 0.7; y > yt; y -= r * 1.25) {
        const f = (yb - y) / (yb - yt), xa = lerp(x0b, x0t, f), xb = lerp(x1b, x1t, f);
        for (let x = xa + r * 0.6; x < xb - r * 0.4; x += r * 1.5) pts.push([x + (hash(seed + x * 0.37 + y) - 0.5) * r * 0.6, y + (hash(seed + y * 0.21 + x) - 0.5) * r * 0.4, pts.length]);
      }
      bedCache[key] = pts;
    }
    let s = `<path d="M${x0b},${yb} L${x0t},${yt} L${x1t},${yt} L${x1b},${yb}Z" fill="#5f6168" ${ink(7)}/>`;
    for (const [x, y, i] of bedCache[key]) {
      if (o.skip && o.skip(x, y)) continue;
      s += stone(x, y, r * (0.8 + hash(seed + i) * 0.35), seed + i * 7, { round: o.round, w: o.w, face: o.faces && hash(i + 99) > 0.8, blink: o.blink && hash(i + 5) > 0.5 });
    }
    return s;
  }
  // side-view track along y (rail top), plus sleepers
  function sideTrack(y, offset = 0) {
    let s = '';
    for (let x = -200 + (offset % 120); x < W + 200; x += 120) s += R(x, y + 8, 70, 30, SLEEPER, ink(5));
    s += R(-20, y - 18, W + 40, 26, RAIL, ink(6)) + R(-20, y - 18, W + 40, 8, '#9aa0aa');
    return s;
  }
  function coach(x, y, w, col, o = {}) { // side view, wheels on y
    let s = `<rect x="${x}" y="${y - 250}" width="${w}" height="190" rx="22" fill="${col}" ${ink(7)}/>`;
    s += R(x, y - 120, w, 18, shade(col, -0.25));
    for (let i = 0; i < Math.floor((w - 60) / 90); i++) s += `<rect x="${x + 40 + i * 90}" y="${y - 220}" width="56" height="60" rx="8" fill="#cfe9ff" ${ink(4)}/>`;
    if (o.freight) s = `<rect x="${x}" y="${y - 230}" width="${w}" height="170" rx="8" fill="${col}" ${ink(7)}/>` + [0.25, 0.5, 0.75].map((f) => `<line x1="${x + w * f}" y1="${y - 225}" x2="${x + w * f}" y2="${y - 65}" stroke="${shade(col, -0.25)}" stroke-width="8"/>`).join('') + `<path d="M${x + 20},${y - 230} Q${x + w / 2},${y - 300} ${x + w - 20},${y - 230}Z" fill="#3b2a20" ${ink(6)}/>`;
    for (const f of [0.18, 0.32, 0.68, 0.82]) s += circ(x + w * f, y - 34, 30, '#333', ink(6)) + circ(x + w * f, y - 34, 10, '#888');
    return s;
  }
  function engine(x, y, col) {
    let s = `<path d="M${x},${y - 60} L${x},${y - 270} L${x + 300},${y - 270} Q${x + 380},${y - 260} ${x + 390},${y - 160} L${x + 390},${y - 60}Z" fill="${col}" ${ink(7)}/>`;
    s += `<rect x="${x + 280}" y="${y - 240}" width="80" height="60" rx="8" fill="#cfe9ff" ${ink(4)}/>` + R(x, y - 140, 390, 22, '#ffd23f');
    for (const f of [60, 140, 250, 330]) s += circ(x + f, y - 34, 30, '#333', ink(6));
    return s;
  }
  // side view of the embankment: ballast bed under the track
  function embankment(yTop, faces, st) {
    let s = `<path d="M-60,${yTop + 260} L80,${yTop} L1000,${yTop} L1140,${yTop + 260}Z" fill="#5f6168" ${ink(7)}/>`;
    for (let i = 0; i < 70; i++) {
      const x = 60 + hash(i) * 960, y = yTop + 20 + hash(i + 50) * 220;
      s += stone(x, y, 18 + hash(i + 9) * 10, i * 11, { face: faces && i % 5 === 0, blink: faces && (st * 2 + i) % 4 < 0.15 });
    }
    return s;
  }

  // ---------------- hook: the train passes over the stones ----------------
  function track(st, shot) {
    const pt = cue(shot, 'patthar', 1.5), sj = cue(shot, 'saja', 3.2), nh = cue(shot, 'nahi', 5.3);
    let s = R(0, 0, W, H, '#8fd3ff');
    s += `<path d="M0,900 Q270,840 540,880 T1080,860 L1080,1300 L0,1300Z" fill="#9ed36a"/>`;
    s += R(0, 1250, W, 700, '#7bb555', ink(8));
    s += embankment(1000, false, st);
    s += sideTrack(990, -st * 900);
    const tx = lerp(250, 4300, clamp(st / 3.8, 0, 1)); // engine leads, moving right
    s += engine(tx, 982, '#d64545');
    for (let i = 0; i < 6; i++) s += coach(tx - (i + 1) * 520, 982, 500, i % 2 ? '#4d7cfe' : '#3a62c9');
    const z = st > pt ? lerp(1, 1.7, ease(clamp((st - pt) / 0.8, 0, 1))) : 1;
    s = cam(z, 540, lerp(960, 1120, clamp(z - 1, 0, 1) / 0.7), s);
    if (st > pt) for (let i = 0; i < 3; i++) s += text(300 + i * 230, 700 + (i % 2) * 60, '?', 120 * pop(st, pt + i * 0.1), '#ffd23f', { extra: `transform="rotate(${-10 + i * 10} ${300 + i * 230} ${700 + (i % 2) * 60})"` });
    if (st > sj) s += tag(540, 1180, 'SAJAAVAT? ✨', 64, { k: pop(st, sj), bg: '#ff8fc8', col: '#fff' });
    if (st > nh) s += g(`translate(540,1160) scale(${pop(st, nh, 0.2)})`, `<path d="M-200,-110 L200,110 M200,-110 L-200,110" stroke="${C.red}" stroke-width="40" stroke-linecap="round"/>`);
    return s;
  }

  // ---------------- without ballast: the track sinks ----------------
  function sink(st, shot) {
    const tn = cue(shot, 'ton', 1.2), mt = cue(shot, 'mitti', 2.9), dh = cue(shot, 'dhans', 4.6);
    let s = R(0, 0, W, H, '#ffe0a8');
    const sk = st > dh ? easeOut(clamp((st - dh) / 0.8, 0, 1)) : 0;
    const y = 1080 + sk * 110, tilt = sk * 4;
    let tr = sideTrack(y, 0);
    tr += `<rect x="40" y="${y - 280}" width="440" height="20" fill="none"/>` + coach(30, y - 6, 480, '#7a4a2a', { freight: true }) + coach(560, y - 6, 480, '#8a5a3c', { freight: true });
    s += g(`rotate(${tilt} 540 ${y})`, tr);
    // mud
    s += `<path d="M0,${1100 + sk * 40} ${Array.from({ length: 12 }, (_, i) => `Q${i * 100 + 50},${1080 + sk * 60 + (i % 2 ? 20 : -10)} ${(i + 1) * 100},${1100 + sk * 40}`).join(' ')} L1080,1920 L0,1920Z" fill="#8b5a2b" ${ink(8)}/>`;
    for (let i = 0; i < 20; i++) s += circ(hash(i) * W, 1220 + hash(i + 3) * 600, 8 + hash(i + 1) * 10, '#7a4d24');
    if (st > tn) {
      const k = pop(st, tn);
      s += g(`translate(540,${560 + Math.sin(st * 3) * 6}) scale(${k})`, `<path d="M-120,-40 L120,-40 L160,110 L-160,110Z" fill="#3a3a44" ${ink(8)}/><path d="M-50,-40 Q-50,-110 0,-110 Q50,-110 50,-40" fill="none" ${ink(14)}/>` + text(0, 70, 'HAZAARON', 40, '#fff', { stroke: 0 }) + text(0, 108, 'TON', 34, '#ffd23f', { stroke: 0 }));
      s += `<path d="M540,${720} L540,${880}" stroke="${C.red}" stroke-width="22"/><path d="M490,${850} L540,${920} L590,${850}Z" fill="${C.red}"/>`;
    }
    if (st > mt && st < dh) s += tag(250, 1260, 'SIRF MITTI', 46, { k: pop(st, mt), bg: '#5a3a1a' });
    if (st > dh) s += text(820, 1300, 'DHAS GAYI!', 80 * pop(st, dh), C.red, { extra: 'transform="rotate(-6 820 1300)"' });
    return s;
  }

  // ---------------- front cross-section: layers / spread / rain ----------------
  const GY = 1180; // ground top
  function section(st, shot) {
    const mode = shot.mode;
    let s = R(0, 0, W, H, mode === 'rain' ? '#5d6b85' : '#bfe6ff');
    if (mode === 'rain') for (let i = 0; i < 70; i++) {
      const x = hash(i) * W, y = ((hash(i + 3) * 1900 + st * 1600) % 1900);
      s += `<line x1="${x}" y1="${y}" x2="${x - 10}" y2="${y + 40}" stroke="#bfe6ff" stroke-width="5" opacity="0.8" stroke-linecap="round"/>`;
    }
    s += R(0, GY, W, H - GY, '#8b5a2b', ink(8));
    for (let i = 0; i < 25; i++) s += circ(hash(i + 40) * W, GY + 60 + hash(i + 41) * 600, 6 + hash(i + 42) * 8, '#7a4d24');
    // what's visible when
    let showBed = 1, showSl = 1, showRail = 1;
    if (mode === 'layers') {
      showRail = pop(st, cue(shot, 'patri', 1.4) - 0.1);
      showSl = clamp((st - cue(shot, 'sleeper', 2.6) + 0.2) / 0.3, 0, 1);
      showBed = clamp((st - cue(shot, 'patthar', 4.5) + 0.3) / 0.5, 0, 1);
    }
    const bedY = 960;
    if (showBed > 0) s += g(`translate(0,${(1 - easeOut(showBed)) * 500})`, bed(110, 970, 250, 830, bedY, GY, 30, 5), `opacity="${showBed}"`);
    const slY = bedY - 40 + (1 - easeOut(showSl)) * -400;
    if (showSl > 0) s += R(220, slY, 640, 64, SLEEPER, ink(7)) + R(220, slY, 640, 14, '#ddd7c9');
    const railY = slY - 70;
    if (showRail > 0) for (const x of [380, 700]) s += g(`translate(${x},${railY}) scale(${showRail})`, `<path d="M-40,70 L40,70 L40,58 L12,50 L12,18 L30,10 L30,-6 L-30,-6 L-30,10 L-12,18 L-12,50 L-40,58Z" fill="${RAIL}" ${ink(5)}/>`);
    if (mode === 'layers') {
      if (st > cue(shot, 'patri', 1.4)) s += tag(540, railY - 90, 'PATRI', 48, { k: pop(st, cue(shot, 'patri', 1.4)) });
      if (st > cue(shot, 'sleeper', 2.6)) s += tag(890, slY - 40, 'SLEEPER', 42, { k: pop(st, cue(shot, 'sleeper', 2.6)), rot: 4 });
      const bl = cue(shot, 'ballast', 5.3);
      if (st > bl) s += g(`translate(540,560) rotate(-5) scale(${lerp(2.2, 1, easeOut(clamp((st - bl) / 0.22, 0, 1)))})`, `<rect x="-260" y="-80" width="520" height="130" rx="20" fill="#ffd23f" ${ink(8)}/>` + text(0, 22, 'BALLAST', 92, INK, { stroke: 0 }));
    }
    if (mode === 'spread') {
      const fl = cue(shot, 'faila', 1.3), bd = cue(shot, 'bade', 2.2), zm = cue(shot, 'zameen', 3.6);
      // wheel pressing on the rails
      s += circ(380, railY - 80, 70, '#333', ink(7)) + circ(700, railY - 80, 70, '#333', ink(7)) + R(300, railY - 170, 480, 50, '#4d7cfe', ink(6));
      s += `<path d="M540,${railY - 330} L540,${railY - 200}" stroke="${C.red}" stroke-width="40"/><path d="M480,${railY - 220} L540,${railY - 160} L600,${railY - 220}Z" fill="${C.red}" ${ink(4)}/>`;
      s += tag(540, railY - 380, 'TRAIN KA WAZAN', 44, { bg: C.red });
      const k = clamp((st - fl) / 0.9, 0, 1);
      for (let i = -3; i <= 3; i++) {
        const x0 = 540 + i * 60, x1 = 540 + i * lerp(60, 150, ease(k));
        const len = ease(k);
        s += `<line x1="${x0}" y1="${bedY + 20}" x2="${lerp(x0, x1, len)}" y2="${lerp(bedY + 20, GY + 120, len)}" stroke="#ffd23f" stroke-width="12" stroke-linecap="round" opacity="${k > 0 ? 1 : 0}"/>`;
      }
      if (st > bd) s += `<path d="M${540 - 3 * 150},${GY + 160} L${540 + 3 * 150},${GY + 160}" stroke="#ffd23f" stroke-width="10" stroke-dasharray="20 14"/>` + text(540, GY + 230, '⟵ BADA AREA ⟶', 52, '#ffd23f', { stroke: 8 });
      if (st > zm) s += tag(540, GY + 330, 'ZAMEEN SAFE ✓', 50, { k: pop(st, zm), bg: GREEN });
    }
    if (mode === 'rain') {
      const nk = cue(shot, 'nikal', 1.9), kc = cue(shot, 'keechad', 4.1);
      for (let i = 0; i < 14; i++) {
        const ph = ((st * 0.8 + hash(i) * 2) % 1.6) / 1.6;
        const x = 280 + hash(i + 7) * 520 + Math.sin(ph * 20 + i) * 12, y = lerp(bedY - 20, GY + 180, ph);
        s += `<path d="M${x},${y - 18} Q${x + 14},${y + 4} ${x},${y + 12} Q${x - 14},${y + 4} ${x},${y - 18}Z" fill="#4da3ff" ${ink(3)}/>`;
      }
      if (st > nk) s += `<path d="M150,${GY + 200} Q540,${GY + 260} 930,${GY + 200}" stroke="#4da3ff" stroke-width="18" fill="none" stroke-dasharray="30 18" stroke-dashoffset="${-st * 120}"/>`;
      if (st > nk) s += tag(540, 640, 'PAANI NIKAL GAYA ✓', 48, { k: pop(st, nk), bg: '#4da3ff' });
      if (st > kc) s += tag(540, 760, 'KEECHAD ✗', 48, { k: pop(st, kc), bg: C.red, rot: 3 });
    }
    return s;
  }

  // ---------------- angular vs round ----------------
  function sharp(st, shot) {
    const nk = cue(shot, 'nukeele', 1.2), fs = cue(shot, 'fas', 4.4), gl = cue(shot, 'gol', 6.8), ld = cue(shot, 'lud', 8.2);
    let s = R(0, 0, W, H, '#fff3dc') + halftone('h4', '#efd9ae', 0.6, 30);
    s += `<line x1="540" y1="470" x2="540" y2="1330" stroke="${INK}" stroke-width="8" stroke-dasharray="20 14"/>`;
    // left: round pebbles
    const roll = st > ld ? easeIn(clamp((st - ld) / 1.2, 0, 1)) : 0;
    const wob = st > gl ? Math.sin(st * 14) * 10 : 0;
    let L = '';
    for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) {
      const x = 110 + i * 100 + (r % 2) * 50, y = 1220 - r * 80;
      const dir = i < 2 ? -1 : 1;
      L += g(`translate(${dir * roll * (200 + r * 60)},${roll * 80})`, stone(x, y, 40, r * 10 + i, { round: true }));
    }
    L += g(`translate(${wob + roll * 140},${roll * 140}) rotate(${roll * 18 + wob * 0.3} 270 900)`, R(90, 870, 360, 60, SLEEPER, ink(6)));
    s += L + text(270, 580, 'GOL', 80, '#fff', { strokeCol: INK }) + text(270, 1420 - 60, st > gl ? '✗' : '', 110, C.red);
    // right: angular stones that lock
    let Rr = '';
    const lock = clamp((st - fs) / 0.5, 0, 1);
    for (let r = 0; r < 4; r++) for (let i = 0; i < 5; i++) {
      const x = 630 + i * 82 + (r % 2) * 40, y = 1220 - r * 72;
      Rr += stone(x + (1 - lock) * (hash(r * 5 + i) - 0.5) * 30, y, 44, 100 + r * 10 + i);
    }
    Rr += R(620, 900, 380, 60, SLEEPER, ink(6));
    if (st > fs) Rr += [0, 1, 2].map((i) => `<path d="M${660 + i * 140},${1010} l20,20 l30,-40" stroke="${GREEN}" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${lock}"/>`).join('');
    s += Rr + text(810, 580, 'NUKEELE', 80, '#fff', { strokeCol: INK });
    if (st > nk) s += g(`translate(810,700) scale(${pop(st, nk)})`, `<rect x="-130" y="-40" width="260" height="70" rx="16" fill="${GREEN}" ${ink(6)}/>` + text(0, 12, 'ASLI WALE', 38, '#fff', { font: FONT, weight: 900, stroke: 0 }));
    if (st > fs) s += tag(810, 820, 'LOCK! 🔒', 48, { k: pop(st, fs), bg: '#ffd23f', col: INK });
    if (st > ld) s += text(270, 820, 'LUDHAK!', 72 * pop(st, ld), C.red, { extra: 'transform="rotate(-8 270 820)"' });
    return s;
  }

  // ---------------- bonus: no weeds, less vibration ----------------
  function bonus(st, shot) {
    const gh = cue(shot, 'ghaas', 0.5), nh = cue(shot, 'nahi', 2.3), vb = cue(shot, 'vib', 3.4);
    let s = R(0, 0, W, H, '#d9f2c4');
    s += bed(0, W, 0, W, 860, 1400, 34, 77);
    // weed trying to grow
    const gk = clamp((st - gh) / 0.8, 0, 1) * (st > nh ? Math.max(0.15, 1 - (st - nh) / 0.6) : 1);
    if (gk > 0) {
      const h = 320 * gk;
      s += `<path d="M300,960 Q290,${960 - h * 0.5} 300,${960 - h}" stroke="#3a9d3a" stroke-width="18" fill="none" stroke-linecap="round"/>` + `<ellipse cx="${280}" cy="${960 - h * 0.7}" rx="${60 * gk}" ry="${26 * gk}" fill="#4cbb4c" ${ink(4)}/><ellipse cx="${340}" cy="${960 - h * 0.85}" rx="${60 * gk}" ry="${26 * gk}" fill="#4cbb4c" ${ink(4)}/>`;
      if (st > nh) s += circ(300, 960 - h - 20, 26, '#ffd23f', ink(4)) + `<path d="M290,${960 - h - 14} q10,-8 20,0" ${ink(3)} fill="none"/>` + circ(292, 960 - h - 26, 3, INK) + circ(308, 960 - h - 26, 3, INK);
    }
    if (st > nh) s += tag(300, 640, 'GHAAS ✗', 50, { k: pop(st, nh), bg: C.red });
    // vibration waves: big above the stones, small below
    if (st > vb) {
      const k = clamp((st - vb) / 0.4, 0, 1);
      const wave = (y, amp, col) => { let d = `M60,${y}`; for (let x = 60; x <= 1020; x += 20) d += ` L${x},${y + Math.sin(x * 0.05 - st * 14) * amp}`; return `<path d="${d}" stroke="${col}" stroke-width="10" fill="none" stroke-linecap="round" opacity="${k}"/>`; };
      s += wave(780, 40, C.red) + wave(1480, 8, GREEN);
      s += tag(820, 660, 'VIBRATION ↓', 46, { k: pop(st, vb), bg: GREEN });
    }
    return s;
  }

  // ---------------- end: thank the stones ----------------
  function trackEnd(st, shot) {
    const th = cue(shot, 'thank', 2.8), ko = cue(shot, 'koi', 4.1);
    let s = R(0, 0, W, H, '#ffcf8f');
    s += circ(820, 560, 110, '#fff2b3', 'opacity="0.9"');
    s += R(0, 1250, W, 700, '#7bb555', ink(8));
    s += embankment(1000, true, st);
    s += sideTrack(990, -st * 700);
    const tx = ((st * 700) % 3300) - 300;
    s += engine(tx, 982, '#d64545');
    for (let i = 0; i < 4; i++) s += coach(tx - (i + 1) * 520, 982, 500, i % 2 ? '#4d7cfe' : '#3a62c9');
    if (st > th) s += g(`translate(540,540) scale(${pop(st, th)})`, `<path d="M0,40 C-60,-40 -150,10 -110,80 C-80,130 0,170 0,200 C0,170 80,130 110,80 C150,10 60,-40 0,40Z" fill="${C.red}" ${ink(7)}/>` + text(0, -60, 'THANK YOU!', 64, '#fff'));
    if (st > ko) s += g(`translate(330,880) scale(${pop(st, ko)})`, `<rect x="-200" y="-60" width="400" height="110" rx="30" fill="#fff" ${ink(6)}/><path d="M-40,50 L0,110 L40,50Z" fill="#fff" ${ink(6)}/>` + text(0, 16, 'KOI BAAT NAHI!', 46, INK, { font: FONT, weight: 900, stroke: 0 }));
    return s;
  }

  root.Scenes = { track, sink, section, sharp, bonus, trackEnd };
})(window);
