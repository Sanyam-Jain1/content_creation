// Drawing kit: flat cartoon style, thick ink outlines. Everything returns SVG strings
// for a 1080x1920 frame.
(function (root) {
  'use strict';
  const W = 1080, H = 1920;
  const INK = '#1d1b22';
  const C = {
    ink: INK, yellow: '#ffd23f', red: '#ff4d3d', white: '#fffaf0', cream: '#fff3dc',
    skin: ['#f2c29b', '#c98e64', '#8d5a3b', '#e9b48c', '#62402b', '#f6d0b0'],
    shirts: ['#4d7cfe', '#ff7a59', '#2ec4b6', '#ffd23f', '#9b5de5', '#f15bb5', '#00bbf9', '#8ac926', '#ff595e', '#6a4c93'],
    hair: ['#3b2a20', '#1d1b22', '#8a5a2b', '#d9a441', '#5a3825', '#b5b0a8'],
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeIn = (t) => Math.pow(clamp(t, 0, 1), 3);
  const back = (t) => { t = clamp(t, 0, 1); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const p = (t, a, d) => clamp((t - a) / d, 0, 1); // progress of t through [a, a+d]
  const rad = (d) => (d * Math.PI) / 180;
  const R = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  const ink = (w = 8) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const g = (tr, inner, extra = '') => `<g transform="${tr}" ${extra}>${inner}</g>`;
  function shade(hex, amt) {
    const c = parseInt(hex.slice(1), 16);
    let r = c >> 16, gg = (c >> 8) & 255, b = c & 255;
    if (amt < 0) { r *= 1 + amt; gg *= 1 + amt; b *= 1 + amt; } else { r += (255 - r) * amt; gg += (255 - gg) * amt; b += (255 - b) * amt; }
    return '#' + [r, gg, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  // thick outlined limb (a polyline drawn twice: ink then colour)
  function limb(pts, w, col, inkW = 7) {
    const d = 'M' + pts.map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' L');
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + inkW * 2}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  const circ = (x, y, r, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;

  // ---------------- faces ----------------
  // hx,hy head centre, r head radius. o.expr, o.look [x,y], o.blink
  function face(hx, hy, r, o) {
    const e = o.expr || 'neutral';
    const k = r / 78;
    const lx = (o.look ? o.look[0] : 0) * 6 * k, ly = (o.look ? o.look[1] : 0) * 5 * k;
    const ex = 29 * k, ey = hy - 4 * k;
    let s = '';
    const brow = (y, inner, outer, w = 7) => [-1, 1].map((sd) =>
      `<path d="M${hx + sd * 14 * k},${y - inner * k} L${hx + sd * 42 * k},${y - outer * k}" ${ink(w * k)} fill="none"/>`).join('');
    const openEyes = (rx, ry, pr) => [-1, 1].map((sd) =>
      `<ellipse cx="${hx + sd * ex}" cy="${ey}" rx="${rx * k}" ry="${ry * k * (1 - (o.blink || 0) * 0.92)}" fill="#fff" ${ink(5 * k)}/>` +
      ((o.blink || 0) < 0.6 ? circ(hx + sd * ex + lx, ey + ly, pr * k, INK) + circ(hx + sd * ex + lx + 2.5 * k, ey + ly - 3 * k, pr * 0.32 * k, '#fff') : '')).join('');
    const arcEyes = (up) => [-1, 1].map((sd) =>
      `<path d="M${hx + sd * ex - 13 * k},${ey} Q${hx + sd * ex},${ey + (up ? -14 : 12) * k} ${hx + sd * ex + 13 * k},${ey}" ${ink(6 * k)} fill="none"/>`).join('');
    if (o.red) s += `<circle cx="${hx}" cy="${hy}" r="${r - 4}" fill="#ff3b2f" opacity="${o.red}"/>`;
    if (o.blush || e === 'happy' || e === 'relaxed') s += [-1, 1].map((sd) => `<ellipse cx="${hx + sd * 46 * k}" cy="${hy + 20 * k}" rx="${13 * k}" ry="${8 * k}" fill="#ff7a6b" opacity="0.45"/>`).join('');
    const my = hy + 36 * k;
    if (e === 'neutral') {
      s += openEyes(13, 16, 7) + brow(hy - 30 * k, 0, 2);
      s += `<path d="M${hx - 14 * k},${my} Q${hx},${my + 9 * k} ${hx + 14 * k},${my}" ${ink(6 * k)} fill="none"/>`;
    } else if (e === 'shock') {
      s += openEyes(20, 23, 5) + brow(hy - 44 * k, 6, -2);
      s += `<ellipse cx="${hx}" cy="${my + 8 * k}" rx="${13 * k}" ry="${(o.mouth ?? 1) * 19 * k + 3}" fill="#5a1620" ${ink(5 * k)}/>`;
    } else if (e === 'worried') {
      s += openEyes(13, 17, 6) + brow(hy - 32 * k, 10, -2);
      s += `<path d="M${hx - 18 * k},${my + 6 * k} q${6 * k},${-8 * k} ${12 * k},0 t${12 * k},0 t${12 * k},0" ${ink(5 * k)} fill="none"/>`;
    } else if (e === 'sleep') {
      s += arcEyes(false);
      s += `<ellipse cx="${hx + 4 * k}" cy="${my + 4 * k}" rx="${7 * k}" ry="${(5 + (o.snore || 0) * 6) * k}" fill="#5a1620" ${ink(4 * k)}/>`;
    } else if (e === 'happy') {
      s += arcEyes(true) + brow(hy - 34 * k, 2, 2);
      s += `<path d="M${hx - 24 * k},${my - 4 * k} Q${hx},${my + 30 * k} ${hx + 24 * k},${my - 4 * k} Z" fill="#5a1620" ${ink(5 * k)}/>`;
    } else if (e === 'pain' || e === 'strain') {
      s += [-1, 1].map((sd) => `<path d="M${hx + sd * (ex + 12 * k)},${ey - 10 * k} L${hx + sd * (ex - 10 * k)},${ey} L${hx + sd * (ex + 12 * k)},${ey + 10 * k}" ${ink(6 * k)} fill="none"/>`).join('');
      s += brow(hy - 34 * k, e === 'pain' ? 9 : -6, e === 'pain' ? -3 : 4);
      s += `<rect x="${hx - 22 * k}" y="${my - 6 * k}" width="${44 * k}" height="${18 * k}" rx="${6 * k}" fill="#fff" ${ink(5 * k)}/><line x1="${hx - 22 * k}" y1="${my + 3 * k}" x2="${hx + 22 * k}" y2="${my + 3 * k}" ${ink(3 * k)}/>`;
    } else if (e === 'relaxed') {
      s += [-1, 1].map((sd) => `<path d="M${hx + sd * ex - 13 * k},${ey} Q${hx + sd * ex},${ey + 10 * k} ${hx + sd * ex + 13 * k},${ey}" fill="#fff" ${ink(5 * k)}/>` + circ(hx + sd * ex + 2 * k, ey + 4 * k, 4 * k, INK) +
        `<path d="M${hx + sd * ex - 15 * k},${ey} L${hx + sd * ex + 15 * k},${ey}" ${ink(6 * k)}/>`).join('');
      s += `<path d="M${hx - 16 * k},${my} Q${hx},${my + 12 * k} ${hx + 16 * k},${my - 2 * k}" ${ink(6 * k)} fill="none"/>`;
    } else if (e === 'focus') {
      s += openEyes(10, 12, 6) + brow(hy - 26 * k, -6, 3);
      s += `<path d="M${hx - 12 * k},${my} L${hx + 12 * k},${my}" ${ink(6 * k)}/><path d="M${hx + 6 * k},${my + 2 * k} q${8 * k},${16 * k} ${16 * k},${2 * k}" fill="#ff6f8a" ${ink(4 * k)}/>`;
    } else if (e === 'determined') {
      s += openEyes(13, 15, 7) + brow(hy - 28 * k, -8, 3);
      s += `<path d="M${hx - 20 * k},${my - 2 * k} Q${hx},${my + 16 * k} ${hx + 20 * k},${my - 2 * k} Z" fill="#fff" ${ink(5 * k)}/>`;
    }
    if (o.sweat) s += `<path d="M${hx + 62 * k},${hy - 40 * k} q${12 * k},${22 * k} 0,${30 * k} q${-12 * k},${-8 * k} 0,${-30 * k}Z" fill="#8fd3ff" ${ink(4 * k)}/>`;
    if (o.stress) {
      const sx = hx + 70 * k, sy = hy - 70 * k;
      s += `<g transform="rotate(${o.stressRot || 0} ${sx} ${sy})">` + [0, 1, 2].map((i) => {
        const a = rad(-60 + i * 40);
        return `<line x1="${sx + Math.cos(a) * 16 * k}" y1="${sy + Math.sin(a) * 16 * k}" x2="${sx + Math.cos(a) * 38 * k}" y2="${sy + Math.sin(a) * 38 * k}" stroke="${C.red}" stroke-width="${7 * k}" stroke-linecap="round"/>`;
      }).join('') + `</g>`;
    }
    return s;
  }

  function hair(hx, hy, r, style, col, front) {
    const k = r / 78;
    if (style === 'tuft') {
      if (!front) return '';
      return `<path d="M${hx - 74 * k},${hy - 14 * k} C${hx - 86 * k},${hy - 84 * k} ${hx - 20 * k},${hy - 104 * k} ${hx + 18 * k},${hy - 92 * k} L${hx + 6 * k},${hy - 118 * k} L${hx + 36 * k},${hy - 92 * k} L${hx + 48 * k},${hy - 112 * k} L${hx + 56 * k},${hy - 76 * k} C${hx + 78 * k},${hy - 62 * k} ${hx + 80 * k},${hy - 34 * k} ${hx + 74 * k},${hy - 14 * k} C${hx + 48 * k},${hy - 44 * k} ${hx - 10 * k},${hy - 56 * k} ${hx - 42 * k},${hy - 36 * k} C${hx - 54 * k},${hy - 28 * k} ${hx - 66 * k},${hy - 22 * k} ${hx - 74 * k},${hy - 14 * k}Z" fill="${col}" ${ink(6 * k)}/>`;
    }
    if (style === 'bun') {
      if (!front) return circ(hx, hy - 92 * k, 34 * k, col, ink(6 * k));
      return `<path d="M${hx - 78 * k},${hy + 4 * k} C${hx - 86 * k},${hy - 80 * k} ${hx + 86 * k},${hy - 80 * k} ${hx + 78 * k},${hy + 4 * k} C${hx + 60 * k},${hy - 36 * k} ${hx - 60 * k},${hy - 36 * k} ${hx - 78 * k},${hy + 4 * k}Z" fill="${col}" ${ink(6 * k)}/>`;
    }
    if (style === 'long') {
      if (!front) return `<path d="M${hx - 84 * k},${hy - 10 * k} C${hx - 96 * k},${hy + 70 * k} ${hx - 90 * k},${hy + 110 * k} ${hx - 60 * k},${hy + 120 * k} L${hx + 60 * k},${hy + 120 * k} C${hx + 90 * k},${hy + 110 * k} ${hx + 96 * k},${hy + 70 * k} ${hx + 84 * k},${hy - 10 * k}Z" fill="${col}" ${ink(6 * k)}/>`;
      return `<path d="M${hx - 80 * k},${hy + 10 * k} C${hx - 90 * k},${hy - 90 * k} ${hx + 90 * k},${hy - 90 * k} ${hx + 80 * k},${hy + 10 * k} C${hx + 50 * k},${hy - 40 * k} ${hx - 20 * k},${hy - 50 * k} ${hx - 80 * k},${hy + 10 * k}Z" fill="${col}" ${ink(6 * k)}/>`;
    }
    if (style === 'curly') {
      if (!front) return '';
      let s = '';
      for (let i = 0; i < 9; i++) { const a = rad(200 + i * 17.5); s += circ(hx + Math.cos(a) * 72 * k, hy + Math.sin(a) * 66 * k - 6 * k, 22 * k, col, ink(5 * k)); }
      return s;
    }
    if (style === 'cap') {
      if (!front) return '';
      return `<path d="M${hx - 76 * k},${hy - 20 * k} C${hx - 76 * k},${hy - 100 * k} ${hx + 76 * k},${hy - 100 * k} ${hx + 76 * k},${hy - 20 * k}Z" fill="${col}" ${ink(6 * k)}/><path d="M${hx + 20 * k},${hy - 24 * k} L${hx + 120 * k},${hy - 18 * k} L${hx + 70 * k},${hy - 38 * k}Z" fill="${shade(col, -0.2)}" ${ink(6 * k)}/>`;
    }
    if (style === 'short') {
      if (!front) return '';
      return `<path d="M${hx - 76 * k},${hy - 10 * k} C${hx - 82 * k},${hy - 92 * k} ${hx + 82 * k},${hy - 92 * k} ${hx + 76 * k},${hy - 10 * k} C${hx + 60 * k},${hy - 50 * k} ${hx - 60 * k},${hy - 50 * k} ${hx - 76 * k},${hy - 10 * k}Z" fill="${col}" ${ink(6 * k)}/>`;
    }
    return '';
  }

  function head(hx, hy, r, o) {
    const skin = o.skin || C.skin[0];
    let s = hair(hx, hy, r, o.hair, o.hairColor || C.hair[0], false);
    s += circ(hx - r * 0.98, hy + r * 0.08, r * 0.2, skin, ink(6 * r / 78)) + circ(hx + r * 0.98, hy + r * 0.08, r * 0.2, skin, ink(6 * r / 78));
    s += circ(hx, hy, r, skin, ink(7 * r / 78));
    s += face(hx, hy, r, o);
    s += hair(hx, hy, r, o.hair, o.hairColor || C.hair[0], true);
    if (o.glasses) s += [-1, 1].map((sd) => circ(hx + sd * 29 * r / 78, hy - 4 * r / 78, 22 * r / 78, 'none', ink(5 * r / 78))).join('') + `<line x1="${hx - 7 * r / 78}" y1="${hy - 4 * r / 78}" x2="${hx + 7 * r / 78}" y2="${hy - 4 * r / 78}" ${ink(5 * r / 78)}/>`;
    return s;
  }

  // ---------------- front-facing person ----------------
  // feet at (x,y). arms: armL/armR = [upperDeg, foreDeg] measured from straight down, + = outward/up.
  function arm(side, o, sh) {
    const [a1, a2] = (side < 0 ? o.armL : o.armR) || [12, 8];
    const L1 = 86, L2 = 80;
    const s0 = [side * 74, -250];
    const e = [s0[0] + side * Math.sin(rad(a1)) * L1, s0[1] + Math.cos(rad(a1)) * L1];
    const h = [e[0] + side * Math.sin(rad(a2)) * L2, e[1] + Math.cos(rad(a2)) * L2];
    const cast = (o.cast || []).includes(side < 0 ? 'l' : 'r');
    let s = limb([s0, e], 36, o.shirt) + limb([e, h], cast ? 40 : 32, cast ? '#f4f4f0' : o.sleeve === 'short' ? o.skin : o.shirt);
    if (cast) s += [0.3, 0.55, 0.8].map((f) => { const q = [lerp(e[0], h[0], f), lerp(e[1], h[1], f)]; return `<circle cx="${q[0]}" cy="${q[1]}" r="4" fill="#c9c9c0"/>`; }).join('');
    s += circ(h[0], h[1], 24, o.skin, ink(6));
    return { svg: s, hand: h };
  }
  function person(o) {
    o = Object.assign({ x: 540, y: 1500, s: 1, skin: C.skin[0], shirt: C.shirts[0], pants: '#2f3b55', hair: 'tuft', hairColor: C.hair[0], expr: 'neutral', legs: 'stand', rot: 0 }, o);
    let s = '';
    // legs
    if (o.legs === 'stand' || o.legs === 'tiptoe') {
      for (const sd of [-1, 1]) {
        const fy = o.legs === 'tiptoe' ? -18 : 0;
        const lc = (o.cast || []).includes(sd < 0 ? 'legl' : 'legr');
        s += limb([[sd * 34, -120], [sd * 38, -24 + fy]], lc ? 50 : 40, lc ? '#f4f4f0' : o.pants);
        s += `<ellipse cx="${sd * 46}" cy="${-8 + fy}" rx="${o.legs === 'tiptoe' ? 22 : 36}" ry="18" fill="${INK}"/>`;
      }
    } else if (o.legs === 'sit') {
      for (const sd of [-1, 1]) {
        const lc = (o.cast || []).includes(sd < 0 ? 'legl' : 'legr');
        s += limb([[sd * 34, -120], [sd * 46, -110], [sd * 50, -20]], lc ? 50 : 40, lc ? '#f4f4f0' : o.pants) + `<ellipse cx="${sd * 58}" cy="-8" rx="36" ry="18" fill="${INK}"/>`;
      }
    }
    const armsBehind = o.armsBehind ? [arm(-1, o), arm(1, o)] : null;
    if (armsBehind) s += armsBehind[0].svg + armsBehind[1].svg;
    // body
    s += `<path d="M-84,-110 C-90,-200 -86,-262 -40,-272 L40,-272 C86,-262 90,-200 84,-110 Z" fill="${o.shirt}" ${ink(8)}/>`;
    if (o.pj) s += [-40, 0, 40].map((x) => `<line x1="${x}" y1="-262" x2="${x}" y2="-118" stroke="${shade(o.shirt, 0.25)}" stroke-width="10" opacity="0.7"/>`).join('');
    s += `<path d="M-84,-130 L84,-130 L84,-110 L-84,-110Z" fill="${o.pants}" ${ink(6)}/>`;
    let hands = {};
    if (!armsBehind) {
      const aL = arm(-1, o), aR = arm(1, o);
      s += aL.svg + aR.svg;
      hands = { l: aL.hand, r: aR.hand };
    }
    if (o.brace) s += `<rect x="-46" y="-292" width="92" height="40" rx="12" fill="#f4f4f0" ${ink(6)}/>`;
    s += head(0, -350, 78, o);
    if (o.bandage) s += `<path d="M-80,-380 Q0,-410 80,-380 L80,-352 Q0,-382 -80,-352Z" fill="#f4f4f0" ${ink(5)}/><path d="M40,-392 l0,22 M29,-381 l22,0" stroke="${C.red}" stroke-width="6"/>`;
    const tr = `translate(${o.x},${o.y}) rotate(${o.rot}) scale(${o.s})`;
    return { svg: g(tr, s + (o.extra || '')), hands, tr };
  }

  // ---------------- side-view person (walk / run / tiptoe) ----------------
  // facing right. o.phase radians, o.mode: 'run' | 'tiptoe' | 'walk', o.lean deg
  function sidePerson(o) {
    o = Object.assign({ x: 540, y: 1500, s: 1, skin: C.skin[0], shirt: C.shirts[1], pants: '#2f3b55', hair: 'short', hairColor: C.hair[1], mode: 'run', phase: 0, lean: 8, expr: 'determined' }, o);
    const ph = o.phase;
    const amp = o.mode === 'run' ? 48 : o.mode === 'tiptoe' ? 26 : 24;
    const hip = [0, -170];
    const legAt = (q) => {
      const th = amp * Math.sin(q);
      const bend = o.mode === 'run' ? 30 + 55 * Math.max(0, Math.sin(q - 1.6)) : o.mode === 'tiptoe' ? 10 + 70 * Math.max(0, Math.sin(q)) : 12 + 25 * Math.max(0, Math.sin(q - 1.4));
      const k = [hip[0] + Math.sin(rad(th)) * 82, hip[1] + Math.cos(rad(th)) * 82];
      const sa = th - bend;
      const f = [k[0] + Math.sin(rad(sa)) * 84, k[1] + Math.cos(rad(sa)) * 84];
      return [k, f];
    };
    const legs = o.brokenLegs ? null : [legAt(ph + Math.PI), legAt(ph)];
    let s = '';
    const lift = o.mode === 'run' ? Math.abs(Math.sin(ph)) * 18 : o.mode === 'tiptoe' ? Math.abs(Math.sin(ph)) * 22 : 0;
    const armAt = (q, sd) => {
      const a = (o.mode === 'tiptoe' ? 14 : o.mode === 'run' ? 55 : 26) * Math.sin(q);
      const sh = [6, -310];
      const e = [sh[0] + Math.sin(rad(a)) * 78, sh[1] + Math.cos(rad(a)) * 78];
      const fa = o.mode === 'tiptoe' ? a + 110 : a + (o.mode === 'run' ? 80 : 30);
      const h = [e[0] + Math.sin(rad(fa)) * 70, e[1] + Math.cos(rad(fa)) * 70];
      return [sh, e, h];
    };
    const drawLeg = (L, col) => limb([hip, L[0], L[1]], 38, col) + `<ellipse cx="${L[1][0] + 18}" cy="${L[1][1] + 4}" rx="${o.mode === 'tiptoe' ? 22 : 32}" ry="15" fill="${INK}" transform="rotate(${o.mode === 'tiptoe' ? 40 : 0} ${L[1][0]} ${L[1][1]})"/>`;
    const farArm = armAt(ph, -1), nearArm = armAt(ph + Math.PI, 1);
    let body = '';
    body += limb(farArm, 30, shade(o.shirt, -0.15)) + circ(farArm[2][0], farArm[2][1], 21, shade(o.skin, -0.1), ink(5));
    if (legs) body += drawLeg(legs[0], shade(o.pants, -0.2));
    else body += limb([hip, [30, -95], [-20, -40]], 38, shade(o.pants, -0.2)) + `<ellipse cx="-4" cy="-30" rx="32" ry="15" fill="${INK}"/>`;
    body += `<path d="M-42,-160 C-50,-250 -40,-330 0,-338 C40,-330 52,-250 42,-160 Z" fill="${o.shirt}" ${ink(8)}/>`;
    if (legs) body += drawLeg(legs[1], o.pants);
    else body += limb([hip, [-20, -100], [40, -50], [10, 0]], 38, o.pants) + `<ellipse cx="28" cy="4" rx="32" ry="15" fill="${INK}"/>`;
    body += limb(nearArm, 30, o.shirt) + circ(nearArm[2][0], nearArm[2][1], 22, o.skin, ink(5));
    if (o.handProp) body += o.handProp(nearArm[2]);
    // head in profile: same round head, features pushed toward the facing side
    const hx = 14, hy = -410;
    let hd = hair(hx, hy, 66, o.hair, o.hairColor, false);
    hd += circ(hx - 50, hy + 6, 15, o.skin, ink(6));
    hd += circ(hx, hy, 66, o.skin, ink(7));
    hd += `<g transform="translate(${hx + 22},${hy}) scale(0.82) translate(${-hx},${-hy})">${face(hx, hy, 66, Object.assign({}, o, { look: [1, 0] }))}</g>`;
    hd += `<path d="M${hx + 62},${hy + 2} q16,8 2,18" fill="${o.skin}" ${ink(5)}/>`;
    hd += hair(hx, hy, 66, o.hair, o.hairColor, true);
    body += hd;
    s = `<g transform="translate(0,${-lift}) rotate(${o.lean} 0 -170)">${body}</g>`;
    return g(`translate(${o.x},${o.y}) scale(${o.s})`, s);
  }

  // tiny crowd person holding a folded phone
  function mini(x, y, s, seed, opt = {}) {
    const sk = C.skin[Math.floor(hash(seed) * C.skin.length)];
    const sh = C.shirts[Math.floor(hash(seed + 3) * C.shirts.length)];
    const hc = C.hair[Math.floor(hash(seed + 7) * C.hair.length)];
    const bob = opt.t != null ? Math.sin(opt.t * 6 + seed) * 3 : 0;
    let q = `<path d="M-30,0 C-32,-40 -28,-62 0,-64 C28,-62 32,-40 30,0 Z" fill="${sh}" ${ink(5)}/>`;
    q += circ(0, -88, 26, sk, ink(5));
    q += `<path d="M-26,-92 C-26,-122 26,-122 26,-92 C14,-104 -14,-104 -26,-92Z" fill="${hc}" ${ink(4)}/>`;
    if (opt.face !== false) {
      if (opt.sad) q += circ(-9, -88, 3.5, INK) + circ(9, -88, 3.5, INK) + `<path d="M-8,-74 Q0,-80 8,-74" ${ink(3.5)} fill="none"/>`;
      else q += `<circle cx="-9" cy="-90" r="6" fill="#fff" ${ink(3)}/><circle cx="9" cy="-90" r="6" fill="#fff" ${ink(3)}/>` + circ(-9, -90, 2.4, INK) + circ(9, -90, 2.4, INK) + `<ellipse cx="0" cy="-74" rx="4" ry="5.5" fill="#5a1620"/>`;
    }
    if (opt.phone !== false) q += `<path d="M-8,-38 L4,-14 L18,-40" fill="none" stroke="${INK}" stroke-width="12" stroke-linejoin="round"/><path d="M-8,-38 L4,-14 L18,-40" fill="none" stroke="#5b6274" stroke-width="6" stroke-linejoin="round"/>` + circ(4, -18, 7, sk, ink(3));
    return `<g transform="translate(${x},${y + bob}) scale(${s})">${q}</g>`;
  }

  // ---------------- props ----------------
  function phone(w, h, o = {}) {
    // centred at 0,0
    const r = w * 0.16;
    let s = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${r}" fill="${o.body || '#22252e'}" ${ink(8)}/>`;
    if (o.back) return s + circ(-w / 2 + w * 0.25, -h / 2 + w * 0.25, w * 0.12, '#444a58', ink(4));
    s += `<rect x="${-w / 2 + 12}" y="${-h / 2 + 12}" width="${w - 24}" height="${h - 24}" rx="${r * 0.7}" fill="${o.screen || '#5b7cfa'}"/>`;
    s += `<rect x="${-w * 0.14}" y="${-h / 2 + 20}" width="${w * 0.28}" height="12" rx="6" fill="#111"/>`;
    if (o.time) s += `<text x="0" y="${-h * 0.18}" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="${w * 0.3}" fill="#fff">${o.time}</text>`;
    if (o.notes) for (let i = 0; i < 3; i++) s += `<rect x="${-w / 2 + 26}" y="${-h * 0.02 + i * h * 0.13}" width="${w - 52}" height="${h * 0.1}" rx="12" fill="#fff" opacity="0.85"/>`;
    return s;
  }
  function crack(x, y, r, seed, prog = 1, col = '#fff', w = 5) {
    let s = '';
    for (let i = 0; i < 7; i++) {
      const a = hash(seed + i) * Math.PI * 2;
      let px = x, py = y, d = `M${x},${y}`;
      const n = 4;
      for (let j = 1; j <= n * prog; j++) {
        const rr = (r * j) / n;
        const aa = a + (hash(seed + i * 9 + j) - 0.5) * 0.7;
        px = x + Math.cos(aa) * rr; py = y + Math.sin(aa) * rr;
        d += ` L${px.toFixed(1)},${py.toFixed(1)}`;
      }
      s += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
    return s;
  }
  function burst(x, y, r, n, col, rot = 0) {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = rad(rot) + (i * Math.PI) / n;
      const rr = i % 2 ? r * 0.55 : r;
      d += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ',' + (y + Math.sin(a) * rr).toFixed(1);
    }
    return `<path d="${d}Z" fill="${col}" ${ink(8)}/>`;
  }
  function speedLines(t, col = '#fff', op = 0.5, n = 22) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const y = hash(i) * H, len = 200 + hash(i + 4) * 400, x = ((hash(i + 9) * W * 2 - t * 3000 * (0.6 + hash(i + 2))) % (W * 2) + W * 2) % (W * 2) - W / 2;
      s += `<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y}" stroke="${col}" stroke-width="${4 + hash(i + 5) * 8}" opacity="${op}" stroke-linecap="round"/>`;
    }
    return s;
  }
  function vignette(id, strength = 0.55) {
    return `<defs><radialGradient id="${id}" cx="0.5" cy="0.45" r="0.78"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${strength}"/></radialGradient></defs>${R(0, 0, W, H, `url(#${id})`)}`;
  }
  function halftone(id, col, op = 0.12, size = 26) {
    return `<defs><pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse"><circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.18}" fill="${col}"/></pattern></defs>${R(0, 0, W, H, `url(#${id})`, `opacity="${op}"`)}`;
  }
  function rays(cx, cy, col1, col2, rot = 0, n = 18) {
    let s = R(0, 0, W, H, col1);
    for (let i = 0; i < n; i++) {
      const a0 = rad(rot + (i * 360) / n), a1 = rad(rot + (i * 360) / n + 180 / n);
      s += `<path d="M${cx},${cy} L${cx + Math.cos(a0) * 2600},${cy + Math.sin(a0) * 2600} L${cx + Math.cos(a1) * 2600},${cy + Math.sin(a1) * 2600}Z" fill="${col2}"/>`;
    }
    return s;
  }
  const text = (x, y, str, size, fill, o = {}) =>
    `<text x="${x}" y="${y}" text-anchor="${o.anchor || 'middle'}" font-family="${o.font || "'Luckiest Guy','Montserrat',sans-serif"}" font-weight="${o.weight || 400}" font-size="${size}" fill="${fill}" ${o.stroke !== 0 ? `stroke="${o.strokeCol || INK}" stroke-width="${o.stroke || size * 0.14}" paint-order="stroke" stroke-linejoin="round"` : ''} ${o.extra || ''}>${esc(str)}</text>`;

  root.Kit = { W, H, INK, C, clamp, lerp, ease, easeOut, easeIn, back, hash, esc, p, rad, R, ink, g, shade, limb, circ, face, head, person, sidePerson, mini, phone, crack, burst, speedLines, vignette, halftone, rays, text };
})(window);
