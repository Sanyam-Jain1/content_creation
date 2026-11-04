// EP02 "What if you could eat sunlight?" scene art.
(function (root) {
  'use strict';
  const K = root.Kit;
  const { W, H, INK, C, clamp, lerp, ease, easeOut, easeIn, back, hash, p, rad, R, ink, g, shade, limb, circ, person, sidePerson, burst, vignette, halftone, rays, text } = K;
  const GREEN = '#7ac74f';
  const HERO = { skin: GREEN, shirt: '#ffd23f', pants: '#3a4a8a', hair: 'tuft', hairColor: '#3b2a20' };
  const cue = (shot, k, d = 99) => (shot.cues && shot.cues[k] != null ? shot.cues[k] : d);
  const cam = (z, cx, cy, inner) => `<g transform="translate(540,960) scale(${z}) translate(${-cx},${-cy})">${inner}</g>`;
  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const c = [16, 8, 0].map((sh) => Math.round(lerp((pa >> sh) & 255, (pb >> sh) & 255, t)));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  // a sprout on top of a head (hx, top y, scale, wilt 0..1)
  function sprout(x, y, s = 1, wilt = 0, wave = 0) {
    const r = wilt * 70 + Math.sin(wave) * 6;
    return g(`translate(${x},${y}) scale(${s}) rotate(${r})`,
      `<path d="M0,0 Q4,-40 0,-70" fill="none" stroke="#3f8f2f" stroke-width="10" stroke-linecap="round"/>` +
      `<path d="M0,-60 C-60,-100 -90,-50 -80,-30 C-50,-30 -20,-40 0,-60Z" fill="#8ad65b" ${ink(6)}/>` +
      `<path d="M0,-66 C50,-120 95,-70 84,-46 C54,-40 20,-48 0,-66Z" fill="#8ad65b" ${ink(6)}/>`);
  }
  function sun(x, y, r, t, face = true) {
    let s = '';
    for (let i = 0; i < 12; i++) {
      const a = rad(i * 30 + t * 20);
      s += `<line x1="${x + Math.cos(a) * (r + 20)}" y1="${y + Math.sin(a) * (r + 20)}" x2="${x + Math.cos(a) * (r + 70)}" y2="${y + Math.sin(a) * (r + 70)}" stroke="#ffb703" stroke-width="18" stroke-linecap="round"/>`;
    }
    s += circ(x, y, r, '#ffd23f', ink(8));
    if (face) s += circ(x - r * 0.3, y - r * 0.1, r * 0.08, INK) + circ(x + r * 0.3, y - r * 0.1, r * 0.08, INK) + `<path d="M${x - r * 0.3},${y + r * 0.25} Q${x},${y + r * 0.5} ${x + r * 0.3},${y + r * 0.25}" ${ink(6)} fill="none"/>`;
    return s;
  }
  function battery(x, y, w, h, frac, label, col) {
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#fff" ${ink(8)}/><rect x="${x + w}" y="${y + h * 0.3}" width="18" height="${h * 0.4}" rx="6" fill="${INK}"/>`;
    s += `<rect x="${x + 12}" y="${y + 12}" width="${Math.max(6, (w - 24) * frac)}" height="${h - 24}" rx="8" fill="${col || (frac < 0.2 ? '#ff3b30' : '#8ac926')}"/>`;
    if (label) s += `<text x="${x + w / 2}" y="${y + h / 2 + 18}" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="${h * 0.45}" fill="${INK}">${label}</text>`;
    return s;
  }
  function grassPark(t) {
    let s = R(0, 0, W, H, '#9ad7ff');
    s += `<path d="M0,300 q120,-40 220,0 q100,-50 200,0 h-420z" fill="#fff" opacity="0.8"/>`;
    s += `<path d="M-50,1150 C300,1080 700,1160 1130,1100 L1130,1920 L-50,1920Z" fill="#8ac926" ${ink(6)}/>`;
    for (let i = 0; i < 30; i++) { const x = hash(i) * W, y = 1200 + hash(i + 3) * 700; s += `<path d="M${x},${y} l6,-22 l6,22" fill="none" stroke="#5d9c1c" stroke-width="5"/>`; }
    return s;
  }

  // ======================= hook: you wake up green =======================
  function mirror(st, shot) {
    const gr = cue(shot, 'green', 1.6), pl = cue(shot, 'plant', 5);
    const k = clamp((st - gr) / 0.5, 0, 1);
    let s = R(0, 0, W, H, '#cdeefb');
    for (let y = 0; y < H; y += 120) for (let x = (y / 120) % 2 ? 60 : 0; x < W; x += 120) s += R(x, y, 116, 116, '#bfe6f7');
    s += `<ellipse cx="540" cy="1080" rx="360" ry="480" fill="#c9a24a" ${ink(10)}/><ellipse cx="540" cy="1080" rx="320" ry="440" fill="#e8f7ff"/>`;
    s += `<clipPath id="mir"><ellipse cx="540" cy="1080" rx="320" ry="440"/></clipPath>`;
    const skin = mix(C.skin[0], GREEN, k);
    const P = person(Object.assign({}, HERO, { skin, x: 540, y: 1900, s: 1.9, expr: st < gr ? 'relaxed' : st < pl ? 'shock' : 'happy', armR: [40, 150], armL: [10, 5], pj: false, shirt: '#ffd23f' }));
    let inner = P.svg;
    // toothbrush
    const h = P.hands.r, hx = 540 + h[0] * 1.9, hy = 1900 + h[1] * 1.9;
    inner += `<rect x="${hx - 12}" y="${hy - 180}" width="24" height="170" rx="10" fill="#2ec4b6" ${ink(5)}/><rect x="${hx - 16}" y="${hy - 200}" width="32" height="34" rx="6" fill="#fff" ${ink(5)}/>`;
    if (k > 0) inner += sprout(540, 1900 - 350 * 1.9 - 140, 1.4 * easeOut(k), 0, st * 3);
    s += `<g clip-path="url(#mir)">${inner}</g>`;
    s += `<ellipse cx="420" cy="820" rx="40" ry="110" fill="#fff" opacity="0.4" transform="rotate(25 420 820)"/>`;
    // sink
    s += `<path d="M120,1560 L960,1560 L900,1760 L180,1760Z" fill="#fff" ${ink(8)}/>` + R(500, 1500, 80, 70, '#b9bcc6', ink(6));
    if (st > gr && st - gr < 0.5) s += burst(540, 1000, 420 * easeOut((st - gr) / 0.25), 14, '#d8ff8a', st * 60);
    for (let i = 0; i < 8 && st > gr; i++) { const a = rad(i * 45 + st * 40), r = 380 + Math.sin(st * 3 + i) * 30; s += text(540 + Math.cos(a) * r, 1080 + Math.sin(a) * r * 1.2, '✦', 44, '#ffd23f', { stroke: 6 }); }
    return cam(lerp(1.05, 1.0, easeOut(st / 1.5)), 540, 1000, s);
  }

  // ======================= the dream: lunch = standing outside =======================
  function dream(st, shot) {
    const gro = cue(shot, 'groceries', 0.25), coo = cue(shot, 'cooking', 1.3), lun = cue(shot, 'lunch', 3.4);
    let s = grassPark(st);
    s += sun(860, 470, 110, st);
    const icon = (x, at, inner) => {
      if (st < at) return '';
      const k = back(clamp((st - at) / 0.22, 0, 1)), xk = easeOut(clamp((st - at - 0.15) / 0.2, 0, 1));
      return `<g transform="translate(${x},700) scale(${k})">${circ(0, 0, 130, '#fff', ink(8))}${inner}<path d="M-90,-90 L${-90 + 180 * xk},${-90 + 180 * xk} M90,-90 L${90 - 180 * xk},${-90 + 180 * xk}" stroke="#e8262b" stroke-width="26" stroke-linecap="round"/></g>`;
    };
    const fade = st > lun ? clamp(1 - (st - lun) / 0.3, 0, 1) : 1;
    s += `<g opacity="${fade}">` + icon(300, gro, `<path d="M-70,-40 L60,-40 L45,30 L-55,30Z" fill="#ff7a59" ${ink(7)}/><path d="M-90,-60 L-70,-40" ${ink(8)}/>` + circ(-40, 55, 14, INK) + circ(30, 55, 14, INK)) +
      icon(780, coo, `<ellipse cx="-10" cy="0" rx="70" ry="40" fill="#555" ${ink(7)}/><rect x="55" y="-10" width="80" height="20" rx="8" fill="#3b2a20" ${ink(6)}/><ellipse cx="-10" cy="-6" rx="30" ry="18" fill="#fff" ${ink(4)}/>` + circ(-10, -6, 10, '#ffd23f')) + `</g>`;
    if (st >= lun) {
      const a = st - lun;
      const ppl = [[200, 1500, 0.95, 1], [540, 1560, 1.1, 0], [880, 1500, 0.95, 3], [370, 1300, 0.75, 4], [710, 1300, 0.75, 2]];
      ppl.sort((u, v) => u[1] - v[1]).forEach(([x, y, sc, i], j) => {
        const k = back(clamp((a - j * 0.08) / 0.3, 0, 1));
        s += `<g transform="translate(${x},${y}) scale(${k}) translate(${-x},${-y})">` + person({ x, y, s: sc, skin: GREEN, shirt: C.shirts[i + 2], pants: '#3a4a8a', hair: ['tuft', 'long', 'curly', 'short', 'bun'][i], hairColor: C.hair[i], expr: 'relaxed', armL: [120 + Math.sin(a * 2 + i) * 6, 125], armR: [120 + Math.sin(a * 2 + i) * 6, 125] }).svg + sprout(x, y - 470 * sc, sc, 0, a * 2 + i) + `</g>`;
      });
      s += `<g transform="translate(540,560) scale(${back(clamp(a / 0.3, 0, 1))}) rotate(-4)"><rect x="-260" y="-70" width="520" height="110" rx="20" fill="#fff" ${ink(8)}/>` + text(0, 14, 'LUNCH BREAK', 70, '#3f8f2f', { stroke: 0 }) + `</g>`;
    }
    return s;
  }

  // ======================= the math =======================
  function math(st, shot) {
    const m = cue(shot, 'math', 2.3);
    let s = R(0, 0, W, H, '#f6d6a2');
    s += `<rect x="70" y="440" width="940" height="620" rx="18" fill="#2f5d3a" stroke="#8a5a3c" stroke-width="22"/>`;
    const lines = ['skin area: 1.8 m²', 'sunlight: ~1000 W/m²', 'efficiency: ~1-2%', 'need: 2000 kcal/day'];
    lines.forEach((ln, i) => {
      const at = 0.3 + i * 0.45;
      if (st < at) return;
      const n = Math.floor(clamp((st - at) / 0.4, 0, 1) * ln.length);
      s += `<text x="120" y="${560 + i * 110}" font-family="'Luckiest Guy'" font-size="62" fill="#f4f1ea" opacity="0.92">${K.esc(ln.slice(0, n))}</text>`;
    });
    const P = person(Object.assign({}, HERO, { x: 540, y: 1900, s: 1.5, expr: st > m ? 'shock' : 'focus', armR: [30, 110], armL: [30, 110] }));
    s += P.svg + sprout(540, 1900 - 470 * 1.5, 1.4, st > m ? 0.6 : 0, st * 2);
    const hx = 540 + (P.hands.r[0] + P.hands.l[0]) / 2 * 1.5, hy = 1900 + P.hands.r[1] * 1.5;
    s += `<g transform="translate(${hx},${hy + 70})"><rect x="-110" y="-150" width="220" height="250" rx="24" fill="#3a3f4d" ${ink(8)}/><rect x="-85" y="-125" width="170" height="70" rx="10" fill="${st > m ? '#ff3b30' : '#bde9c4'}"/>` +
      `<text x="0" y="-74" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="40" fill="${INK}">${st > m ? 'ERROR' : '1.8×1000'}</text>` +
      [0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${-80 + c * 58}" y="${-35 + r * 45}" width="44" height="34" rx="8" fill="#ffd23f"/>`).join('')).join('') + `</g>`;
    if (st > m) s += text(860, 1180, '?!', 130, '#ff3b30', { extra: `transform="rotate(12 860 1180)"` });
    return s;
  }

  // ======================= your skin = one door =======================
  function skin(st, shot) {
    const d = cue(shot, 'door', 2.2);
    let s = R(0, 0, W, H, '#fbe7b5');
    for (let x = 0; x < W; x += 80) s += R(x, 0, 40, 1300, '#f6dda3', 'opacity="0.7"');
    s += R(0, 1300, W, 620, '#c98f5a', ink(6));
    // the door
    s += R(100, 500, 360, 800, '#f4f1ea', ink(8)) + R(120, 520, 320, 780, '#c27a45', ink(6)) + R(160, 570, 240, 280, '#b06b3a', ink(5)) + R(160, 900, 240, 340, '#b06b3a', ink(5)) + circ(410, 920, 18, '#ffd23f', ink(5));
    // the unrolled skin, flapping a little like a sheet on a line
    const k = easeOut(clamp(st / 0.6, 0, 1));
    let d1 = `M620,520 `;
    for (let i = 0; i <= 8; i++) d1 += `L${620 + i * 40},${520 + Math.sin(st * 4 + i) * 8} `;
    d1 += `L940,${1280} `;
    for (let i = 8; i >= 0; i--) d1 += `L${620 + i * 40},${1280 + Math.sin(st * 4 + i + 1) * 8} `;
    s += `<g transform="translate(780,900) scale(1,${k}) translate(-780,-900)"><path d="${d1}Z" fill="${GREEN}" ${ink(8)}/>`;
    for (let i = 0; i < 20; i++) s += circ(650 + hash(i) * 260, 560 + hash(i + 4) * 680, 5, '#5a9e35');
    s += `<line x1="600" y1="510" x2="960" y2="510" stroke="#6b6b6b" stroke-width="8"/>` + R(660, 496, 16, 40, '#ff7a59', ink(4)) + R(890, 496, 16, 40, '#ff7a59', ink(4)) + `</g>`;
    s += text(780, 470, 'YOUR SKIN', 64, GREEN);
    s += text(280, 470, 'A DOOR', 64, '#fff');
    if (st > d) {
      const kk = back(clamp((st - d) / 0.25, 0, 1));
      s += `<g transform="translate(530,900) scale(${kk})">` + circ(0, 0, 70, '#ffd23f', ink(8)) + text(0, 30, '=', 110, INK, { stroke: 0 }) + `</g>`;
      s += `<g transform="translate(540,1180) scale(${kk}) rotate(-3)"><rect x="-190" y="-60" width="380" height="96" rx="16" fill="${INK}"/>` + text(0, 12, '≈ 1.8 m²', 64, '#ffd23f', { stroke: 0 }) + `</g>`;
    }
    return s;
  }

  // ======================= sunbathe all day: 1% =======================
  function sunbathe(st, shot) {
    const one = cue(shot, 'one', 3.6);
    const dayT = clamp(st / (one + 0.4), 0, 1);
    const sky = mix('#9ad7ff', '#ff9e6d', clamp((dayT - 0.6) / 0.4, 0, 1));
    let s = R(0, 0, W, H, sky);
    const sx = lerp(80, 1000, dayT), sy = 700 - Math.sin(dayT * Math.PI) * 120;
    s += sun(sx, sy, 90, st);
    s += R(0, 820, W, 120, '#3fa7d6') + `<path d="M0,820 ${Array.from({ length: 12 }, (_, i) => `q45,${i % 2 ? 18 : -18} 90,0`).join(' ')}" fill="none" stroke="#fff" stroke-width="6"/>`;
    s += R(0, 930, W, 990, '#f4d58d', ink(6));
    s += `<rect x="200" y="1000" width="720" height="200" rx="12" fill="#ff595e" ${ink(6)}/>` + [0, 1, 2, 3].map((i) => R(260 + i * 160, 1000, 60, 200, '#fff', 'opacity="0.6"')).join('');
    const P = person(Object.assign({}, HERO, { x: 880, y: 1100, s: 1.05, rot: -90, expr: 'relaxed', armL: [10, 5], armR: [10, 5], shirt: '#ff7a59', sleeve: 'short' }));
    s += P.svg;
    // sunglasses on the lying head (head centre is 350 to the left of the feet)
    s += `<g transform="rotate(-90 ${880 - 350 * 1.05} 1100)">` + circ(880 - 350 * 1.05 - 29, 1100 - 6, 20, INK) + circ(880 - 350 * 1.05 + 29, 1100 - 6, 20, INK) + `</g>`;
    s += sprout(880 - 350 * 1.05 - 130, 1100, 1.0, -1.3, st * 2);
    // timelapse clock + battery
    const hour = Math.floor(lerp(7, 19, dayT));
    s += `<g><rect x="60" y="440" width="300" height="90" rx="16" fill="${INK}" opacity="0.9"/><text x="210" y="502" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="48" fill="#ffd23f">${String(hour).padStart(2, '0')}:00 ▶▶</text></g>`;
    const frac = st > one ? 0.01 : 0.01 * dayT;
    s += battery(600, 440, 360, 120, Math.max(0.02, frac), st > one ? '1%' : '', st > one ? '#ff3b30' : '#8ac926');
    s += `<text x="780" y="610" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="34" fill="${INK}">ENERGY TODAY</text>`;
    if (st < one) s += `<path d="M770,470 L740,510 L775,510 L750,550" fill="none" stroke="#ffd23f" stroke-width="10" stroke-linejoin="round" opacity="${0.5 + 0.5 * Math.sin(st * 8)}"/>`;
    return s;
  }

  // ======================= two crackers =======================
  function crackers(st, shot) {
    const c = cue(shot, 'crackers', 2.3);
    let s = R(0, 0, W, H, '#ffe08a');
    s += halftone('ht4', '#ffffff', 0.4, 32);
    const P = person(Object.assign({}, HERO, { x: 540, y: 1500, s: 1.25, expr: st > c ? 'worried' : 'neutral', sweat: st > c + 0.6, armL: [20, 40], armR: [20, 40] }));
    s += P.svg + sprout(540, 1500 - 470 * 1.25, 1.2, st > c ? 0.9 : 0, st * 2);
    s += R(0, 1250, W, 670, '#a8693f', ink(8)) + R(0, 1250, W, 30, '#c27a45');
    s += `<ellipse cx="540" cy="1320" rx="300" ry="70" fill="#fff" ${ink(8)}/><ellipse cx="540" cy="1315" rx="200" ry="40" fill="#f1ece4"/>`;
    const cr = (x, at) => {
      if (st < at) return '';
      const a = st - at;
      const y = a < 0.2 ? lerp(700, 1295, easeIn(a / 0.2)) : 1295 - Math.abs(Math.sin((a - 0.2) * 14)) * 30 * Math.exp(-(a - 0.2) * 6);
      return `<g transform="translate(${x},${y}) rotate(${hash(x) * 20 - 10}) scale(1,0.45)"><rect x="-70" y="-70" width="140" height="140" rx="14" fill="#f2c26b" ${ink(8)}/>` + [[-35, -35], [0, -35], [35, -35], [-35, 0], [0, 0], [35, 0], [-35, 35], [0, 35], [35, 35]].map(([dx, dy]) => circ(dx, dy, 6, '#c98f3a')).join('') + `</g>`;
    };
    s += cr(470, c) + cr(610, c + 0.12);
    if (st > c) {
      const k = back(clamp((st - c) / 0.3, 0, 1));
      s += `<g transform="translate(540,620) scale(${k}) rotate(-4)"><rect x="-370" y="-80" width="740" height="130" rx="20" fill="${INK}"/>` + text(0, 20, '1 DAY OF SUN =', 84, '#ffd23f', { stroke: 0 }) + `</g>`;
    }
    return s;
  }

  // ======================= a tennis court of skin =======================
  function tennis(st, shot) {
    const c = cue(shot, 'court', 2.8);
    const z = st < c ? 3.0 : Math.exp(lerp(Math.log(3.0), Math.log(0.95), ease(clamp((st - c) / 0.8, 0, 1))));
    let w = R(-2000, -2000, 5000, 6000, '#c86b3c');
    // court (doubles 10.97 x 23.77 m) drawn at 34 px/m
    const cw = 10.97 * 64, ch = 23.77 * 52, x0 = 540 - cw / 2, y0 = 1000 - ch / 2;
    const skinK = st < c ? 0 : clamp((st - c) / 0.6, 0, 1);
    w += R(x0 - 60, y0 - 60, cw + 120, ch + 120, '#3d8b5a');
    w += `<rect x="${x0}" y="${y0}" width="${cw}" height="${ch}" fill="${mix('#3d8b5a', GREEN, skinK)}"/>`;
    for (let i = 0; i < 60 * skinK; i++) w += circ(x0 + hash(i) * cw, y0 + hash(i + 7) * ch, 6, '#5a9e35');
    w += `<rect x="${x0}" y="${y0}" width="${cw}" height="${ch}" fill="none" stroke="#fff" stroke-width="10"/>` +
      `<line x1="${x0 + cw * 0.125}" y1="${y0}" x2="${x0 + cw * 0.125}" y2="${y0 + ch}" stroke="#fff" stroke-width="7"/><line x1="${x0 + cw * 0.875}" y1="${y0}" x2="${x0 + cw * 0.875}" y2="${y0 + ch}" stroke="#fff" stroke-width="7"/>` +
      `<line x1="${x0 + cw * 0.125}" y1="${y0 + ch * 0.27}" x2="${x0 + cw * 0.875}" y2="${y0 + ch * 0.27}" stroke="#fff" stroke-width="7"/><line x1="${x0 + cw * 0.125}" y1="${y0 + ch * 0.73}" x2="${x0 + cw * 0.875}" y2="${y0 + ch * 0.73}" stroke="#fff" stroke-width="7"/>` +
      `<line x1="${x0 + cw / 2}" y1="${y0 + ch * 0.27}" x2="${x0 + cw / 2}" y2="${y0 + ch * 0.73}" stroke="#fff" stroke-width="7"/>` +
      `<line x1="${x0 - 50}" y1="${y0 + ch / 2}" x2="${x0 + cw + 50}" y2="${y0 + ch / 2}" stroke="${INK}" stroke-width="14"/>`;
    // tiny hero in the middle, attached by the shoulders
    w += person(Object.assign({}, HERO, { x: 540, y: 1060, s: 0.22, expr: 'shock', armL: [90, 90], armR: [90, 90] })).svg;
    w += sprout(540, 1060 - 470 * 0.22, 0.25);
    // tennis ball flying past
    const bx = -100 + ((st * 900) % 1400);
    w += circ(bx, 700 + Math.sin(st * 6) * 60, 14, '#e6ff3f', ink(4));
    return cam(z, 540, 1000 - (z - 1) * 10, w);
  }

  // ======================= giant flappy skin cape =======================
  function cape(st, shot) {
    const cp = cue(shot, 'cape', 3.9);
    let s = R(0, 0, W, H, '#9ad7ff');
    s += R(0, 1300, W, 620, '#c9c3b8', ink(6)) + R(0, 1500, W, 420, '#55545c');
    for (let i = 0; i < 6; i++) s += R(i * 200 - ((st * 80) % 200), 900 - (i % 3) * 120, 160, 400 + (i % 3) * 120, ['#f4a259', '#bc4b51', '#5b8e7d'][i % 3], ink(6));
    const lift = st > cp ? easeOut(clamp((st - cp) / 0.8, 0, 1)) * 420 : 0;
    const hx = 760, hy = 1420 - lift;
    // the cape: a huge waving sheet tied to the shoulders, streaming left in the wind
    let d = `M${hx - 40},${hy - 300} `;
    const N = 10;
    for (let i = 1; i <= N; i++) d += `L${hx - 40 - i * 110},${hy - 300 - 250 + Math.sin(st * 6 - i * 0.7) * (40 + i * 8) - i * 10} `;
    for (let i = N; i >= 1; i--) d += `L${hx - 40 - i * 110},${hy - 300 + 420 + Math.sin(st * 6 - i * 0.7 + 0.6) * (40 + i * 8) - i * 6} `;
    d += `L${hx - 30},${hy - 230}Z`;
    s += `<path d="${d}" fill="${GREEN}" ${ink(8)}/>`;
    for (let i = 0; i < 25; i++) s += circ(hx - 120 - hash(i) * 900, hy - 420 + hash(i + 3) * 500, 6, '#5a9e35');
    s += sidePerson(Object.assign({}, HERO, { x: hx, y: hy, s: 0.85, mode: st > cp ? 'tiptoe' : 'walk', phase: st * 6, lean: -18, expr: st > cp ? 'shock' : 'strain' }));
    s += sprout(hx + 14, hy - 410 * 0.85 - 60, 0.8, -0.8, st * 4);
    for (let i = 0; i < 6; i++) { const y = 500 + i * 140, x = ((1300 - st * 1600 - i * 300) % 1400 + 1400) % 1400 - 200; s += `<path d="M${x},${y} q60,-30 120,0 t120,0" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="0.8"/>`; }
    return s;
  }

  // ======================= one cloudy week =======================
  function weather(st, shot) {
    const cl = cue(shot, 'cloudy', 0.45), sv = cue(shot, 'starve', 1.6);
    let s = R(0, 0, W, H, st > cl ? '#7d8597' : '#9ad7ff');
    s += R(0, 1300, W, 620, '#6a8f4a', ink(6));
    const cloud = (x, y, sc) => g(`translate(${x},${y}) scale(${sc})`, `<path d="M-160,40 q-60,-80 20,-110 q30,-90 140,-60 q80,-60 150,20 q90,0 70,90 z" fill="#c5cad6" ${ink(8)}/>`);
    if (st > cl) {
      s += cloud(300, 560, 1.4) + cloud(780, 640, 1.2);
      for (let i = 0; i < 40; i++) { const x = hash(i) * W, y = (600 + hash(i + 3) * 1300 + st * 1400) % 1300 + 620; s += `<line x1="${x}" y1="${y}" x2="${x - 10}" y2="${y + 40}" stroke="#d6ecff" stroke-width="5"/>`; }
    }
    const wilt = st > sv ? clamp((st - sv) / 0.6, 0, 1) : 0;
    const P = person(Object.assign({}, HERO, { x: 540, y: 1580, s: 1.25, rot: wilt * 6, expr: st > sv ? 'pain' : 'worried', armL: [8, 4], armR: [8, 4] }));
    s += P.svg + sprout(540 + wilt * 30, 1580 - 470 * 1.25, 1.2, 0.2 + wilt, 0);
    const frac = st < cl ? 0.6 : Math.max(0, 0.6 - (st - cl) * 0.5);
    s += battery(360, 900, 360, 120, Math.max(0.02, frac), st > sv ? '0%' : '', frac < 0.2 ? '#ff3b30' : '#ffd23f');
    if (st > cl) s += `<g><rect x="250" y="440" width="580" height="90" rx="16" fill="${INK}" opacity="0.9"/>` + ['MON', 'TUE', 'WED', 'THU', 'FRI'].map((d, i) => `<text x="${310 + i * 115}" y="500" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="34" fill="${st - cl > i * 0.25 ? '#9aa0b4' : '#fff'}">${d}</text>`).join('') + `</g>`;
    return s;
  }

  // ======================= why trees don't go jogging =======================
  function tree(x, y, s, o = {}) {
    let q = '';
    const leg = (sd) => {
      const a = o.run ? Math.sin(o.phase + (sd > 0 ? Math.PI : 0)) * 30 : 0;
      const k = [sd * 30 + Math.sin(rad(a)) * 70, 70 + Math.cos(rad(a)) * 70];
      return limb([[sd * 30, 0], k], 22, '#8a5a3c') + `<ellipse cx="${k[0] + 16}" cy="${k[1] + 6}" rx="34" ry="16" fill="#ff4d3d" ${ink(5)}/>`;
    };
    if (!o.lying) q += leg(-1) + leg(1);
    q += `<rect x="-60" y="-260" width="120" height="270" rx="30" fill="#a8693f" ${ink(8)}/>`;
    for (const [cx, cy, r] of [[-110, -330, 110], [100, -330, 110], [0, -430, 140], [0, -300, 120]]) q += circ(cx, cy, r, '#4caf50', ink(8));
    q += `<rect x="-62" y="-210" width="124" height="26" fill="#ff4d3d"/>`;
    q += K.face(0, -120, 60, { expr: o.expr || 'determined', look: [1, 0] });
    if (o.sweat) q += `<path d="M70,-170 q12,22 0,30 q-12,-8 0,-30Z" fill="#8fd3ff" ${ink(4)}/>`;
    return g(`translate(${x},${y}) rotate(${o.rot || 0}) scale(${s})`, q);
  }
  function trees(st, shot) {
    const jg = cue(shot, 'jog', 1.7), af = cue(shot, 'afford', 3.8);
    let s = R(0, 0, W, H, '#8ac926') + '<g transform="translate(0,-220)">' + grassPark(st) + '</g>';
    s += sun(860, 520, 80, st);
    s += '<g transform="translate(0,-220)">';
    // path
    s += `<path d="M-50,1400 C300,1340 700,1460 1130,1380 L1130,1520 C700,1600 300,1480 -50,1540Z" fill="#e9d8a6" ${ink(6)}/>`;
    // bench with the hero relaxing in the sun
    s += R(80, 1180, 360, 30, '#a8693f', ink(6)) + R(100, 1210, 20, 110, '#6b6b6b') + R(400, 1210, 20, 110, '#6b6b6b') + R(80, 1100, 360, 26, '#a8693f', ink(6));
    s += person(Object.assign({}, HERO, { x: 260, y: 1320, s: 0.8, legs: 'sit', expr: 'relaxed', armL: [30, 60], armR: [30, 60] })).svg + sprout(260, 1320 - 470 * 0.8, 0.8, 0, st * 2);
    const fall = clamp((st - jg) / 0.4, 0, 1);
    if (st < jg) s += tree(lerp(1200, 760, clamp(st / jg, 0, 1)), 1420 - Math.abs(Math.sin(st * 9)) * 30, 0.9, { run: true, phase: st * 9, expr: 'determined', sweat: true });
    else s += tree(1010, 1430, 0.9, { rot: lerp(0, -80, easeIn(fall)), expr: 'pain', lying: fall >= 1 });
    if (st > jg + 0.4) s += text(560, 1180, 'Zzz', 70, '#fff');
    if (st > af) {
      const k = back(clamp((st - af) / 0.25, 0, 1));
      s += `<g transform="translate(700,900) scale(${k})">` + battery(-170, -60, 340, 110, 0.03, 'ENERGY', '#ff3b30') + `</g>`;
    }
    return s + '</g>';
  }

  root.Scenes = { mirror, dream, math, skin, sunbathe, crackers, tennis, cape, weather, trees };
})(window);
