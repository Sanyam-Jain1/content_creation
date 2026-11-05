// ANDAR KI BAAT 01: "UPI se paisa 2 second mein kaise pahunchta hai?" scene art.
(function (root) {
  'use strict';
  const K = root.Kit;
  const { W, H, INK, C, clamp, lerp, ease, easeOut, easeIn, back, hash, p, rad, R, ink, g, shade, limb, circ, person, burst, vignette, halftone, rays, text, mini, phone } = K;
  const cue = (shot, k, d = 99) => (shot.cues && shot.cues[k] != null ? shot.cues[k] : d);
  const cam = (z, cx, cy, inner) => `<g transform="translate(540,960) scale(${z}) translate(${-cx},${-cy})">${inner}</g>`;
  const pop = (st, at, d = 0.28) => back(clamp((st - at) / d, 0, 1));
  const FONT = "'Montserrat',sans-serif";
  const GREEN = '#2fbf71', BLUE = '#4d7cfe', TEAL = '#2ec4b6';

  const HERO = { skin: C.skin[1], shirt: TEAL, pants: '#2f3b55', hair: 'short', hairColor: '#1d1b22' };
  const CHAI = { skin: C.skin[2], shirt: '#fffaf0', pants: '#6b4f3a', hair: 'short', hairColor: '#b5b0a8', sleeve: 'short' };

  // ---------------- props ----------------
  function mustache(x, y, s) {
    return `<path d="M${x - 44 * s},${y + 6 * s} C${x - 30 * s},${y - 14 * s} ${x - 8 * s},${y - 10 * s} ${x},${y} C${x + 8 * s},${y - 10 * s} ${x + 30 * s},${y - 14 * s} ${x + 44 * s},${y + 6 * s} C${x + 26 * s},${y + 2 * s} ${x + 10 * s},${y + 8 * s} ${x},${y + 6 * s} C${x - 10 * s},${y + 8 * s} ${x - 26 * s},${y + 2 * s} ${x - 44 * s},${y + 6 * s}Z" fill="#8c8780" ${ink(3 * s)}/>`;
  }
  function qr(x, y, size, seed = 3) {
    const n = 17, c = size / n;
    let s = R(x - 10, y - 10, size + 20, size + 20, '#fff', ink(5));
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const fin = (i < 5 && j < 5) || (i > n - 6 && j < 5) || (i < 5 && j > n - 6);
      if (!fin && hash(seed + i * 31 + j * 7) > 0.52) s += R(x + i * c, y + j * c, c + 0.5, c + 0.5, INK);
    }
    for (const [i, j] of [[0, 0], [n - 5, 0], [0, n - 5]]) s += R(x + i * c, y + j * c, 5 * c, 5 * c, INK) + R(x + (i + 1) * c, y + (j + 1) * c, 3 * c, 3 * c, '#fff') + R(x + (i + 1.8) * c, y + (j + 1.8) * c, 1.4 * c, 1.4 * c, INK);
    return s;
  }
  function standee(x, y, s) { // QR standee on the counter, base at (x,y)
    let q = `<path d="M-90,0 L-70,-300 L70,-300 L90,0Z" fill="#ffd23f" ${ink(7)}/>`;
    q += text(0, -262, 'SCAN & PAY', 26, INK, { font: FONT, weight: 900, stroke: 0 });
    q += qr(-58, -238, 116, 11);
    q += text(0, -40, 'UPI', 40, INK, { stroke: 0 });
    return g(`translate(${x},${y}) scale(${s})`, q);
  }
  function soundbox(x, y, s, glow = 0) { // base at (x,y)
    let q = '';
    if (glow > 0) for (let i = 0; i < 3; i++) q += `<circle cx="0" cy="-80" r="${80 + i * 40 + glow * 30}" fill="none" stroke="#ffd23f" stroke-width="${10 - i * 3}" opacity="${glow * (0.8 - i * 0.22)}"/>`;
    q += `<rect x="-70" y="-160" width="140" height="160" rx="30" fill="#3a56d4" ${ink(7)}/>`;
    q += `<circle cx="0" cy="-92" r="42" fill="#2a3d99" ${ink(5)}/>`;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (i * i + j * j <= 5) q += circ(i * 14, -92 + j * 14, 4, '#1a2560');
    q += `<rect x="-40" y="-36" width="80" height="18" rx="6" fill="${glow > 0.1 ? '#7dffb0' : '#1a2560'}"/>`;
    return g(`translate(${x},${y}) scale(${s})`, q);
  }
  function glass(x, y, s, o = {}) { // cutting-chai glass, base at (x,y)
    let q = `<path d="M-30,-90 L30,-90 L24,0 L-24,0Z" fill="${o.cold ? '#cfe9ff' : '#fff'}" opacity="0.9" ${ink(5)}/>`;
    q += `<path d="M-27,-66 L27,-66 L24,-4 L-24,-4Z" fill="${o.cold ? '#b88a5e' : '#c77d3a'}"/>`;
    for (let i = -1; i <= 1; i++) q += `<line x1="${i * 16}" y1="-84" x2="${i * 14}" y2="-6" stroke="#fff" stroke-width="3" opacity="0.5"/>`;
    if (o.steam != null) for (let i = 0; i < 3; i++) {
      const ph = o.steam * 1.4 + i * 0.8, yy = -110 - ((ph * 40) % 80);
      q += `<path d="M${-12 + i * 12},${yy + 30} q-12,-18 0,-34 q12,-16 0,-32" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity="${0.7 * (1 - ((ph * 40) % 80) / 80)}"/>`;
    }
    if (o.cold) q += `<path d="M0,-150 l0,40 M-17,-140 l34,20 M17,-140 l-34,20" stroke="#bfe6ff" stroke-width="7" stroke-linecap="round"/>`;
    return g(`translate(${x},${y}) scale(${s})`, q);
  }
  function kettle(x, y, s) {
    let q = `<ellipse cx="0" cy="-70" rx="90" ry="76" fill="#c0c4cc" ${ink(7)}/>`;
    q += `<path d="M80,-90 C140,-110 150,-140 170,-150 L176,-136 C160,-120 150,-80 86,-50Z" fill="#c0c4cc" ${ink(6)}/>`;
    q += `<path d="M-60,-130 C-60,-200 60,-200 60,-130" fill="none" ${ink(10)}/>`;
    q += `<ellipse cx="0" cy="-140" rx="40" ry="12" fill="#9aa0aa" ${ink(5)}/>`;
    q += `<rect x="-110" y="-8" width="220" height="16" rx="8" fill="#555" ${ink(5)}/>`;
    return g(`translate(${x},${y}) scale(${s})`, q);
  }
  function bank(x, y, s, label, col = '#e9e3d6', hl = 1) { // base at (x,y)
    let q = `<path d="M-150,-200 L0,-280 L150,-200Z" fill="${shade(col, -0.1)}" ${ink(7)}/>`;
    q += R(-140, -200, 280, 24, shade(col, -0.05), ink(6));
    for (let i = 0; i < 4; i++) q += R(-118 + i * 70, -176, 32, 150, col, ink(5));
    q += R(-160, -26, 320, 26, shade(col, -0.15), ink(6));
    q += text(0, -222, '₹', 42, INK, { font: FONT, weight: 900, stroke: 0 });
    q += text(0, 50, label, 34, '#fff', { font: FONT, weight: 900, stroke: 8 });
    return g(`translate(${x},${y}) scale(${s})`, q, `opacity="${hl}"`);
  }
  function note(x, y, s, rot = 0, o = {}) { // ten-rupee note with an optional face
    let q = `<rect x="-110" y="-55" width="220" height="110" rx="10" fill="#e8a46a" ${ink(6)}/>`;
    q += `<rect x="-96" y="-42" width="192" height="84" rx="6" fill="none" stroke="#b8743c" stroke-width="4"/>`;
    q += text(-60, 18, '10', 46, '#7a3e12', { stroke: 0 }) + circ(40, 0, 26, '#f3c79a', `stroke="#b8743c" stroke-width="4"`);
    if (o.wings) {
      const f = Math.sin(o.wings * 22) * 30;
      for (const sd of [-1, 1]) q += `<path d="M${sd * 30},-50 C${sd * 60},${-130 - f} ${sd * 150},${-120 - f} ${sd * 170},${-60 - f * 0.5} C${sd * 120},-70 ${sd * 80},-50 ${sd * 60},-40Z" fill="#fff" ${ink(5)}/>`;
    }
    if (o.face) {
      if (o.sleep) q += `<path d="M24,-6 q8,6 16,0 M48,-6 q8,6 16,0" ${ink(4)} fill="none"/><path d="M36,14 q8,4 16,0" ${ink(4)} fill="none"/>`;
      else q += circ(30, -6, 5, INK) + circ(52, -6, 5, INK) + `<path d="M32,12 q10,8 20,0" ${ink(4)} fill="none"/>`;
    }
    return g(`translate(${x},${y}) rotate(${rot}) scale(${s})`, q);
  }
  function upiPhone(x, y, s, rot, screen) {
    return g(`translate(${x},${y}) rotate(${rot}) scale(${s})`, phone(260, 480, { screen: screen.bg || '#22252e' }) + (screen.inner || ''));
  }
  function stopwatch(x, y, s, label) {
    let q = `<rect x="-16" y="-128" width="32" height="26" rx="6" fill="${C.red}" ${ink(5)}/>`;
    q += circ(0, 0, 104, '#fff', ink(8)) + circ(0, 0, 84, '#fffaf0', `stroke="#ddd" stroke-width="3"`);
    q += `<line x1="0" y1="0" x2="50" y2="-50" ${ink(9)}/>` + circ(0, 0, 10, INK);
    q += text(0, 160, label, 70, '#ffd23f');
    return g(`translate(${x},${y}) scale(${s})`, q);
  }
  function bubble(x, y, w, h, str, size, o = {}) { // speech bubble, tail toward (o.tx, o.ty)
    let q = `<path d="M${x - w / 2 + 30},${y + h / 2} L${o.tx ?? x},${o.ty ?? y + h / 2 + 60} L${x - w / 2 + 110},${y + h / 2}Z" fill="#fff" ${ink(6)}/>`;
    q += `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="30" fill="#fff" ${ink(6)}/>`;
    q += `<rect x="${x - w / 2 + 34}" y="${y + h / 2 - 8}" width="72" height="14" fill="#fff"/>`;
    q += text(x, y + size * 0.36, str, size, o.col || INK, { font: o.font || FONT, weight: 900, stroke: 0 });
    return q;
  }
  function npciCop(x, y, s, o = {}) { // the UPI switch as a cartoon traffic cop
    let q = '';
    const wave = o.wave ? Math.sin(o.wave * 9) * 25 : 0;
    q += limb([[-110, -40], [-190, -90 - wave], [-230, -170 - wave]], 30, '#ffd23f') + circ(-230, -170 - wave, 24, '#fff', ink(6));
    q += limb([[110, -40], [190, -20], [250, -40]], 30, '#ffd23f') + circ(250, -40, 24, '#fff', ink(6));
    q += `<rect x="-130" y="-170" width="260" height="250" rx="60" fill="#ffd23f" ${ink(8)}/>`;
    q += `<rect x="-90" y="20" width="180" height="46" rx="14" fill="${INK}"/>` + text(0, 56, 'NPCI', 38, '#ffd23f', { stroke: 0 });
    q += K.face(0, -60, 70, { expr: o.expr || 'happy', look: o.look || [0, 0] });
    if (o.cap > 0) {
      const dy = lerp(-260, 0, easeOut(o.cap));
      q += g(`translate(0,${dy})`, `<path d="M-110,-150 C-110,-230 110,-230 110,-150Z" fill="#fff" ${ink(7)}/><rect x="-118" y="-160" width="236" height="26" rx="10" fill="${INK}"/><path d="M-40,-140 L60,-140 L90,-120 L-70,-120Z" fill="${INK}"/>` + circ(0, -190, 16, '#ffd23f', ink(4)));
    }
    if (o.whistle) q += `<rect x="-14" y="-6" width="40" height="18" rx="8" fill="#c0c4cc" ${ink(4)}/>` + [0, 1, 2].map((i) => `<path d="M${40 + i * 18},${-14 - i * 10} l${18},-10" ${ink(5)}/>`).join('');
    return g(`translate(${x},${y}) scale(${s})`, q);
  }
  function packet(x, y, s, label, col = '#fff') {
    let q = `<rect x="-60" y="-40" width="120" height="80" rx="10" fill="${col}" ${ink(6)}/><path d="M-60,-40 L0,8 L60,-40" fill="none" ${ink(6)}/>`;
    if (label) q += text(0, 82, label, 34, '#ffd23f', { font: FONT, weight: 900 });
    return g(`translate(${x},${y}) scale(${s})`, q);
  }
  function check(x, y, k, label) {
    if (k <= 0) return '';
    return g(`translate(${x},${y}) scale(${back(k)}) rotate(-4)`, `<rect x="-150" y="-40" width="300" height="80" rx="20" fill="${GREEN}" ${ink(6)}/>` + text(0, 16, label, 42, '#fff', { font: FONT, weight: 900, stroke: 0 }));
  }

  // ---------------- the chai stall (hook + end) ----------------
  function stallBase(st, o) {
    let s = R(0, 0, W, H, '#ff9f43');
    s += `<defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb35c"/><stop offset="1" stop-color="#f07c2a"/></linearGradient></defs>` + R(0, 0, W, 1100, 'url(#wall)');
    // awning
    for (let i = 0; i < 9; i++) s += `<path d="M${i * 130 - 20},440 L${i * 130 + 110},440 L${i * 130 + 110},500 Q${i * 130 + 45},540 ${i * 130 - 20},500Z" fill="${i % 2 ? '#fffaf0' : C.red}" ${ink(6)}/>`;
    s += text(540, 590, 'CHAI', 80, '#fffaf0', { extra: 'opacity="0.35"' });
    // chaiwala
    const P = person(Object.assign({}, CHAI, { x: 700, y: 1080, s: 0.95, expr: o.expr || 'happy', armL: o.armL || [20, 10], armR: o.armR || [20, 10], blink: o.blink }));
    s += P.svg;
    const hx = 700, hy = 1080 - 350 * 0.95;
    s += mustache(hx, hy + 22 * 0.95, 0.95);
    s += o.afterChai ? o.afterChai(P) : '';
    // counter
    s += R(-20, 1020, 1120, 900, '#8a5a3c', ink(8)) + R(-20, 1020, 1120, 40, '#a8714b', ink(8));
    for (let i = 0; i < 6; i++) s += `<line x1="${i * 200 + 60}" y1="1080" x2="${i * 200 + 60}" y2="1920" stroke="#6f472f" stroke-width="6"/>`;
    s += kettle(230, 1020, 1);
    s += glass(400, 1020, 0.9, { steam: st });
    s += standee(900, 1020, 0.9);
    s += soundbox(560, 1020, 0.8, o.glow || 0);
    return s;
  }

  function stall(st, shot) {
    const sc = cue(shot, 'scan', 1.2), tg = cue(shot, 'ting', 2.3), bx = cue(shot, 'box', 3.2), dd = cue(shot, 'do', 4.6), ks = cue(shot, 'kaise', 7.2);
    const glow = st > tg ? Math.max(0, 1 - (st - tg) / 1.4) + (st > bx && st < bx + 1.6 ? 0.5 : 0) : 0;
    let s = stallBase(st, { glow: Math.min(1, glow), expr: st > tg ? 'happy' : 'neutral' });
    // your hand + phone, slides in from the bottom left
    const k = easeOut(clamp(st / 0.6, 0, 1));
    const px = lerp(-200, 300, k), py = lerp(1500, 930, k);
    s += limb([[-60, 1500], [px - 60, py + 170]], 90, HERO.shirt, 9) + circ(px - 40, py + 150, 52, HERO.skin, ink(7));
    let inner = '';
    if (st < tg) {
      inner += qr(-70, -110, 140, 11);
      const sy = -110 + ((st * 280) % 160);
      if (st > sc - 0.3) inner += `<rect x="-100" y="${sy}" width="200" height="8" fill="${C.red}" opacity="0.85"/>`;
      inner += [[-90, -140], [90, -140], [-90, 60], [90, 60]].map(([a, b]) => `<path d="M${a},${b + (b < 0 ? 30 : -30)} L${a},${b} L${a + (a < 0 ? 30 : -30)},${b}" stroke="#fff" stroke-width="8" fill="none"/>`).join('');
    } else {
      const k2 = pop(st, tg);
      inner += g(`scale(${k2})`, circ(0, -60, 70, GREEN, ink(6)) + `<path d="M-32,-60 L-8,-36 L36,-86" stroke="#fff" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
      inner += text(0, 70, '₹10 PAID', 44, '#fff', { font: FONT, weight: 900 });
    }
    s += upiPhone(px, py, 0.95, -12, { bg: st < tg ? '#2a2f3d' : '#16352a', inner });
    if (st > tg && st < tg + 0.5) s += burst(560, 900, 120 * pop(st, tg, 0.2), 10, '#ffd23f', st * 200);
    if (st > bx) s += g(`translate(380,630) scale(${pop(st, bx)}) translate(-380,-630)`, bubble(380, 630, 400, 110, '₹10 PRAPT HUE', 44, { tx: 545, ty: 860 }));
    if (st > dd) s += g(`translate(935,615) rotate(${Math.sin((st - dd) * 30) * 6 * Math.exp(-(st - dd) * 3)})`, stopwatch(0, 0, 0.75 * pop(st, dd), '2 SEC'));
    if (st > ks) for (let i = 0; i < 3; i++) s += text(160 + i * 90, 780 - i * 60, '?', 120 * pop(st, ks + i * 0.12), '#fff', { extra: `transform="rotate(${-12 + i * 12} ${160 + i * 90} ${780 - i * 60})"` });
    return s;
  }

  function stallEnd(st, shot) {
    const tg = cue(shot, 'ting', 0.8), an = cue(shot, 'andar', 2.5), cd = cue(shot, 'cold', 4.7);
    const cold = st > cd;
    const glow = st > tg ? Math.max(0, 1 - (st - tg) / 1.2) : 0;
    let s = stallBase(st, {
      glow, expr: cold ? 'worried' : 'happy', armR: [70, 120], blink: cold ? 0 : (st % 3 < 0.12 ? 1 : 0),
      afterChai: (P) => {
        const hx = 700 + P.hands.r[0] * 0.95, hy = 1080 + P.hands.r[1] * 0.95;
        return glass(hx, hy + 24, 1.2, cold ? { cold: true } : { steam: st });
      },
    });
    // x-ray peek inside the soundbox: the tiny NPCI cop
    if (st > an && st < cd) {
      const k = pop(st, an);
      s += g(`translate(560,780) scale(${k})`, `<circle cx="0" cy="0" r="130" fill="#1f2a44" ${ink(7)}/>` + npciCop(0, 40, 0.42, { cap: 1, wave: st }));
    }
    if (cold) {
      s += R(0, 0, W, H, '#9fd8ff', `opacity="${0.18 * pop(st, cd, 0.4)}"`);
      s += g(`translate(330,760) scale(${pop(st, cd)}) rotate(-6)`, `<rect x="-170" y="-60" width="340" height="110" rx="24" fill="#fff" ${ink(6)}/>` + text(0, 18, 'THANDI 🥶', 54, '#3a8dde', { font: FONT, weight: 900, stroke: 0 }));
    }
    return s;
  }

  // ---------------- does the note fly? ----------------
  function fly(st, shot) {
    const nh = cue(shot, 'nahi', 2.3);
    let s = R(0, 0, W, H, '#8fd3ff');
    for (let i = 0; i < 5; i++) {
      const cx = ((hash(i) * 1400 - st * 40 * (1 + i * 0.2)) % 1400 + 1400) % 1400 - 150, cy = 480 + hash(i + 3) * 500;
      s += `<g opacity="0.9">${circ(cx, cy, 60, '#fff')}${circ(cx + 60, cy - 20, 70, '#fff')}${circ(cx + 130, cy, 55, '#fff')}</g>`;
    }
    s += R(0, 1180, W, 740, '#7bc96f', ink(8));
    s += upiPhone(200, 1050, 0.75, -6, { bg: '#2a2f3d', inner: text(0, 0, '₹', 120, '#fff', { font: FONT, weight: 900 }) });
    // shop on the right
    s += R(760, 860, 280, 320, '#ff9f43', ink(7)) + `<path d="M740,860 L1060,860 L1030,790 L770,790Z" fill="${C.red}" ${ink(7)}/>` + text(900, 960, 'CHAI', 48, '#fff');
    const f = Math.min(st, nh) / Math.max(0.5, nh);
    let nx = lerp(250, 860, ease(f)), ny = 820 - Math.sin(f * Math.PI) * 260, rot = Math.sin(st * 6) * 8;
    if (st > nh) { const d = st - nh; ny += 900 * d * d; rot += d * 400; nx += d * 60; }
    s += note(nx, ny, 0.9, rot, { wings: st < nh ? st : 0, face: true });
    if (st > nh) {
      const k = pop(st, nh, 0.2);
      s += g(`translate(540,800) scale(${k})`, `<path d="M-220,-220 L220,220 M220,-220 L-220,220" stroke="${C.red}" stroke-width="60" stroke-linecap="round"/><path d="M-220,-220 L220,220 M220,-220 L-220,220" stroke="${INK}" stroke-width="78" stroke-linecap="round" opacity="0" />`);
    }
    return s;
  }

  // ---------------- the flow diagram ----------------
  const N = { phone: [230, 640], npci: [540, 860], my: [230, 1200], their: [850, 1200], box: [850, 640] };
  function along(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; }
  function flow(st, shot, ctx) {
    const step = shot.step || 1;
    let s = R(0, 0, W, H, '#1f2a44');
    for (let x = 30; x < W; x += 60) for (let y = 470; y < 1400; y += 60) s += circ(x, y, 3, '#2f3d60');
    const dim = (keys) => (n) => (step === 1 || keys.includes(n) ? 1 : 0.35);
    const hl = dim(step === 2 ? ['npci', 'my', 'phone'] : ['npci', 'their', 'box']);
    const wire = (a, b, on) => `<line x1="${N[a][0]}" y1="${N[a][1]}" x2="${N[b][0]}" y2="${N[b][1]}" stroke="${on ? '#ffd23f' : '#3c4a70'}" stroke-width="10" stroke-dasharray="4 22" stroke-linecap="round"/>`;
    s += wire('phone', 'npci', step === 1) + wire('npci', 'my', step === 2) + wire('npci', 'their', step === 3) + wire('their', 'box', step === 3);
    // nodes
    const st1 = step === 1;
    const npciIn = st1 ? pop(st, cue(shot, 'npci', 3)) : 1;
    const cap = st1 ? clamp((st - cue(shot, 'police', 5.5) + 0.2) / 0.35, 0, 1) : 1;
    s += g('', upiPhone(N.phone[0], N.phone[1] - 20, 0.6, 0, { bg: '#2a2f3d', inner: text(0, 10, 'AAP', 64, '#fff') }), `opacity="${hl('phone')}"`);
    s += g('', soundbox(N.box[0], N.box[1] + 90, 0.95, step === 3 && st > cue(shot, 'two', 4) ? Math.max(0, 1 - (st - cue(shot, 'two', 4)) / 1.2) : 0) + text(N.box[0], N.box[1] + 150, 'CHAIWALA', 34, '#fff', { font: FONT, weight: 900 }), `opacity="${hl('box') * (st1 ? 0.35 : 1)}"`);
    s += bank(N.my[0], N.my[1] + 50, 0.78, 'AAPKA BANK', '#e9e3d6', hl('my') * (st1 ? 0.35 : 1));
    s += bank(N.their[0], N.their[1] + 50, 0.78, 'CHAIWALE KA BANK', '#e9e3d6', hl('their') * (st1 ? 0.35 : 1));
    if (npciIn > 0) s += g(`translate(${N.npci[0]},${N.npci[1]}) scale(${npciIn}) translate(${-N.npci[0]},${-N.npci[1]})`, npciCop(N.npci[0], N.npci[1] + 60, 0.95, { cap, wave: cap >= 1 ? st : 0, whistle: st1 && cap >= 1 && st < cue(shot, 'police', 5.5) + 1.2, expr: step === 2 && st > cue(shot, 'ask', 1.4) && st < cue(shot, 'bal', 4.3) ? 'focus' : 'happy' }));
    // packets
    const fly1 = (a, b, at, label, col) => { const k = clamp((st - at) / 0.6, 0, 1); return k > 0 && k < 1 ? packet(...along(N[a], N[b], ease(k)), 0.8, label, col) : ''; };
    if (step === 1) s += fly1('phone', 'npci', cue(shot, 'send', 2), '₹10 → CHAIWALA');
    if (step === 2) {
      s += fly1('npci', 'my', cue(shot, 'ask', 1.4), 'PIN? BALANCE?');
      s += check(N.my[0] + 40, N.my[1] - 300, clamp((st - cue(shot, 'pin', 2.4)) / 0.25, 0, 1), 'PIN ✓');
      s += check(N.my[0] + 40, N.my[1] - 200, clamp((st - cue(shot, 'bal', 4.4)) / 0.25, 0, 1), 'BALANCE ✓');
      const m = cue(shot, 'minus', 7);
      if (st > m) s += text(N.my[0], N.my[1] - 60 - 80 * easeOut((st - m) / 0.8), '−₹10', 90 * pop(st, m), C.red);
    }
    if (step === 3) {
      s += fly1('npci', 'their', cue(shot, 'tell', 1.9), '+₹10', '#d9ffe8');
      const pl = cue(shot, 'plus', 2.9);
      if (st > pl) s += text(N.their[0], N.their[1] - 60 - 80 * easeOut((st - pl) / 0.8), '+₹10', 90 * pop(st, pl), GREEN);
      s += fly1('their', 'box', pl + 0.3, '');
      const tw = cue(shot, 'two', 4.2);
      if (st > tw) s += stopwatch(540, 560, 0.7 * pop(st, tw), '2 SEC');
    }
    return s;
  }

  // ---------------- the twist: only the ledger changes ----------------
  function ledger(st, shot) {
    const en = cue(shot, 'entries', 2.5), se = cue(shot, 'settle', 5.7), ka = cue(shot, 'kai', 7.2);
    let s = R(0, 0, W, H, '#fff3dc') + halftone('ht1', '#e8c48a', 0.35, 30);
    const k2 = easeOut(clamp((st - se + 0.4) / 0.5, 0, 1)); // phase 2 slide
    let a = '';
    // phase 1: the note sleeps in the vault, the khata gets the entries
    a += `<rect x="340" y="470" width="400" height="230" rx="30" fill="#9aa0aa" ${ink(8)}/>` + circ(680, 585, 36, '#c0c4cc', ink(6));
    a += note(500, 600, 0.95, -4, { face: true, sleep: true });
    a += text(620 + Math.sin(st * 3) * 6, 520 - (st * 30) % 40, 'z', 50, '#fff') + text(660, 480 - (st * 30) % 40, 'Z', 64, '#fff');
    a += `<rect x="110" y="760" width="860" height="480" rx="20" fill="#c0392b" ${ink(8)}/>`;
    a += `<rect x="135" y="780" width="400" height="440" fill="#fffaf0" ${ink(5)}/><rect x="545" y="780" width="400" height="440" fill="#fffaf0" ${ink(5)}/>`;
    for (let i = 0; i < 8; i++) a += `<line x1="150" y1="${860 + i * 46}" x2="925" y2="${860 + i * 46}" stroke="#9cc3e6" stroke-width="3"/>`;
    a += text(335, 840, 'AAPKA BANK', 34, INK, { font: FONT, weight: 900, stroke: 0 }) + text(745, 840, 'CHAIWALE KA', 34, INK, { font: FONT, weight: 900, stroke: 0 });
    a += text(820, 745, 'HISAAB', 54, '#fff');
    const w1 = clamp((st - en + 0.2) / 0.5, 0, 1), w2 = clamp((st - en - 0.3) / 0.5, 0, 1);
    a += `<defs><clipPath id="c1"><rect x="150" y="880" width="${370 * w1}" height="120"/></clipPath><clipPath id="c2"><rect x="560" y="880" width="${370 * w2}" height="120"/></clipPath></defs>`;
    a += `<g clip-path="url(#c1)">${text(335, 970, '− ₹10', 90, C.red, { stroke: 0 })}</g><g clip-path="url(#c2)">${text(745, 970, '+ ₹10', 90, GREEN, { stroke: 0 })}</g>`;
    if (st > en) a += `<g opacity="${clamp((st - en - 0.8) / 0.3, 0, 1)}">${text(540, 1140, 'BAS ITNA HI!', 60, INK, { stroke: 0, extra: 'transform="rotate(-3 540 1140)"' })}</g>`;
    s += g(`translate(${-1100 * k2},0)`, a);
    // phase 2: banks settle between themselves later, several times a day
    if (k2 > 0) {
      let b = bank(260, 1180, 0.95, 'BANK A') + bank(820, 1180, 0.95, 'BANK B');
      const sw = Math.sin((st - se) * 4);
      b += `<path d="M380,${1000 + sw * 10} C480,${900 + sw * 10} 600,${900 + sw * 10} 700,${1000 + sw * 10}" stroke="#ffd23f" stroke-width="16" fill="none" ${'stroke-linecap="round"'}/><path d="M690,${975 + sw * 10} L720,${1010 + sw * 10} L680,${1020 + sw * 10}" fill="#ffd23f" ${ink(4)}/>`;
      b += text(540, 880, 'SETTLE', 70, '#ffd23f');
      // clock with the hands racing through the day
      const spin = st > ka ? (st - ka) * 900 : 0;
      b += circ(540, 610, 130, '#fff', ink(9));
      for (let i = 0; i < 12; i++) b += `<line x1="${540 + Math.cos(rad(i * 30)) * 110}" y1="${610 + Math.sin(rad(i * 30)) * 110}" x2="${540 + Math.cos(rad(i * 30)) * 96}" y2="${610 + Math.sin(rad(i * 30)) * 96}" ${ink(6)}/>`;
      b += `<line x1="540" y1="610" x2="${540 + Math.cos(rad(spin / 12 - 90)) * 60}" y2="${610 + Math.sin(rad(spin / 12 - 90)) * 60}" ${ink(12)}/><line x1="540" y1="610" x2="${540 + Math.cos(rad(spin - 90)) * 95}" y2="${610 + Math.sin(rad(spin - 90)) * 95}" ${ink(8)}/>` + circ(540, 610, 12, INK);
      if (st > ka) for (let i = 0; i < Math.min(5, Math.floor((st - ka) / 0.25) + 1); i++) b += check([170, 910, 160, 920, 540][i], [560, 560, 760, 760, 380][i], 1, '✓ SETTLED');
      s += g(`translate(${1100 * (1 - k2)},0)`, b);
    }
    return s;
  }

  // ---------------- scale: 2,000 crore a month ----------------
  function crowd(st, shot) {
    let s = rays(540, 640, '#ffd23f', '#ffc21a', st * 12, 20);
    const rows = 5;
    for (let r = 0; r < rows; r++) {
      const y = 900 + r * 110, sc = 0.8 + r * 0.18;
      for (let i = 0; i < 9 - Math.floor(r / 2); i++) {
        const x = (i + 0.5 + (r % 2) * 0.4) * (W / (9 - Math.floor(r / 2)));
        s += mini(x, y + 60, sc, r * 20 + i, { t: st });
        const tt = (st * 1.3 + hash(r * 9 + i) * 3) % 3;
        if (tt < 0.35) s += text(x, y - 70 * sc, 'TING!', 30 * back(tt / 0.2), '#fff', { font: FONT, weight: 900, strokeCol: GREEN });
      }
    }
    return s + vignette('v2', 0.3);
  }

  // ---------------- the tip: PIN only to SEND ----------------
  function scam(st, shot) {
    const yd = cue(shot, 'yaad', 0.5), nv = cue(shot, 'never', 2.7), sc = cue(shot, 'scam', 6.9);
    let s = R(0, 0, W, H, '#3d2350') + halftone('ht2', '#5a3570', 0.6, 34);
    // shady caller
    const P = person({ x: 820, y: 1380, s: 0.85, skin: C.skin[3], shirt: '#2b2b33', pants: '#1d1b22', hair: 'cap', hairColor: '#1d1b22', expr: st > sc ? 'shock' : 'happy', armR: [150, 170], armL: [15, 10] });
    s += P.svg;
    s += g('translate(820,1380) scale(0.85)', `<rect x="${P.hands.r[0] - 18}" y="${P.hands.r[1] - 40}" width="36" height="70" rx="8" fill="#22252e" ${ink(4)}/>`);
    // the phone with the trap screen
    let inner = `<rect x="-110" y="-200" width="220" height="90" rx="14" fill="#fff"/>`;
    inner += text(0, -165, '₹5,000 PAANE KE LIYE', 19, INK, { font: FONT, weight: 900, stroke: 0 }) + text(0, -130, 'PIN DAALEIN', 26, C.red, { font: FONT, weight: 900, stroke: 0 });
    for (let i = 0; i < 9; i++) inner += `<circle cx="${-70 + (i % 3) * 70}" cy="${-40 + Math.floor(i / 3) * 70}" r="28" fill="#3a4152"/>` + text(-70 + (i % 3) * 70, -28 + Math.floor(i / 3) * 70, String(i + 1), 30, '#fff', { font: FONT, weight: 900, stroke: 0 });
    s += upiPhone(330, 900, 1.25, -5, { bg: '#2a2f3d', inner });
    if (st > yd && st < nv) s += text(330, 520, '☝️', 120 * pop(st, yd), '#fff', { stroke: 0 });
    if (st > nv) s += g(`translate(330,920) scale(${pop(st, nv, 0.2)})`, `<circle cx="0" cy="0" r="250" fill="none" stroke="${C.red}" stroke-width="34"/><line x1="-176" y1="176" x2="176" y2="-176" stroke="${C.red}" stroke-width="34"/>`);
    if (st > nv) s += g(`translate(700,560) scale(${pop(st, nv + 0.3)}) rotate(4)`, `<rect x="-230" y="-60" width="460" height="120" rx="24" fill="#fff" ${ink(6)}/>` + text(0, -6, 'PIN SIRF', 38, INK, { font: FONT, weight: 900, stroke: 0 }) + text(0, 40, 'BHEJNE KE LIYE', 38, C.red, { font: FONT, weight: 900, stroke: 0 }));
    if (st > sc) {
      const k = clamp((st - sc) / 0.18, 0, 1);
      s += g(`translate(540,900) rotate(-14) scale(${lerp(2.4, 1, easeOut(k))})`, `<rect x="-300" y="-110" width="600" height="220" rx="20" fill="none" stroke="${C.red}" stroke-width="22" opacity="${k}"/>` + text(0, 60, 'SCAM!', 170, C.red, { stroke: 0, extra: `opacity="${k}"` }));
    }
    return s;
  }

  root.Scenes = { stall, stallEnd, fly, flow, ledger, crowd, scam };
})(window);
