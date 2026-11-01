// GARBO frame player. Given a built timeline (see build_timeline.py), draws
// frame N as SVG into #stage. Used both for live preview (play()) and for
// deterministic headless rendering (window.renderFrame(n)).
(function (root) {
  'use strict';
  const W = 1080, H = 1920;
  const { draw } = root.GarboRig;
  const CAST = root.GarboCast;
  const SETS = root.GarboSets;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // deterministic pseudo-random
  const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

  let TL = null;
  function load(tl) { TL = tl; }

  // blink: ~every 3–5 s per character, 140 ms long, deterministic per char
  function blinkAt(t, seed) {
    const period = 3.2 + hash(seed) * 2.2;
    const ph = (t + hash(seed + 9) * period) % period;
    if (ph < 0.07) return ph / 0.07;
    if (ph < 0.14) return 1 - (ph - 0.07) / 0.07;
    return 0;
  }

  function mouthFor(charKey, t) {
    // envelope arrays sampled at TL.fps for each line
    let open = 0, round = 0;
    for (const L of TL.lines) {
      if (L.char !== charKey || t < L.start || t > L.end) continue;
      const i = Math.floor((t - L.start) * TL.fps);
      open = Math.max(open, L.env[i] || 0);
      round = L.round ? (L.round[i] || 0) : 0;
    }
    return { open, round };
  }
  function speakingNow(t) {
    for (const L of TL.lines) if (t >= L.start - 0.05 && t <= L.end + 0.1 && L.char) return L.char;
    return null;
  }

  function nameCard(nc, t, s0) {
    const a = clamp((t - s0 - (nc.at || 0.4)) / 0.35, 0, 1) * clamp((s0 + (nc.at || 0.4) + (nc.dur || 3.2) - t) / 0.35, 0, 1);
    if (a <= 0) return '';
    const x = nc.x ?? 70, y = nc.y ?? 1180;
    const slide = (1 - ease(a)) * -40;
    const w = Math.max(nc.title.length * 26, (nc.sub || '').length * 17) + 70;
    return `<g opacity="${a}" transform="translate(${slide},0)">` +
      `<rect x="${x}" y="${y}" width="${w}" height="${nc.sub ? 118 : 74}" fill="#0f0e0c" opacity="0.82"/>` +
      `<rect x="${x}" y="${y}" width="8" height="${nc.sub ? 118 : 74}" fill="#c9a24a"/>` +
      `<text x="${x + 32}" y="${y + 50}" font-family="'Playfair Display',Georgia,serif" font-weight="700" font-size="42" fill="#f3ead7" letter-spacing="1">${esc(nc.title)}</text>` +
      (nc.sub ? `<text x="${x + 32}" y="${y + 94}" font-family="'Courier Prime','Courier New',monospace" font-size="28" fill="#c9a24a">${esc(nc.sub)}</text>` : '') +
      `</g>`;
  }

  function wrap(text, max) {
    const words = text.split(/\s+/); const lines = []; let cur = '';
    for (const w of words) { if ((cur + ' ' + w).trim().length > max) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }
    if (cur.trim()) lines.push(cur.trim());
    return lines;
  }

  function subtitle(t) {
    for (const L of TL.lines) {
      if (t < L.start || t > L.end + 0.25 || !L.sub) continue;
      const lines = wrap(L.sub, 30);
      const y0 = 1400 - (lines.length - 1) * 62;
      let g = '';
      lines.forEach((ln, i) => {
        g += `<text x="540" y="${y0 + i * 62}" text-anchor="middle" font-family="'Inter','Helvetica Neue',Arial,sans-serif" font-weight="800" font-size="46" fill="#fff" stroke="#000" stroke-width="9" paint-order="stroke" stroke-linejoin="round">${esc(ln)}</text>`;
      });
      if (L.lang && L.lang !== 'en') g = `<text x="540" y="${y0 - 64}" text-anchor="middle" font-family="'Courier Prime','Courier New',monospace" font-size="26" fill="#e8c56a" stroke="#000" stroke-width="6" paint-order="stroke">${L.lang === 'es' ? 'SPANISH' : L.lang === 'de' ? 'GERMAN' : ''}</text>` + g;
      return g;
    }
    return '';
  }

  function textCards(shot, t) {
    let g = '';
    for (const c of shot.texts || []) {
      const st = shot.start + (c.at || 0), en = c.dur ? st + c.dur : shot.end;
      if (t < st || t > en) continue;
      const a = clamp((t - st) / (c.fade ?? 0.3), 0, 1) * clamp((en - t) / (c.fade ?? 0.3), 0, 1);
      const scale = c.stamp ? lerp(1.6, 1, ease(clamp((t - st) / 0.18, 0, 1))) : 1;
      const x = c.x ?? 540, y = c.y ?? 900;
      const lines = c.text.split('\n');
      const size = c.size || 72;
      let inner = '';
      lines.forEach((ln, i) => {
        inner += `<text x="${x}" y="${y + i * size * 1.18}" text-anchor="${c.anchor || 'middle'}" font-family="${c.mono ? "'Courier Prime','Courier New',monospace" : "'Playfair Display',Georgia,serif"}" font-weight="${c.weight || 700}" font-size="${size}" fill="${c.color || '#f3ead7'}" ${c.italic ? 'font-style="italic"' : ''} letter-spacing="${c.spacing || 0}" ${c.stroke ? 'stroke="#000" stroke-width="4" paint-order="stroke" stroke-linejoin="round"' : ''}>${esc(ln)}</text>`;
      });
      if (c.panel) {
        const pw = Math.max(...lines.map((l) => l.length)) * size * 0.52 + 80, ph = lines.length * size * 1.18 + size * 0.5;
        inner = `<rect x="${x - pw / 2}" y="${y - size * 1.05}" width="${pw}" height="${ph}" fill="#0b0a09" opacity="0.72" rx="6"/>` + inner;
      }
      if (c.stamp) inner = `<g transform="rotate(${c.rot || -10} ${x} ${y})"><rect x="${x - c.text.length * size * 0.33}" y="${y - size * 0.95}" width="${c.text.length * size * 0.66}" height="${size * 1.3}" fill="none" stroke="${c.color}" stroke-width="8"/>${inner}</g>`;
      g += `<g opacity="${a}" transform="translate(${x},${y}) scale(${scale}) translate(${-x},${-y})">${inner}</g>`;
    }
    return g;
  }

  function renderAt(t) {
    const shot = TL.shots.find((s) => t >= s.start && t < s.end) || TL.shots[TL.shots.length - 1];
    const st = t - shot.start, dur = shot.end - shot.start;
    const set = SETS[shot.set] ? SETS[shot.set](st) : { back: '', front: '' };
    // camera
    const cam0 = Object.assign({ zoom: 1, x: 0, y: 0 }, shot.cam && shot.cam.from), cam1 = Object.assign({}, cam0, shot.cam && shot.cam.to);
    const ct = ease(clamp(st / dur, 0, 1));
    const z = lerp(cam0.zoom, cam1.zoom, ct), cx = lerp(cam0.x, cam1.x, ct), cy = lerp(cam0.y, cam1.y, ct);
    const shake = shot.shakeAt && shot.shakeAt.some((s) => st >= s && st < s + 0.25) ? (hash(t * 60) - 0.5) * 18 : 0;
    const camT = `translate(${540 + cx + shake},${960 + cy}) scale(${z}) translate(-540,-960)`;

    const speaker = speakingNow(t);
    let chars = '';
    (shot.chars || []).forEach((c, idx) => {
      const prof = CAST[c.rig];
      if (!prof) return;
      const m = mouthFor(c.key, t);
      const seed = (c.key || c.rig).length * 13 + idx;
      // idle motion: breathing + small head drift; speakers move a bit more
      const talking = speaker === c.key;
      const lookAt = c.lookAt != null ? c.lookAt : (speaker && speaker !== c.key ? (shot.chars.find((o) => o.key === speaker)?.x > c.x ? 0.7 : -0.7) * (c.flip ? -1 : 1) : 0);
      const state = Object.assign({
        open: m.open, round: m.round,
        blink: Math.max(blinkAt(t, seed), c.state?.blink || 0),
        lookX: lookAt, lookY: 0.05,
        breathe: (Math.sin(t * 1.6 + seed) + 1) / 2,
        tilt: Math.sin(t * 0.7 + seed) * 1.2 + (talking ? Math.sin(t * 3.1 + seed) * 1.6 : 0),
        turn: (c.turn != null ? c.turn : ((shot.chars || []).length > 1 ? 0.55 : 0)) + Math.sin(t * 0.4 + seed) * 0.08,
      }, c.state || {});
      // keyed state changes within shot: [{at, state}]
      for (const k of c.keys || []) if (st >= k.at) Object.assign(state, k.state);
      const enter = c.enter ? ease(clamp((st - (c.enter.at || 0)) / (c.enter.dur || 0.5), 0, 1)) : 1;
      const ex = c.enter ? lerp(c.enter.dx || 0, 0, enter) : 0;
      const s = c.s || 1.6;
      const op = c.dim ? 0.92 : 1;
      chars += `<g opacity="${op * (c.enter?.fade ? enter : 1)}" transform="translate(${c.x + ex},${c.y}) scale(${c.flip ? -s : s},${s}) translate(-300,-300)">${draw(prof, state)}</g>`;
    });

    let svg = `<g transform="${camT}">${set.back}${chars}${set.front}</g>`;
    // grade
    if (shot.grade) svg += `<rect width="${W}" height="${H}" fill="${shot.grade}" style="mix-blend-mode:${shot.gradeMode || 'multiply'}" opacity="${shot.gradeOp ?? 0.35}"/>`;
    // overlays
    for (const nc of shot.nameCards || []) svg += nameCard(nc, t, shot.start);
    svg += textCards(shot, t);
    svg += subtitle(t);
    // badge
    svg += `<g opacity="0.92"><rect x="40" y="236" width="410" height="62" rx="4" fill="#0f0e0c" opacity="0.75"/><text x="64" y="278" font-family="'Courier Prime','Courier New',monospace" font-size="30" fill="#e8c56a" letter-spacing="2">GARBO · PART ${TL.part}/${TL.of}</text></g>`;
    // flash / fade
    const fin = clamp(st / (shot.fadeIn ?? 0.25), 0, 1), fout = clamp((shot.end - t) / (shot.fadeOut ?? 0.2), 0, 1);
    const fade = 1 - Math.min(fin, fout);
    if (fade > 0.001) svg += `<rect width="${W}" height="${H}" fill="${shot.fadeColor || '#000'}" opacity="${fade}"/>`;
    // film grain (static, cheap)
    svg += `<rect width="${W}" height="${H}" fill="url(#grain)" opacity="0.10"/>`;
    return svg;
  }

  function mount(el) {
    el.innerHTML = `<svg id="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="display:block;background:#000">` +
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
  root.GarboPlayer = { load, renderFrame, renderAt, play };
  root.renderFrame = renderFrame;
})(window);
