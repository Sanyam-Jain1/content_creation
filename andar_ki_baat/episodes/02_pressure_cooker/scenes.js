// ANDAR KI BAAT 02: "Pressure cooker ki seeti: andar kya ho raha hai?" scene art.
(function (root) {
  'use strict';
  const K = root.Kit;
  const { W, H, INK, C, clamp, lerp, ease, easeOut, easeIn, back, hash, p, rad, R, ink, g, shade, limb, circ, person, burst, vignette, halftone, rays, text } = K;
  const cue = (shot, k, d = 99) => (shot.cues && shot.cues[k] != null ? shot.cues[k] : d);
  const cam = (z, cx, cy, inner) => `<g transform="translate(540,960) scale(${z}) translate(${-cx},${-cy})">${inner}</g>`;
  const pop = (st, at, d = 0.28) => back(clamp((st - at) / d, 0, 1));
  const FONT = "'Montserrat',sans-serif";
  const GREEN = '#2fbf71', AL = '#c9ced6', AL_D = '#9aa1ad', HANDLE = '#2b2b33';
  const MUMMY = { skin: C.skin[1], shirt: '#e84a8a', pants: '#e84a8a', hair: 'bun', hairColor: '#1d1b22' };
  const HERO = { skin: C.skin[1], shirt: '#2ec4b6', pants: '#2f3b55', hair: 'short', hairColor: '#1d1b22' };

  function tag(x, y, str, size, o = {}) {
    const w = K.Player ? 0 : 0;
    const ww = str.length * size * 0.66 + 50;
    return g(`translate(${x},${y}) rotate(${o.rot ?? -3}) scale(${o.k ?? 1})`, `<rect x="${-ww / 2}" y="${-size * 0.95}" width="${ww}" height="${size * 1.45}" rx="16" fill="${o.bg || INK}" ${o.bg ? ink(6) : ''}/>` + text(0, size * 0.18, str, size, o.col || '#fff', { font: FONT, weight: 900, stroke: 0 }));
  }
  function bindi(P, x, y, s) { return circ(x, y - 350 * s - 40 * s, 7 * s, C.red); }

  // ---------------- the cooker ----------------
  // base centre at (x,y). o.lift (px weight rise), o.jet (0..1 steam jet), o.cut (cutaway), o.n (steam particles),
  // o.t (time for animation), o.plug (0..1 safety plug popped), o.clog, o.badge
  function cooker(x, y, s, o = {}) {
    const t = o.t || 0;
    let q = '';
    // handles behind
    q += `<rect x="150" y="-250" width="290" height="34" rx="16" fill="${HANDLE}" ${ink(6)}/>`;
    q += `<rect x="150" y="-206" width="270" height="30" rx="14" fill="${HANDLE}" ${ink(6)}/>`;
    q += `<rect x="-250" y="-210" width="90" height="28" rx="12" fill="${HANDLE}" ${ink(6)}/>`;
    // body
    q += `<path d="M-180,-230 L180,-230 L176,-30 Q172,0 140,0 L-140,0 Q-172,0 -176,-30Z" fill="${AL}" ${ink(8)}/>`;
    q += `<path d="M-150,-210 L-150,-30" stroke="#eef1f5" stroke-width="18" stroke-linecap="round" opacity="0.8"/>`;
    if (o.cut) {
      q += `<path d="M-160,-215 L160,-215 L157,-34 Q154,-16 132,-16 L-132,-16 Q-154,-16 -157,-34Z" fill="#2b3550"/>`;
      const wl = -90;
      q += `<path d="M-157,${wl} ${Array.from({ length: 9 }, (_, i) => `Q${-140 + i * 36},${wl + (i % 2 ? 8 : -8) + Math.sin(t * 6 + i) * 4} ${-122 + i * 36},${wl}`).join(' ')} L157,-34 Q154,-16 132,-16 L-132,-16 Q-154,-16 -157,-34Z" fill="#4da3ff" opacity="0.9"/>`;
      for (let i = 0; i < (o.n || 0); i++) {
        const sp = 1.4 + hash(i) * 1.8;
        const px = -140 + ((hash(i + 1) * 280 + t * 90 * sp * (hash(i + 2) > 0.5 ? 1 : -1)) % 280 + 280) % 280;
        const span = wl - 10 - (-205);
        const ph = ((hash(i + 3) * 2 + t * sp) % 2 + 2) % 2;
        const py = -205 + Math.abs(ph - 1) * span;
        q += circ(px, py, 9, '#fff', `opacity="0.9"`);
        if (o.bonk && py < -195) q += `<path d="M${px - 14},-208 l-10,-10 M${px + 14},-208 l10,-10" stroke="#ffd23f" stroke-width="5"/>`;
      }
    }
    // lid
    q += `<path d="M-196,-226 Q0,-300 196,-226 L196,-240 Q0,-320 -196,-240Z" fill="${AL_D}" ${ink(7)}/>`;
    q += `<path d="M-188,-240 Q0,-318 188,-240" fill="${AL}" ${ink(7)}/>`;
    // safety plug
    const pl = o.plug || 0;
    q += g(`translate(-90,${-268 - pl * 120}) rotate(${pl * 300})`, `<rect x="-18" y="-10" width="36" height="20" rx="6" fill="#e0b84a" ${ink(5)}/>`);
    if (pl > 0.05) q += steam(-90, -268, 1, t, -1, 0.8);
    // vent + weight
    q += `<rect x="-12" y="-322" width="24" height="40" fill="${AL_D}" ${ink(5)}/>`;
    const lf = o.lift || 0;
    q += g(`translate(0,${-lf})`, `<rect x="-36" y="-376" width="72" height="60" rx="16" fill="#3a3a44" ${ink(6)}/><rect x="-16" y="-400" width="32" height="30" rx="10" fill="#3a3a44" ${ink(5)}/><path d="M-24,-360 L-24,-334" stroke="#666" stroke-width="6" stroke-linecap="round"/>`);
    if (o.clog) q += `<ellipse cx="0" cy="-322" rx="40" ry="16" fill="#d6a23a" ${ink(4)}/>` + circ(-14, -326, 6, '#f2cf72') + circ(16, -320, 5, '#f2cf72');
    if (o.jet > 0) q += steam(0, -322 - lf * 0.4, o.jet, t, 1, 1.2);
    return g(`translate(${x},${y}) scale(${s}) rotate(${o.shake ? Math.sin(t * 60) * o.shake : 0})`, q);
  }
  function steam(x, y, k, t, dir = 1, sc = 1) { // a jet of puffs going up and slightly sideways
    let q = '';
    for (let i = 0; i < 9; i++) {
      const ph = (t * 2.4 + i / 9) % 1;
      const r = (16 + ph * 60) * sc * k;
      q += circ(x + dir * ph * 120 * sc + Math.sin(ph * 9 + i) * 10, y - ph * 380 * sc, r, '#fff', `opacity="${(1 - ph) * 0.85 * k}"`);
    }
    return q;
  }
  function flame(x, y, s, t, big = 0) {
    let q = '';
    for (let i = -3; i <= 3; i++) {
      const h = (40 + big * 50) * (1 + 0.25 * Math.sin(t * 20 + i * 2));
      q += `<path d="M${i * 34 - 14},0 Q${i * 34},${-h * 1.2} ${i * 34 + 14},0Z" fill="#4da3ff" opacity="0.9"/><path d="M${i * 34 - 7},0 Q${i * 34},${-h * 0.6} ${i * 34 + 7},0Z" fill="#c8e6ff"/>`;
    }
    return g(`translate(${x},${y}) scale(${s})`, q);
  }
  function stove(x, y, s, t, big = 0) {
    let q = flame(0, -60, 1, t, big);
    q += `<rect x="-260" y="-60" width="520" height="70" rx="14" fill="#1d1b22" ${ink(6)}/>`;
    q += `<path d="M-200,-60 L-150,-90 M200,-60 L150,-90 M-60,-60 L-40,-92 M60,-60 L40,-92" stroke="#444" stroke-width="12" stroke-linecap="round"/>`;
    for (const k of [-180, 180]) q += circ(k, -24, 18, '#c0c4cc', ink(4));
    return g(`translate(${x},${y}) scale(${s})`, q);
  }
  function thermo(x, y, h, val, o = {}) { // bulb at bottom (x,y), scale 0..130 C over height h
    const f = clamp(val / 130, 0, 1);
    let q = `<rect x="${x - 34}" y="${y - h - 20}" width="68" height="${h + 40}" rx="34" fill="#fff" ${ink(7)}/>`;
    q += `<rect x="${x - 16}" y="${y - f * h}" width="32" height="${f * h + 10}" fill="${C.red}"/>` + circ(x, y + 30, 54, C.red, ink(7));
    for (const v of [0, 50, 100, 120]) { const yy = y - (v / 130) * h; q += `<line x1="${x + 34}" y1="${yy}" x2="${x + 58}" y2="${yy}" ${ink(5)}/>`; if (v >= 100) q += text(x + 70, yy + 14, String(v), 40, INK, { anchor: 'start', font: FONT, weight: 900, stroke: 0 }); }
    q += text(x, y + 150, `${Math.round(val)}°C`, 76, o.col || '#ffd23f');
    if (o.label) q += text(x, y + 216, o.label, 38, '#fff', { font: FONT, weight: 900, stroke: 9 });
    return q;
  }
  function kitchenBg() {
    let s = R(0, 0, W, H, '#cfeceb');
    for (let x = 0; x < W; x += 90) s += `<line x1="${x}" y1="0" x2="${x}" y2="1100" stroke="#b5dcdb" stroke-width="5"/>`;
    for (let y = 0; y < 1100; y += 90) s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#b5dcdb" stroke-width="5"/>`;
    s += `<rect x="80" y="470" width="300" height="280" rx="12" fill="#bfe6ff" ${ink(8)}/><line x1="230" y1="470" x2="230" y2="750" ${ink(7)}/><line x1="80" y1="610" x2="380" y2="610" ${ink(7)}/>`;
    s += `<rect x="0" y="1080" width="${W}" height="840" fill="#5d6470" ${ink(8)}/><rect x="0" y="1080" width="${W}" height="40" fill="#79808c"/>`;
    for (let i = 0; i < 40; i++) s += circ(hash(i) * W, 1140 + hash(i + 7) * 760, 3 + hash(i + 3) * 4, '#4a505b');
    return s;
  }

  // ---------------- hook: mummy's three whistles ----------------
  function kitchen(st, shot) {
    const se = cue(shot, 'seeti', 3), ky = cue(shot, 'kya', 5.8);
    let s = kitchenBg();
    s += stove(700, 1090, 0.9, st);
    const wh = st > se - 0.2 && st < se + 2.2;
    const lift = wh ? 14 + Math.abs(Math.sin(st * 30)) * 10 : 0;
    s += cooker(700, 1020, 0.85, { t: st, lift, jet: wh ? 1 : 0, shake: wh ? 1.5 : 0 });
    const P = person(Object.assign({}, MUMMY, { x: 250, y: 1440, s: 1.05, expr: st < se ? 'determined' : 'happy', armR: [95, 80], armL: [25, 10] }));
    s += P.svg + bindi(P, 250, 1440, 1.05);
    // three fingers / the whistle count
    if (st < se) s += g(`translate(420,620) scale(${pop(st, 0.2)})`, `<rect x="-120" y="-70" width="240" height="140" rx="30" fill="#fff" ${ink(6)}/><path d="M-60,70 L-90,120 L-20,70Z" fill="#fff" ${ink(6)}/>` + text(0, 34, '3 SEETI', 54, '#e84a8a', { stroke: 0 }));
    if (wh) s += text(820, 640, 'SEETI!', 90 * pop(st, se - 0.2), '#fff', { extra: `transform="rotate(8 820 640)"` });
    if (st > se) s += [0, 1, 2].map((i) => text(110 + i * 90, 870, i === 0 ? '✓' : '○', 70, i === 0 ? GREEN : '#fff', { font: FONT, weight: 900 })).join('');
    if (st > ky) for (let i = 0; i < 3; i++) s += text(560 + i * 110, 560 - i * 40, '?', 110 * pop(st, ky + i * 0.1), '#ffd23f', { extra: `transform="rotate(${-10 + i * 10} ${560 + i * 110} ${560 - i * 40})"` });
    return s;
  }

  // ---------------- open pot: stuck at 100 ----------------
  function pot(st, shot) {
    const ag = cue(shot, 'aag', 3.4), wa = cue(shot, 'wahi', 4.6), bh = cue(shot, 'bhaap', 6.8);
    let s = R(0, 0, W, H, '#ffe29a') + halftone('h1', '#ffcd57', 0.5, 30);
    const big = easeOut(clamp((st - ag) / 0.4, 0, 1));
    s += stove(540, 1260, 1.2, st, big);
    // the patila, cut open so we see the water
    s += `<path d="M260,800 L820,800 L800,1150 Q795,1185 760,1185 L320,1185 Q285,1185 280,1150Z" fill="#d7dbe2" ${ink(9)}/>`;
    s += `<path d="M285,900 L795,900 L785,1140 Q780,1165 755,1165 L325,1165 Q300,1165 295,1140Z" fill="#4da3ff"/>`;
    for (let i = 0; i < 18; i++) {
      const ph = (st * (1.2 + big) + hash(i)) % 1;
      s += circ(310 + hash(i + 2) * 460, 1150 - ph * 250, 8 + hash(i + 5) * 10, '#fff', `opacity="${0.8 * (1 - ph * 0.6)}"`);
    }
    s += `<rect x="240" y="780" width="600" height="34" rx="14" fill="#eef1f5" ${ink(8)}/>`;
    // steam out of the open top
    const sk = 0.6 + (st > bh ? 0.6 : 0) + big * 0.3;
    for (let i = 0; i < 5; i++) s += steam(340 + i * 100, 780, Math.min(1, sk), st + i * 0.21, i % 2 ? 1 : -1, 0.9);
    if (st > bh) s += tag(540, 520, 'BHAAP ↑', 56, { k: pop(st, bh), bg: '#fff', col: INK });
    // the stuck thermometer reading
    const shake = st > wa ? Math.sin(st * 50) * 8 * Math.exp(-(st - wa) * 3) : 0;
    s += g(`translate(${880 + shake},620) rotate(6)`, `<rect x="-150" y="-80" width="300" height="140" rx="24" fill="${INK}"/>` + text(0, 34, '100°C', 92, '#ffd23f', { stroke: 0 }));
    if (st > wa) s += tag(880, 760, st > wa + 0.4 ? 'ATKA HUA! 🔒' : '', 40, { k: pop(st, wa + 0.2), bg: C.red, col: '#fff' });
    if (st > ag && st < wa + 0.5) s += text(170, 1150, 'AAG ↑↑', 70 * pop(st, ag), '#ff7a2f');
    return s;
  }

  // ---------------- sealed cooker: pressure builds ----------------
  function sealed(st, shot) {
    const bd = cue(shot, 'band', 0.3), nh = cue(shot, 'nahi', 3), pr = cue(shot, 'pressure', 4.6);
    let s = R(0, 0, W, H, '#20283d');
    for (let i = 0; i < 30; i++) s += circ(hash(i) * W, hash(i + 4) * 1300, 2 + hash(i + 2) * 3, '#3a4668');
    const n = Math.floor(6 + clamp(st / 5, 0, 1) * 34);
    s += stove(540, 1300, 1.5, st, 0.5);
    s += cooker(540, 1230, 1.55, { t: st, cut: true, n, bonk: st > nh });
    if (st > bd) s += g(`translate(540,640) scale(${pop(st, bd)})`, `<rect x="-60" y="-30" width="120" height="96" rx="16" fill="#ffd23f" ${ink(7)}/><path d="M-36,-30 L-36,-62 Q0,-108 36,-62 L36,-30" fill="none" ${ink(14)}/><path d="M-36,-30 L-36,-62 Q0,-108 36,-62 L36,-30" fill="none" stroke="#ffd23f" stroke-width="6"/>` + circ(0, 14, 12, INK) + text(0, 130, 'BAND', 52, '#fff'));
    // gauge
    const pk = clamp((st - pr + 0.3) / 1.4, 0, 1);
    s += g('translate(860,600)', circ(0, 0, 120, '#fff', ink(8)) + `<path d="M-84,60 A104,104 0 1 1 84,60" fill="none" stroke="${GREEN}" stroke-width="16"/><path d="M60,-84 A104,104 0 0 1 84,60" fill="none" stroke="${C.red}" stroke-width="16"/>` +
      `<line x1="0" y1="0" x2="${Math.cos(rad(lerp(140, 380, ease(pk)))) * 86}" y2="${Math.sin(rad(lerp(140, 380, ease(pk)))) * 86}" ${ink(10)}/>` + circ(0, 0, 14, INK) + text(0, 180, 'PRESSURE', 44, '#fff', { font: FONT, weight: 900, stroke: 9 }));
    if (st > nh && st < pr + 0.3) s += text(260, 640, 'BONK!', 64 * pop(st, nh), '#ffd23f', { extra: 'transform="rotate(-10 260 640)"' });
    return s;
  }

  // ---------------- 100 vs 120 ----------------
  function thermoScene(st, shot) {
    const nh = cue(shot, 'nahi', 1.4), t1 = cue(shot, 't120', 2.4), jl = cue(shot, 'jaldi', 6.7);
    let s = rays(540, 900, '#ff9f43', '#ffab5c', st * 8, 20);
    const v = lerp(100, 120, ease(clamp((st - nh) / Math.max(0.3, t1 - nh), 0, 1)));
    const fade = st > jl - 0.2 ? 0.25 : 1;
    s += `<g opacity="${fade}">${thermo(300, 1080, 560, 100, { label: 'KHULA BARTAN', col: '#fff' })}${thermo(780, 1080, 560, v, { label: 'COOKER', col: v > 119 ? '#ffd23f' : '#fff' })}</g>`;
    if (st > t1 && st < jl) s += burst(780, 1080 - (120 / 130) * 560, 90 * pop(st, t1), 10, '#ffd23f', st * 120) + text(780, 1080 - (120 / 130) * 560 + 22, '+20', 56, C.red, { stroke: 6 });
    if (st > jl - 0.2) {
      const k = pop(st, jl - 0.2);
      let b = `<path d="M-200,0 Q0,180 200,0Z" fill="#fff" ${ink(9)}/><ellipse cx="0" cy="0" rx="200" ry="40" fill="#f2b632" ${ink(8)}/>`;
      for (let i = 0; i < 9; i++) b += circ(-150 + hash(i) * 300, -6 + hash(i + 2) * 14, 10, '#ffd36b');
      b += steam(-60, -20, 0.6, st, -1, 0.6) + steam(60, -20, 0.6, st + 0.4, 1, 0.6);
      s += g(`translate(540,860) scale(${k})`, b) + tag(540, 640, 'KAI GUNA JALDI ⚡', 58, { k, bg: '#ffd23f', col: INK });
    }
    return s;
  }

  // ---------------- the whistle is a weight ----------------
  function whistle(st, shot) {
    const wz = cue(shot, 'wazan', 2.2), ut = cue(shot, 'utha', 4.7), se = cue(shot, 'seeti', 6.6);
    let s = R(0, 0, W, H, '#2a3350');
    const rise = st > ut ? clamp((st - ut) / Math.max(0.3, se - ut), 0, 1) : 0;
    const lift = rise * 30 + (st > se ? 10 + Math.abs(Math.sin(st * 28)) * 14 : 0);
    s += cam(2.4, 540, 900, cooker(540, 1240, 1, { t: st, lift, jet: st > se ? 1 : rise * 0.25 }) + R(-200, 1240, 1500, 800, '#2a3350'));
    // vent cutaway: steam arrows pushing up
    if (st > ut - 0.2) for (let i = 0; i < 3; i++) {
      const y = 1180 - ((st * 300 + i * 70) % 210);
      s += `<path d="M${520 + (i - 1) * 16},${y} l20,-30 l20,30" stroke="#ffd23f" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`;
    }
    if (st > wz) s += g(`translate(820,${520 - lift * 2.4}) scale(${pop(st, wz)})`, tag(0, 0, 'WAZAN', 60, { bg: '#ffd23f', col: INK }) + `<path d="M-120,30 Q-190,70 -200,120" stroke="#ffd23f" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M-218,98 L-200,126 L-176,104" stroke="#ffd23f" stroke-width="10" fill="none" stroke-linecap="round"/>`);
    if (st > ut && st < se + 0.1) s += tag(280, 1180, 'PRESSURE ↑', 46, { k: pop(st, ut), bg: C.red });
    if (st > se) s += text(540, 520, 'SEETI!', 150 * pop(st, se, 0.2), '#fff', { extra: `transform="rotate(-6 540 520)"` });
    return s;
  }

  // ---------------- safety valve + safety plug ----------------
  function safety(st, shot) {
    const vl = cue(shot, 'valve', 1.9), at = cue(shot, 'atak', 3.7), pl = cue(shot, 'plug', 5.9);
    let s = R(0, 0, W, H, '#ffefd0') + halftone('h3', '#f5d59a', 0.6, 30);
    const clog = st > at;
    const pp = clamp((st - pl) / 0.35, 0, 1);
    s += cam(1.75, 520, 1000, cooker(540, 1260, 1, { t: st, clog, plug: easeOut(pp) * 0.7, jet: clog ? 0 : 0.3 }) + stove(540, 1330, 1, st, 0.2));
    if (st > vl && !clog) s += tag(560, 470, 'SAFETY VALVE ✓', 52, { k: pop(st, vl), bg: GREEN });
    if (clog) {
      s += g(`translate(540,600) scale(${pop(st, at, 0.2)})`, `<path d="M-110,-110 L110,110 M110,-110 L-110,110" stroke="${C.red}" stroke-width="34" stroke-linecap="round"/>`);
      s += tag(540, 420, 'ATAK GAYI', 54, { k: pop(st, at), bg: C.red });
    }
    if (st > pl) s += tag(330, 900, 'SAFETY PLUG', 48, { k: pop(st, pl), bg: '#ffd23f', col: INK, rot: 4 }) + text(560, 760, 'POP!', 80 * pop(st, pl), '#e0b84a');
    return s;
  }

  // ---------------- mountains: water boils at 88 ----------------
  function mountain(st, shot) {
    const km = cue(shot, 'kam', 2.7), t8 = cue(shot, 't88', 4.4), dl = cue(shot, 'dal', 7.3), ck = cue(shot, 'cooker', 9.6);
    let s = R(0, 0, W, H, '#a8dcff');
    const mt = (x, w, h, col) => `<path d="M${x - w},1150 L${x},${1150 - h} L${x + w},1150Z" fill="${col}" ${ink(8)}/><path d="M${x - w * 0.28},${1150 - h * 0.72} L${x},${1150 - h} L${x + w * 0.28},${1150 - h * 0.72} L${x + w * 0.1},${1150 - h * 0.64} L${x - w * 0.08},${1150 - h * 0.74}Z" fill="#fff" ${ink(5)}/>`;
    s += mt(200, 380, 640, '#8d8fb5') + mt(820, 420, 720, '#7a7da6') + mt(520, 300, 480, '#a3a6c8');
    s += R(0, 1150, W, 770, '#e8eef5', ink(8));
    for (let i = 0; i < 40; i++) { const y = ((hash(i) * 1900 + st * 300 * (0.5 + hash(i + 1))) % 1900); s += circ((hash(i + 3) * W + Math.sin(st + i) * 20), y, 4 + hash(i + 2) * 5, '#fff', 'opacity="0.9"'); }
    s += g('translate(880,1000) rotate(3)', `<rect x="-8" y="0" width="16" height="160" fill="#6b4f3a" ${ink(4)}/><rect x="-140" y="-70" width="280" height="110" rx="12" fill="#2f6b3a" ${ink(6)}/>` + text(0, -18, 'LEH', 44, '#fff', { stroke: 0 }) + text(0, 26, '3,500 M', 34, '#fff', { font: FONT, weight: 900, stroke: 0 }));
    if (st > km) s += tag(340, 560, 'HAWA KA PRESSURE ↓', 44, { k: pop(st, km), bg: '#fff', col: INK });
    const cooked = st > ck;
    if (!cooked) {
      s += stove(470, 1250, 0.8, st, 0.3);
      s += `<path d="M260,1000 L680,1000 L665,1190 L275,1190Z" fill="#d7dbe2" ${ink(8)}/><rect x="245" y="985" width="450" height="30" rx="12" fill="#eef1f5" ${ink(7)}/>`;
      s += steam(380, 985, 0.6, st, -1, 0.7) + steam(560, 985, 0.6, st + 0.5, 1, 0.7);
      if (st > dl) for (let i = 0; i < 4; i++) {
        const x = 340 + i * 85, y = 920 - Math.abs(Math.sin(st * 4 + i)) * 20;
        s += g(`translate(${x},${y}) scale(${pop(st, dl + i * 0.08)})`, `<ellipse cx="0" cy="0" rx="34" ry="26" fill="#f2b632" ${ink(5)}/>` + circ(-10, -4, 4, INK) + circ(10, -4, 4, INK) + `<path d="M-9,12 Q0,4 9,12" ${ink(4)} fill="none"/>`);
      }
      if (st > dl) s += tag(470, 820, 'KACHCHI DAL 😩', 44, { k: pop(st, dl + 0.3), bg: C.red });
    } else {
      s += stove(470, 1250, 0.8, st, 0.3) + cooker(470, 1190, 0.75, { t: st, jet: 0.5 });
      s += burst(470, 800, 80 * pop(st, ck), 10, '#ffd23f', st * 90) + tag(470, 720, 'COOKER ✓', 56, { k: pop(st, ck), bg: GREEN });
    }
    if (st > t8) s += g(`translate(820,${cooked ? 640 : 660})`, `<rect x="-140" y="-74" width="280" height="130" rx="22" fill="${INK}"/>` + text(0, 30, '88°C', 90, '#7fd0ff', { stroke: 0 }), `opacity="${pop(st, t8)}"`);
    return s;
  }

  // ---------------- end: lost count ----------------
  function kitchenEnd(st, shot) {
    const ak = cue(shot, 'ask', 0.1), pt = cue(shot, 'pata', 1.6), en = cue(shot, 'end', 4.2);
    let s = kitchenBg();
    const mad = st > en - 0.3;
    s += stove(760, 1090, 0.8, st);
    s += cooker(760, 1030, 0.75, { t: st, lift: mad ? 20 + Math.abs(Math.sin(st * 26)) * 16 : 6, jet: mad ? 1 : 0.4, shake: mad ? 3 : 0.6 });
    const M = person(Object.assign({}, MUMMY, { x: 250, y: 1460, s: 1.0, expr: mad ? 'shock' : st > pt ? 'worried' : 'determined', armL: [40, 140], armR: [40, 140] }));
    s += M.svg + bindi(M, 250, 1460, 1.0);
    const Hh = person(Object.assign({}, HERO, { x: 580, y: 1500, s: 0.9, expr: mad ? 'worried' : 'happy', armL: [12, -55], armR: [12, -55] }));
    s += Hh.svg;
    // book in his hands
    s += g('translate(580,1395) rotate(-4)', `<rect x="-110" y="-70" width="220" height="140" rx="10" fill="#4d7cfe" ${ink(7)}/><line x1="0" y1="-70" x2="0" y2="70" ${ink(5)}/>` + text(0, 14, 'PHYSICS', 38, '#fff', { stroke: 6 }));
    if (st > ak && st < pt + 0.3) s += g(`translate(320,700) scale(${pop(st, ak)})`, `<rect x="-200" y="-70" width="400" height="140" rx="30" fill="#fff" ${ink(6)}/><path d="M-80,70 L-110,130 L-20,70Z" fill="#fff" ${ink(6)}/>` + text(0, 22, 'KITNI SEETI?', 56, '#e84a8a', { stroke: 0 }));
    if (mad) {
      for (let i = 0; i < 4; i++) {
        const k = pop(st, en - 0.3 + i * 0.35);
        s += text(640 + (i % 2 ? 200 : 0), 520 + i * 90, 'SEETI!', 70 * k, '#fff', { extra: `transform="rotate(${i % 2 ? 10 : -8} ${640 + (i % 2 ? 200 : 0)} ${520 + i * 90})"` });
      }
      s += text(320, 760, '4? 5? 9?', 64 * pop(st, en), C.red);
    }
    return s;
  }

  root.Scenes = { kitchen, pot, sealed, thermo: thermoScene, whistle, safety, mountain, kitchenEnd };
})(window);
