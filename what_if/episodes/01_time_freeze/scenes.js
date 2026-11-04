// EP01 "What if time froze for everyone but you?" scene art.
(function (root) {
  'use strict';
  const K = root.Kit;
  const { W, H, INK, C, clamp, lerp, ease, easeOut, easeIn, back, hash, p, rad, R, ink, g, shade, limb, circ, person, sidePerson, crack, burst, vignette, halftone, rays, text } = K;
  const HERO = { skin: C.skin[0], shirt: '#ff7a59', pants: '#3a4a8a', hair: 'tuft', hairColor: '#3b2a20' };
  const KEEPER = { skin: C.skin[2], shirt: '#2ec4b6', pants: '#2f3b55', hair: 'short', hairColor: '#1d1b22' };
  const GUY = { skin: C.skin[3], shirt: '#9b5de5', pants: '#2f3b55', hair: 'curly', hairColor: '#5a3825' };
  const cue = (shot, k, d = 99) => (shot.cues && shot.cues[k] != null ? shot.cues[k] : d);
  const cam = (z, cx, cy, inner) => `<g transform="translate(540,960) scale(${z}) translate(${-cx},${-cy})">${inner}</g>`;
  const FREEZE_FILTER = `<defs><filter id="frz"><feColorMatrix type="matrix" values="0.3 0.35 0.2 0 0.02  0.25 0.4 0.2 0 0.04  0.3 0.4 0.45 0 0.12  0 0 0 1 0"/></filter></defs>`;

  function candy(x, y, s = 1, rot = 0) {
    return g(`translate(${x},${y}) rotate(${rot}) scale(${s})`,
      `<path d="M-70,-26 L-84,-34 L-84,34 L-70,26 Z M70,-26 L84,-34 L84,34 L70,26 Z" fill="#c9c9c0" ${ink(4)}/>` +
      `<rect x="-70" y="-28" width="140" height="56" rx="8" fill="#e8262b" ${ink(6)}/>` +
      text(0, 12, 'CHOCO', 30, '#ffd23f', { stroke: 0 }));
  }
  function cup(x, y, s = 1) {
    return g(`translate(${x},${y}) scale(${s})`, `<path d="M-30,-40 L30,-40 L24,36 L-24,36Z" fill="#fff" ${ink(6)}/><rect x="-30" y="-18" width="60" height="22" fill="#7a4a2a"/><rect x="-34" y="-50" width="68" height="14" rx="6" fill="#ff7a59" ${ink(5)}/>`);
  }

  // ---------------- the corner shop ----------------
  // f: 0 = moving world, 1 = frozen. u = seconds since time restarted (or -1)
  function shopSet(t, f, u, opt = {}) {
    let s = R(0, 0, W, H, '#fbe7b5');
    for (let x = 0; x < W; x += 80) s += R(x, 0, 40, 1250, '#f6dda3', 'opacity="0.7"');
    s += R(0, 1250, W, 670, '#d9b48a', ink(6));
    for (let x = 0; x < W; x += 140) s += `<line x1="${x}" y1="1250" x2="${x - 200}" y2="1920" stroke="#c99f74" stroke-width="5"/>`;
    // window with a pigeon and the street
    s += R(330, 470, 420, 300, '#ffffff', ink(8)) + R(345, 485, 390, 270, '#9ad7ff');
    s += R(345, 680, 390, 75, '#9a9aa6');
    const py = f ? 560 : 560 + Math.sin(t * 9) * 14;
    let pgx = 470 + (f ? 0 : (t % 3) * 30);
    if (u >= 0) pgx = 470 + u * 400;
    const flap = f && u < 0 ? 0.2 : Math.sin(t * 22);
    s += `<g transform="translate(${pgx},${py})"><ellipse cx="0" cy="0" rx="40" ry="24" fill="#8f96a8" ${ink(5)}/>` + circ(34, -16, 15, '#8f96a8', ink(5)) + circ(38, -19, 3, INK) + `<path d="M48,-14 l12,4 l-12,4z" fill="#ffb347"/>` +
      `<path d="M-10,-8 Q-30,${-50 * flap} -50,${-30 * flap - 10}" fill="#7a8194" ${ink(5)}/></g>`;
    s += R(533, 470, 14, 300, '#ffffff', ink(4));
    s += text(540, 450, 'OPEN 24/7', 40, '#e8262b', { stroke: 0 });
    // wall clock
    const sec = f && u < 0 ? 0.6 : t * 1.0;
    s += circ(900, 600, 90, '#fff', ink(8)) + `<line x1="900" y1="600" x2="900" y2="540" ${ink(8)}/><line x1="900" y1="600" x2="940" y2="610" ${ink(8)}/>`;
    s += `<line x1="900" y1="600" x2="${900 + Math.sin(sec * Math.PI / 30 * 6) * 75}" y2="${600 - Math.cos(sec * Math.PI / 30 * 6) * 75}" stroke="${C.red}" stroke-width="5"/>` + circ(900, 600, 8, INK);
    // shelves
    for (let r = 0; r < 4; r++) {
      const y = 620 + r * 160;
      s += R(0, y + 110, 290, 18, '#a8693f', ink(5));
      for (let i = 0; i < 5; i++) {
        const col = C.shirts[(i + r * 3) % C.shirts.length];
        s += `<rect x="${14 + i * 56}" y="${y + 30 + (i % 2) * 10}" width="46" height="${80 - (i % 2) * 10}" rx="6" fill="${col}" ${ink(4)}/>`;
      }
    }
    // shopkeeper behind the counter: building a sneeze
    const sneezeAt = opt.sneezeAt ?? 99;
    const keeperExpr = opt.keeperExpr || (u >= 0 ? (u < 0.5 ? 'pain' : 'shock') : 'pain');
    s += person(Object.assign({}, KEEPER, { x: 880, y: 1300, s: 1.0, expr: keeperExpr, look: opt.keeperLook, armL: [30, 60], armR: [30, 60], extra: `<rect x="-80" y="-220" width="160" height="100" fill="#fff" opacity="0.9" ${ink(5)}/>` })).svg;
    if (f && u < 0) for (let i = 0; i < 9; i++) s += circ(790 - hash(i) * 150, 990 - hash(i + 3) * 70, 6 + hash(i + 5) * 6, '#bfe8ff', ink(3));
    // counter
    s += R(640, 1120, 460, 260, '#c27a45', ink(8)) + R(630, 1100, 470, 30, '#e09a5f', ink(6));
    s += R(650, 1010, 110, 90, '#2b2b33', ink(6)) + R(664, 1028, 82, 40, '#7fffd4');
    // customer with coffee (left)
    s += person(Object.assign({}, GUY, { x: 230, y: 1420, s: 1.0, expr: u > 0.5 ? 'shock' : 'neutral', armR: [70, 140], armL: [15, 10], sweat: u > 0.5 })).svg;
    const cx = 230 + 74 + 120, cy = 1420 - 250 - 40;
    s += cup(cx + 10, cy - 30, 1.0);
    // coffee splash frozen mid-air, then landing on him
    if (u < 0) {
      for (let i = 0; i < 8; i++) {
        const a = i / 8;
        const x = cx - 10 - a * 140, y = cy - 80 - Math.sin(a * Math.PI) * 120 + (f ? 0 : ((t * 3) % 1) * 40);
        s += circ(x, y, 14 - a * 6, '#7a4a2a', ink(3));
      }
    } else if (u < 0.6) {
      for (let i = 0; i < 8; i++) s += circ(cx - 140 + i * 10, cy - 80 + u * 400 + i * 8, 10, '#7a4a2a', ink(3));
    } else {
      s += `<path d="M160,${1000} q40,40 0,90 q-20,-30 0,-90z" fill="#7a4a2a" opacity="0.9"/>` + `<ellipse cx="230" cy="940" rx="70" ry="22" fill="#7a4a2a" opacity="0.85"/>`;
    }
    // floating dust motes: drift, or hang still when frozen
    for (let i = 0; i < 26; i++) {
      const x = (hash(i) * W + (f ? 0 : t * 30)) % W, y = 300 + hash(i + 9) * 900 + (f ? 0 : Math.sin(t + i) * 20);
      s += circ(x, y, 3 + hash(i + 2) * 3, '#fff', 'opacity="0.7"');
    }
    return s;
  }
  function heroAt(o) {
    return person(Object.assign({}, HERO, { x: 560, y: 1440, s: 1.08, armR: [60, 150], armL: [12, 8] }, o));
  }

  // ======================= hook + restart =======================
  function shop(st, shot) {
    if (shot.id === 'hook') {
      const fr = cue(shot, 'freeze', 1), ex = cue(shot, 'except', 2.8);
      const f = st >= fr ? 1 : 0;
      let world = shopSet(st, f, -1);
      const H1 = heroAt({ expr: st >= ex ? 'shock' : 'neutral', look: st >= ex ? [Math.sin(st * 3), 0] : [0, 0] });
      let hero = H1.svg + candy(560 + H1.hands.r[0] * 1.08, 1440 + H1.hands.r[1] * 1.08 - 10, 0.8, -20);
      let s = '';
      if (f) {
        s += FREEZE_FILTER + `<g filter="url(#frz)">${world}${st < ex ? hero : ''}</g>`;
        if (st >= ex) {
          const k = easeOut((st - ex) / 0.3);
          s += `<circle cx="560" cy="1130" r="${330 * k}" fill="#fff8d6" opacity="0.25"/>` + hero;
        }
        const a = st - fr;
        if (a < 0.25) s += R(0, 0, W, H, '#ffffff', `opacity="${0.8 * (1 - a / 0.25)}"`);
        s += `<g opacity="${clamp(a / 0.2, 0, 1)}"><rect x="405" y="800" width="270" height="86" rx="14" fill="${INK}"/>` + text(540, 860, '❚❚ PAUSED', 46, '#7fd8ff', { stroke: 0 }) + `</g>`;
      } else s += world + hero;
      return cam(lerp(1.0, 1.08, ease(clamp(st / 3.8, 0, 1))), 540, 1050, s);
    }
    // restart: purple, frozen, then everything snaps back
    const ag = cue(shot, 'again', 3);
    const u = st >= ag ? st - ag : -1;
    const world = shopSet(st, u < 0 ? 1 : 0, u);
    const H2 = heroAt(u < 0 ? { expr: 'strain', red: 0 } : { expr: 'shock', sweat: true, armR: [100, 150], armL: [100, 30] });
    let hero = H2.svg + candy(560 + H2.hands.r[0] * 1.08, 1440 + H2.hands.r[1] * 1.08 - 10, 0.8, -20);
    if (u < 0) hero += `<circle cx="560" cy="${1440 - 350 * 1.08}" r="${78 * 1.08}" fill="#8e44ad" opacity="${0.35 + 0.1 * Math.sin(st * 8)}"/>` + circ(510, 1440 - 330 * 1.08, 26, '#b783d6', ink(4)) + circ(610, 1440 - 330 * 1.08, 26, '#b783d6', ink(4));
    let s = '';
    if (u < 0) s += FREEZE_FILTER + `<g filter="url(#frz)">${world}</g>` + hero + `<rect width="${W}" height="${H}" fill="#000" opacity="${0.25 * Math.max(0, Math.sin(st * 3))}"/>`;
    else {
      s += world + hero;
      if (u < 0.3) s += R(0, 0, W, H, '#fff', `opacity="${0.8 * (1 - u / 0.3)}"`);
      if (u < 1.2) s += text(540, 700, '▶ PLAY', 110, '#8ac926', { extra: `opacity="${1 - p(u, 0.8, 0.4)}"` });
    }
    const z = u < 0 ? lerp(1, 1.18, ease(clamp(st / ag, 0, 1))) : lerp(1.18, 1.0, easeOut(u / 0.4));
    return cam(z, 540, 1050, s);
  }

  // ======================= fantasy: no school, no bills, free snacks =======================
  function fantasy(st, shot) {
    const sc = cue(shot, 'school', 0.2), bl = cue(shot, 'bills', 1.2), sn = cue(shot, 'snacks', 2.3);
    let s = rays(540, 1000, '#ffe08a', '#ffd23f', st * 30, 18);
    const icon = (x, y, at, inner) => {
      if (st < at) return '';
      const k = back(clamp((st - at) / 0.22, 0, 1));
      const xk = easeOut(clamp((st - at - 0.15) / 0.2, 0, 1));
      return `<g transform="translate(${x},${y}) scale(${k})">${inner}<path d="M-110,-110 L${-110 + 220 * xk},${-110 + 220 * xk} M110,-110 L${110 - 220 * xk},${-110 + 220 * xk}" stroke="#e8262b" stroke-width="30" stroke-linecap="round"/></g>`;
    };
    s += icon(270, 620, sc, `<rect x="-120" y="-60" width="240" height="160" fill="#ff7a59" ${ink(8)}/><path d="M-140,-60 L0,-150 L140,-60Z" fill="#e8262b" ${ink(8)}/><rect x="-30" y="20" width="60" height="80" fill="#5a3825" ${ink(6)}/>` + circ(0, -80, 26, '#fff', ink(5)) + text(0, -20, 'SCHOOL', 40, '#fff', { stroke: 6 }));
    s += icon(810, 620, bl, `<rect x="-130" y="-90" width="260" height="180" rx="10" fill="#fff" ${ink(8)}/><path d="M-130,-90 L0,10 L130,-90" fill="none" ${ink(8)}/>` + text(0, 70, 'BILLS', 48, '#e8262b', { stroke: 0 }));
    if (st >= sn) {
      const a = st - sn;
      const k = back(clamp(a / 0.25, 0, 1));
      for (let i = 0; i < 14; i++) {
        const x = 80 + hash(i) * 920, y = -100 + ((a * 900 + hash(i + 3) * 1200) % 1500);
        const col = C.shirts[i % C.shirts.length];
        s += `<g transform="rotate(${a * 200 * (hash(i) - 0.5) + i * 30} ${x} ${y})"><rect x="${x - 34}" y="${y - 46}" width="68" height="92" rx="10" fill="${col}" ${ink(5)}/></g>`;
      }
      const P = person(Object.assign({}, HERO, { x: 540, y: 1400 + (1 - k) * 600, s: 1.25, expr: 'happy', armL: [150, 175], armR: [150, 175] }));
      s += P.svg;
      s += candy(540 + P.hands.r[0] * 1.25, 1400 + (1 - k) * 600 + P.hands.r[1] * 1.25 - 40, 0.9, 20) + candy(540 + P.hands.l[0] * 1.25, 1400 + (1 - k) * 600 + P.hands.l[1] * 1.25 - 40, 0.9, -20);
      s += text(540, 800, 'FREE!', 150, '#8ac926', { extra: `transform="rotate(-6 540 800) translate(540,800) scale(${k}) translate(-540,-800)"` });
    }
    return s;
  }

  // ======================= 2 minutes to live =======================
  function twomin(st, shot) {
    const two = cue(shot, 'two', 1.8);
    const beat = Math.pow(Math.max(0, Math.sin(st * Math.PI * 2.2)), 8);
    let s = R(0, 0, W, H, '#3a0d12');
    s += `<defs><radialGradient id="tm"><stop offset="0" stop-color="#ff3b30" stop-opacity="${0.35 + beat * 0.25}"/><stop offset="1" stop-color="#ff3b30" stop-opacity="0"/></radialGradient></defs>` + circ(540, 760, 700, 'url(#tm)');
    const P = person(Object.assign({}, HERO, { x: 540, y: 1850, s: 2.1, expr: st >= two ? 'shock' : 'neutral', sweat: st >= two }));
    s += P.svg;
    if (st >= two) {
      const a = st - two;
      const k = lerp(2.4, 1, back(clamp(a / 0.25, 0, 1)));
      const rem = Math.max(0, 120 - Math.floor(a * 3));
      const txt = `${Math.floor(rem / 60)}:${String(rem % 60).padStart(2, '0')}`;
      s += `<g transform="translate(540,700) scale(${k * (1 + beat * 0.04)})"><rect x="-330" y="-150" width="660" height="230" rx="36" fill="#14121a" ${ink(10)}/>` +
        `<text x="0" y="40" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="190" fill="#ff3b30" letter-spacing="8">${txt}</text></g>`;
      s += text(540, 520, 'TO LIVE', 70, '#fff');
    }
    return s;
  }

  // ======================= problem 1: light is frozen =======================
  function dark(st, shot) {
    const bk = cue(shot, 'black', 2.1), fz = cue(shot, 'frozen', 3), bl = cue(shot, 'blind', 6.1);
    const lit = st < bk;
    let s = lit ? R(0, 0, W, H, '#fbe7b5') : R(0, 0, W, H, '#05060c');
    // lamp top-left, eye bottom-right; photons travel along the line, then hang still
    const L0 = [200, 520], E = [700, 1130];
    if (lit) s += `<defs><radialGradient id="lmp"><stop offset="0" stop-color="#fff3b0" stop-opacity="0.8"/><stop offset="1" stop-color="#fff3b0" stop-opacity="0"/></radialGradient></defs>` + circ(L0[0], L0[1], 300, 'url(#lmp)');
    s += `<path d="M${L0[0] - 70},${L0[1] - 20} L${L0[0] + 70},${L0[1] - 20} L${L0[0] + 45},${L0[1] - 100} L${L0[0] - 45},${L0[1] - 100}Z" fill="${lit ? '#ffd27a' : '#2a2a35'}" ${ink(6)}/>` + R(L0[0] - 6, 300, 12, L0[1] - 400, '#333');
    const tt = lit ? st : bk;
    for (let i = 0; i < 9; i++) {
      const ph = ((tt * 0.9 + i / 9) % 1);
      const x = lerp(L0[0], E[0] - 60, ph), y = lerp(L0[1], E[1] - 80, ph);
      const glow = lit ? 1 : 0.85;
      s += `<g opacity="${glow}"><line x1="${x - 34}" y1="${y - 26}" x2="${x}" y2="${y}" stroke="#ffd23f" stroke-width="8" stroke-linecap="round"/>` + circ(x, y, 13, '#fff3b0', ink(4)) + `</g>`;
      if (!lit && st > fz) s += `<g opacity="${clamp((st - fz) / 0.3, 0, 1)}">` + R(x + 18, y - 22, 8, 26, '#7fd8ff') + R(x + 30, y - 22, 8, 26, '#7fd8ff') + `</g>`;
    }
    // the hero: lit normally, then only the eyes in the dark
    const P = person(Object.assign({}, HERO, { x: 760, y: 1500, s: 1.0, expr: lit ? 'neutral' : 'shock', look: lit ? [-0.6, -0.4] : [Math.sin(st * 4), 0] }));
    if (lit) s += P.svg;
    else {
      s += `<g opacity="0.16">${P.svg}</g>`;
      const hx = 760, hy = 1500 - 350;
      for (const sd of [-1, 1]) s += `<ellipse cx="${hx + sd * 29}" cy="${hy - 4}" rx="20" ry="23" fill="#fff"/>` + circ(hx + sd * 29 + Math.sin(st * 4) * 8, hy - 4, 5, INK);
      if (st > fz) {
        const k = back(clamp((st - fz) / 0.25, 0, 1));
        s += `<g transform="translate(330,880) scale(${k}) rotate(-6)">` + `<rect x="-230" y="-60" width="460" height="100" rx="16" fill="#7fd8ff" ${ink(6)}/>` + text(0, 14, 'LIGHT: FROZEN', 56, INK, { stroke: 0 }) + `</g>`;
      }
    }
    if (!lit && st - bk < 0.15) s += R(0, 0, W, H, '#fff', `opacity="${0.5 * (1 - (st - bk) / 0.15)}"`);
    return s;
  }

  // ======================= problem 2: air is a wall =======================
  function air(st, shot) {
    const push = cue(shot, 'push', 3.1);
    const frozen = st > 0.9;
    let s = R(0, 0, W, H, '#dff3ff');
    let mols = '';
    for (let j = 0; j < 20; j++) for (let i = 0; i < 12; i++) {
      const seed = i * 31 + j * 17;
      let x = i * 96 + (j % 2) * 48 + 10, y = 420 + j * 80;
      if (!frozen) { x += Math.sin(st * 9 + seed) * 22; y += Math.cos(st * 7 + seed) * 22; }
      const near = Math.hypot(x - 520, y - 1150) < 260;
      mols += circ(x, y, 30, near && st > push ? '#ffb3b3' : '#9fd4ff', ink(4)) + circ(x - 8, y - 5, 3.5, INK) + circ(x + 8, y - 5, 3.5, INK) +
        (near && st > push ? `<path d="M${x - 8},${y + 12} q8,-8 16,0" ${ink(3)} fill="none"/>` : `<path d="M${x - 7},${y + 8} q7,6 14,0" ${ink(3)} fill="none"/>`);
    }
    // hero tunnels slowly through: carve a pocket around him
    const prog = st > push ? (st - push) * 18 : 0;
    const hx = 330 + prog;
    s += mols;
    s += `<ellipse cx="${hx + 20}" cy="1180" rx="170" ry="300" fill="#dff3ff" opacity="0.95"/>`;
    s += sidePerson(Object.assign({}, HERO, { x: hx, y: 1420, s: 1.05, mode: 'walk', phase: st > push ? st * 1.4 : 0, lean: st > push ? 28 : 4, expr: st > push ? 'strain' : 'shock', sweat: st > push }));
    if (st > push) for (let i = 0; i < 3; i++) s += `<line x1="${hx + 150}" y1="${1000 + i * 70}" x2="${hx + 200}" y2="${990 + i * 70}" stroke="${C.red}" stroke-width="10" stroke-linecap="round"/>`;
    if (frozen && st < 2.5) s += `<g opacity="${clamp((st - 0.9) / 0.2, 0, 1) * clamp((2.5 - st) / 0.3, 0, 1)}"><rect x="320" y="470" width="440" height="90" rx="16" fill="${INK}"/>` + text(540, 532, '❚❚ AIR: PAUSED', 50, '#7fd8ff', { stroke: 0 }) + `</g>`;
    return s;
  }

  // ======================= problem 3: lungs =======================
  function lungs(st, shot) {
    const pull = cue(shot, 'pull', 2.9), cant = cue(shot, 'cant', 4.6);
    let s = R(0, 0, W, H, '#0b1026');
    for (let x = 0; x < W; x += 60) s += R(x, 0, 2, H, '#16204a');
    for (let y = 0; y < H; y += 60) s += R(0, y, W, 2, '#16204a');
    s += `<rect x="110" y="420" width="860" height="900" rx="30" fill="#0f2a44" stroke="#5fd4ff" stroke-width="8"/>`;
    // torso outline + head
    s += `<path d="M250,1320 C240,1000 300,820 420,780 L660,780 C780,820 840,1000 830,1320" fill="#7fd8ff" opacity="0.15" stroke="#7fd8ff" stroke-width="5"/>`;
    s += circ(540, 640, 120, '#7fd8ff', 'opacity="0.15" stroke="#7fd8ff" stroke-width="5"');
    // trachea + lungs that try to inflate
    const tryK = st > pull ? Math.abs(Math.sin((st - pull) * 5)) * 0.08 : 0;
    const shrink = st > cant ? 0.9 : 1;
    const ls = (shrink + tryK);
    s += `<rect x="525" y="760" width="30" height="150" rx="12" fill="#ff9aa2"/>`;
    for (const sd of [-1, 1]) s += `<g transform="translate(${540 + sd * 130},1050) scale(${sd * ls},${ls})"><path d="M10,-160 C120,-170 150,-20 130,120 C110,190 20,190 10,140 Z" fill="#ff6f7d" opacity="0.92"/></g>`;
    // frozen air molecules stuck at the mouth
    for (let i = 0; i < 7; i++) {
      const x = 380 + i * 55, y = 520 + Math.abs(i - 3) * 14;
      s += circ(x, y - 30, 22, '#9fd4ff', ink(3)) + R(x - 8, y - 40, 5, 18, INK) + R(x + 3, y - 40, 5, 18, INK);
    }
    if (st > pull) {
      const k = back(clamp((st - pull) / 0.25, 0, 1));
      s += `<g transform="translate(860,700) scale(${k})">` + text(0, 0, 'PULL!', 80, '#ffd23f') + `</g>`;
    }
    if (st > cant) {
      const k = back(clamp((st - cant) / 0.25, 0, 1));
      s += `<g transform="translate(540,1250) scale(${k}) rotate(-4)"><rect x="-240" y="-70" width="480" height="110" rx="18" fill="#e8262b" ${ink(6)}/>` + text(0, 14, '0% AIR IN', 72, '#fff', { stroke: 0 }) + `</g>`;
    }
    return s;
  }

  // ======================= silent scream =======================
  function scream(st, shot) {
    const sc = cue(shot, 'scream', 2.9);
    let s = R(0, 0, W, H, '#20232e');
    const open = st > sc ? 1 : 0;
    const P = person(Object.assign({}, HERO, { x: 540, y: 1960, s: 2.4, expr: open ? 'shock' : 'worried', mouth: open ? 2.2 : 1, sweat: true }));
    s += cam(open ? 1 + 0.03 * Math.sin(st * 30) : 1, 540, 960, P.svg);
    // sound waves that leave the mouth and stop dead
    const mx = 540, my = 1960 - (350 - 44) * 2.4;
    for (let i = 0; i < 4; i++) {
      const r = 120 + i * 70;
      s += `<path d="M${mx - r * 0.7},${my - r * 0.7} A${r},${r} 0 0 1 ${mx + r * 0.7},${my - r * 0.7}" fill="none" stroke="#7fd8ff" stroke-width="10" stroke-dasharray="20 18" opacity="${open ? 0.6 : 0.25}"/>`;
    }
    if (open) {
      const k = back(clamp((st - sc) / 0.25, 0, 1));
      s += `<g transform="translate(540,600) scale(${k})">` + circ(0, 0, 120, '#fff', ink(8)) + `<path d="M-50,-30 L-20,-30 L20,-70 L20,70 L-20,30 L-50,30Z" fill="${INK}"/><path d="M40,-40 L90,40 M90,-40 L40,40" stroke="#e8262b" stroke-width="16" stroke-linecap="round"/></g>`;
      s += text(540, 820, '( total silence )', 54, '#9aa0b4', { stroke: 0, font: 'Montserrat', weight: 900 });
    }
    return s;
  }

  // ======================= blind, deaf, stuck, purple =======================
  function stuck(st, shot) {
    const b = cue(shot, 'blind', 2.6), d = cue(shot, 'deaf', 3.6), k0 = cue(shot, 'stuck', 4.3), pu = cue(shot, 'purple', 6.2);
    let s = R(0, 0, W, H, '#ffd23f');
    s += halftone('ht3', '#ffffff', 0.35, 30);
    // crown: "most powerful person in history"
    const P = person(Object.assign({}, HERO, { x: 540, y: 1680, s: 1.45, expr: st > pu ? 'strain' : 'worried', armL: [10, 5], armR: [10, 5] }));
    s += P.svg;
    const hy = 1680 - 350 * 1.45;
    s += `<path d="M450,${hy - 100} L470,${hy - 170} L505,${hy - 125} L540,${hy - 185} L575,${hy - 125} L610,${hy - 170} L630,${hy - 100}Z" fill="#ffd23f" ${ink(7)}/>`;
    if (st > pu) {
      const a = clamp((st - pu) / 0.5, 0, 1);
      s += `<circle cx="540" cy="${hy}" r="${78 * 1.45 - 4}" fill="#8e44ad" opacity="${0.45 * a}"/>`;
      s += circ(485, hy + 30, 32 * a, '#b783d6', ink(5)) + circ(595, hy + 30, 32 * a, '#b783d6', ink(5));
    }
    const badge = (x, at, inner, label) => {
      if (st < at) return '';
      const k = back(clamp((st - at) / 0.22, 0, 1));
      return `<g transform="translate(${x},640) scale(${k})">` + circ(0, 0, 120, '#fff', ink(8)) + inner + `<path d="M-80,-80 L80,80" stroke="#e8262b" stroke-width="18" stroke-linecap="round"/>` + text(0, 185, label, 54, INK, { stroke: 0 }) + `</g>`;
    };
    s += badge(200, b, `<path d="M-70,0 Q0,-60 70,0 Q0,60 -70,0Z" fill="#fff" ${ink(7)}/>` + circ(0, 0, 22, INK), 'BLIND');
    s += badge(540, d, `<path d="M-30,-60 C40,-90 70,-20 30,20 C10,40 20,70 -10,70 C-40,70 -40,40 -40,30" fill="${C.skin[0]}" ${ink(7)}/>`, 'DEAF');
    s += badge(880, k0, `<rect x="-55" y="-20" width="110" height="80" rx="12" fill="#ffd23f" ${ink(7)}/><path d="M-35,-20 L-35,-50 A35,35 0 0 1 35,-50 L35,-20" fill="none" ${ink(10)}/>`, 'STUCK');
    return s;
  }

  // ======================= ending: on the floor with an unpaid candy bar =======================
  function end(st, shot) {
    const ex = cue(shot, 'except', 2), cd = cue(shot, 'candy', 5.2);
    let s = shopSet(st + 10, 0, 5, st > ex ? { keeperExpr: 'focus', keeperLook: [-0.9, 0.8] } : { keeperExpr: 'neutral' });
    // hero flat on the floor, candy held up
    const P = person(Object.assign({}, HERO, { x: 840, y: 1300, s: 1.0, rot: -90, expr: 'sleep', armR: [150, 160], armL: [8, 4] }));
    s += P.svg;
    const hx = 840 + P.hands.r[1] * 1.0, hy = 1300 - P.hands.r[0] * 1.0;
    s += candy(hx, hy - 40, 0.95, 10);
    for (let i = 0; i < 3; i++) { const a = st * 3 + i * 2.1; s += text(470 + Math.cos(a) * 70, 1180 + Math.sin(a) * 26, '★', 40, '#ffd23f', { stroke: 6 }); }
    // the shopkeeper leans over the counter and stares
    if (st > ex && st < ex + 1.2) s += text(990, 820, '?!', 110, '#ff3b2f', { extra: `transform="rotate(10 990 820)"` });
    let out = cam(lerp(1.0, 1.1, ease(clamp(st / 6, 0, 1))), 600, 1150, s);
    if (st > cd) {
      const a = st - cd, k = easeOut(a / 0.35);
      const z = lerp(1.0, 1.1, ease(clamp(st / 6, 0, 1)));
      const sx = 540 + (hx - 600) * z, sy = 960 + (hy - 40 - 1150) * z;
      const r = 130, c = 2 * Math.PI * r;
      out += `<ellipse cx="${sx}" cy="${sy}" rx="${r * 1.2}" ry="${r}" fill="none" stroke="#ff3b2f" stroke-width="14" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - k)}" transform="rotate(-10 ${sx} ${sy})" stroke-linecap="round"/>`;
      out += `<g transform="translate(${sx - 60},${sy - 200}) scale(${back(clamp(a / 0.25, 0, 1))}) rotate(-6)">` + text(0, 0, 'NOT PAID', 90, '#ff3b2f') + `</g>`;
    }
    return out;
  }

  // ======================= AIR LEFT countdown (runs across shots) =======================
  function overlay(t, shot, ctx) {
    const h = ctx.TL.hud;
    if (!h) return '';
    const s0 = ctx.byId[h.startShot], s1 = ctx.byId[h.endShot];
    const t0 = s0.start + s0.cues[h.startCue] + 0.4, t1 = s1.start + s1.cues[h.endCue];
    if (t < t0 || t > t1 + 0.6) return '';
    const f = clamp((t - t0) / (t1 - t0), 0, 1);
    const rem = Math.max(0, Math.round(h.seconds * (1 - f * 0.985)));
    const col = f < 0.5 ? '#8ac926' : f < 0.8 ? '#ffd23f' : '#ff3b30';
    const blink = f > 0.8 && Math.floor(t * 4) % 2 ? 0.5 : 1;
    const a = clamp((t - t0) / 0.25, 0, 1) * clamp((t1 + 0.6 - t) / 0.3, 0, 1);
    const done = t > t1;
    let s = `<g opacity="${a * blink}"><rect x="690" y="236" width="350" height="96" rx="16" fill="${INK}" opacity="0.92"/>`;
    s += `<text x="712" y="276" font-family="Montserrat" font-weight="900" font-size="28" fill="#fff">AIR LEFT</text>`;
    s += `<text x="1020" y="278" text-anchor="end" font-family="Montserrat" font-weight="900" font-size="34" fill="${done ? '#8ac926' : col}">${done ? 'OK!' : `${Math.floor(rem / 60)}:${String(rem % 60).padStart(2, '0')}`}</text>`;
    s += `<rect x="712" y="294" width="306" height="22" rx="11" fill="#3a3a48"/><rect x="712" y="294" width="${done ? 306 : 306 * (1 - f)}" height="22" rx="11" fill="${done ? '#8ac926' : col}"/></g>`;
    return s;
  }

  root.Scenes = { shop, fantasy, twomin, dark, air, lungs, scream, stuck, end, __overlay: overlay };
})(window);
