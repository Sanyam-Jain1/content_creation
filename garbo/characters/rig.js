// GARBO character rig: stylised-realism vector portraits.
// Every character is drawn into a 600x900 box (bust / waist-up), head centred
// near (300, 300). drawCharacter(id, state) returns an SVG <g> string.
//
// state = {
//   open: 0..1     mouth opening (lip-sync)
//   round: 0..1    mouth roundness (O/U shapes)
//   smile: -1..1   mouth corners
//   blink: 0..1    1 = eyes shut
//   lookX, lookY: -1..1   iris direction
//   brow: -1..1    -1 = frown, 1 = raised
//   tilt: degrees  head tilt
//   turn: -1..1    slight head turn (shifts features)
//   breathe: 0..1  shoulder rise
// }
(function (root) {
  'use strict';

  const DEF = { open: 0, round: 0, smile: 0, blink: 0, lookX: 0, lookY: 0, brow: 0, tilt: 0, turn: 0, breathe: 0 };

  // ---------- helpers ----------
  const f = (n) => Math.round(n * 10) / 10;
  function crPath(pts, closed = true, tension = 1) {
    // Catmull-Rom -> cubic bezier
    const n = pts.length;
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const q0 = !closed && i === 0 ? p1 : p0;
      const q3 = !closed && i === n - 2 ? p2 : p3;
      const c1 = [p1[0] + (p2[0] - q0[0]) / 6 * tension, p1[1] + (p2[1] - q0[1]) / 6 * tension];
      const c2 = [p2[0] - (q3[0] - p1[0]) / 6 * tension, p2[1] - (q3[1] - p1[1]) / 6 * tension];
      d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
    }
    return d + (closed ? 'Z' : '');
  }
  function shade(hex, amt) {
    // amt < 0 darker, > 0 lighter
    const c = parseInt(hex.slice(1), 16);
    let r = c >> 16, g = (c >> 8) & 255, b = c & 255;
    if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  let uid = 0;
  const nid = (p) => `${p}${++uid}`;

  // ---------- head geometry ----------
  function headOutline(P, cx, cy) {
    const { w, h, jaw, cheek = 0.5, chin = 0.18, crown = 0.5 } = P.head;
    const hw = w / 2;
    return [
      [cx, cy - h / 2],                                  // crown
      [cx + hw * 0.80, cy - h * 0.40 * (crown + 0.5)],   // upper skull
      [cx + hw, cy - h * 0.10],                          // temple
      [cx + hw * (0.86 + cheek * 0.14), cy + h * 0.14],  // cheekbone
      [cx + jaw / 2, cy + h * 0.34],                     // jaw corner
      [cx + w * chin, cy + h * 0.47],                    // chin side
      [cx, cy + h / 2],                                  // chin
      [cx - w * chin, cy + h * 0.47],
      [cx - jaw / 2, cy + h * 0.34],
      [cx - hw * (0.86 + cheek * 0.14), cy + h * 0.14],
      [cx - hw, cy - h * 0.10],
      [cx - hw * 0.80, cy - h * 0.40 * (crown + 0.5)],
    ];
  }

  function eye(P, S, ex, ey, side, clip) {
    const E = P.eyes;
    const ew = E.w, eh = E.h;
    const id = nid('eye');
    const lidDrop = Math.min(1, (E.lid || 0) + S.blink * (1 - (E.lid || 0)));
    const tiltUp = E.tiltUp ?? 0.06;
    const almond = `M${ex - ew / 2},${ey} Q${ex - ew * 0.08},${ey - eh * 1.25} ${ex + ew / 2},${ey - eh * tiltUp * side} Q${ex + ew * 0.02},${ey + eh * 0.95} ${ex - ew / 2},${ey}Z`;
    const ix = ex + S.lookX * ew * 0.22 + S.turn * ew * 0.15;
    const iy = ey - eh * 0.08 + S.lookY * eh * 0.25;
    const ir = E.iris || eh * 0.62;
    let g = `<clipPath id="${id}"><path d="${almond}"/></clipPath>`;
    g += `<path d="${almond}" fill="${E.white || '#f1ebe2'}"/>`;
    g += `<g clip-path="url(#${id})">`;
    g += `<circle cx="${f(ix)}" cy="${f(iy)}" r="${f(ir)}" fill="${E.color}"/>`;
    g += `<circle cx="${f(ix)}" cy="${f(iy)}" r="${f(ir * 0.48)}" fill="#120c08"/>`;
    g += `<circle cx="${f(ix + ir * 0.35)}" cy="${f(iy - ir * 0.35)}" r="${f(ir * 0.22)}" fill="#fff" opacity="0.85"/>`;
    // upper lid (skin) drops for blink / heavy lids
    const lidY = ey - eh * 1.2 + lidDrop * eh * 1.9;
    g += `<rect x="${ex - ew}" y="${ey - eh * 2}" width="${ew * 2}" height="${f(lidY - (ey - eh * 2))}" fill="${P.skin}"/>`;
    g += `<rect x="${ex - ew}" y="${ey - eh * 2}" width="${ew * 2}" height="${f(lidY - (ey - eh * 2))}" fill="#5a3020" opacity="0.10"/>`;
    g += `</g>`;
    // lash line follows the lid
    const ll = Math.max(ey - eh * 0.95, lidY);
    const lashCurve = lidDrop > 0.85
      ? `M${ex - ew / 2},${ey} Q${ex},${ey + eh * 0.35} ${ex + ew / 2},${ey - eh * tiltUp * side}`
      : `M${ex - ew / 2 - 1},${ey + 0.5} Q${ex - ew * 0.1},${f(ll - eh * 0.25)} ${ex + ew / 2 + 1},${f(Math.max(ey - eh * tiltUp * side, ll * 0.3 + ey * 0.7))}`;
    g += `<path d="${lashCurve}" fill="none" stroke="${E.lash || '#1d130e'}" stroke-width="${E.lashW || 3.2}" stroke-linecap="round"/>`;
    // crease above eye
    if (E.crease !== false) {
      g += `<path d="M${ex - ew * 0.45},${ey - eh * 1.25} Q${ex},${ey - eh * 1.75} ${ex + ew * 0.5},${ey - eh * 1.15}" fill="none" stroke="${shade(P.skin, -0.35)}" stroke-width="1.6" opacity="0.6" stroke-linecap="round"/>`;
    }
    // lower lid / bag
    if (E.bags) g += `<path d="M${ex - ew * 0.4},${ey + eh * 0.75} Q${ex},${ey + eh * 1.2} ${ex + ew * 0.42},${ey + eh * 0.6}" fill="none" stroke="${shade(P.skin, -0.3)}" stroke-width="1.4" opacity="${E.bags}" stroke-linecap="round"/>`;
    return g;
  }

  function brow(P, S, bx, by, side) {
    const B = P.brows;
    const lift = S.brow * 9;
    const inner = side < 0 ? 1 : -1; // inner end points to centre
    const x0 = bx + inner * B.w * 0.5 * -1; // inner
    const xi = bx - side * B.w * 0.5, xo = bx + side * B.w * 0.5;
    const yi = by - lift - (S.brow < 0 ? S.brow * -6 : 0) + (S.brow < 0 ? 4 : 0);
    const yo = by - lift * 0.6 + (B.slope || 0);
    const peak = by - lift - B.arch;
    const t = B.t;
    const top = crPath([[xi, yi - t * 0.5], [bx + side * B.w * 0.1, peak - t * 0.55], [xo, yo - t * 0.15]], false);
    const d = `M${f(xi)},${f(yi + t * 0.5)} Q${f(bx + side * B.w * 0.08)},${f(peak + t * 0.45)} ${f(xo)},${f(yo + t * 0.2)} L${f(xo)},${f(yo - t * 0.15)} ` +
      top.replace(/^M[^C]+/, '').replace(/C/g, 'C') ;
    // simpler robust brow: thick tapered quad
    const p = `M${f(xi)},${f(yi + t * 0.55)} Q${f(bx + side * B.w * 0.05)},${f(peak + t * 0.5)} ${f(xo)},${f(yo + t * 0.15)} Q${f(bx + side * B.w * 0.12)},${f(peak - t * 0.6)} ${f(xi)},${f(yi - t * 0.5)}Z`;
    return `<path d="${p}" fill="${B.color}"/>`;
  }

  function nose(P, S, cx, cy) {
    const N = P.nose;
    const tx = cx + S.turn * 24;
    const len = N.len, wid = N.w;
    const tipY = cy + len;
    const sk = P.skin, dk = shade(P.skin, -0.32);
    let g = '';
    // bridge shadow on one side
    const hook = N.hook || 0;
    g += `<path d="M${f(tx - 6)},${f(cy - len * 0.15)} C${f(tx - 9 - hook * 0.3)},${f(cy + len * 0.35)} ${f(tx - 6 - hook)},${f(tipY - len * 0.25)} ${f(tx - wid * 0.25)},${f(tipY - 2)}" fill="none" stroke="${dk}" stroke-width="3" opacity="0.55" stroke-linecap="round"/>`;
    // side plane shadow
    g += `<path d="M${f(tx - 3)},${f(cy)} C${f(tx - 10 - hook)},${f(cy + len * 0.5)} ${f(tx - wid * 0.6)},${f(tipY - 6)} ${f(tx - wid * 0.55)},${f(tipY + 4)} L${f(tx - 2)},${f(tipY + 2)}Z" fill="${dk}" opacity="0.18"/>`;
    // tip + nostrils
    g += `<path d="M${f(tx - wid * 0.55)},${f(tipY - 2)} Q${f(tx - wid * 0.62)},${f(tipY + 9)} ${f(tx - wid * 0.25)},${f(tipY + 8)} Q${f(tx)},${f(tipY + 14 + hook * 0.4)} ${f(tx + wid * 0.25)},${f(tipY + 8)} Q${f(tx + wid * 0.62)},${f(tipY + 9)} ${f(tx + wid * 0.55)},${f(tipY - 2)}" fill="none" stroke="${dk}" stroke-width="2.6" stroke-linecap="round" opacity="0.85"/>`;
    g += `<ellipse cx="${f(tx - wid * 0.28)}" cy="${f(tipY + 7)}" rx="${f(wid * 0.12)}" ry="3" fill="${shade(sk, -0.55)}" opacity="0.7"/>`;
    g += `<ellipse cx="${f(tx + wid * 0.28)}" cy="${f(tipY + 7)}" rx="${f(wid * 0.12)}" ry="3" fill="${shade(sk, -0.55)}" opacity="0.7"/>`;
    // highlight
    g += `<path d="M${f(tx + 3)},${f(cy + len * 0.2)} L${f(tx + 4)},${f(tipY - 4)}" stroke="#fff" stroke-width="3" opacity="0.18" stroke-linecap="round"/>`;
    return g;
  }

  function mouth(P, S, cx, my) {
    const M = P.mouth;
    const tx = cx + S.turn * 15;
    const open = Math.max(0, Math.min(1, S.open));
    const w = M.w * (1 - S.round * 0.38) * (1 + Math.max(0, S.smile) * 0.08);
    const hw = w / 2;
    const corner = -S.smile * 6;
    const oh = open * M.maxOpen * (1 + S.round * 0.25);
    const lip = M.lip || '#a9615a';
    const lipDk = shade(lip, -0.3);
    let g = '';
    if (oh < 1.5) {
      // closed mouth: upper lip shape + parting line + lower lip
      g += `<path d="M${f(tx - hw)},${f(my + corner)} Q${f(tx - hw * 0.4)},${f(my - M.upper)} ${f(tx)},${f(my - M.upper * 0.55)} Q${f(tx + hw * 0.4)},${f(my - M.upper)} ${f(tx + hw)},${f(my + corner)} Q${f(tx)},${f(my + 2)} ${f(tx - hw)},${f(my + corner)}Z" fill="${lip}"/>`;
      g += `<path d="M${f(tx - hw)},${f(my + corner)} Q${f(tx)},${f(my + M.lower * 1.6)} ${f(tx + hw)},${f(my + corner)} Q${f(tx)},${f(my + 2)} ${f(tx - hw)},${f(my + corner)}Z" fill="${shade(lip, 0.08)}"/>`;
      g += `<path d="M${f(tx - hw - 2)},${f(my + corner)} Q${f(tx)},${f(my + 3 - S.smile * 3)} ${f(tx + hw + 2)},${f(my + corner)}" fill="none" stroke="${lipDk}" stroke-width="2.4" stroke-linecap="round"/>`;
    } else {
      const top = my - 1;
      const bot = my + oh;
      const inner = `M${f(tx - hw)},${f(my + corner)} Q${f(tx)},${f(top - 3)} ${f(tx + hw)},${f(my + corner)} Q${f(tx)},${f(bot + 4)} ${f(tx - hw)},${f(my + corner)}Z`;
      const id = nid('m');
      g += `<clipPath id="${id}"><path d="${inner}"/></clipPath>`;
      g += `<path d="${inner}" fill="#3a1414"/>`;
      g += `<g clip-path="url(#${id})">`;
      g += `<rect x="${f(tx - hw)}" y="${f(top - 6)}" width="${f(w)}" height="${f(Math.min(9, oh * 0.45) + 6)}" fill="#efe6da"/>`;
      if (oh > 12) g += `<ellipse cx="${f(tx)}" cy="${f(bot + 2)}" rx="${f(hw * 0.55)}" ry="${f(oh * 0.3)}" fill="#a2414a"/>`;
      g += `</g>`;
      // upper lip
      g += `<path d="M${f(tx - hw - 1)},${f(my + corner)} Q${f(tx - hw * 0.4)},${f(top - M.upper - 3)} ${f(tx)},${f(top - M.upper * 0.6 - 2)} Q${f(tx + hw * 0.4)},${f(top - M.upper - 3)} ${f(tx + hw + 1)},${f(my + corner)} Q${f(tx)},${f(top - 3)} ${f(tx - hw - 1)},${f(my + corner)}Z" fill="${lip}"/>`;
      // lower lip
      g += `<path d="M${f(tx - hw - 1)},${f(my + corner)} Q${f(tx)},${f(bot + 4)} ${f(tx + hw + 1)},${f(my + corner)} Q${f(tx)},${f(bot + 4 + M.lower * 1.5)} ${f(tx - hw - 1)},${f(my + corner)}Z" fill="${shade(lip, 0.08)}"/>`;
    }
    // philtrum + chin shadow
    g += `<path d="M${f(tx)},${f(my - M.upper - 14)} L${f(tx)},${f(my - M.upper - 3)}" stroke="${shade(P.skin, -0.25)}" stroke-width="5" opacity="0.25" stroke-linecap="round"/>`;
    g += `<path d="M${f(tx - hw * 0.5)},${f(my + M.lower * 2 + oh + 12)} Q${f(tx)},${f(my + M.lower * 2 + oh + 16)} ${f(tx + hw * 0.5)},${f(my + M.lower * 2 + oh + 12)}" stroke="${shade(P.skin, -0.3)}" stroke-width="3" fill="none" opacity="0.35" stroke-linecap="round"/>`;
    // smile lines
    if (M.lines) {
      g += `<path d="M${f(tx - hw - 12)},${f(my - 34)} Q${f(tx - hw - 22)},${f(my - 8)} ${f(tx - hw - 8)},${f(my + 14)}" stroke="${shade(P.skin, -0.3)}" stroke-width="2" fill="none" opacity="${M.lines}" stroke-linecap="round"/>`;
      g += `<path d="M${f(tx + hw + 12)},${f(my - 34)} Q${f(tx + hw + 22)},${f(my - 8)} ${f(tx + hw + 8)},${f(my + 14)}" stroke="${shade(P.skin, -0.3)}" stroke-width="2" fill="none" opacity="${M.lines}" stroke-linecap="round"/>`;
    }
    return g;
  }

  function ear(P, x, y, side) {
    const E = P.ears;
    const sk = P.skin, dk = shade(sk, -0.28);
    const out = E.out || 0;
    const ew = E.w, eh = E.h;
    const ox = x + side * (ew * 0.35 + out);
    const pts = [
      [x, y - eh * 0.42], [ox + side * ew * 0.35, y - eh * 0.48], [ox + side * ew * 0.62, y - eh * 0.1],
      [ox + side * ew * 0.4, y + eh * 0.3], [x + side * ew * 0.2, y + eh * 0.52], [x - side * 4, y + eh * 0.3],
    ];
    let g = `<path d="${crPath(pts)}" fill="${sk}"/>`;
    g += `<path d="${crPath(pts)}" fill="${dk}" opacity="0.18"/>`;
    g += `<path d="M${f(x + side * ew * 0.25)},${f(y - eh * 0.28)} Q${f(ox + side * ew * 0.35)},${f(y - eh * 0.2)} ${f(ox + side * ew * 0.25)},${f(y + eh * 0.1)} Q${f(x + side * ew * 0.3)},${f(y + eh * 0.15)} ${f(x + side * ew * 0.25)},${f(y + eh * 0.32)}" fill="none" stroke="${dk}" stroke-width="2.4" stroke-linecap="round" opacity="0.8"/>`;
    return g;
  }

  // ---------- clothing ----------
  function suit(P, S, cx) {
    const C = P.clothes;
    const by = (P._chinY || 420) + 104 - S.breathe * 4;
    const sh = C.shoulder || 210;
    const jacket = C.jacket, jd = shade(jacket, -0.3), jl = shade(jacket, 0.12);
    let g = '';
    // torso
    const body = [[cx - 58, by - 50], [cx - sh * 0.75, by - 8], [cx - sh, by + 40], [cx - sh - 20, by + 380], [cx + sh + 20, by + 380], [cx + sh, by + 40], [cx + sh * 0.75, by - 8], [cx + 58, by - 50]];
    // shirt V
    g += `<path d="M${cx - 62},${by - 60} L${cx + 62},${by - 60} L${cx + 70},${by + 200} L${cx - 70},${by + 200}Z" fill="${C.shirt || '#ece6da'}"/>`;
    if (C.openCollar) {
      g += `<path d="M${cx - 30},${by - 58} L${cx},${by + 40} L${cx + 30},${by - 58}Z" fill="${P.skin}"/>`;
      g += `<path d="M${cx - 30},${by - 58} L${cx},${by + 40} L${cx + 30},${by - 58}Z" fill="#5a3020" opacity="0.15"/>`;
    } else if (C.tie) {
      g += `<path d="M${cx - 13},${by - 40} L${cx + 13},${by - 40} L${cx + 9},${by - 22} L${cx - 9},${by - 22}Z" fill="${C.tie}"/>`;
      g += `<path d="M${cx - 9},${by - 22} L${cx + 9},${by - 22} L${cx + 24},${by + 190} L${cx},${by + 215} L${cx - 24},${by + 190}Z" fill="${C.tie}"/>`;
      if (C.tiePattern === 'dots') {
        for (let yy = by - 15; yy < by + 200; yy += 15) for (let xx = -20; xx <= 20; xx += 13) {
          const ww = 9 + (yy - by) * 0.07; if (Math.abs(xx) < ww) g += `<circle cx="${cx + xx + ((yy / 15) % 2 ? 6 : 0)}" cy="${yy}" r="2.6" fill="${C.tieDot || '#d8cdb8'}" opacity="0.85"/>`;
        }
      } else if (C.tiePattern === 'stripe') {
        for (let yy = by - 30; yy < by + 220; yy += 22) g += `<path d="M${cx - 30},${yy} L${cx + 30},${yy + 26}" stroke="${C.tieDot || '#b8a070'}" stroke-width="4" opacity="0.7"/>`;
      }
      g = g.replace(/(<path d="M\d+\.?\d*,\d+\.?\d* L[^"]+Z" fill="[^"]+"\/>)$/, '$1');
      // collar points
      g += `<path d="M${cx - 62},${by - 64} L${cx - 14},${by - 40} L${cx - 34},${by - 6}Z" fill="${shade(C.shirt || '#ece6da', -0.06)}"/>`;
      g += `<path d="M${cx + 62},${by - 64} L${cx + 14},${by - 40} L${cx + 34},${by - 6}Z" fill="${shade(C.shirt || '#ece6da', -0.06)}"/>`;
    }
    // jacket body with lapels
    const lapelL = `M${cx - 62},${by - 66} L${cx - 26},${by + 120} L${cx - 8},${by + 250} L${cx - 8},${by + 400} L${cx - sh - 20},${by + 400} L${cx - sh - 20},${by + 40} Q${cx - sh},${by - 10} ${cx - sh * 0.7},${by - 22}Z`;
    const lapelR = `M${cx + 62},${by - 66} L${cx + 26},${by + 120} L${cx + (C.doubleBreasted ? -40 : 8)},${by + 250} L${cx + (C.doubleBreasted ? -40 : 8)},${by + 400} L${cx + sh + 20},${by + 400} L${cx + sh + 20},${by + 40} Q${cx + sh},${by - 10} ${cx + sh * 0.7},${by - 22}Z`;
    g += `<path d="${lapelL}" fill="${jacket}"/><path d="${lapelR}" fill="${jacket}"/>`;
    if (C.pattern === 'pinstripe') {
      const id = nid('pin');
      g += `<clipPath id="${id}"><path d="${lapelL}"/><path d="${lapelR}"/></clipPath><g clip-path="url(#${id})" opacity="0.22">`;
      for (let xx = cx - sh - 30; xx < cx + sh + 30; xx += 16) g += `<line x1="${xx}" y1="${by - 80}" x2="${xx + 6}" y2="${by + 400}" stroke="#d9d4cc" stroke-width="1.3"/>`;
      g += `</g>`;
    } else if (C.pattern === 'tweed') {
      const id = nid('tw');
      g += `<clipPath id="${id}"><path d="${lapelL}"/><path d="${lapelR}"/></clipPath><g clip-path="url(#${id})" opacity="0.25">`;
      for (let xx = cx - sh - 30; xx < cx + sh + 30; xx += 22) g += `<line x1="${xx}" y1="${by - 80}" x2="${xx}" y2="${by + 400}" stroke="${shade(jacket, 0.35)}" stroke-width="2"/>`;
      for (let yy = by - 80; yy < by + 400; yy += 22) g += `<line x1="${cx - sh - 30}" y1="${yy}" x2="${cx + sh + 30}" y2="${yy}" stroke="${shade(jacket, -0.35)}" stroke-width="2"/>`;
      g += `</g>`;
    }
    // lapel folds
    g += `<path d="M${cx - 62},${by - 66} L${cx - 96},${by + 10} L${cx - 70},${by + 22} L${cx - 26},${by + 120}" fill="${jl}" opacity="0.5"/>`;
    g += `<path d="M${cx + 62},${by - 66} L${cx + 96},${by + 10} L${cx + 70},${by + 22} L${cx + 26},${by + 120}" fill="${jl}" opacity="0.5"/>`;
    g += `<path d="M${cx - 62},${by - 66} L${cx - 96},${by + 10} L${cx - 70},${by + 22} L${cx - 26},${by + 120} M${cx + 62},${by - 66} L${cx + 96},${by + 10} L${cx + 70},${by + 22} L${cx + 26},${by + 120}" fill="none" stroke="${jd}" stroke-width="2.4" stroke-linejoin="round"/>`;
    // shoulder shading
    g += `<path d="M${cx - sh - 20},${by + 40} Q${cx - sh},${by - 10} ${cx - sh * 0.7},${by - 22} L${cx - sh * 0.6},${by + 30} Q${cx - sh * 0.9},${by + 60} ${cx - sh - 20},${by + 140}Z" fill="${jd}" opacity="0.35"/>`;
    if (C.pocketSquare) g += `<path d="M${cx + 110},${by + 165} L${cx + 128},${by + 148} L${cx + 140},${by + 160} L${cx + 152},${by + 150} L${cx + 160},${by + 168}Z" fill="#f4f1ea"/><path d="M${cx + 100},${by + 168} L${cx + 168},${by + 168}" stroke="${jd}" stroke-width="3"/>`;
    if (C.doubleBreasted) {
      for (const [bx, byy] of [[-32, 230], [32, 230], [-32, 300], [32, 300]]) g += `<circle cx="${cx + bx}" cy="${by + byy}" r="6" fill="${jd}"/>`;
    } else if (C.buttons !== false) {
      g += `<circle cx="${cx - 2}" cy="${by + 268}" r="6" fill="${jd}"/>`;
    }
    if (C.waistcoat) g += `<path d="M${cx - 26},${by + 120} L${cx - 8},${by + 250} L${cx + 8},${by + 250} L${cx + 26},${by + 120}" fill="${shade(jacket, -0.12)}"/>`;
    if (C.pin) g += `<circle cx="${cx - 82}" cy="${by + 60}" r="7" fill="#b02020" stroke="#e8d27a" stroke-width="2"/><circle cx="${cx - 82}" cy="${by + 60}" r="2.5" fill="#fff"/>`;
    if (C.prison) {
      g = `<path d="M${cx - 60},${by - 66} Q${cx},${by - 20} ${cx + 60},${by - 66} L${cx + sh + 20},${by + 40} L${cx + sh + 20},${by + 390} L${cx - sh - 20},${by + 390} L${cx - sh - 20},${by + 40}Z" fill="${C.jacket}"/>` +
        `<path d="M${cx - 60},${by - 66} Q${cx},${by - 20} ${cx + 60},${by - 66}" fill="none" stroke="${jd}" stroke-width="5"/>` +
        `<path d="M${cx},${by - 40} L${cx},${by + 390}" stroke="${jd}" stroke-width="3"/>` +
        [120, 200, 280].map((yy) => `<circle cx="${cx + 10}" cy="${by + yy}" r="5" fill="${jd}"/>`).join('');
    }
    return g;
  }

  function dress(P, S, cx) {
    const C = P.clothes;
    const by = (P._chinY || 420) + 100 - S.breathe * 4;
    const sh = C.shoulder || 180;
    const d = C.dress, dd = shade(d, -0.3);
    let g = '';
    // skin V neckline
    g += `<path d="M${cx - 70},${by - 70} L${cx + 70},${by - 70} L${cx + 4},${by + 120} L${cx - 4},${by + 120}Z" fill="${P.skin}"/>`;
    g += `<path d="M${cx - 50},${by - 30} Q${cx},${by + 10} ${cx + 50},${by - 30}" fill="none" stroke="${shade(P.skin, -0.25)}" stroke-width="2" opacity="0.4"/>`;
    const body = `M${cx - 62},${by - 72} L${cx},${by + 125} L${cx + 62},${by - 72} Q${cx + sh * 0.8},${by - 40} ${cx + sh},${by + 30} L${cx + sh + 25},${by + 390} L${cx - sh - 25},${by + 390} L${cx - sh},${by + 30} Q${cx - sh * 0.8},${by - 40} ${cx - 62},${by - 72}Z`;
    g += `<path d="${body}" fill="${d}"/>`;
    // collar
    g += `<path d="M${cx - 62},${by - 72} L${cx - 92},${by - 10} L${cx - 12},${by + 100} L${cx},${by + 125}Z" fill="${shade(d, 0.1)}"/><path d="M${cx + 62},${by - 72} L${cx + 92},${by - 10} L${cx + 12},${by + 100} L${cx},${by + 125}Z" fill="${shade(d, 0.1)}"/>`;
    g += `<path d="M${cx - 62},${by - 72} L${cx - 92},${by - 10} L${cx - 12},${by + 100} M${cx + 62},${by - 72} L${cx + 92},${by - 10} L${cx + 12},${by + 100}" fill="none" stroke="${dd}" stroke-width="2.4"/>`;
    g += `<path d="M${cx - sh - 25},${by + 60} Q${cx - sh},${by} ${cx - sh * 0.7},${by - 30} L${cx - sh * 0.55},${by + 40} Q${cx - sh * 0.9},${by + 90} ${cx - sh - 25},${by + 200}Z" fill="${dd}" opacity="0.4"/>`;
    if (C.brooch) {
      const bx = cx + 100, byy = by + 10;
      g += `<path d="M${bx},${byy} C${bx - 26},${byy - 22} ${bx - 30},${byy + 14} ${bx},${byy} C${bx + 26},${byy - 22} ${bx + 30},${byy + 14} ${bx},${byy}Z" fill="#f2efe8" stroke="#bdb6a8" stroke-width="1.5"/>`;
      g += `<path d="M${bx},${byy} L${bx - 10},${byy + 26} M${bx},${byy} L${bx + 12},${byy + 24}" stroke="#f2efe8" stroke-width="5" stroke-linecap="round"/><circle cx="${bx}" cy="${byy}" r="4" fill="#e6e1d6"/>`;
    }
    return g;
  }

  // ---------- full character ----------
  function draw(P, state, opts = {}) {
    const S = Object.assign({}, DEF, state || {});
    const cx = 300, cy = 300 + (P.head.y || 0);
    const H = P.head;
    P._chinY = cy + H.h / 2;
    let g = '';
    const tilt = S.tilt || 0;
    // back hair (behind everything)
    if (P.hairBack) g += P.hairBack(cx, cy, P, S);
    // neck
    const nw = P.neck || 56;
    g += `<path d="M${cx - nw},${cy + H.h * 0.2} L${cx - nw - 6},${cy + H.h * 0.5 + 110} L${cx + nw + 6},${cy + H.h * 0.5 + 110} L${cx + nw},${cy + H.h * 0.2}Z" fill="${P.skin}"/>`;
    g += `<path d="M${cx - nw},${cy + H.h * 0.3} Q${cx},${cy + H.h * 0.62} ${cx + nw},${cy + H.h * 0.3} L${cx + nw + 4},${cy + H.h * 0.5 + 40} L${cx - nw - 4},${cy + H.h * 0.5 + 40}Z" fill="#4a2010" opacity="0.22"/>`;
    g += P.clothes.type === 'dress' ? dress(P, S, cx) : suit(P, S, cx);
    if (P.extraFront) g += P.extraFront(cx, cy, P, S);
    // head group (tilts)
    let hg = '';
    const eyeY = cy + (P.eyes.y || -8);
    const sideX = H.w / 2;
    const tn = S.turn || 0;
    const earL = Object.assign({}, P, { ears: Object.assign({}, P.ears, { w: P.ears.w * (1 - Math.max(0, -tn) * 0.55), out: (P.ears.out || 0) * (1 - Math.max(0, -tn)) }) });
    const earR = Object.assign({}, P, { ears: Object.assign({}, P.ears, { w: P.ears.w * (1 - Math.max(0, tn) * 0.55), out: (P.ears.out || 0) * (1 - Math.max(0, tn)) }) });
    hg += ear(earL, cx - sideX + 6 + Math.max(0, -tn) * 10, eyeY + (P.ears.y || 22), -1);
    hg += ear(earR, cx + sideX - 6 - Math.max(0, tn) * 10, eyeY + (P.ears.y || 22), 1);
    const outline = crPath(headOutline(P, cx, cy));
    const clip = nid('hd');
    hg += `<clipPath id="${clip}"><path d="${outline}"/></clipPath>`;
    hg += `<path d="${outline}" fill="${P.skin}"/>`;
    // form shading
    hg += `<g clip-path="url(#${clip})">`;
    const gl = nid('gl'), gr = nid('gr'), gs = nid('gs');
    hg += `<defs><linearGradient id="${gl}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#4a200c" stop-opacity="0.34"/><stop offset="0.38" stop-color="#4a200c" stop-opacity="0.06"/><stop offset="0.7" stop-color="#4a200c" stop-opacity="0"/><stop offset="1" stop-color="#4a200c" stop-opacity="0.14"/></linearGradient>` +
      `<radialGradient id="${gr}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="${P.sheen || 0.08}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="${gs}" x1="0" x2="0" y1="0" y2="1"><stop offset="0.55" stop-color="#4a200c" stop-opacity="0"/><stop offset="1" stop-color="#4a200c" stop-opacity="0.22"/></linearGradient></defs>`;
    hg += `<rect x="${cx - H.w / 2 - 5}" y="${cy - H.h / 2 - 5}" width="${H.w + 10}" height="${H.h + 10}" fill="url(#${gl})"/>`;
    hg += `<rect x="${cx - H.w / 2 - 5}" y="${cy - H.h / 2 - 5}" width="${H.w + 10}" height="${H.h + 10}" fill="url(#${gs})"/>`;
    hg += `<ellipse cx="${cx + H.w * 0.12}" cy="${cy - H.h * 0.3}" rx="${H.w * 0.34}" ry="${H.h * 0.2}" fill="url(#${gr})"/>`;
    // cheekbone + temple planes
    hg += `<path d="M${cx - H.w * 0.46},${cy + H.h * 0.02} Q${cx - H.w * 0.34},${cy + H.h * 0.22} ${cx - H.w * 0.2},${cy + H.h * 0.24}" fill="none" stroke="#4a200c" stroke-width="10" opacity="0.07" stroke-linecap="round"/>`;
    hg += `<path d="M${cx + H.w * 0.46},${cy + H.h * 0.02} Q${cx + H.w * 0.34},${cy + H.h * 0.22} ${cx + H.w * 0.2},${cy + H.h * 0.24}" fill="none" stroke="#4a200c" stroke-width="10" opacity="0.05" stroke-linecap="round"/>`;
    // cheeks
    hg += `<ellipse cx="${cx - H.w * 0.3}" cy="${cy + H.h * 0.12}" rx="${H.w * 0.13}" ry="${H.h * 0.07}" fill="#d04a40" opacity="${P.blush || 0.08}"/>`;
    hg += `<ellipse cx="${cx + H.w * 0.3}" cy="${cy + H.h * 0.12}" rx="${H.w * 0.13}" ry="${H.h * 0.07}" fill="#d04a40" opacity="${P.blush || 0.08}"/>`;
    if (P.stubble) hg += `<path d="M${cx - H.w * 0.42},${cy + H.h * 0.16} Q${cx},${cy + H.h * 0.62} ${cx + H.w * 0.42},${cy + H.h * 0.16} L${cx + H.w * 0.5},${cy + H.h * 0.6} L${cx - H.w * 0.5},${cy + H.h * 0.6}Z" fill="#2a2a3a" opacity="${P.stubble}"/>`;
    if (P.wrinkles) {
      const o = P.wrinkles;
      hg += `<path d="M${cx - 40},${cy - H.h * 0.3} Q${cx},${cy - H.h * 0.33} ${cx + 40},${cy - H.h * 0.3} M${cx - 34},${cy - H.h * 0.26} Q${cx},${cy - H.h * 0.285} ${cx + 34},${cy - H.h * 0.26}" fill="none" stroke="${shade(P.skin, -0.3)}" stroke-width="1.8" opacity="${o}"/>`;
      hg += `<path d="M${cx - H.w * 0.4},${eyeY + 2} l-12,-4 M${cx - H.w * 0.4},${eyeY + 7} l-12,4 M${cx + H.w * 0.4},${eyeY + 2} l12,-4 M${cx + H.w * 0.4},${eyeY + 7} l12,4" stroke="${shade(P.skin, -0.3)}" stroke-width="1.5" opacity="${o}"/>`;
    }
    if (P.deepSet) {
      hg += `<ellipse cx="${cx - P.eyes.gap}" cy="${eyeY - 8}" rx="${P.eyes.w * 0.85}" ry="${P.eyes.h * 1.6}" fill="#3a1a0c" opacity="${P.deepSet}"/>`;
      hg += `<ellipse cx="${cx + P.eyes.gap}" cy="${eyeY - 8}" rx="${P.eyes.w * 0.85}" ry="${P.eyes.h * 1.6}" fill="#3a1a0c" opacity="${P.deepSet}"/>`;
    }
    if (P.hairInHead) hg += P.hairInHead(cx, cy, P, S);
    hg += `</g>`;
    // jaw outline (subtle)
    hg += `<path d="${outline}" fill="none" stroke="${shade(P.skin, -0.4)}" stroke-width="2" opacity="0.35"/>`;
    // features
    const gap = P.eyes.gap;
    const sh = S.turn * 16;
    const narrow = (k) => Object.assign({}, P, { eyes: Object.assign({}, P.eyes, { w: P.eyes.w * (1 - Math.max(0, k * S.turn) * 0.22) }) });
    hg += eye(narrow(-1), S, cx - gap + sh * (S.turn < 0 ? 0.7 : 1), eyeY, -1);
    hg += eye(narrow(1), S, cx + gap + sh * (S.turn > 0 ? 0.7 : 1), eyeY, 1);
    hg += brow(P, S, cx - gap + sh, eyeY + P.brows.y, -1);
    hg += brow(P, S, cx + gap + sh, eyeY + P.brows.y, 1);
    hg += nose(P, S, cx, eyeY + 4);
    const my = eyeY + P.mouth.y;
    if (P.beard) hg += P.beard(cx, cy, P, S, my);
    hg += mouth(P, S, cx, my);
    if (P.moustache) hg += P.moustache(cx, my, P, S);
    if (P.hairFront) hg += P.hairFront(cx, cy, P, S);
    if (P.glasses) hg += glasses(P, S, cx, eyeY);
    if (P.hat) hg += P.hat(cx, cy, P, S);
    g += `<g transform="rotate(${tilt} ${cx} ${cy + H.h * 0.5})">${hg}</g>`;
    return g;
  }

  function glasses(P, S, cx, ey) {
    const G = P.glasses;
    const gap = P.eyes.gap + S.turn * 6;
    const r = G.r;
    const col = G.color;
    let g = '';
    if (G.shape === 'round') {
      g += `<circle cx="${cx - gap}" cy="${ey - 2}" r="${r}" fill="#cfe3ee" fill-opacity="0.12" stroke="${col}" stroke-width="${G.t}"/>`;
      g += `<circle cx="${cx + gap}" cy="${ey - 2}" r="${r}" fill="#cfe3ee" fill-opacity="0.12" stroke="${col}" stroke-width="${G.t}"/>`;
    } else {
      // soft-octagon / panto
      const lens = (x) => crPath([[x - r, ey - r * 0.55], [x - r * 0.6, ey - r * 0.95], [x + r * 0.6, ey - r * 0.95], [x + r, ey - r * 0.55], [x + r * 0.85, ey + r * 0.6], [x, ey + r * 0.95], [x - r * 0.85, ey + r * 0.6]]);
      g += `<path d="${lens(cx - gap)}" fill="#cfe3ee" fill-opacity="0.12" stroke="${col}" stroke-width="${G.t}"/>`;
      g += `<path d="${lens(cx + gap)}" fill="#cfe3ee" fill-opacity="0.12" stroke="${col}" stroke-width="${G.t}"/>`;
    }
    g += `<path d="M${cx - gap + r * 0.8},${ey - r * 0.45} Q${cx},${ey - r * 0.75} ${cx + gap - r * 0.8},${ey - r * 0.45}" fill="none" stroke="${col}" stroke-width="${G.t * 0.8}"/>`;
    g += `<path d="M${cx - gap - r},${ey - r * 0.4} L${cx - P.head.w / 2 + 2},${ey - r * 0.55} M${cx + gap + r},${ey - r * 0.4} L${cx + P.head.w / 2 - 2},${ey - r * 0.55}" stroke="${col}" stroke-width="${G.t * 0.8}"/>`;
    g += `<path d="M${cx - gap - r * 0.5},${ey - r * 0.5} L${cx - gap - r * 0.1},${ey - r * 0.8}" stroke="#fff" stroke-width="3" opacity="0.5" stroke-linecap="round"/>`;
    g += `<path d="M${cx + gap - r * 0.5},${ey - r * 0.5} L${cx + gap - r * 0.1},${ey - r * 0.8}" stroke="#fff" stroke-width="3" opacity="0.5" stroke-linecap="round"/>`;
    return g;
  }

  root.GarboRig = { draw, crPath, shade, DEF };
})(typeof window !== 'undefined' ? window : globalThis);
