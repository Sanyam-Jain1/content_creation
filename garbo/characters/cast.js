// GARBO cast: per-person proportions and signature features, from period
// photos (see ../research/CHARACTERS.md). Each entry is a rig profile for GarboRig.draw.
(function (root) {
  'use strict';
  const { crPath, shade } = root.GarboRig;

  // ---------------- Juan Pujol ----------------
  // 1941 consular photo: clean-shaven, high bald dome, short dark sides,
  // narrow oval face, prominent ears, straight long nose, heavy lids, half-smile.
  // Close-cropped hair at the sides/back: clipped inside the head outline so it
  // follows the skull, plus a thin fringe just outside the silhouette.
  function juanSidesIn(color, thin) {
    return (cx, cy) => {
      let g = '';
      for (const s of [-1, 1]) {
        const pts = [[cx + s * 66, cy - 90], [cx + s * 86, cy - 66], [cx + s * 96, cy - 24], [cx + s * 95, cy + 8], [cx + s * 84, cy + 6], [cx + s * 78, cy - 22], [cx + s * 72, cy - 50], [cx + s * 60, cy - 76]];
        g += `<path d="${crPath(pts)}" fill="${color}" opacity="0.92"/>`;
        for (let k = 0; k < 5; k++) g += `<path d="M${cx + s * (64 + k * 4)},${cy - 76 + k * 6} Q${cx + s * (80 + k * 3)},${cy - 36} ${cx + s * (84 + k * 2)},${cy + 2}" fill="none" stroke="${shade(color, 0.3)}" stroke-width="1.2" opacity="0.45"/>`;
      }
      if (thin) g += `<path d="M${cx - 58},${cy - 90} Q${cx - 6},${cy - 108} ${cx + 54},${cy - 92} M${cx - 50},${cy - 98} Q${cx + 4},${cy - 114} ${cx + 48},${cy - 100}" fill="none" stroke="${color}" stroke-width="1.5" opacity="${thin}"/>`;
      return g;
    };
  }
  function juanSidesOut(color) {
    return (cx, cy) => {
      let g = '';
      for (const s of [-1, 1]) {
        g += `<path d="M${cx + s * 84},${cy - 64} Q${cx + s * 94},${cy - 34} ${cx + s * 93},${cy + 2}" fill="none" stroke="${color}" stroke-width="4" opacity="0.85" stroke-linecap="round"/>`;
      }
      return g;
    };
  }
  const juanBase = {
    name: 'Juan Pujol',
    skin: '#d9a681',
    sheen: 0.16,
    head: { w: 178, h: 240, jaw: 112, cheek: 0.3, chin: 0.13, crown: 0.62 },
    neck: 50,
    eyes: { gap: 39, w: 35, h: 13, y: -6, lid: 0.2, color: '#4b2d1b', bags: 0.4 },
    deepSet: 0.12,
    brows: { y: -24, w: 42, arch: 7, t: 6.5, color: '#271a12', slope: 2 },
    nose: { len: 48, w: 30 },
    mouth: { y: 88, w: 50, upper: 4, lower: 5, maxOpen: 26, lip: '#b37563', lines: 0.35 },
    ears: { w: 36, h: 62, out: 12, y: 18 },
    blush: 0.06,
    hairInHead: juanSidesIn('#2e221a', 0.4),
    hairFront: juanSidesOut('#2e221a'),
    clothes: { type: 'suit', jacket: '#24262c', shirt: '#eee8dc', tie: '#3a3530', tiePattern: 'dots', tieDot: '#d9ccb2', doubleBreasted: true, pocketSquare: true, shoulder: 205 },
  };

  const juan1941 = juanBase;
  const juan1944 = Object.assign({}, juanBase, {
    eyes: Object.assign({}, juanBase.eyes, { bags: 0.5 }),
    clothes: Object.assign({}, juanBase.clothes, { pattern: 'pinstripe', jacket: '#262a33' }),
  });
  const juanPrison = Object.assign({}, juanBase, {
    stubble: 0.12,
    clothes: { type: 'suit', jacket: '#5d604f', prison: true, shoulder: 205 },
  });
  // The famous wartime "disguise" portrait: full beard + round dark glasses.
  const juanDisguise = Object.assign({}, juanBase, {
    beard: (cx, cy, P, S, my) => {
      const c = '#2b1f18';
      const pts = [[cx - 84, cy + 8], [cx - 82, cy + 60], [cx - 62, cy + 112], [cx - 30, cy + 140], [cx, cy + 146], [cx + 30, cy + 140], [cx + 62, cy + 112], [cx + 82, cy + 60], [cx + 84, cy + 8], [cx + 66, cy + 40], [cx + 40, cy + 66], [cx, cy + 70], [cx - 40, cy + 66], [cx - 66, cy + 40]];
      let g = `<path d="${crPath(pts)}" fill="${c}"/>`;
      for (let i = 0; i < 26; i++) {
        const a = (i / 25) * Math.PI;
        const x = cx - Math.cos(a) * 70, y = cy + 70 + Math.sin(a) * 60;
        g += `<path d="M${x.toFixed(1)},${y.toFixed(1)} l${(Math.cos(a) * -6).toFixed(1)},10" stroke="${shade(c, 0.3)}" stroke-width="1.3" opacity="0.5"/>`;
      }
      return g;
    },
    moustache: (cx, my) => `<path d="M${cx - 34},${my + 3} Q${cx - 18},${my - 16} ${cx},${my - 9} Q${cx + 18},${my - 16} ${cx + 34},${my + 3} Q${cx + 16},${my - 4} ${cx},${my - 2} Q${cx - 16},${my - 4} ${cx - 34},${my + 3}Z" fill="#2b1f18"/>`,
    glasses: { shape: 'panto', r: 25, t: 4.5, color: '#141010' },
    clothes: Object.assign({}, juanBase.clothes, { pattern: 'pinstripe', doubleBreasted: false, tiePattern: 'dots' }),
  });
  // 1984: 72 years old, grey sides, lined face, light jacket, open collar (Venezuela).
  const juan1984 = Object.assign({}, juanBase, {
    skin: '#cf9a74',
    sheen: 0.2,
    wrinkles: 0.55,
    eyes: Object.assign({}, juanBase.eyes, { lid: 0.32, bags: 0.8, color: '#3f2618' }),
    brows: Object.assign({}, juanBase.brows, { color: '#8c857c', t: 6 }),
    mouth: Object.assign({}, juanBase.mouth, { lines: 0.7, lip: '#a87262' }),
    hairInHead: juanSidesIn('#b1aba2', 0),
    hairFront: juanSidesOut('#b1aba2'),
    clothes: { type: 'suit', jacket: '#d8d0bf', shirt: '#f1ede4', openCollar: true, buttons: true, shoulder: 200 },
  });

  // ---------------- Araceli ----------------
  // 1941 consular photo: round full face, dark wavy shoulder-length hair parted
  // off-centre, warm smile, dark V-neck dress with white bow brooch.
  const araHair = '#261813';
  const araceli1941 = {
    name: 'Araceli',
    skin: '#ecc3a3',
    sheen: 0.06,
    head: { w: 188, h: 222, jaw: 148, cheek: 0.75, chin: 0.2, crown: 0.5, y: 6 },
    neck: 44,
    eyes: { gap: 41, w: 37, h: 14.5, y: -4, lid: 0.04, color: '#3a2216', lash: '#120a07', lashW: 4, iris: 8.5, tiltUp: 0 },
    brows: { y: -26, w: 40, arch: 8, t: 5, color: '#2b1a12', slope: 3 },
    nose: { len: 36, w: 26 },
    mouth: { y: 74, w: 52, upper: 6, lower: 7, maxOpen: 24, lip: '#b0444a' },
    ears: { w: 24, h: 44, out: 0, y: 20 },
    blush: 0.16,
    hairBack: (cx, cy) => {
      const pts = [[cx, cy - 140], [cx + 98, cy - 120], [cx + 136, cy - 40], [cx + 138, cy + 60], [cx + 150, cy + 140], [cx + 118, cy + 178], [cx + 70, cy + 150], [cx, cy + 120], [cx - 70, cy + 150], [cx - 118, cy + 178], [cx - 150, cy + 140], [cx - 138, cy + 60], [cx - 136, cy - 40], [cx - 98, cy - 120]];
      let g = `<path d="${crPath(pts)}" fill="${araHair}"/>`;
      // curls at the ends
      for (const s of [-1, 1]) {
        g += `<path d="M${cx + s * 140},${cy + 120} q${s * 18},30 ${s * -10},52 q${s * -24},10 ${s * -36},-14" fill="none" stroke="${shade(araHair, 0.25)}" stroke-width="3" opacity="0.7"/>`;
        g += `<path d="M${cx + s * 118},${cy + 40} q${s * 22},30 ${s * 6},70" fill="none" stroke="${shade(araHair, 0.25)}" stroke-width="2.5" opacity="0.6"/>`;
      }
      return g;
    },
    hairFront: (cx, cy) => {
      // swept crown with an off-centre (left) part and a soft wave over the right temple
      const right = [[cx - 18, cy - 134], [cx + 56, cy - 128], [cx + 104, cy - 86], [cx + 116, cy - 20], [cx + 110, cy + 50], [cx + 92, cy + 30], [cx + 94, cy - 26], [cx + 72, cy - 66], [cx + 30, cy - 82], [cx - 10, cy - 96]];
      const left = [[cx - 18, cy - 134], [cx - 66, cy - 124], [cx - 104, cy - 82], [cx - 116, cy - 10], [cx - 110, cy + 56], [cx - 92, cy + 30], [cx - 92, cy - 30], [cx - 70, cy - 76], [cx - 34, cy - 100]];
      let g = `<path d="${crPath(right)}" fill="${araHair}"/><path d="${crPath(left)}" fill="${araHair}"/>`;
      // wave highlights
      g += `<path d="M${cx - 6},${cy - 120} Q${cx + 50},${cy - 112} ${cx + 88},${cy - 70} M${cx + 10},${cy - 106} Q${cx + 60},${cy - 98} ${cx + 96},${cy - 40}" fill="none" stroke="${shade(araHair, 0.35)}" stroke-width="3" opacity="0.55" stroke-linecap="round"/>`;
      g += `<path d="M${cx - 30},${cy - 122} Q${cx - 76},${cy - 106} ${cx - 98},${cy - 50}" fill="none" stroke="${shade(araHair, 0.35)}" stroke-width="3" opacity="0.5" stroke-linecap="round"/>`;
      return g;
    },
    clothes: { type: 'dress', dress: '#1f1d24', brooch: true, shoulder: 175 },
  };
  const araceli1943 = Object.assign({}, araceli1941, {
    eyes: Object.assign({}, araceli1941.eyes, { bags: 0.35 }),
    clothes: { type: 'dress', dress: '#3c4a5a', brooch: false, shoulder: 175 },
  });
  const araceli1949 = Object.assign({}, araceli1941, {
    eyes: Object.assign({}, araceli1941.eyes, { bags: 0.4 }),
    clothes: { type: 'dress', dress: '#4a3a34', brooch: true, shoulder: 178 },
  });

  // ---------------- Tommy Harris ----------------
  // "swept-black hair, beaky nose, intense dark eyes" (Costello); 1942 MI5 ID photo.
  const harris = {
    name: 'Tommy Harris',
    skin: '#c89670',
    sheen: 0.08,
    head: { w: 170, h: 254, jaw: 116, cheek: 0.25, chin: 0.15, crown: 0.55 },
    neck: 50,
    eyes: { gap: 37, w: 32, h: 10.5, y: -4, lid: 0.28, color: '#22130b', bags: 0.45 },
    deepSet: 0.18,
    brows: { y: -18, w: 46, arch: 4, t: 9, color: '#141011', slope: 4 },
    nose: { len: 60, w: 34, hook: 11 },
    mouth: { y: 100, w: 48, upper: 4, lower: 6, maxOpen: 26, lip: '#9c6252', lines: 0.4 },
    ears: { w: 30, h: 58, out: 4, y: 22 },
    stubble: 0.07,
    hairFront: (cx, cy) => {
      const c = '#121013';
      const pts = [[cx - 86, cy - 20], [cx - 96, cy - 92], [cx - 50, cy - 150], [cx + 20, cy - 162], [cx + 80, cy - 136], [cx + 98, cy - 76], [cx + 88, cy - 18], [cx + 80, cy - 62], [cx + 50, cy - 92], [cx + 10, cy - 104], [cx - 36, cy - 100], [cx - 72, cy - 74]];
      let g = `<path d="${crPath(pts)}" fill="${c}"/>`;
      // swept-back streaks
      g += `<path d="M${cx - 40},${cy - 104} Q${cx - 20},${cy - 146} ${cx + 30},${cy - 152} M${cx},${cy - 106} Q${cx + 20},${cy - 140} ${cx + 66},${cy - 130} M${cx + 40},${cy - 96} Q${cx + 70},${cy - 120} ${cx + 88},${cy - 84}" fill="none" stroke="#4a4652" stroke-width="2.4" opacity="0.7" stroke-linecap="round"/>`;
      return g;
    },
    clothes: { type: 'suit', jacket: '#2e2a28', shirt: '#e9e3d6', tie: '#5a2b2b', tiePattern: 'stripe', tieDot: '#9a7a5a', shoulder: 210 },
  };

  // ---------------- "Frederico" ----------------
  // No reliable photo: 1940s Abwehr officer in civilian dress (archetype).
  const frederico = {
    name: '"Frederico"',
    skin: '#eec3a4',
    sheen: 0.1,
    head: { w: 188, h: 234, jaw: 142, cheek: 0.5, chin: 0.2, crown: 0.5 },
    neck: 58,
    eyes: { gap: 40, w: 30, h: 10, y: -6, lid: 0.18, color: '#58799a' },
    brows: { y: -24, w: 42, arch: 3, t: 5, color: '#a98a52', slope: 0 },
    nose: { len: 42, w: 32 },
    mouth: { y: 84, w: 52, upper: 3.5, lower: 5, maxOpen: 26, lip: '#b97b6c', lines: 0.25 },
    ears: { w: 30, h: 56, out: 5, y: 20 },
    blush: 0.14,
    hairFront: (cx, cy) => {
      const c = '#c3a161';
      // short back-and-sides, longer top with a left side-parting
      const pts = [[cx - 92, cy - 18], [cx - 96, cy - 84], [cx - 60, cy - 132], [cx + 10, cy - 142], [cx + 72, cy - 124], [cx + 96, cy - 74], [cx + 92, cy - 22], [cx + 84, cy - 66], [cx + 40, cy - 98], [cx - 40, cy - 100], [cx - 82, cy - 70]];
      let g = `<path d="${crPath(pts)}" fill="${c}"/>`;
      g += `<path d="M${cx - 44},${cy - 132} L${cx - 40},${cy - 100}" stroke="${shade(c, -0.35)}" stroke-width="2.4"/>`;
      g += `<path d="M${cx - 36},${cy - 120} Q${cx + 20},${cy - 132} ${cx + 80},${cy - 98}" fill="none" stroke="${shade(c, 0.3)}" stroke-width="3" opacity="0.6"/>`;
      return g;
    },
    glasses: { shape: 'round', r: 22, t: 2.6, color: '#8d8f92' },
    clothes: { type: 'suit', jacket: '#2b2f2a', shirt: '#ecebe4', tie: '#1d1d22', tiePattern: null, waistcoat: true, pin: true, shoulder: 215 },
  };

  // ---------------- minor characters ----------------
  const officer = {
    name: 'Embassy officer',
    skin: '#f0cbab',
    head: { w: 166, h: 242, jaw: 108, cheek: 0.2, chin: 0.13, crown: 0.5 },
    neck: 46,
    eyes: { gap: 36, w: 30, h: 10, y: -6, lid: 0.5, color: '#6b7458' },
    brows: { y: -22, w: 38, arch: 3, t: 4.5, color: '#9c7a4c', slope: 4 },
    nose: { len: 46, w: 26 },
    mouth: { y: 88, w: 44, upper: 3, lower: 4, maxOpen: 22, lip: '#bf8578' },
    ears: { w: 30, h: 56, out: 4, y: 20 },
    blush: 0.12,
    moustache: (cx, my) => `<path d="M${cx - 18},${my - 8} L${cx + 18},${my - 8} L${cx + 16},${my - 18} L${cx - 16},${my - 18}Z" fill="#9c7a4c"/>`,
    hairFront: (cx, cy) => {
      const c = '#a8844f';
      const pts = [[cx - 84, cy - 24], [cx - 88, cy - 92], [cx - 40, cy - 134], [cx + 30, cy - 136], [cx + 84, cy - 100], [cx + 86, cy - 26], [cx + 76, cy - 72], [cx + 20, cy - 94], [cx - 30, cy - 100], [cx - 74, cy - 74]];
      return `<path d="${crPath(pts)}" fill="${c}"/><path d="M${cx - 30},${cy - 130} L${cx - 26},${cy - 100}" stroke="${shade(c, -0.3)}" stroke-width="2"/>`;
    },
    clothes: { type: 'suit', jacket: '#3c3a35', shirt: '#efeadf', tie: '#22304a', tiePattern: 'stripe', tieDot: '#8a2a2a', shoulder: 195 },
  };

  const nigelWest = {
    name: 'Nigel West',
    skin: '#efc3a2',
    head: { w: 178, h: 236, jaw: 128, cheek: 0.45, chin: 0.17, crown: 0.5 },
    neck: 50,
    eyes: { gap: 38, w: 32, h: 11, y: -6, lid: 0.2, color: '#4c5e72' },
    brows: { y: -24, w: 42, arch: 5, t: 6, color: '#3a2a20', slope: 1 },
    nose: { len: 42, w: 28 },
    mouth: { y: 84, w: 48, upper: 4, lower: 5, maxOpen: 26, lip: '#b97a6a' },
    ears: { w: 30, h: 56, out: 4, y: 20 },
    blush: 0.12,
    hairFront: (cx, cy) => {
      const c = '#3a2a20';
      const pts = [[cx - 90, cy - 10], [cx - 98, cy - 90], [cx - 50, cy - 144], [cx + 30, cy - 148], [cx + 92, cy - 108], [cx + 94, cy - 20], [cx + 84, cy - 60], [cx + 60, cy - 66], [cx + 10, cy - 80], [cx - 50, cy - 100], [cx - 80, cy - 70]];
      return `<path d="${crPath(pts)}" fill="${c}"/><path d="M${cx - 50},${cy - 100} Q${cx + 10},${cy - 128} ${cx + 80},${cy - 96}" fill="none" stroke="${shade(c, 0.35)}" stroke-width="3" opacity="0.5"/>`;
    },
    clothes: { type: 'suit', jacket: '#6a5a41', pattern: 'tweed', shirt: '#dfe6ee', openCollar: true, shoulder: 205 },
  };


  // MI5 officer (Part 1): 50s, grey suit, horn-rimmed glasses, greying hair
  const mi5officer = {
    name: 'MI5 officer',
    skin: '#e9bf9e',
    head: { w: 184, h: 240, jaw: 132, cheek: 0.45, chin: 0.18, crown: 0.5 },
    neck: 54,
    wrinkles: 0.35,
    eyes: { gap: 39, w: 30, h: 10, y: -6, lid: 0.3, color: '#4a5a4a', bags: 0.6 },
    brows: { y: -22, w: 42, arch: 3, t: 6.5, color: '#6e6a62', slope: 2 },
    nose: { len: 46, w: 34 },
    mouth: { y: 88, w: 50, upper: 3, lower: 5, maxOpen: 24, lip: '#ad7666', lines: 0.5 },
    ears: { w: 32, h: 60, out: 5, y: 20 },
    blush: 0.12,
    hairFront: (cx, cy) => {
      const c = '#8d877d';
      const pts = [[cx - 90, cy - 16], [cx - 96, cy - 86], [cx - 56, cy - 130], [cx + 20, cy - 138], [cx + 80, cy - 112], [cx + 96, cy - 60], [cx + 90, cy - 14], [cx + 80, cy - 62], [cx + 40, cy - 84], [cx - 20, cy - 92], [cx - 78, cy - 70]];
      return `<path d="${crPath(pts)}" fill="${c}"/><path d="M${cx - 20},${cy - 92} Q${cx + 30},${cy - 120} ${cx + 82},${cy - 100}" fill="none" stroke="${shade(c, 0.3)}" stroke-width="3" opacity="0.6"/>`;
    },
    glasses: { shape: 'panto', r: 23, t: 5, color: '#3a2618' },
    clothes: { type: 'suit', jacket: '#5a5c5e', shirt: '#ecebe4', tie: '#2a2a40', tiePattern: 'stripe', tieDot: '#7a6a3a', waistcoat: true, shoulder: 215 },
  };

  root.GarboCast = {
    juan1941, juan1944, juanPrison, juanDisguise, juan1984,
    araceli1941, araceli1943, araceli1949,
    harris, frederico, officer, mi5officer, nigelWest,
  };
})(typeof window !== 'undefined' ? window : globalThis);
