// GARBO frame player (retention cut). Draws frame N of a built timeline as SVG.
// Engagement toolkit: word-by-word kinetic captions, punch-in zooms on every
// line, speaker cut-ins, flash cuts, slam words, counters, animated map routes,
// agent-silhouette build-ups, red circle call-outs.
(function (root) {
  'use strict';
  const W = 1080, H = 1920;
  const { draw } = root.GarboRig;
  const CAST = root.GarboCast;
  const SETS = root.GarboSets;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const back = (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
  const FONT_CAP = "'Montserrat','Inter','Helvetica Neue',Arial,sans-serif";
  const FONT_SERIF = "'Playfair Display',Georgia,serif";
  const FONT_MONO = "'Courier Prime','Courier New',monospace";

  let TL = null;
  function load(tl) { TL = tl; }
  let _ctx = null;
  function measure(text, size, family = 'Montserrat', weight = 900) {
    if (!_ctx) _ctx = document.createElement('canvas').getContext('2d');
    _ctx.font = `${weight} ${size}px "${family}"`;
    return _ctx.measureText(text).width;
  }

  function blinkAt(t, seed) {
    const period = 3.0 + hash(seed) * 2.2;
    const ph = (t + hash(seed + 9) * period) % period;
    if (ph < 0.07) return ph / 0.07;
    if (ph < 0.14) return 1 - (ph - 0.07) / 0.07;
    return 0;
  }
  function mouthFor(key, t) {
    let open = 0, round = 0;
    for (const L of TL.lines) {
      if (L.char !== key || t < L.start || t > L.end) continue;
      const i = Math.floor((t - L.start) * TL.fps);
      open = Math.max(open, L.env[i] || 0);
      round = L.round ? (L.round[i] || 0) : 0;
    }
    return { open, round };
  }
  function lineAt(t) {
    for (const L of TL.lines) if (t >= L.start && t <= L.end + 0.05) return L;
    return null;
  }

  // ---------- kinetic captions ----------
  function chunks(L) {
    if (L._chunks) return L._chunks;
    const out = []; let cur = [];
    (L.words || []).forEach((w, i) => {
      cur.push(w);
      const punct = /[.,!?;:…]$/.test(w.text);
      if (cur.length >= 3 || punct || (cur.length >= 2 && (L.words[i + 1]?.text || '').length > 9)) { out.push(cur); cur = []; }
    });
    if (cur.length) out.push(cur);
    return (L._chunks = out);
  }
  function captions(t) {
    const L = lineAt(t);
    if (!L || L.nosub) return '';
    const lt = t - L.start;
    // translated lines: show the English meaning as a pop-in subtitle
    if (L.lang !== 'en' || !L.words || !L.words.length) {
      if (!L.sub) return '';
      const a = easeOut(clamp(lt / 0.15, 0, 1));
      const lines = wrap(L.sub, 22);
      let g = `<g transform="translate(540,1240) scale(${0.85 + 0.15 * a}) translate(-540,-1240)" opacity="${a}">`;
      g += `<text x="540" y="${1240 - 70 - (lines.length - 1) * 36}" text-anchor="middle" font-family="${FONT_MONO}" font-size="30" fill="#e8c56a" stroke="#000" stroke-width="6" paint-order="stroke">${L.lang === 'es' ? '(IN SPANISH)' : L.lang === 'de' ? '(IN GERMAN)' : ''}</text>`;
      lines.forEach((ln, i) => {
        g += `<text x="540" y="${1240 + (i - (lines.length - 1) / 2) * 72}" text-anchor="middle" font-family="${FONT_CAP}" font-weight="900" font-size="62" fill="#fff" stroke="#000" stroke-width="12" paint-order="stroke" stroke-linejoin="round">${esc(ln.toUpperCase())}</text>`;
      });
      return g + `</g>`;
    }
    const cs = chunks(L);
    let ci = cs.findIndex((c) => lt >= c[0].start - 0.05 && lt <= (c[c.length - 1].end + 0.25));
    if (ci < 0) { // between chunks: keep the last one that started
      for (let i = cs.length - 1; i >= 0; i--) if (lt >= cs[i][0].start) { ci = i; break; }
    }
    if (ci < 0) return '';
    const c = cs[ci];
    const since = lt - c[0].start;
    const pop = back(clamp(since / 0.16, 0, 1));
    const emph = new Set((L.emph || []).map((s) => s.toLowerCase()));
    const words = c.map((w) => w.text.toUpperCase());
    let size = 84;
    const space = () => size * 0.36;
    let widths = words.map((w) => measure(w, size));
    let total = widths.reduce((a, b) => a + b, 0) + space() * (words.length - 1);
    if (total > 900) { size = Math.floor(size * 900 / total); widths = words.map((w) => measure(w, size)); total = widths.reduce((a, b) => a + b, 0) + space() * (words.length - 1); }
    let x = 540 - total / 2;
    const y = 1250;
    let g = `<g transform="translate(540,${y}) scale(${0.6 + 0.4 * pop}) translate(-540,${-y})">`;
    c.forEach((w, i) => {
      const active = lt >= w.start - 0.02 && lt <= w.end + 0.08;
      const spoken = lt >= w.start - 0.02;
      const key = emph.has(w.text.toLowerCase().replace(/[^a-z0-9áéíóúñ']/gi, ''));
      const fill = key ? '#ff4d3d' : active ? '#ffd23f' : spoken ? '#ffffff' : '#ffffff';
      const sc = active ? 1.06 : 1;
      const cx = x + widths[i] / 2;
      g += `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${FONT_CAP}" font-weight="900" font-size="${size}" fill="${fill}" stroke="#000" stroke-width="14" paint-order="stroke" stroke-linejoin="round" transform="translate(${cx},${y}) scale(${sc}) translate(${-cx},${-y})" opacity="${spoken ? 1 : 0.55}">${esc(words[i])}</text>`;
      x += widths[i] + space();
    });
    return g + `</g>`;
  }
  function wrap(text, max) {
    const words = text.split(/\s+/); const lines = []; let cur = '';
    for (const w of words) { if ((cur + ' ' + w).trim().length > max) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }
    if (cur.trim()) lines.push(cur.trim());
    return lines;
  }

  // ---------- overlays ----------
  function nameCard(nc, t, s0) {
    const a = clamp((t - s0 - (nc.at || 0.2)) / 0.2, 0, 1) * clamp((s0 + (nc.at || 0.2) + (nc.dur || 2.6) - t) / 0.25, 0, 1);
    if (a <= 0) return '';
    const x = nc.x ?? 60, y = nc.y ?? 330;
    const slide = (1 - easeOut(a)) * -60;
    const w = Math.max(nc.title.length * 27, (nc.sub || '').length * 17) + 70;
    return `<g opacity="${a}" transform="translate(${slide},0)">` +
      `<rect x="${x}" y="${y}" width="${w}" height="${nc.sub ? 112 : 70}" fill="#0f0e0c" opacity="0.85"/>` +
      `<rect x="${x}" y="${y}" width="8" height="${nc.sub ? 112 : 70}" fill="#ffd23f"/>` +
      `<text x="${x + 30}" y="${y + 48}" font-family="${FONT_SERIF}" font-weight="700" font-size="42" fill="#f3ead7">${esc(nc.title)}</text>` +
      (nc.sub ? `<text x="${x + 30}" y="${y + 92}" font-family="${FONT_MONO}" font-size="27" fill="#ffd23f">${esc(nc.sub)}</text>` : '') + `</g>`;
  }

  function fx(shot, t) {
    let g = '';
    for (const e of shot.fx || []) {
      const st = shot.start + (e.at || 0), en = e.dur ? st + e.dur : shot.end;
      if (t < st || t > en) continue;
      const lt = t - st, a = clamp(lt / 0.12, 0, 1) * clamp((en - t) / 0.15, 0, 1);
      if (e.type === 'slam') {
        const s = lerp(2.4, 1, back(clamp(lt / 0.22, 0, 1)));
        const x = e.x ?? 540, y = e.y ?? 700, size = e.size || 120;
        const lines = e.text.split('\n');
        let inner = '';
        lines.forEach((ln, i) => {
          inner += `<text x="${x}" y="${y + i * size * 1.05}" text-anchor="middle" font-family="${e.serif ? FONT_SERIF : FONT_CAP}" font-weight="900" font-size="${size}" fill="${e.color || '#fff'}" stroke="#000" stroke-width="${e.stroke ?? 16}" paint-order="stroke" stroke-linejoin="round" letter-spacing="${e.spacing || 0}">${esc(ln)}</text>`;
        });
        if (e.box) {
          const bw = Math.max(...lines.map((l) => l.length)) * size * 0.66 + 60;
          inner = `<rect x="${x - bw / 2}" y="${y - size * 0.95}" width="${bw}" height="${lines.length * size * 1.05 + size * 0.25}" fill="none" stroke="${e.color}" stroke-width="10"/>` + inner;
        }
        g += `<g opacity="${a}" transform="translate(${x},${y}) rotate(${e.rot || 0}) scale(${s}) translate(${-x},${-y})">${inner}</g>`;
      } else if (e.type === 'counter') {
        const p = clamp(lt / (e.count || 2), 0, 1);
        const n = Math.round(lerp(e.from || 0, e.to, easeOut(p)));
        const x = e.x ?? 540, y = e.y ?? 640;
        g += `<g opacity="${a}"><text x="${x}" y="${y}" text-anchor="middle" font-family="${FONT_CAP}" font-weight="900" font-size="${e.size || 200}" fill="${e.color || '#ffd23f'}" stroke="#000" stroke-width="18" paint-order="stroke">${n}${e.suffix || ''}</text>` +
          (e.label ? `<text x="${x}" y="${y + 80}" text-anchor="middle" font-family="${FONT_MONO}" font-size="40" fill="#fff" stroke="#000" stroke-width="8" paint-order="stroke" letter-spacing="3">${esc(e.label)}</text>` : '') + `</g>`;
      } else if (e.type === 'agents') {
        // fedora silhouettes popping in one by one, each with a fake name
        const names = e.names || [];
        const per = e.every || 0.45;
        names.forEach((nm, i) => {
          const at = i * per; if (lt < at) return;
          const pp = back(clamp((lt - at) / 0.25, 0, 1));
          const col = i % 3, row = Math.floor(i / 3);
          const x = 200 + col * 340, y = (e.y ?? 560) + row * 300;
          g += `<g opacity="${a}" transform="translate(${x},${y}) scale(${pp}) translate(${-x},${-y})">` +
            `<ellipse cx="${x}" cy="${y - 40}" rx="92" ry="18" fill="#141210"/><path d="M${x - 56},${y - 44} Q${x - 50},${y - 120} ${x},${y - 118} Q${x + 50},${y - 120} ${x + 56},${y - 44}Z" fill="#1d1a17"/>` +
            `<rect x="${x - 56}" y="${y - 66}" width="112" height="14" fill="#7a1d1d"/>` +
            `<ellipse cx="${x}" cy="${y - 6}" rx="46" ry="54" fill="#2a2622"/><path d="M${x - 100},${y + 130} Q${x - 96},${y + 50} ${x},${y + 44} Q${x + 96},${y + 50} ${x + 100},${y + 130}Z" fill="#221f1b"/>` +
            `<text x="${x}" y="${y + 6}" text-anchor="middle" font-family="${FONT_CAP}" font-weight="900" font-size="64" fill="#ffd23f">?</text>` +
            `<rect x="${x - 140}" y="${y + 140}" width="280" height="54" fill="#0f0e0c" opacity="0.85"/>` +
            `<text x="${x}" y="${y + 177}" text-anchor="middle" font-family="${FONT_MONO}" font-size="26" fill="#f3ead7">${esc(nm)}</text></g>`;
        });
      } else if (e.type === 'route') {
        // animated dashed route between named map points (set: 'map')
        const P = root.GarboSets.MAP_POINTS;
        const pts = e.points.map((k) => P[k]);
        const p = easeOut(clamp(lt / (e.draw || 1.2), 0, 1));
        let len = 0; const segs = [];
        for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); len += d; }
        const d = 'M' + pts.map((q) => q.join(',')).join(' L');
        g += `<path d="${d}" fill="none" stroke="${e.color || '#ff4d3d'}" stroke-width="9" stroke-dasharray="${len}" stroke-dashoffset="${len * (1 - p)}" stroke-linecap="round"/>`;
        if (e.dashedLast && p >= 1) {
          const q0 = pts[pts.length - 1], q1 = P[e.dashedLast];
          const p2 = easeOut(clamp((lt - (e.draw || 1.2)) / 0.8, 0, 1));
          const l2 = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]);
          g += `<line x1="${q0[0]}" y1="${q0[1]}" x2="${lerp(q0[0], q1[0], p2)}" y2="${lerp(q0[1], q1[1], p2)}" stroke="#ffd23f" stroke-width="8" stroke-dasharray="20 16"/>`;
          if (p2 >= 1) g += `<text x="${(q0[0] + q1[0]) / 2 + 30}" y="${(q0[1] + q1[1]) / 2}" font-family="${FONT_CAP}" font-weight="900" font-size="44" fill="#ffd23f" stroke="#000" stroke-width="8" paint-order="stroke">NEVER WENT</text>`;
        }
        for (const k of e.points.concat(e.dashedLast ? [e.dashedLast] : [])) {
          const q = P[k];
          g += `<circle cx="${q[0]}" cy="${q[1]}" r="14" fill="#ffd23f" stroke="#000" stroke-width="4"/><text x="${q[0] + 24}" y="${q[1] + 14}" font-family="${FONT_CAP}" font-weight="900" font-size="40" fill="#fff" stroke="#000" stroke-width="8" paint-order="stroke">${k.toUpperCase()}</text>`;
        }
      } else if (e.type === 'circle') {
        const p = easeOut(clamp(lt / 0.4, 0, 1));
        const r = e.r || 170, c = 2 * Math.PI * r;
        g += `<ellipse cx="${e.x}" cy="${e.y}" rx="${r * 1.08}" ry="${r}" fill="none" stroke="#ff3b2f" stroke-width="12" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-12 ${e.x} ${e.y})" stroke-linecap="round"/>`;
        if (e.label) g += `<text x="${e.lx ?? e.x}" y="${e.ly ?? e.y - r - 30}" text-anchor="middle" font-family="${FONT_CAP}" font-weight="900" font-size="52" fill="#ff3b2f" stroke="#000" stroke-width="10" paint-order="stroke" opacity="${p}">${esc(e.label)}</text>`;
      } else if (e.type === 'title') {
        const lines = e.text.split('\n'); const size = e.size || 64;
        const pw = Math.max(...lines.map((l) => l.length)) * size * 0.55 + 80;
        let inner = `<rect x="${540 - pw / 2}" y="${(e.y ?? 420) - size * 1.05}" width="${pw}" height="${lines.length * size * 1.2 + size * 0.45}" fill="#0b0a09" opacity="0.8" rx="8"/>`;
        lines.forEach((ln, i) => { inner += `<text x="540" y="${(e.y ?? 420) + i * size * 1.2}" text-anchor="middle" font-family="${FONT_SERIF}" font-weight="700" font-size="${size}" fill="${e.color || '#f3ead7'}">${esc(ln)}</text>`; });
        g += `<g opacity="${a}">${inner}</g>`;
      } else if (e.type === 'document') {
        // a typed agent report; the quoted line types out in sync with the reader's voice
        const L = TL.lines.find((l) => l.idx === e.line);
        const lt2 = L ? t - L.start : 0;
        const qWords = e.quote.split(' ');
        let shown = qWords.length;
        if (L && L.words && L.words.length) {
          const spoken = L.words.filter((w) => lt2 >= w.start).length;
          shown = Math.round(qWords.length * spoken / L.words.length);
          if (t > L.end) shown = qWords.length;
        }
        const ins = back(clamp(lt / 0.3, 0, 1));
        const x0 = 150, y0 = 320, w = 780, h = 500;
        let doc = `<g transform="translate(540,${y0 + h / 2}) rotate(-2.5) scale(${0.7 + 0.3 * ins}) translate(-540,${-(y0 + h / 2)})">`;
        doc += `<rect x="${x0 + 10}" y="${y0 + 14}" width="${w}" height="${h}" fill="#000" opacity="0.35"/>`;
        doc += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#efe6cf" stroke="#bfb08a" stroke-width="2"/>`;
        doc += `<text x="${x0 + 40}" y="${y0 + 62}" font-family="${FONT_MONO}" font-size="28" fill="#5a1a14" letter-spacing="1">${esc(e.header)}</text>`;
        doc += `<line x1="${x0 + 40}" y1="${y0 + 84}" x2="${x0 + w - 40}" y2="${y0 + 84}" stroke="#5a1a14" stroke-width="2"/>`;
        let yy = y0 + 132;
        for (const ln of e.before || []) { doc += `<text x="${x0 + 40}" y="${yy}" font-family="${FONT_MONO}" font-size="32" fill="#2d2a24">${esc(ln)}</text>`; yy += 48; }
        yy += 20;
        // quoted line, wrapped, revealed word by word with a highlighter
        const qLines = wrap('“' + e.quote + '”', 30);
        let wi = 0;
        for (const ql of qLines) {
          let xx = x0 + 40;
          for (const word of ql.split(' ')) {
            const vis = wi < shown + (wi === 0 ? 1 : 0);
            const wpx = measure(word, 40, 'Courier Prime', 400);
            if (vis) {
              doc += `<rect x="${xx - 4}" y="${yy - 36}" width="${wpx + 12}" height="48" fill="#ffd23f" opacity="0.7"/>`;
              doc += `<text x="${xx}" y="${yy}" font-family="${FONT_MONO}" font-size="40" fill="#141210">${esc(word)}</text>`;
            }
            xx += wpx + measure(' ', 40, 'Courier Prime', 400);
            wi++;
          }
          yy += 58;
        }
        yy += 20;
        for (const ln of e.after || []) { doc += `<text x="${x0 + 40}" y="${yy}" font-family="${FONT_MONO}" font-size="32" fill="#2d2a24">${esc(ln)}</text>`; yy += 48; }
        doc += `<g transform="rotate(-14 ${x0 + w - 170} ${y0 + h - 70})"><rect x="${x0 + w - 300}" y="${y0 + h - 115}" width="260" height="80" fill="none" stroke="#a02424" stroke-width="5"/><text x="${x0 + w - 170}" y="${y0 + h - 60}" text-anchor="middle" font-family="${FONT_MONO}" font-size="36" font-weight="700" fill="#a02424">GEHEIM</text></g>`;
        doc += `</g>`;
        g += `<g opacity="${a}">${doc}</g>`;
      } else if (e.type === 'tag') {
        g += `<g opacity="${a}"><text x="540" y="${e.y ?? 1500}" text-anchor="middle" font-family="${FONT_MONO}" font-size="${e.size || 28}" fill="${e.color || '#d8cdb4'}" letter-spacing="5">${esc(e.text)}</text></g>`;
      }
    }
    return g;
  }

  // ---------- frame ----------
  function renderAt(t) {
    const si = TL.shots.findIndex((s) => t >= s.start && t < s.end);
    const shot = TL.shots[si < 0 ? TL.shots.length - 1 : si];
    const st = t - shot.start, dur = shot.end - shot.start;
    const set = SETS[shot.set] ? SETS[shot.set](st) : { back: '', front: '' };
    const L = lineAt(t);
    const speaker = L && L.char;

    // camera: base move + punch-in per line + optional speaker follow
    const cam0 = Object.assign({ zoom: 1, x: 0, y: 0 }, shot.cam && shot.cam.from), cam1 = Object.assign({}, cam0, shot.cam && shot.cam.to);
    const ct = ease(clamp(st / dur, 0, 1));
    let z = lerp(cam0.zoom, cam1.zoom, ct), cx = lerp(cam0.x, cam1.x, ct), cy = lerp(cam0.y, cam1.y, ct);
    if (shot.punch !== false && L && L.shot === shot.id) {
      const k = easeOut(clamp((t - L.start) / 0.14, 0, 1));
      const amt = (L.idx % 2 ? 0.1 : 0.04) * (shot.punchAmt ?? 1);
      z *= 1 + amt * k;
    }
    if (shot.follow && speaker) {
      const ch = (shot.chars || []).find((c) => c.key === speaker);
      if (ch) {
        z *= shot.followZoom || 1.32;
        const lim = 540 * (z - 1) - 4;
        cx = clamp((540 - ch.x) * z * 0.8, -lim, lim);
        cy = clamp(cy + (shot.followY ?? 140), -960 * (z - 1) + 4, 960 * (z - 1) - 4);
      }
    }
    let shake = 0;
    for (const s of shot.shakeAt || []) if (st >= s && st < s + 0.22) shake = (hash(t * 60) - 0.5) * 26 * (1 - (st - s) / 0.22);
    const camT = `translate(${540 + cx + shake},${960 + cy}) scale(${z}) translate(-540,-960)`;

    let chars = '';
    (shot.chars || []).forEach((c, idx) => {
      const prof = CAST[c.rig]; if (!prof) return;
      const m = mouthFor(c.key, t);
      const seed = (c.key || c.rig).length * 13 + idx;
      const talking = speaker === c.key;
      const other = speaker && speaker !== c.key ? (shot.chars || []).find((o) => o.key === speaker) : null;
      const lookAt = c.lookAt != null ? c.lookAt : other ? (other.x > c.x ? 0.7 : -0.7) * (c.flip ? -1 : 1) : 0;
      const state = Object.assign({
        open: m.open, round: m.round,
        blink: blinkAt(t, seed), lookX: lookAt, lookY: 0.05,
        breathe: (Math.sin(t * 1.6 + seed) + 1) / 2,
        tilt: Math.sin(t * 0.7 + seed) * 1.2 + (talking ? Math.sin(t * 3.4 + seed) * 2.2 : 0),
        turn: (c.turn != null ? c.turn : ((shot.chars || []).length > 1 ? 0.55 : 0)) + Math.sin(t * 0.4 + seed) * 0.08,
        brow: talking ? Math.max(0, Math.sin(t * 2.3 + seed)) * 0.35 : 0,
      }, c.state || {});
      for (const k of c.keys || []) if (st >= k.at) Object.assign(state, k.state);
      if (c.state && c.state.blink) state.blink = Math.max(state.blink, c.state.blink);
      const s = c.s || 1.5;
      const bob = talking ? Math.sin(t * 6.2) * 3 : 0;
      let prop = '';
      if (c.prop === 'paper' && !(c.propUntil != null && st > c.propUntil)) {
        // a held sheet in front of the chest, hands as two skin ovals at its lower corners
        prop = `<g transform="translate(0,-170) rotate(-8 300 720)"><rect x="185" y="600" width="230" height="290" fill="#efe6cf" stroke="#bfb08a" stroke-width="3"/>` +
          [640, 670, 700, 730, 790, 820].map((yy) => `<line x1="210" y1="${yy}" x2="${yy === 730 ? 330 : 390}" y2="${yy}" stroke="#6a6458" stroke-width="5" opacity="0.6"/>`).join('') +
          `<rect x="205" y="756" width="190" height="22" fill="#ffd23f" opacity="0.8"/>` +
          `<ellipse cx="190" cy="850" rx="34" ry="26" fill="${prof.skin}"/><ellipse cx="410" cy="850" rx="34" ry="26" fill="${prof.skin}"/></g>`;
      }
      chars += `<g transform="translate(${c.x},${c.y + bob}) scale(${c.flip ? -s : s},${s}) translate(-300,-300)">${draw(prof, state)}${prop}</g>`;
    });

    let svg = `<g transform="${camT}">${set.back}${chars}${set.front}</g>`;
    if (shot.grade) svg += `<rect width="${W}" height="${H}" fill="${shot.grade}" style="mix-blend-mode:multiply" opacity="${shot.gradeOp ?? 0.3}"/>`;
    // top & bottom scrims keep text legible
    svg += `<defs><linearGradient id="scrB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient></defs><rect y="1050" width="${W}" height="870" fill="url(#scrB)"/>`;
    for (const nc of shot.nameCards || []) svg += nameCard(nc, t, shot.start);
    svg += fx(shot, t);
    svg += captions(t);
    svg += `<g><rect x="40" y="236" width="${measure(`GARBO · PART ${TL.part}/${TL.of}`, 28, "Courier Prime", 400) + 50}" height="56" rx="4" fill="#0f0e0c" opacity="0.8"/><text x="60" y="274" font-family="${FONT_MONO}" font-size="28" fill="#ffd23f" letter-spacing="2">GARBO · PART ${TL.part}/${TL.of}</text></g>`;
    // flash on cut
    if (shot.flash !== false && si > 0 && st < 0.12) svg += `<rect width="${W}" height="${H}" fill="#fff" opacity="${0.55 * (1 - st / 0.12)}"/>`;
    const fin = shot.fadeIn ? clamp(st / shot.fadeIn, 0, 1) : 1, fout = shot.fadeOut ? clamp((shot.end - t) / shot.fadeOut, 0, 1) : 1;
    const fade = 1 - Math.min(fin, fout);
    if (fade > 0.001) svg += `<rect width="${W}" height="${H}" fill="#000" opacity="${fade}"/>`;
    svg += `<rect width="${W}" height="${H}" fill="url(#grain)" opacity="0.08"/>`;
    return svg;
  }

  function mount(el) {
    el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="display:block;background:#000">` +
      `<defs><pattern id="grain" width="256" height="256" patternUnits="userSpaceOnUse"><image href="grain.png" width="256" height="256"/></pattern></defs><g id="root"></g></svg>`;
    return el.querySelector('#root');
  }
  let rootG = null;
  function renderFrame(n) {
    if (!rootG) rootG = mount(document.getElementById('stage'));
    rootG.innerHTML = renderAt(n / TL.fps);
    return true;
  }
  function play(audioEl) {
    const t0 = performance.now();
    if (audioEl) audioEl.play();
    const tick = () => {
      const t = audioEl ? audioEl.currentTime : (performance.now() - t0) / 1000;
      renderFrame(Math.floor(t * TL.fps));
      if (t < TL.duration) requestAnimationFrame(tick);
    };
    tick();
  }
  // fonts must be loaded before the first measure(), or widths come from a fallback face
  async function ready() {
    const specs = ['900 84px "Montserrat"', '400 40px "Courier Prime"', '700 42px "Playfair Display"'];
    await Promise.all(specs.map((f) => document.fonts.load(f)));
    _ctx = null;
  }
  root.GarboPlayer = { load, renderFrame, renderAt, play, ready };
  root.renderFrame = renderFrame;
})(window);
