// Frame player: draws frame N of build/timeline.json as SVG.
// Scene art comes from Scenes[shot.scene](st, shot, ctx); this file adds the
// retention layer: camera shake + punch-ins, cut flashes, slams, counters,
// word-by-word captions, the hook header, the series badge and the end card.
(function (root) {
  'use strict';
  const K = root.Kit;
  const { W, H, INK, clamp, lerp, easeOut, back, esc, hash, p } = K;
  const FONT_CAP = "'Montserrat','Helvetica Neue',Arial,sans-serif";
  const FONT_FUN = "'Luckiest Guy','Montserrat',sans-serif";
  let TL = null, byId = {};

  function load(tl) { TL = tl; byId = {}; tl.shots.forEach((s) => (byId[s.id] = s)); }
  let _ctx = null;
  function measure(str, size, family = 'Montserrat', weight = 900) {
    if (!_ctx) _ctx = document.createElement('canvas').getContext('2d');
    _ctx.font = `${weight} ${size}px "${family}"`;
    return _ctx.measureText(str).width;
  }
  function lineAt(t) {
    for (const L of TL.lines) if (t >= L.start && t <= L.end + 0.12) return L;
    return null;
  }

  // ---------- captions: 1-3 word chunks, active word in yellow, key words in red ----------
  function chunks(L) {
    if (L._chunks) return L._chunks;
    const out = []; let cur = [];
    L.words.forEach((w, i) => {
      cur.push(w);
      const punct = /[.,!?;:…]$/.test(w.text);
      if (cur.length >= 3 || punct || (cur.length >= 2 && (L.words[i + 1]?.text || '').length > 8)) { out.push(cur); cur = []; }
    });
    if (cur.length) out.push(cur);
    return (L._chunks = out);
  }
  function captions(t, shot) {
    if (shot.nocap) return '';
    const L = lineAt(t);
    if (!L) return '';
    const lt = t - L.start;
    const cs = chunks(L);
    let ci = -1;
    for (let i = cs.length - 1; i >= 0; i--) if (lt >= cs[i][0].start - 0.06) { ci = i; break; }
    if (ci < 0) return '';
    const c = cs[ci];
    const pop = back(clamp((lt - c[0].start + 0.06) / 0.16, 0, 1));
    const emph = new Set((L.emph || []).map((s) => s.toLowerCase().replace(/[^a-z0-9']/g, '')));
    const words = c.map((w) => w.text.toUpperCase().replace(/\.\.\.$/, '…'));
    let size = 92;
    const gap = () => size * 0.32;
    let widths = words.map((w) => measure(w, size));
    let total = widths.reduce((a, b) => a + b, 0) + gap() * (words.length - 1);
    if (total > 940) { size = Math.floor((size * 940) / total); widths = words.map((w) => measure(w, size)); total = widths.reduce((a, b) => a + b, 0) + gap() * (words.length - 1); }
    let x = 540 - total / 2;
    const y = shot.capY || 1400;
    let s = `<g transform="translate(540,${y}) scale(${0.65 + 0.35 * pop}) translate(-540,${-y})">`;
    c.forEach((w, i) => {
      const active = lt >= w.start - 0.03 && lt <= w.end + 0.06;
      const key = emph.has(w.text.toLowerCase().replace(/[^a-z0-9']/g, ''));
      const fill = key ? '#ff4d3d' : active ? '#ffd23f' : '#ffffff';
      const sc = active || key ? 1.08 : 1;
      const cx = x + widths[i] / 2;
      s += `<text x="${cx}" y="${y}" text-anchor="middle" font-family="${FONT_CAP}" font-weight="900" font-size="${size}" fill="${fill}" stroke="${INK}" stroke-width="16" paint-order="stroke" stroke-linejoin="round" transform="translate(${cx},${y}) scale(${sc}) translate(${-cx},${-y})">${esc(words[i])}</text>`;
      x += widths[i] + gap();
    });
    return s + `</g>`;
  }

  // ---------- fx ----------
  function fmt(n, commas) { return commas ? Math.round(n).toLocaleString('en-US') : String(Math.round(n)); }
  function fx(shot, t) {
    let s = '';
    for (const e of shot.fx || []) {
      const st = shot.start + (e.at || 0), en = e.dur ? st + e.dur : shot.end;
      if (t < st || t > en + 0.001) continue;
      const lt = t - st, a = clamp(lt / 0.08, 0, 1) * clamp((en - t) / 0.12, 0, 1);
      const x = e.x ?? 540, y = e.y ?? 700;
      if (e.type === 'slam') {
        const sc = lerp(2.6, 1, back(clamp(lt / 0.24, 0, 1)));
        const size = e.size || 130;
        const lines = e.text.split('\n');
        let inner = '';
        lines.forEach((ln, i) => {
          inner += `<text x="${x}" y="${y + i * size * 1.0}" text-anchor="middle" font-family="${FONT_FUN}" font-size="${size}" fill="${e.color || '#fff'}" stroke="${INK}" stroke-width="${size * 0.16}" paint-order="stroke" stroke-linejoin="round">${esc(ln)}</text>`;
        });
        const wob = Math.sin(lt * 18) * Math.exp(-lt * 5) * 4;
        s += `<g opacity="${a}" transform="translate(${x},${y}) rotate(${(e.rot || 0) + wob}) scale(${sc}) translate(${-x},${-y})">${inner}</g>`;
      } else if (e.type === 'counter') {
        const k = easeOut(clamp(lt / (e.count || 2), 0, 1));
        const n = Math.exp(lerp(Math.log(e.from || 1), Math.log(e.to), k));
        const size = e.size || 110;
        const pulse = 1 + (k >= 1 ? 0.06 * Math.exp(-(lt - e.count) * 6) : 0);
        s += `<g opacity="${a}" transform="translate(${x},${y}) scale(${pulse}) translate(${-x},${-y})"><text x="${x}" y="${y}" text-anchor="middle" font-family="${FONT_FUN}" font-size="${size}" fill="${e.color || '#ffd23f'}" stroke="${INK}" stroke-width="${size * 0.16}" paint-order="stroke" stroke-linejoin="round">${fmt(n, e.commas)}</text>` +
          (e.label ? `<text x="${x}" y="${y + size * 0.62}" text-anchor="middle" font-family="${FONT_CAP}" font-weight="900" font-size="44" fill="#fff" stroke="${INK}" stroke-width="10" paint-order="stroke" letter-spacing="4">${esc(e.label)}</text>` : '') + `</g>`;
      } else if (e.type === 'tag') {
        const sc = back(clamp(lt / 0.2, 0, 1));
        const size = e.size || 48;
        const w = measure(e.text, size) + 60;
        s += `<g opacity="${a}" transform="translate(${x},${y}) scale(${sc}) rotate(-3) translate(${-x},${-y})"><rect x="${x - w / 2}" y="${y - size * 0.95}" width="${w}" height="${size * 1.35}" rx="14" fill="${INK}"/><text x="${x}" y="${y}" text-anchor="middle" font-family="${FONT_CAP}" font-weight="900" font-size="${size}" fill="${e.color || '#fff'}">${esc(e.text)}</text></g>`;
      }
    }
    return s;
  }

  // ---------- hook header + badge + end card ----------
  function header(t, shot) {
    if (shot.id === 'hook') {
      const k = back(clamp(t / 0.3, 0, 1));
      const ten = shot.cues.ten || 99;
      const pulse = 1 + 0.18 * Math.exp(-Math.max(0, t - ten) * 5) * (t >= ten ? 1 : 0);
      let s = `<g transform="translate(540,300) scale(${k}) translate(-540,-300)">`;
      s += `<rect x="70" y="190" width="940" height="250" rx="28" fill="${INK}" opacity="0.9"/>`;
      s += `<text x="540" y="290" text-anchor="middle" font-family="${FONT_FUN}" font-size="82" fill="#fff">WHAT IF YOU WOKE UP</text>`;
      s += `<g transform="translate(540,392) scale(${pulse}) translate(-540,-392)"><text x="540" y="400" text-anchor="middle" font-family="${FONT_FUN}" font-size="112" fill="#ffd23f">10× STRONGER?</text></g>`;
      return s + `</g>`;
    }
    const lbl = 'WHAT IF? · 10× STRONGER';
    const w = measure(lbl, 30) + 44;
    return `<g opacity="0.92"><rect x="40" y="236" width="${w}" height="58" rx="12" fill="${INK}"/><text x="62" y="276" font-family="${FONT_CAP}" font-weight="900" font-size="30" fill="#ffd23f">${lbl}</text></g>`;
  }
  function endCard(t, shot) {
    if (shot.id !== 'couch' || shot.cues.end == null) return '';
    const lt = t - shot.start - shot.cues.end;
    if (lt < 0) return '';
    const k = back(clamp(lt / 0.3, 0, 1));
    const k2 = back(clamp((lt - 0.45) / 0.3, 0, 1));
    let s = `<g transform="translate(540,1420) scale(${k}) rotate(-2) translate(-540,-1420)"><rect x="60" y="1340" width="960" height="130" rx="26" fill="#ffd23f" stroke="${INK}" stroke-width="8"/>` +
      `<text x="540" y="1432" text-anchor="middle" font-family="${FONT_FUN}" font-size="60" fill="${INK}">WHAT WOULD YOU BREAK FIRST?</text></g>`;
    s += `<g transform="translate(540,1540) scale(${k2}) translate(-540,-1540)"><text x="540" y="1555" text-anchor="middle" font-family="${FONT_CAP}" font-weight="900" font-size="46" fill="#fff" stroke="${INK}" stroke-width="10" paint-order="stroke">TELL ME IN THE COMMENTS ↓</text></g>`;
    return s;
  }

  // ---------- frame ----------
  function renderAt(t) {
    let si = TL.shots.findIndex((s) => t >= s.start && t < s.end);
    if (si < 0) si = TL.shots.length - 1;
    const shot = TL.shots[si];
    const st = t - shot.start;
    const ctx = { TL, byId, t, lines: TL.lines.filter((l) => l.shot === shot.id) };
    const art = root.Scenes[shot.scene](st, shot, ctx);

    // camera: punch-in on each new line + shake on impacts
    let z = 1;
    if (shot.punch !== false) {
      for (const L of ctx.lines) if (t >= L.start) z = 1 + (L.idx % 2 ? 0.045 : 0) * easeOut((t - L.start) / 0.12);
    }
    let sx = 0, sy = 0;
    for (const a of shot.shakeAt || []) {
      const d = st - a;
      if (d >= 0 && d < 0.4) { const f = (1 - d / 0.4) * 34; sx = (hash(t * 97) - 0.5) * f; sy = (hash(t * 131) - 0.5) * f; }
    }
    let svg = `<g transform="translate(${540 + sx},${960 + sy}) scale(${z}) translate(-540,-960)">${art}</g>`;
    // legibility scrim behind captions
    svg += `<defs><linearGradient id="scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></linearGradient></defs><rect y="1180" width="${W}" height="740" fill="url(#scr)"/>`;
    svg += fx(shot, t);
    svg += header(st, shot);
    svg += captions(t, shot);
    svg += endCard(t, shot);
    if (shot.flash !== false && si > 0 && st < 0.1) svg += `<rect width="${W}" height="${H}" fill="#fff" opacity="${0.6 * (1 - st / 0.1)}"/>`;
    svg += `<rect width="${W}" height="${H}" fill="url(#grain)" opacity="0.06"/>`;
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
  async function ready() {
    await Promise.all(['900 92px "Montserrat"', '400 100px "Luckiest Guy"'].map((f) => document.fonts.load(f)));
    _ctx = null;
  }
  root.Player = { load, renderFrame, renderAt, play, ready, measure };
  root.renderFrame = renderFrame;
})(window);
