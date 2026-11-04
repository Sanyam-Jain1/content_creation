// Scene art. Each scene is (st, shot, ctx) -> SVG string for the full 1080x1920 frame.
// st = seconds into the shot; shot.cues = named moments (seconds from shot start)
// resolved from spoken words at build time, so the action lands on the line.
(function (root) {
  'use strict';
  const K = root.Kit;
  const { W, H, INK, C, clamp, lerp, ease, easeOut, easeIn, back, hash, p, rad, R, ink, g, shade, limb, circ, person, sidePerson, mini, phone, crack, burst, speedLines, vignette, halftone, rays, text } = K;
  const HERO = { skin: C.skin[0], shirt: '#4d7cfe', pants: '#3a4a8a', hair: 'tuft', hairColor: '#3b2a20', pj: true };
  const cue = (shot, k, d = 99) => (shot.cues && shot.cues[k] != null ? shot.cues[k] : d);
  const cam = (z, cx, cy, inner) => `<g transform="translate(540,960) scale(${z}) translate(${-cx},${-cy})">${inner}</g>`;

  // ---------------- shared sets ----------------
  function bedroomWall(night) {
    const wall = night ? '#22305e' : '#f6d6a2';
    let s = R(0, 0, W, H, wall);
    for (let x = 0; x < W; x += 72) s += R(x, 0, 36, H, shade(wall, night ? 0.05 : -0.04), 'opacity="0.6"');
    s += R(0, 1300, W, H - 1300, night ? '#1a2246' : '#c98f5a');
    s += R(0, 1290, W, 20, night ? '#2c3a70' : '#e7b07a');
    return s;
  }
  function windowNight(x, y, w, h, t) {
    let s = R(x - 20, y - 20, w + 40, h + 40, '#3a4a86', ink(8));
    s += R(x, y, w, h, '#0f1636');
    for (let i = 0; i < 14; i++) {
      const sx = x + 20 + hash(i) * (w - 40), sy = y + 20 + hash(i + 30) * (h - 40);
      const tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
      s += circ(sx, sy, 3 + hash(i + 5) * 3, '#fff6c8', `opacity="${0.4 + tw * 0.6}"`);
    }
    s += `<defs><radialGradient id="moonglow"><stop offset="0.4" stop-color="#fff3c4" stop-opacity="0.5"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient></defs>`;
    s += circ(x + w * 0.66, y + h * 0.32, 120, 'url(#moonglow)');
    s += circ(x + w * 0.66, y + h * 0.32, 62, '#fff3c4', ink(6)) + circ(x + w * 0.66 + 26, y + h * 0.32 - 18, 62, '#0f1636');
    s += R(x + w / 2 - 8, y, 16, h, '#3a4a86') + R(x, y + h / 2 - 8, w, 16, '#3a4a86');
    // curtains
    s += `<path d="M${x - 60},${y - 40} L${x + 70},${y - 40} Q${x + 30},${y + h / 2} ${x + 60},${y + h + 40} L${x - 60},${y + h + 40}Z" fill="#7b3f8f" ${ink(7)}/>`;
    s += `<path d="M${x + w + 60},${y - 40} L${x + w - 70},${y - 40} Q${x + w - 30},${y + h / 2} ${x + w - 60},${y + h + 40} L${x + w + 60},${y + h + 40}Z" fill="#7b3f8f" ${ink(7)}/>`;
    return s;
  }
  function windowDay(x, y, w, h) {
    let s = R(x - 20, y - 20, w + 40, h + 40, '#fff3dc', ink(8));
    s += R(x, y, w, h, '#8fd3ff');
    s += circ(x + w * 0.3, y + h * 0.3, 54, '#ffe066', ink(6));
    s += `<path d="M${x + w * 0.5},${y + h * 0.62} q30,-40 70,-10 q30,-30 60,0 q30,0 20,30 h-150z" fill="#fff" ${ink(5)}/>`;
    s += R(x + w / 2 - 8, y, 16, h, '#fff3dc') + R(x, y + h / 2 - 8, w, 16, '#fff3dc');
    return s;
  }
  function clockFace(x, y, w, h, txt, o = {}) {
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h * 0.22}" fill="${o.body || '#ff7a59'}" ${ink(8)}/>`;
    s += `<rect x="${x + w * 0.09}" y="${y + h * 0.16}" width="${w * 0.82}" height="${h * 0.66}" rx="${h * 0.1}" fill="#14121a"/>`;
    s += `<text x="${x + w / 2}" y="${y + h * 0.7}" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="${h * 0.52}" fill="#ff3b30" letter-spacing="4" opacity="${o.dim ?? 1}">${txt}</text>`;
    if (o.cracked) s += crack(x + w * 0.62, y + h * 0.45, h * 0.5, 7, 1, '#e8e8e8', 4);
    return s;
  }
  function zzz(x, y, t) {
    let s = '';
    for (let i = 0; i < 3; i++) {
      const ph = ((t * 0.7 + i / 3) % 1);
      s += text(x + ph * 90 + Math.sin(ph * 6) * 10, y - ph * 200, 'Z', 44 + ph * 40, '#fff', { stroke: 8, extra: `opacity="${Math.sin(ph * Math.PI)}"` });
    }
    return s;
  }
  function car(x, y, s, col = '#ff4d3d') {
    return g(`translate(${x},${y}) scale(${s})`,
      `<path d="M-150,0 L-150,-50 Q-140,-70 -100,-75 L-60,-120 L60,-120 L100,-75 Q145,-70 150,-50 L150,0Z" fill="${col}" ${ink(8)}/>` +
      `<path d="M-48,-108 L-80,-76 L-6,-76 L-6,-108Z M10,-108 L10,-76 L84,-76 L52,-108Z" fill="#bfe8ff" ${ink(5)}/>` +
      circ(-90, 4, 30, INK) + circ(-90, 4, 12, '#ccc') + circ(90, 4, 30, INK) + circ(90, 4, 12, '#ccc'));
  }

  // ======================= 1. HOOK: asleep at night =======================
  function night(st, shot) {
    const z = lerp(1.0, 1.14, ease(clamp(st / 4.8, 0, 1)));
    let s = bedroomWall(true);
    s += windowNight(560, 520, 380, 400, st);
    // bed
    s += `<rect x="40" y="820" width="90" height="520" rx="20" fill="#8a5a3c" ${ink(8)}/>`;
    s += `<rect x="60" y="1060" width="760" height="150" rx="24" fill="#f1ece4" ${ink(8)}/>`;
    s += `<rect x="60" y="1190" width="760" height="110" fill="#8a5a3c" ${ink(8)}/>`;
    s += `<ellipse cx="250" cy="1060" rx="130" ry="56" fill="#fffaf0" ${ink(7)}/>`;
    const dream = cue(shot, 'awesome', 4) - 0.55;
    const happy = st > dream;
    const breathe = Math.sin(st * 2.2) * 6;
    s += `<g transform="rotate(-12 260 1000)">${K.head(260, 1000, 78, Object.assign({}, HERO, { expr: 'sleep', snore: (Math.sin(st * 2.2) + 1) / 2 }))}</g>`;
    if (happy) s += `<path d="M236,1046 Q262,1066 290,1040" ${ink(6)} fill="none"/>`;
    s += `<path d="M320,${1040 - breathe} C420,${960 - breathe} 640,${980 - breathe} 800,1040 L800,1200 L250,1200 C240,1140 270,1080 320,${1040 - breathe}Z" fill="#4d7cfe" ${ink(8)}/>`;
    for (let i = 0; i < 5; i++) s += circ(380 + i * 85, 1110 + (i % 2) * 40, 14, '#ffd23f', 'opacity="0.8"');
    // nightstand + clock
    s += `<rect x="840" y="1080" width="200" height="220" rx="10" fill="#a8693f" ${ink(8)}/><rect x="862" y="1130" width="156" height="60" rx="8" fill="#8a5432" ${ink(5)}/>` + circ(940, 1160, 8, '#ffd23f', ink(3));
    s += `<defs><radialGradient id="clockglow"><stop offset="0" stop-color="#ff3b30" stop-opacity="0.45"/><stop offset="1" stop-color="#ff3b30" stop-opacity="0"/></radialGradient></defs>` + circ(940, 1020, 170, 'url(#clockglow)');
    s += clockFace(850, 960, 180, 120, '6:59');
    s += zzz(300, 900, st);
    // dream bubble: lifting a car
    if (happy) {
      const k = back(p(st, dream, 0.3));
      s += circ(370, 920, 16 * k, '#fff', ink(5)) + circ(410, 880, 24 * k, '#fff', ink(5));
      s += `<g transform="translate(40,150) translate(560,640) scale(${k}) translate(-560,-640)">`;
      s += `<path d="M330,700 q-60,-80 20,-130 q10,-90 120,-80 q60,-70 160,-20 q110,-20 120,80 q80,50 20,140 q0,80 -110,70 q-60,60 -170,20 q-120,20 -160,-80z" fill="#fff" ${ink(8)}/>`;
      const lift = Math.sin(st * 8) * 8;
      s += person(Object.assign({}, HERO, { x: 560, y: 800, s: 0.42, expr: 'happy', armL: [160, 175], armR: [160, 175] })).svg;
      s += car(560, 612 + lift, 0.62);
      s += `</g>`;
    }
    s += vignette('vn1', 0.6);
    return cam(z, 540, 1000, s);
  }

  // ======================= 2. TEASE: flash-forward montage =======================
  function tease(st, shot, ctx) {
    const cuts = [['alarm', 'smash', 0.35], ['phone', 'fold', 0.55], ['sprint', 'snap', 0.25], ['hospital', 'jar', 0.9]];
    const i = Math.min(cuts.length - 1, Math.floor(st / 0.5));
    const [id, c, off] = cuts[i];
    const src = ctx.byId[id];
    const inner = Scenes[src.scene](cue(src, c, 1) + off + (st - i * 0.5) * 0.4, src, ctx);
    let s = `<defs><filter id="ffw"><feColorMatrix type="matrix" values="0.6 0.5 0.2 0 0.08  0.2 0.35 0.15 0 0  0.2 0.25 0.3 0 0  0 0 0 1 0"/></filter></defs>`;
    s += `<g filter="url(#ffw)">${inner}</g>`;
    // VHS lines + label
    for (let y = 0; y < H; y += 8) s += R(0, y, W, 3, '#000', 'opacity="0.18"');
    const jitter = (hash(Math.floor(st * 30)) - 0.5) * 30;
    s += R(0, 600 + jitter * 10, W, 26, '#fff', 'opacity="0.08"');
    s += `<g><rect x="250" y="330" width="580" height="86" rx="12" fill="#ff4d3d" ${ink(6)}/>` + text(540, 392, '▶▶ FLASH FORWARD', 56, '#fff', { stroke: 0 }) + `</g>`;
    if (Math.floor(st * 3) % 2 === 0) s += circ(980, 380, 18, '#ff3b30');
    // cut flashes between montage frames
    const lt = st - i * 0.5;
    if (i > 0 && lt < 0.06) s += R(0, 0, W, H, '#fff', `opacity="${0.7 * (1 - lt / 0.06)}"`);
    return s;
  }

  // ======================= 3. ALARM: snooze through the table =======================
  function alarm(st, shot) {
    const ring = cue(shot, 'ring', 0.35), snooze = cue(shot, 'snooze', 2.8), smash = cue(shot, 'smash', 4.7);
    const hit = st >= smash;
    const after = st - smash;
    let s = bedroomWall(false);
    s += windowDay(110, 400, 330, 360);
    // headboard / blanket edge at left
    s += `<path d="M-40,1060 C80,980 200,1010 260,1100 L260,1400 L-40,1400Z" fill="#4d7cfe" ${ink(8)}/>`;
    // table (two halves after the hit)
    const tx = 280, ty = 1040, tw = 640, th = 360;
    const crackX = 600;
    const halfL = `<rect x="${tx}" y="${ty}" width="${crackX - tx}" height="34" fill="#c27a45" ${ink(8)}/><rect x="${tx + 20}" y="${ty + 34}" width="${crackX - tx - 20}" height="${th - 80}" fill="#a8693f" ${ink(8)}/><rect x="${tx + 50}" y="${ty + 80}" width="${crackX - tx - 70}" height="110" rx="10" fill="#8a5432" ${ink(6)}/>` + circ((tx + crackX) / 2 + 10, ty + 135, 12, '#ffd23f', ink(4)) + `<rect x="${tx + 30}" y="${ty + th - 46}" width="30" height="60" fill="#8a5432" ${ink(6)}/>`;
    const halfR = `<rect x="${crackX}" y="${ty}" width="${tx + tw - crackX}" height="34" fill="#c27a45" ${ink(8)}/><rect x="${crackX}" y="${ty + 34}" width="${tx + tw - crackX - 20}" height="${th - 80}" fill="#a8693f" ${ink(8)}/><rect x="${crackX + 20}" y="${ty + 80}" width="${tx + tw - crackX - 70}" height="110" rx="10" fill="#8a5432" ${ink(6)}/>` + `<rect x="${tx + tw - 60}" y="${ty + th - 46}" width="30" height="60" fill="#8a5432" ${ink(6)}/>`;
    const split = hit ? easeOut(after / 0.25) : 0;
    // clock position: on the table, then punched through to the floor
    const shake = !hit && st > ring ? Math.sin(st * 70) * 5 : 0;
    let cy = ty - 190, crot = shake;
    if (hit) { cy = lerp(ty - 190, ty + 300, easeIn(clamp(after / 0.12, 0, 1))); crot = lerp(0, -18, easeOut(after / 0.3)); }
    const label = st < ring ? '6:59' : hit ? (Math.floor(st * 8) % 3 ? '7:0_' : '8:88') : '7:00';
    const clock = `<g transform="rotate(${crot} 600 ${cy + 95})">${clockFace(430, cy, 340, 190, label, { cracked: hit, dim: hit && Math.floor(st * 12) % 4 === 0 ? 0.3 : 1 })}` +
      `<rect x="${560}" y="${cy - 24}" width="80" height="26" rx="8" fill="#ffd23f" ${ink(6)}/></g>`;
    if (hit) s += clock;
    s += `<g transform="rotate(${-22 * split} ${tx + 40} ${ty + th}) translate(${-30 * split},${40 * split})">${halfL}</g>`;
    s += `<g transform="rotate(${20 * split} ${tx + tw - 40} ${ty + th}) translate(${30 * split},${40 * split})">${halfR}</g>`;
    if (!hit) s += clock;
    // ringing marks
    if (!hit && st > ring) {
      const k = Math.floor(st * 6) % 2;
      for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) s += `<path d="M${600 + sd * (220 + i * 26)},${cy + 40 + i * 6} q${sd * 16},40 0,80" ${ink(7)} fill="none" opacity="${k ? 1 : 0.4}"/>`;
      s += text(600 + (k ? -250 : 250), cy - 40, 'BEEP!', 70, '#ffd23f', { extra: `transform="rotate(${k ? -12 : 12} ${600 + (k ? -250 : 250)} ${cy - 40})"` });
    }
    // the arm
    const enter = clamp((st - (snooze - 0.6)) / 0.6, 0, 1);
    if (enter > 0) {
      let hx = lerp(-200, 560, easeOut(enter)), hy = lerp(300, 620, easeOut(enter));
      hy += Math.sin(st * 3) * 10 * (1 - p(st, smash - 0.3, 0.2));
      if (st > smash - 0.12) hy = lerp(620, cy - 40, easeIn(p(st, smash - 0.12, 0.12)));
      if (hit) hy = cy - 40 + Math.min(after, 0.1) * 0;
      s += limb([[-200, 120], [hx - 120, hy - 140], [hx, hy]], 92, '#4d7cfe');
      s += `<path d="M${hx - 70},${hy - 40} q0,-60 60,-60 q70,0 80,60 q0,50 -70,60 q-70,0 -70,-60z" fill="${C.skin[0]}" ${ink(7)}/>`;
      s += `<path d="M${hx - 30},${hy - 2} l40,0 M${hx - 26},${hy + 18} l38,0" ${ink(5)}/>`;
    }
    if (hit) {
      // impact burst + splinters + dust
      if (after < 0.35) s += burst(600, ty + 10, 260 * easeOut(after / 0.15), 12, '#ffd23f', after * 40);
      for (let i = 0; i < 22; i++) {
        const a = rad(-170 + hash(i) * 160), v = 900 + hash(i + 7) * 1300;
        const x = 600 + Math.cos(a) * v * after, y = ty + 10 + Math.sin(a) * v * after + 2600 * after * after;
        s += `<rect x="${x}" y="${y}" width="${24 + hash(i + 2) * 40}" height="12" rx="4" fill="#c27a45" ${ink(4)} transform="rotate(${hash(i) * 360 + after * 900} ${x} ${y})"/>`;
      }
      for (let i = 0; i < 7; i++) {
        const k = easeOut(after / 1.0);
        s += circ(600 + (i - 3) * 110 * k, ty + 250 - hash(i) * 80 * k, (50 + hash(i + 3) * 50) * (0.3 + k), '#e8dccb', `opacity="${0.85 * (1 - k)}" ${ink(4)}`);
      }
      if (after < 0.9) s += text(820, ty - 230, 'KRAK!', 120, '#ff4d3d', { extra: `transform="rotate(10 820 ${ty - 230}) scale(1)" opacity="${1 - p(after, 0.6, 0.3)}"` });
    }
    return s;
  }

  // ======================= 4. PHONE: folded like a taco =======================
  function phoneScene(st, shot) {
    const grab = cue(shot, 'grab', 1.2), fold = cue(shot, 'fold', 2.3), taco = cue(shot, 'taco', 3.7);
    if (st >= taco) return reaction(st - taco);
    let s = R(0, 0, W, H, '#f3c98f');
    for (let i = 0; i < 9; i++) s += circ(hash(i) * W, hash(i + 4) * 1300, 60 + hash(i + 8) * 90, '#fff2d0', 'opacity="0.35"');
    s += `<path d="M-40,1250 C300,1180 700,1320 1120,1220 L1120,1920 L-40,1920Z" fill="#4d7cfe" ${ink(8)}/>`;
    for (let i = 0; i < 6; i++) s += circ(120 + i * 180, 1420 + (i % 2) * 90, 18, '#ffd23f', 'opacity="0.8"');
    const k = easeOut(p(st, grab - 0.1, 0.45));
    const px = lerp(560, 540, k), py = lerp(1310, 840, k), rot = lerp(-78, 0, k), sc = lerp(0.62, 1, k);
    const f = clamp((st - fold) / 0.22, 0, 1);
    const fe = easeIn(f);
    const pw = 330, ph = 640;
    let ph_ = '';
    // bottom half (always visible)
    ph_ += `<clipPath id="bottomHalf"><rect x="-400" y="0" width="800" height="800"/></clipPath>`;
    ph_ += `<g clip-path="url(#bottomHalf)">${phone(pw, ph, { time: '7:00', notes: true })}${f > 0 ? crack(0, 0, 200, 3, f, '#fff', 5) : ''}</g>`;
    // top half folds toward the viewer around y=0
    const sy = Math.cos(fe * Math.PI * 0.95);
    ph_ += `<clipPath id="topHalf"><rect x="-400" y="-800" width="800" height="800"/></clipPath>`;
    ph_ += `<g transform="scale(${1 - fe * 0.08},${sy})"><g clip-path="url(#topHalf)">${phone(pw, ph, sy > 0 ? { time: '7:00', notes: true } : { back: true })}</g></g>`;
    if (f > 0) ph_ += `<path d="M${-pw / 2 - 10},0 L${pw / 2 + 10},0" stroke="#111" stroke-width="16" stroke-linecap="round"/>`;
    // hand under the phone
    let hand = limb([[860, 1950], [700, 1450], [px + 70, py + 300 * sc]], 110, C.skin[0]);
    hand += `<ellipse cx="${px + 60}" cy="${py + 280 * sc}" rx="${110 * sc}" ry="${80 * sc}" fill="${C.skin[0]}" ${ink(7)}/>`;
    s += k > 0.05 ? hand : '';
    s += `<g transform="translate(${px},${py}) rotate(${rot}) scale(${sc})">${ph_}</g>`;
    // thumb on top
    if (k > 0.05) s += `<ellipse cx="${px + pw / 2 * sc - 10}" cy="${py + 180 * sc}" rx="${36 * sc}" ry="${70 * sc}" fill="${C.skin[0]}" ${ink(7)} transform="rotate(-15 ${px + pw / 2 * sc} ${py + 180 * sc})"/>`;
    if (f > 0) {
      const a = st - fold;
      if (a < 0.35) s += burst(540, 840, 300 * easeOut(a / 0.15), 10, '#ffd23f', 0) + `<g transform="translate(${px},${py}) rotate(${rot}) scale(${sc})">${ph_}</g>`;
      for (let i = 0; i < 16; i++) {
        const an = rad(hash(i + 40) * 360), v = 700 + hash(i + 3) * 900;
        const x = 540 + Math.cos(an) * v * a, y = 840 + Math.sin(an) * v * a + 1800 * a * a;
        s += `<path d="M${x},${y} l18,-6 l-6,22z" fill="#bfe8ff" ${ink(3)} opacity="${1 - p(a, 0.5, 0.4)}"/>`;
      }
      if (a < 1.2) s += text(800, 520, 'CRUNCH!', 96, '#ff4d3d', { extra: `transform="rotate(-10 800 520)"` });
    }
    return s;
  }
  function reaction(lt) {
    let s = rays(540, 900, '#ffe08a', '#ffd23f', lt * 20, 16);
    const z = lerp(1.25, 1.05, easeOut(lt / 0.4));
    let inner = '';
    const hero = person(Object.assign({}, HERO, { x: 540, y: 1980, s: 2.3, expr: 'shock', sweat: true, armR: [150, 175], armL: [20, 10] }));
    inner += hero.svg;
    // folded phone in the raised hand
    const h = hero.hands.r, hx = 540 + h[0] * 2.3, hy = 1980 + h[1] * 2.3;
    inner += `<g transform="translate(${hx},${hy - 80}) rotate(8)"><path d="M-70,-120 L0,40 L70,-120" fill="none" stroke="${INK}" stroke-width="64" stroke-linejoin="round"/><path d="M-70,-120 L0,40 L70,-120" fill="none" stroke="#3a3f4d" stroke-width="44" stroke-linejoin="round"/>${crack(-40, -60, 40, 9, 1, '#9fb4ff', 3)}</g>`;
    inner += circ(hx, hy, 56, C.skin[0], ink(7));
    // shock lines around the head
    for (let i = 0; i < 8; i++) {
      const a = rad(-160 + i * 20), r0 = 300 + Math.sin(lt * 20 + i) * 10;
      inner += `<line x1="${540 + Math.cos(a) * r0}" y1="${1170 + Math.sin(a) * r0}" x2="${540 + Math.cos(a) * (r0 + 70)}" y2="${1170 + Math.sin(a) * (r0 + 70)}" ${ink(10)}/>`;
    }
    s += cam(z, 540, 960, inner);
    return s;
  }

  // ======================= 5. WORLD: 8 billion folded phones + SOLD OUT =======================
  function world(st, shot) {
    const store = cue(shot, 'store', 3.4), sold = cue(shot, 'sold', 4.3);
    if (st >= store) return phoneStore(st - store, sold - store);
    let s = R(0, 0, W, H, '#7fd0ff');
    s += halftone('ht1', '#ffffff', 0.25, 34);
    const k = ease(clamp(st / (store - 0.1), 0, 1));
    const z = Math.exp(lerp(Math.log(3.4), Math.log(0.32), k));
    const cw = 150, ch = 210, cx0 = 540, cy0 = 1150;
    const halfW = 560 / z + cw, halfH = 980 / z + ch;
    let crowd = '';
    const nx = Math.ceil(halfW / cw), ny = Math.ceil(halfH / ch);
    for (let j = -ny; j <= ny; j++) for (let i = -nx; i <= nx; i++) {
      const seed = i * 131 + j * 71 + 5000;
      const x = cx0 + i * cw + (j % 2 ? cw / 2 : 0), y = cy0 + j * ch;
      if (i === 0 && j === 0) {
        crowd += person(Object.assign({}, HERO, { x, y: y + 4, s: 0.26, expr: 'shock' })).svg;
        crowd += `<path d="M${x - 8},${y - 40} L${x + 4},${y - 18} L${x + 18},${y - 42}" fill="none" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>`;
      } else crowd += mini(x, y, 0.9, seed, { t: st, face: z > 0.5 });
    }
    s += cam(z, cx0, cy0 - 60, crowd);
    return s;
  }
  function phoneStore(lt, soldAt) {
    let s = R(0, 0, W, H, '#9ad7ff');
    s += `<path d="M0,300 q120,-40 220,0 q100,-50 200,0 h-420z" fill="#fff" opacity="0.8"/>`;
    const pan = lerp(0, -160, ease(clamp(lt / 2.2, 0, 1)));
    let world = '';
    // street + sidewalk
    world += R(-200, 1180, 2400, 400, '#c9c3b8', ink(6)) + R(-200, 1560, 2400, 400, '#55545c');
    for (let x = -200; x < 2400; x += 160) world += R(x, 1180, 6, 380, '#b0aa9f');
    // store
    world += R(120, 420, 860, 760, '#f4f1ea', ink(8));
    world += `<rect x="150" y="440" width="800" height="120" rx="14" fill="${INK}"/>` + text(550, 525, 'PHONE STORE', 84, '#ffd23f', { stroke: 0 });
    for (let i = 0; i < 8; i++) world += `<path d="M${120 + i * 107.5},580 L${227.5 + i * 107.5},580 L${227.5 + i * 107.5 - 10},650 Q${174 + i * 107.5},680 ${130 + i * 107.5},650Z" fill="${i % 2 ? '#fff' : '#ff4d3d'}" ${ink(6)}/>`;
    world += R(170, 700, 520, 400, '#bfe8ff', ink(8));
    for (let i = 0; i < 3; i++) world += R(190, 790 + i * 110, 480, 14, '#8aa9c0');
    world += `<path d="M190,720 L330,720 L190,860Z" fill="#fff" opacity="0.5"/>`;
    world += R(730, 760, 200, 420, '#5e7cff', ink(8)) + circ(905, 980, 10, '#ffd23f', ink(3));
    // queue: snakes from the door to the right and off-screen
    let q = '';
    for (let i = 0; i < 22; i++) q += mini(900 + i * 110, 1235, 1.5, i * 23 + 99, { t: lt + 1, sad: true });
    for (let i = 0; i < 16; i++) {
      const x = 130 + i * 150 + Math.sin(i * 1.7) * 12, y = 1330 + (i % 2) * 30;
      q += mini(x, y, 2.1, i * 17 + 3, { t: lt, sad: true });
    }
    world += q;
    s += `<g transform="translate(${pan},0)">${world}</g>`;
    // SOLD OUT stamp
    if (lt >= soldAt) {
      const a = lt - soldAt;
      const k = lerp(2.4, 1, back(clamp(a / 0.22, 0, 1)));
      s += `<g transform="translate(${430 + pan},880) rotate(-14) scale(${k * 0.85})"><rect x="-330" y="-110" width="660" height="210" rx="18" fill="#fff" stroke="#e8262b" stroke-width="18"/>` + text(0, 40, 'SOLD OUT', 150, '#e8262b', { stroke: 0 }) + `</g>`;
    }
    return s;
  }

  // ======================= 6a. DOOR =======================
  function door(st, shot) {
    const rip = cue(shot, 'rip', 1.4);
    const a = st - rip, ripped = a >= 0;
    let s = R(0, 0, W, H, '#bfe3c8');
    for (let x = 0; x < W; x += 90) s += R(x, 0, 45, 1330, '#b2dabd', 'opacity="0.7"');
    s += R(0, 1330, W, 600, '#a87c55', ink(6)) + R(0, 1320, W, 24, '#f4f1ea', ink(5));
    // door frame + dark opening
    const fx = 470, fy = 470, fw = 400, fh = 860;
    s += R(fx - 30, fy - 30, fw + 60, fh + 30, '#f4f1ea', ink(8)) + R(fx, fy, fw, fh, '#2a2433');
    const k = ripped ? easeOut(a / 0.3) : 0;
    const P = person(Object.assign({}, HERO, { x: 290, y: 1520, s: 1.15, expr: ripped ? 'shock' : 'neutral', sweat: ripped, armR: ripped ? [lerp(118, 165, k), lerp(118, 175, k)] : [118, 108] }));
    const hand = [290 + P.hands.r[0] * 1.15, 1520 + P.hands.r[1] * 1.15];
    // door: hinged at right; knob at left; follows the hand once ripped
    const knobLocal = [fx + 50, fy + 470];
    const doorSvg = R(fx, fy, fw, fh, '#c27a45', ink(8)) + R(fx + 50, fy + 60, fw - 100, 300, '#b06b3a', ink(6)) + R(fx + 50, fy + 430, fw - 100, 360, '#b06b3a', ink(6)) + circ(knobLocal[0], knobLocal[1], 22, '#ffd23f', ink(6)) +
      R(fx + fw - 18, fy + 120, 26, 70, '#9a9a9a', ink(4)) + R(fx + fw - 18, fy + fh - 190, 26, 70, '#9a9a9a', ink(4));
    if (!ripped) {
      // knob sits where the hand is
      s += `<g transform="translate(${hand[0] - knobLocal[0]},${hand[1] - knobLocal[1]})">${doorSvg}</g>`;
      s += P.svg;
    } else {
      s += P.svg;
      const rot = lerp(0, -24, k);
      s += `<g transform="translate(${hand[0]},${hand[1]}) rotate(${rot}) translate(${-knobLocal[0]},${-knobLocal[1]})">${doorSvg}</g>`;
      s += circ(hand[0], hand[1], 30, C.skin[0], ink(6));
      for (let i = 0; i < 6; i++) {
        const x = fx + fw + 20 + (200 + hash(i) * 500) * a, y = fy + 150 + (i % 2) * 520 - 600 * a + 2400 * a * a;
        s += `<g transform="rotate(${a * 800 + i * 60} ${x} ${y})">${R(x - 8, y - 20, 16, 40, '#9a9a9a', ink(4))}</g>`;
      }
      for (let i = 0; i < 6; i++) { const kk = easeOut(a / 0.8); s += circ(fx + fw + (i - 2) * 60 * kk, fy + 300 + i * 100, 40 * (0.4 + kk), '#efe6d8', `opacity="${0.8 * (1 - kk)}" ${ink(3)}`); }
      if (a < 1) s += text(820, 560, 'RRRIP!', 110, '#ff4d3d', { extra: `transform="rotate(8 820 560)"` });
    }
    return s;
  }

  // ======================= 6b. HANDSHAKES BANNED =======================
  function handshake(st, shot) {
    const ban = cue(shot, 'banned', 0.8);
    let s = rays(540, 860, '#ffe08a', '#ffd23f', st * 25, 18);
    const shakeY = Math.sin(st * 22) * 26;
    const y = 860 + shakeY;
    s += limb([[-60, y + 120], [380, y]], 120, '#ff7a59');
    s += limb([[1140, y + 120], [700, y]], 120, '#2ec4b6');
    s += `<ellipse cx="470" cy="${y}" rx="120" ry="78" fill="${C.skin[1]}" ${ink(8)}/>`;
    s += `<ellipse cx="610" cy="${y + 4}" rx="120" ry="78" fill="${C.skin[0]}" ${ink(8)}/>`;
    for (let i = 0; i < 4; i++) s += `<path d="M${520 - i * 6},${y - 60 + i * 34} q-60,8 -90,0" ${ink(6)} fill="none"/>`;
    s += `<ellipse cx="610" cy="${y - 64}" rx="40" ry="22" fill="${C.skin[0]}" ${ink(6)}/>`;
    // squeeze stress
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) s += `<line x1="${540 + sd * (170 + i * 20)}" y1="${y - 120 - i * 30}" x2="${540 + sd * (210 + i * 30)}" y2="${y - 160 - i * 40}" stroke="${C.red}" stroke-width="10" stroke-linecap="round"/>`;
    if (st >= ban) {
      const a = st - ban, k = easeOut(a / 0.25);
      const r = 330, c = 2 * Math.PI * r;
      s += `<circle cx="540" cy="860" r="${r}" fill="none" stroke="#e8262b" stroke-width="56" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - k)}" transform="rotate(-90 540 860)"/>`;
      if (k > 0.6) s += `<line x1="${540 - r * 0.7}" y1="${860 - r * 0.7}" x2="${540 - r * 0.7 + r * 1.4 * easeOut((k - 0.6) / 0.4)}" y2="${860 - r * 0.7 + r * 1.4 * easeOut((k - 0.6) / 0.4)}" stroke="#e8262b" stroke-width="56" stroke-linecap="round"/>`;
      const sk = lerp(2.2, 1, back(clamp((a - 0.05) / 0.22, 0, 1)));
      s += `<g transform="translate(540,1290) rotate(-8) scale(${sk})"><rect x="-250" y="-88" width="500" height="150" rx="16" fill="#fff" stroke="#e8262b" stroke-width="14"/>` + text(0, 30, 'BANNED', 118, '#e8262b', { stroke: 0 }) + `</g>`;
    }
    return s;
  }

  // ======================= 6c. HUG = MEDICAL EMERGENCY =======================
  function hug(st, shot) {
    const em = cue(shot, 'emergency', 1.5);
    let s = R(0, 0, W, H, '#ffc8d6');
    for (let x = 0; x < W; x += 80) s += circ(x + 40, 200 + (x % 160 ? 0 : 40), 6, '#ffb0c4');
    for (let y = 120; y < 1330; y += 80) for (let x = (y % 160 ? 40 : 0); x < W; x += 160) s += circ(x, y, 7, '#ffb5c8');
    s += `<rect x="130" y="520" width="200" height="240" rx="8" fill="#fff3dc" ${ink(7)}/><path d="M160,730 l50,-90 l40,60 l30,-40 l40,70z" fill="#8ac926" ${ink(4)}/>`;
    s += `<rect x="760" y="560" width="180" height="160" rx="8" fill="#fff3dc" ${ink(7)}/>` + circ(850, 640, 40, '#ff7a59', ink(5));
    s += R(0, 1330, W, 600, '#c98f5a', ink(6));
    const sq = 0.5 + 0.5 * Math.sin(st * 9);
    const squeeze = clamp(st / 0.3, 0, 1) * (0.1 + 0.05 * sq);
    const red = clamp((st - 0.3) / 1.4, 0, 0.55);
    // mum on the right, squished
    const mum = person({ x: 680, y: 1560, s: 1.25, skin: C.skin[5], shirt: '#9b5de5', pants: '#6a4c93', hair: 'bun', hairColor: '#cfcac2', glasses: true, expr: st > em ? 'shock' : 'worried', stress: true, stressRot: Math.sin(st * 12) * 10, sweat: true, red, armL: [20, 30], armR: [25, 35] });
    const hero = person(Object.assign({}, HERO, { pj: false, shirt: '#2ec4b6', x: 360, y: 1560, s: 1.25, expr: 'happy', armL: [20, 10], armR: [70, 90] }));
    s += hero.svg;
    s += `<g transform="translate(680,1560) scale(${1 - squeeze},${1 + squeeze * 0.5}) translate(-680,-1560)">${mum.svg}</g>`;
    // hero's arm wrapped across mum
    s += limb([[360 + 74 * 1.25, 1560 - 250 * 1.25], [610, 1180 + sq * 6], [820 - squeeze * 200, 1200]], 44, '#2ec4b6') + circ(824 - squeeze * 200, 1200, 30, C.skin[0], ink(6));
    // little hearts from the oblivious hero
    for (let i = 0; i < 3; i++) { const ph = (st * 0.8 + i / 3) % 1; s += text(250 + i * 40, 760 - ph * 220, '♥', 50 + ph * 20, '#ff4d6d', { stroke: 6, extra: `opacity="${Math.sin(ph * Math.PI)}"` }); }
    if (st >= em) {
      const a = st - em;
      const on = Math.floor(a * 6) % 2;
      s += R(0, 0, W, H, on ? '#ff1a1a' : '#1a5cff', `opacity="0.22"`);
      const k = back(clamp(a / 0.25, 0, 1));
      s += `<g transform="translate(860,560) scale(${k})"><rect x="-90" y="-90" width="180" height="180" rx="30" fill="#fff" ${ink(8)}/><path d="M-22,-62 h44 v40 h40 v44 h-40 v40 h-44 v-40 h-40 v-44 h40z" fill="#e8262b"/></g>`;
    }
    return s;
  }

  // ======================= 7. X-RAY: muscles x10, bones x1 =======================
  function xray(st, shot) {
    const mus = cue(shot, 'muscles', 2.3), bon = cue(shot, 'bones', 4.4), crk = cue(shot, 'crack', 5.5);
    let s = R(0, 0, W, H, '#0b1026');
    for (let x = 0; x < W; x += 60) s += R(x, 0, 2, H, '#16204a');
    for (let y = 0; y < H; y += 60) s += R(0, y, W, 2, '#16204a');
    const on = clamp(st / 0.35, 0, 1) * (st < 0.35 && Math.floor(st * 30) % 3 === 0 ? 0.3 : 1);
    // light box
    s += `<rect x="90" y="400" width="900" height="900" rx="30" fill="#0f2a44" stroke="#5fd4ff" stroke-width="8" opacity="${on}"/>`;
    s += `<defs><radialGradient id="xglow"><stop offset="0" stop-color="#3fb6ff" stop-opacity="0.45"/><stop offset="1" stop-color="#3fb6ff" stop-opacity="0"/></radialGradient>` +
      `<filter id="blur12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter></defs>`;
    s += `<ellipse cx="540" cy="850" rx="520" ry="520" fill="url(#xglow)" opacity="${on}"/>`;
    let arm = '';
    // flexed arm silhouette: shoulder (190,980) -> elbow (600,1040) -> fist (700,640)
    arm += `<path d="M150,980 L600,1040 L700,640" fill="none" stroke="#7fd8ff" stroke-width="210" stroke-linecap="round" stroke-linejoin="round" opacity="0.18"/>`;
    arm += circ(720, 590, 110, '#7fd8ff', 'opacity="0.18"');
    // muscles
    const grow = st >= mus ? easeOut((st - mus) / 0.4) : 0;
    const beat = st >= mus ? Math.pow(Math.max(0, Math.sin((st - mus) * Math.PI * 2.4)), 6) : 0;
    const msc = 1 + grow * 0.35 + beat * 0.07;
    const mcol = st >= mus ? '#ff3b30' : '#ff8a80';
    const muscle = `<g transform="translate(380,950) scale(${msc}) translate(-380,-950)"><ellipse cx="380" cy="950" rx="190" ry="${70 + grow * 20}" fill="${mcol}" opacity="0.9"/></g>` +
      `<g transform="translate(660,840) rotate(-76) scale(${msc}) translate(-660,-840)"><ellipse cx="660" cy="840" rx="170" ry="58" fill="${mcol}" opacity="0.9"/></g>`;
    if (st >= mus) arm += `<g filter="url(#blur12)" opacity="${0.6 + beat * 0.4}">${muscle}</g>`;
    arm += muscle;
    // bones: deliberately thin
    const broken = st >= crk;
    const off = broken ? easeOut((st - crk) / 0.15) * 14 : 0;
    const bone = (x1, y1, x2, y2, w) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f4f7ff" stroke-width="${w}" stroke-linecap="round"/>` + circ(x1, y1, w * 0.9, '#f4f7ff') + circ(x2, y2, w * 0.9, '#f4f7ff');
    if (!broken) arm += bone(200, 975, 590, 1030, 22);
    else {
      arm += `<g transform="translate(${-off},${-off * 0.6}) rotate(${-off * 0.25} 200 975)">${bone(200, 975, 395, 1003, 22)}</g>`;
      arm += `<g transform="translate(${off},${off * 0.6}) rotate(${off * 0.25} 590 1030)">${bone(410, 1005, 590, 1030, 22)}</g>`;
    }
    arm += bone(605, 1020, 690, 690, 12) + bone(630, 1035, 720, 700, 10);
    for (let i = 0; i < 4; i++) arm += circ(690 + i * 22, 600 - i * 8, 13, '#f4f7ff');
    if (broken) {
      const a = st - crk;
      arm += `<path d="M386,960 L410,985 L392,1003 L418,1030 L400,1050" fill="none" stroke="#ff3b30" stroke-width="10" stroke-linejoin="round"/>`;
      if (a < 0.3) arm += burst(402, 1003, 150 * easeOut(a / 0.12), 9, '#ffd23f', a * 50);
    }
    // scan line
    const sy = 420 + ((st * 500) % 860);
    arm += `<rect x="100" y="${sy}" width="880" height="6" fill="#7fffd4" opacity="${0.5 * on}"/>`;
    // labels
    if (st >= mus) {
      const k = back(clamp((st - mus) / 0.25, 0, 1));
      arm += `<g transform="translate(330,640) scale(${k}) translate(-330,-640)">` + text(330, 640, 'MUSCLES ×10', 78, '#ff4d3d') + `<path d="M330,670 L360,820" stroke="#ff4d3d" stroke-width="10" marker-end=""/><path d="M340,800 L362,830 L378,796" fill="none" stroke="#ff4d3d" stroke-width="10" stroke-linejoin="round"/></g>`;
    }
    if (st >= bon) {
      const k = back(clamp((st - bon) / 0.25, 0, 1));
      arm += `<g transform="translate(330,1210) scale(${k}) translate(-330,-1210)">` + text(330, 1230, 'BONES ×1', 78, '#fff') + `<path d="M330,1170 L360,1060" stroke="#fff" stroke-width="10"/><path d="M342,1080 L362,1050 L380,1084" fill="none" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></g>`;
    }
    const z = st >= bon ? lerp(1, 1.3, ease(clamp((st - bon) / 0.8, 0, 1))) : 1;
    s += `<g opacity="${on}">${cam(z, lerp(540, 470, z - 1), lerp(960, 960, z - 1), arm)}</g>`;
    if (broken && st - crk < 0.12) s += R(0, 0, W, H, '#ff1a1a', `opacity="${0.45 * (1 - (st - crk) / 0.12)}"`);
    return s;
  }

  // ======================= 8. SPRINT: snap =======================
  function sprint(st, shot) {
    const go = cue(shot, 'go', 0.9), snap = cue(shot, 'snap', 2.2);
    const frozen = st >= snap;
    const tt = frozen ? snap : st;
    const run = Math.max(0, tt - go);
    const rx = 260 + run * 170 + run * run * 30;
    let s = R(0, 0, W, H, '#9ad7ff');
    // parallax city
    const par = run * 260;
    let city = '';
    for (let i = 0; i < 9; i++) {
      const bw = 160 + hash(i) * 120, bh = 300 + hash(i + 3) * 400, bx = i * 220 - (par * 0.4) % 220 - 220;
      city += R(bx, 1180 - bh, bw, bh, ['#f4a259', '#bc4b51', '#5b8e7d', '#8cb369', '#f4e285'][i % 5], ink(6));
      for (let w = 0; w < 4; w++) city += R(bx + 24 + (w % 2) * (bw / 2 - 10), 1180 - bh + 40 + Math.floor(w / 2) * 90, 40, 50, '#fff3dc', ink(4));
    }
    s += city;
    s += R(0, 1180, W, 140, '#c9c3b8', ink(6)) + R(0, 1320, W, 600, '#55545c');
    for (let x = -((par) % 200); x < W; x += 200) s += R(x, 1600, 110, 18, '#fff3dc');
    // bus pulling away
    const bx = 600 + tt * 160 + tt * tt * 40;
    s += `<g><rect x="${bx}" y="860" width="560" height="380" rx="40" fill="#ffd23f" ${ink(8)}/>`;
    for (let i = 0; i < 4; i++) s += R(bx + 40 + i * 125, 900, 100, 120, '#bfe8ff', ink(6));
    s += R(bx, 1080, 560, 30, '#ff4d3d') + circ(bx + 120, 1250, 56, INK) + circ(bx + 120, 1250, 22, '#bbb') + circ(bx + 440, 1250, 56, INK) + circ(bx + 440, 1250, 22, '#bbb');
    s += text(bx + 290, 1170, 'BUS', 70, '#1d1b22', { stroke: 0 }) + `</g>`;
    // bus stop
    s += R(100, 760, 16, 520, '#6b6b6b', ink(5)) + circ(108, 740, 60, '#e8262b', ink(6)) + text(108, 762, 'BUS', 36, '#fff', { stroke: 0 });
    if (run > 0 && !frozen) s += speedLines(st, '#fff', 0.55, 14);
    const phase = run > 0 ? run * 16 : 0;
    s += sidePerson(Object.assign({}, HERO, { pj: false, shirt: '#ff7a59', x: rx, y: 1330, s: 1.1, mode: run > 0 ? 'run' : 'walk', phase, lean: run > 0 ? 14 : 2, expr: frozen ? 'pain' : run > 0 ? 'determined' : 'neutral', brokenLegs: frozen }));
    if (frozen) {
      const a = st - snap;
      s = `<defs><filter id="gray"><feColorMatrix type="saturate" values="0.12"/></filter></defs><g filter="url(#gray)">${s}</g>`;
      s += R(0, 0, W, H, '#ff3b30', `opacity="${0.18 + 0.3 * Math.exp(-a * 8)}"`);
      s += crack(rx + 10, 1230, 420, 21, easeOut(a / 0.12), '#fff', 9);
      s += crack(rx + 10, 1230, 420, 21, easeOut(a / 0.12), INK, 3);
    }
    return s;
  }

  // ======================= 9. HOSPITAL: the pickle jar =======================
  function pickleJar(x, y, s) {
    let q = `<rect x="-62" y="-80" width="124" height="160" rx="26" fill="#bfeec3" opacity="0.9" ${ink(7)}/>`;
    for (let i = 0; i < 4; i++) q += `<ellipse cx="${-30 + i * 20}" cy="${-10 + (i % 2) * 20}" rx="14" ry="48" fill="#5aa43c" ${ink(4)} transform="rotate(${-10 + i * 7} ${-30 + i * 20} 0)"/>`;
    q += `<rect x="-58" y="-10" width="116" height="50" fill="#fff3dc" ${ink(4)}/>` + text(0, 24, 'PICKLES', 26, '#2f7d32', { stroke: 0 });
    q += `<rect x="-58" y="-110" width="116" height="38" rx="8" fill="#b9bcc6" ${ink(6)}/>`;
    for (let i = 0; i < 6; i++) q += `<line x1="${-48 + i * 19}" y1="-104" x2="${-48 + i * 19}" y2="-78" stroke="#8b8e99" stroke-width="4"/>`;
    return g(`translate(${x},${y}) scale(${s})`, q);
  }
  function hospital(st, shot) {
    const jar = cue(shot, 'jar', 4);
    let s = R(0, 0, W, H, '#cdeedd');
    s += R(0, 1250, W, 700, '#e9eef2', ink(6));
    for (let x = 0; x < W; x += 120) s += R(x, 1250, 4, 700, '#cfd8de');
    for (let y = 1250; y < H; y += 120) s += R(0, y, W, 4, '#cfd8de');
    s += `<rect x="240" y="350" width="600" height="130" rx="18" fill="#e8262b" ${ink(8)}/>` + text(540, 445, 'EMERGENCY', 92, '#fff', { stroke: 0 });
    s += `<rect x="300" y="510" width="480" height="96" rx="12" fill="${INK}"/>` + `<text x="540" y="575" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="46" fill="#ff3b30">WAIT: 9 HRS</text>`;
    // chairs
    for (let i = 0; i < 4; i++) {
      const x = 150 + i * 260;
      s += `<rect x="${x - 110}" y="860" width="220" height="200" rx="24" fill="#4d9de0" ${ink(7)}/><rect x="${x - 120}" y="1080" width="240" height="40" rx="12" fill="#3b82c4" ${ink(7)}/>` + R(x - 90, 1120, 16, 140, '#6b6b6b') + R(x + 74, 1120, 16, 140, '#6b6b6b');
    }
    const people = [
      { skin: C.skin[2], shirt: '#ff7a59', hair: 'curly', hairColor: '#1d1b22', cast: ['legr'], expr: 'pain' },
      { skin: C.skin[3], shirt: '#8ac926', hair: 'long', hairColor: '#8a5a2b', cast: ['l'], brace: true, expr: 'worried' },
      { skin: C.skin[0], shirt: '#ffd23f', hair: 'short', hairColor: '#5a3825', cast: ['r'], expr: 'worried', bandage: false, jar: true },
      { skin: C.skin[4], shirt: '#9b5de5', hair: 'cap', hairColor: '#ff4d3d', cast: ['l', 'r'], bandage: true, expr: 'pain' },
    ];
    let row = '', jarPos = [670, 1060];
    people.forEach((o, i) => {
      const x = 150 + i * 260;
      const P = person(Object.assign({ x, y: 1270, s: 0.78, legs: 'sit', pants: '#3a4a8a', armL: [18, 40], armR: [18, 40] }, o, o.jar ? { armL: [25, 60], expr: st > jar ? 'strain' : 'worried', red: st > jar ? 0.25 + 0.15 * Math.sin(st * 20) : 0 } : {}));
      row += P.svg;
      if (o.jar) {
        const hx = x + P.hands.l[0] * 0.78, hy = 1270 + P.hands.l[1] * 0.78;
        const wob = st > jar ? Math.sin(st * 40) * 4 : 0;
        row += `<g transform="rotate(${wob} ${hx} ${hy})">${pickleJar(hx + 10, hy - 50, 0.75)}</g>` + circ(hx, hy, 19, o.skin, ink(5));
        jarPos = [hx + 10, hy - 50];
      }
    });
    s += row;
    // a pair of crutches against the wall
    s += `<line x1="1010" y1="1260" x2="1050" y2="820" ${ink(16)}/><line x1="1010" y1="1260" x2="1050" y2="820" stroke="#c0c4cc" stroke-width="8"/>`;
    const z = st >= jar ? lerp(1, 2.0, ease(clamp((st - jar) / 0.6, 0, 1))) : lerp(1.06, 1, clamp(st / 2, 0, 1));
    const f = clamp(z - 1, 0, 1);
    const cx = lerp(540, jarPos[0] + 60, f), cy = lerp(960, jarPos[1] + 40, f);
    let out = cam(z, cx, cy, s);
    if (st >= jar + 0.5) {
      const a = st - jar - 0.5, k = easeOut(a / 0.35);
      const sx = 540 + (jarPos[0] - cx) * z, sy = 960 + (jarPos[1] - cy) * z;
      const r = 150, c = 2 * Math.PI * r;
      out += `<ellipse cx="${sx}" cy="${sy - 10}" rx="${r * 1.05}" ry="${r}" fill="none" stroke="#ff3b2f" stroke-width="14" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - k)}" transform="rotate(-12 ${sx} ${sy})" stroke-linecap="round"/>`;
      out += `<g transform="translate(${sx},${sy - 300}) scale(${back(clamp(a / 0.25, 0, 1))}) rotate(-4) translate(${-sx},${-(sy - 300)})">` + text(sx + 60, sy - 280, 'STILL CLOSED', 96, '#ff3b2f') + `</g>`;
    }
    return out;
  }

  // ======================= 10. GENTLE: slow-motion world =======================
  function gentle(st, shot) {
    const gently = cue(shot, 'gently', 7);
    const split = 3.6;
    let s = R(0, 0, W, H, '#d9ccff');
    s += halftone('ht2', '#ffffff', 0.35, 40);
    for (let i = 0; i < 18; i++) {
      const x = (hash(i) * W + st * 12 * (hash(i + 2) - 0.5) * 4) % W, y = (hash(i + 5) * H - st * 18) % H;
      s += text(x, (y + H) % H, '✦', 26 + hash(i + 9) * 26, '#fff', { stroke: 0, extra: `opacity="${0.4 + 0.4 * Math.sin(st + i)}"` });
    }
    if (st < split) {
      s += R(0, 1100, W, 820, '#b8a6f0', ink(6));
      const crowd = [
        { x: 640 + st * 40, y: 1180, s: 0.95, shirt: '#ff7a59', skin: C.skin[1], hair: 'curly', hairColor: '#1d1b22', ph: 0 },
        { x: 330 + st * 45, y: 1700, s: 1.6, shirt: '#2ec4b6', skin: C.skin[0], hair: 'long', hairColor: '#d9a441', ph: 1.5 },
        { x: 120 + st * 35, y: 1300, s: 1.15, shirt: '#f15bb5', skin: C.skin[2], hair: 'short', hairColor: '#1d1b22', ph: 3 },
      ];
      crowd.sort((a, b) => a.y - b.y).forEach((o) => {
        const cup = (h) => `<g transform="translate(${h[0] + 4},${h[1] - 34})"><path d="M-22,-30 L22,-30 L16,22 L-16,22Z" fill="#fff" ${ink(5)}/><path d="M22,-18 q18,4 0,24" fill="none" ${ink(5)}/></g>`;
        s += sidePerson(Object.assign({}, o, { mode: 'tiptoe', phase: st * 1.6 + o.ph, lean: -4, expr: 'focus', handProp: o.ph === 1.5 ? cup : null }));
      });
      s += `<g><rect x="660" y="330" width="360" height="90" rx="16" fill="${INK}"/><text x="840" y="392" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="46" fill="#ffd23f">◀◀ 0.25×</text></g>`;
      return s;
    }
    const lt = st - split;
    const z = lerp(1.0, 1.12, ease(clamp(lt / 4, 0, 1)));
    let q = '';
    const hero = person(Object.assign({}, HERO, { pj: false, shirt: '#2ec4b6', x: 540, y: 1900, s: 2.0, expr: 'focus', sweat: true, armR: [145, 170], armL: [15, 10] }));
    q += hero.svg;
    const h = hero.hands.r, hx = 540 + h[0] * 2, hy = 1900 + h[1] * 2;
    const lift = st >= gently ? -lerp(0, 40, easeOut((st - gently) / 1.5)) : 0;
    // tiny cup pinched between two fingers, pinky out
    q += `<g transform="translate(${hx - 10},${hy - 120 + lift})">`;
    for (let i = 0; i < 3; i++) q += `<path d="M${-20 + i * 20},-80 q16,-30 0,-60 q-16,-30 0,-60" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="${0.6 * (0.5 + 0.5 * Math.sin(st * 2 + i))}"/>`;
    q += `<path d="M-46,-60 L46,-60 L34,40 L-34,40Z" fill="#fff" ${ink(7)}/><path d="M46,-40 q36,10 0,52" fill="none" ${ink(7)}/><rect x="-40" y="-56" width="80" height="16" fill="#7a4a2a"/></g>`;
    q += `<ellipse cx="${hx + 30}" cy="${hy - 70 + lift}" rx="20" ry="30" fill="${C.skin[0]}" ${ink(6)}/>`;
    q += `<ellipse cx="${hx - 34}" cy="${hy - 100 + lift}" rx="14" ry="34" fill="${C.skin[0]}" ${ink(6)} transform="rotate(-50 ${hx - 34} ${hy - 100 + lift})"/>`;
    q += circ(hx, hy + lift * 0.3, 40, C.skin[0], ink(7));
    if (st >= gently) {
      const a = st - gently;
      for (let i = 0; i < 5; i++) { const an = rad(i * 72 + a * 30); q += text(hx + Math.cos(an) * 160, hy - 200 + Math.sin(an) * 120, '✦', 54, '#ffd23f', { stroke: 6, extra: `opacity="${clamp(a / 0.4, 0, 1)}"` }); }
    }
    s += cam(z, 540, 1000, q);
    return s;
  }

  // ======================= 11. COUCH: already great at it =======================
  function couch(st, shot) {
    const z = lerp(1.0, 1.1, ease(clamp(st / 5, 0, 1)));
    let q = R(0, 0, W, H, '#21495c');
    for (let x = 0; x < W; x += 90) q += R(x, 0, 45, H, '#24506a', 'opacity="0.7"');
    q += R(0, 1300, W, 620, '#6b4a3a', ink(6));
    q += `<ellipse cx="540" cy="1520" rx="460" ry="90" fill="#a83f3f" ${ink(6)}/>`;
    // lamp glow
    q += `<defs><radialGradient id="lampg"><stop offset="0" stop-color="#ffd27a" stop-opacity="0.55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>` + circ(130, 640, 380, 'url(#lampg)');
    q += `<path d="M60,560 L200,560 L170,470 L90,470Z" fill="#ffd27a" ${ink(6)}/>` + R(124, 560, 12, 400, '#3b2a20') + R(80, 950, 100, 20, '#3b2a20');
    // couch
    q += `<rect x="150" y="800" width="800" height="230" rx="50" fill="#e76f51" ${ink(8)}/>`;
    q += `<rect x="150" y="1010" width="800" height="170" rx="30" fill="#d65b3f" ${ink(8)}/>`;
    q += `<rect x="110" y="900" width="120" height="300" rx="50" fill="#e76f51" ${ink(8)}/><rect x="870" y="900" width="120" height="300" rx="50" fill="#e76f51" ${ink(8)}/>`;
    q += R(180, 1180, 30, 60, '#3b2a20', ink(5)) + R(890, 1180, 30, 60, '#3b2a20', ink(5));
    // lying hero: feet right, head on the left armrest
    const br = Math.sin(st * 1.8) * 4;
    const P = person(Object.assign({}, HERO, { x: 900, y: 975, s: 1.32, rot: -90, expr: 'relaxed', look: [0.6, 0.3], armL: [6, 4], armR: [6, 4], pj: false, shirt: '#8ac926', pants: '#3a4a8a' }));
    q += P.svg;
    // remote balanced on the chest
    const rx = 900 - 200 * 1.32, ry = 975 - 84 * 1.32 - 14 + br;
    q += `<g transform="rotate(${Math.sin(st * 1.8 + 0.5) * 3} ${rx} ${ry})"><rect x="${rx - 80}" y="${ry - 24}" width="160" height="40" rx="14" fill="#2b2b33" ${ink(6)}/>` + circ(rx - 50, ry - 4, 8, '#ff3b30') + circ(rx - 20, ry - 4, 6, '#ccc') + circ(rx + 5, ry - 4, 6, '#ccc') + circ(rx + 30, ry - 4, 6, '#ccc') + `</g>`;
    // snacks on the floor
    q += `<path d="M640,1380 L760,1370 L770,1450 L650,1460Z" fill="#ffd23f" ${ink(6)}/>` + text(706, 1428, 'CHIPS', 30, '#e8262b', { stroke: 0, extra: 'transform="rotate(-5 706 1428)"' });
    for (let i = 0; i < 6; i++) q += circ(600 + hash(i) * 260, 1470 + hash(i + 2) * 40, 7, '#f4c430', ink(3));
    // TV glow from off-screen right
    const fl = 0.16 + 0.08 * Math.sin(st * 13) * Math.sin(st * 5.3);
    q += `<defs><linearGradient id="tvg" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#7fc8ff" stop-opacity="${fl * 2}"/><stop offset="0.6" stop-color="#7fc8ff" stop-opacity="0"/></linearGradient></defs>` + R(0, 0, W, H, 'url(#tvg)');
    q += vignette('vn2', 0.5);
    return cam(z, 560, 1000, q);
  }

  const Scenes = { night, tease, alarm, phone: phoneScene, world, door, handshake, hug, xray, sprint, hospital, gentle, couch };
  root.Scenes = Scenes;
})(window);
