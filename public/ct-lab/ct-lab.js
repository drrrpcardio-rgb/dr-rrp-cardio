/* Dr. RRP Cardio · CT Lab
   A cardiac CT / CT coronary angiography simulator. A synthetic chest and heart is built
   as a voxel volume in the browser; coronary arteries are analytic tubes with plaques, so
   curved MPR and cross-sections stay sharp. Scan settings (heart rate, gating, kV, mAs,
   contrast timing) change noise, enhancement, motion and dose. Teaching only. */
'use strict';
(() => {
  // ───────────────────────── utilities ─────────────────────────
  const DEG = Math.PI / 180;
  const hyp = (a, b, c = 0) => Math.sqrt(a * a + b * b + c * c);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const frac = (x) => x - Math.floor(x);
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vlen = (a) => hyp(a[0], a[1], a[2]);
  const nrm = (a) => mul(a, 1 / (vlen(a) || 1));
  let seed = 7;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const fmt = (v, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : '–');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ───────────────────────── volume grid ─────────────────────────
  // World mm: +x patient left, +y posterior, +z superior. Axial images: patient right on screen left, anterior up.
  const NX = 224, NY = 224, NZ = 160, NXY = NX * NY, NV = NXY * NZ;
  const FOV = 200, ZLEN = 140, X0 = -95, Y0 = -100, Z0 = -80, ZTOP = Z0 + ZLEN;
  const DX = FOV / NX, DZ = ZLEN / NZ;
  const L_BODY = 0, L_HEART = 1, L_BONE = 2, L_COR = 3, L_AORTA = 4, L_FAT = 5, L_LUNG = 6, L_ABD = 7;
  const C_NONE = 0, C_LEFT = 1, C_RIGHT = 2, C_MYO = 3, C_COLL = 4, C_SVC = 5, C_HALF = 6, C_ABD = 7;
  const tg = (l, c) => (l << 3) | c;

  const baseHU = new Int16Array(NV), baseTag = new Uint8Array(NV);
  const HU = new Int16Array(NV), TAG = new Uint8Array(NV), NOISE = new Int8Array(NV), BEST = new Uint8Array(NV);
  const GA = new Float32Array(8); // HU added per contrast compartment
  let NAMP = 0; // noise HU per NOISE unit

  // ───────────────────────── heart frame ─────────────────────────
  // e1: base → apex long axis. e2: from LV toward RV. e3: anterior-superior (LAD side).
  const B = [-5, -14, 12];
  const e1 = nrm([0.62, -0.52, -0.58]);
  const e2 = (() => { const r = [-0.7, -0.7, 0]; return nrm(sub(r, mul(e1, dot(r, e1)))); })();
  const e3 = nrm(cross(e2, e1));
  const HL = 88, HLc = 78;
  function Repi(a) {
    const t = clamp(a / HL, 0, 1);
    return t <= 0.42 ? 29 * (1 - 0.16 * ((0.42 - t) / 0.42) ** 2) : 29 * Math.sqrt(Math.max(0, 1 - ((t - 0.42) / 0.58) ** 2));
  }
  function Rendo(a) {
    const t = a / HLc;
    if (t < 0) return 18;
    if (t > 1) return 0;
    return t <= 0.4 ? 20.5 * (1 - 0.12 * ((0.4 - t) / 0.4) ** 2) : 20.5 * Math.sqrt(Math.max(0, 1 - ((t - 0.4) / 0.6) ** 2));
  }
  function rvQ(a, c2, c3, sh) {
    const sa = (a < 24 ? 44 : 46) - sh, u = (a - 24) / sa, v = (c2 - 12) / (30 - sh), w = c3 / (38 - sh);
    return u * u + v * v + w * w;
  }
  const H2W = (a, c2, c3) => [B[0] + a * e1[0] + c2 * e2[0] + c3 * e3[0], B[1] + a * e1[1] + c2 * e2[1] + c3 * e3[1], B[2] + a * e1[2] + c2 * e2[2] + c3 * e3[2]];
  function toH(p) { const d = sub(p, B); return [dot(d, e1), dot(d, e2), dot(d, e3)]; }
  function epiPt(a, phi, out) { const r = Repi(Math.max(0, a)) + out; return H2W(a, r * Math.cos(phi * DEG), r * Math.sin(phi * DEG)); }
  function rvRing(a, psi, out) {
    const sa = Math.sqrt(Math.max(0.05, 1 - ((a - 24) / (a < 24 ? 44 : 46)) ** 2));
    return H2W(a, 12 + (30 * sa + out) * Math.cos(psi * DEG), (38 * sa + out) * Math.sin(psi * DEG));
  }
  function junction(a, lo, hi) {
    const r = Repi(a) + 0.5;
    const f = (p) => rvQ(a, r * Math.cos(p * DEG), r * Math.sin(p * DEG), 0) - 1;
    if (f(lo) > 0 || f(hi) < 0) return null;
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  const jA = [], jP = [];
  { let la = 60, lp = -60; for (let a = 0; a <= HL; a++) { const fa = junction(a, 0, 160); if (fa != null) la = fa; jA[a] = la; const fp = junction(a, 0, -160); if (fp != null) lp = fp; jP[a] = lp; } }
  const phA = (a) => jA[clamp(Math.round(a), 0, HL)];
  const phP = (a) => jP[clamp(Math.round(a), 0, HL)];

  // ───────────────────────── anatomy primitives ─────────────────────────
  function tube(pts, r, pad = 9) {
    const segs = [], bb = [1e9, -1e9, 1e9, -1e9, 1e9, -1e9];
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], d = sub(pts[i + 1], a); segs.push([a[0], a[1], a[2], d[0], d[1], d[2], dot(d, d)]); }
    for (const p of pts) for (let k = 0; k < 3; k++) { bb[2 * k] = Math.min(bb[2 * k], p[k] - r - pad); bb[2 * k + 1] = Math.max(bb[2 * k + 1], p[k] + r + pad); }
    return { segs, r, bb, pts };
  }
  function tubeD(t, x, y, z) {
    const b = t.bb;
    if (x < b[0] || x > b[1] || y < b[2] || y > b[3] || z < b[4] || z > b[5]) return 1e9;
    let m = 1e18;
    const s = t.segs;
    for (let i = 0; i < s.length; i++) {
      const g = s[i], px = x - g[0], py = y - g[1], pz = z - g[2];
      let h = (px * g[3] + py * g[4] + pz * g[5]) / g[6];
      h = h < 0 ? 0 : h > 1 ? 1 : h;
      const qx = px - g[3] * h, qy = py - g[4] * h, qz = pz - g[5] * h, d = qx * qx + qy * qy + qz * qz;
      if (d < m) m = d;
    }
    return Math.sqrt(m) - t.r;
  }
  function ell(c, s, pad = 9) { return { c, s, m: Math.min(...s), bb: [c[0] - s[0] - pad, c[0] + s[0] + pad, c[1] - s[1] - pad, c[1] + s[1] + pad, c[2] - s[2] - pad, c[2] + s[2] + pad] }; }
  function ellD(e, x, y, z) {
    const b = e.bb;
    if (x < b[0] || x > b[1] || y < b[2] || y > b[3] || z < b[4] || z > b[5]) return 1e9;
    const u = (x - e.c[0]) / e.s[0], v = (y - e.c[1]) / e.s[1], w = (z - e.c[2]) / e.s[2];
    return (Math.sqrt(u * u + v * v + w * w) - 1) * e.m;
  }

  const A0 = [-15, -20, 32];
  const ROOT = [-15, -20, 34], ROOT_R = 16.5;
  const T_LVOT = tube([H2W(12, 6, 4), A0], 10);
  const T_ASC = tube([A0, [-18, -22, 48], [-18, -21, 72]], 15);
  const T_DESC = tube([[26, 58, 72], [28, 58, -92]], 12);
  const T_PA = tube([H2W(6, 26, 22), [8, -42, 44], [10, -16, 57]], 12.5);
  const T_LPA = tube([[10, -16, 57], [30, 0, 58], [52, 20, 52]], 10);
  const T_RPA = tube([[10, -16, 57], [-10, 6, 56], [-50, 10, 52]], 10);
  const E_LA = ell([7, 18, 26], [32, 17, 19]);
  const E_LAA = ell([33, -6, 34], [12, 7, 8]);
  const T_MV = tube([H2W(4, 0, 0), [7, 18, 26]], 15);
  const T_PVS = [
    tube([[-15, 22, 30], [-55, 30, 38]], 7), tube([[-15, 26, 16], [-55, 40, 10]], 7),
    tube([[28, 20, 32], [62, 35, 40]], 7), tube([[28, 26, 16], [62, 45, 10]], 7),
  ];
  const E_RA = ell([-40, 6, 14], [18, 20, 22]);
  const T_TV = tube([H2W(-4, 24, -4), [-40, 6, 14]], 14);
  const T_SVC = tube([[-38, 6, 30], [-33, 6, 45], [-31, 7, 72]], 10);
  const T_IVC = tube([[-36, 10, -6], [-30, 18, -40], [-28, 22, -92]], 12);
  const T_ESO = tube([[6, 44, 72], [10, 44, -92]], 7);
  const T_AIR = [tube([[0, 32, 72], [0, 32, 52]], 9), tube([[0, 32, 52], [38, 36, 40]], 6.5), tube([[0, 32, 52], [-32, 34, 46]], 7)];
  const PAP = [[Math.cos(135 * DEG), Math.sin(135 * DEG)], [Math.cos(-135 * DEG), Math.sin(-135 * DEG)]];

  // ───────────────────────── base scene ─────────────────────────
  let OH = 0, OT = 0, SDH = 1e9, SDV = 1e9;
  const put = (h, t) => { OH = h; OT = t; return true; };

  function heartScene(x, y, z) {
    SDH = 1e9; SDV = 1e9;
    if (x < -85 || x > 105 || y < -90 || y > 82 || z < -95 || z > 80) return false;
    let d, wall = false;
    d = tubeD(T_ASC, x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(44, tg(L_AORTA, C_LEFT)); if (d < 1.6) wall = true;
    d = hyp(x - ROOT[0], y - ROOT[1], z - ROOT[2]) - ROOT_R; if (d < SDV) SDV = d; if (d < 0) return put(44, tg(L_AORTA, C_LEFT)); if (d < 1.6) wall = true;
    d = tubeD(T_LVOT, x, y, z); if (d < 0) return put(44, tg(L_HEART, C_LEFT));
    d = tubeD(T_DESC, x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(44, tg(L_BODY, C_LEFT)); if (d < 1.6) wall = true;
    d = tubeD(T_ESO, x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(z > -40 && d < -5.4 ? -960 : 38, tg(L_BODY, 0));
    for (let i = 0; i < 3; i++) { d = tubeD(T_AIR[i], x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(d < -1.8 ? -990 : 50, tg(L_BODY, 0)); }
    d = tubeD(T_SVC, x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(44, tg(L_BODY, C_SVC));
    d = tubeD(T_IVC, x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(40, tg(L_BODY, 0));
    for (let i = 0; i < 4; i++) { d = tubeD(T_PVS[i], x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(44, tg(L_HEART, C_LEFT)); }

    const px = x - B[0], py = y - B[1], pz = z - B[2];
    const a = px * e1[0] + py * e1[1] + pz * e1[2];
    const c2 = px * e2[0] + py * e2[1] + pz * e2[2];
    const c3 = px * e3[0] + py * e3[1] + pz * e3[2];
    const rho = hyp(c2, c3);
    // left ventricle
    if (a > -8 && a < HL + 14) {
      const re = Repi(a < 0 ? 0 : a);
      const sdl = a < 0 ? Math.max(-a, rho - re) : a > HL ? hyp(a - HL, rho) : rho - re;
      if (sdl < SDH) SDH = sdl;
      if (a >= 0 && a <= HL && rho < re) {
        const rn = Rendo(a);
        if (a <= HLc && rho < rn) {
          if (a > 22 && a < 58) {
            const pr = 0.58 * rn, w = 4.6 * (1 - Math.abs(a - 40) / 30);
            for (let k = 0; k < 2; k++) if (hyp(c2 - pr * PAP[k][0], c3 - pr * PAP[k][1]) < w) return put(40, tg(L_HEART, C_MYO));
          }
          if (a > 50 && rho > rn - 2.4) { const ph = Math.atan2(c3, c2); if (Math.sin(ph * 9 + a * 0.45) > 0.5) return put(40, tg(L_HEART, C_MYO)); }
          return put(43, tg(L_HEART, C_LEFT));
        }
        return put(40, tg(L_HEART, C_MYO));
      }
      if (a < 0 && a > -3 && rho < 17) return put(43, tg(L_HEART, C_LEFT));
    }
    // RV outflow and pulmonary arteries
    d = tubeD(T_PA, x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(44, tg(L_HEART, C_RIGHT));
    d = tubeD(T_LPA, x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(44, tg(L_HEART, C_RIGHT));
    d = tubeD(T_RPA, x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(44, tg(L_HEART, C_RIGHT));
    // right ventricle
    if (a > -16 && a < 72) {
      const q = rvQ(a, c2, c3, 0), sdr = (Math.sqrt(q) - 1) * 30;
      if (sdr < SDH) SDH = sdr;
      if (q < 1 && (a >= 0 ? rho >= Repi(a) : c2 > 6)) {
        if (rvQ(a, c2, c3, 3.5) < 1) {
          if (a > 40 && Math.sin(c3 * 0.55 + a * 0.3) > 0.82 && rvQ(a, c2, c3, 6.5) > 1) return put(40, tg(L_HEART, C_MYO));
          return put(43, tg(L_HEART, C_RIGHT));
        }
        return put(40, tg(L_HEART, C_MYO));
      }
    }
    d = tubeD(T_MV, x, y, z); if (d < 0) return put(43, tg(L_HEART, C_LEFT));
    d = tubeD(T_TV, x, y, z); if (d < 0) return put(43, tg(L_HEART, C_RIGHT));
    // atria
    d = ellD(E_LA, x, y, z); if (d < SDH) SDH = d; if (d < 0) return put(43, tg(L_HEART, C_LEFT)); if (d < 2) return put(40, tg(L_HEART, C_MYO));
    d = ellD(E_LAA, x, y, z); if (d < SDH) SDH = d; if (d < 0) return put(43, tg(L_HEART, C_LEFT)); if (d < 1.6) return put(40, tg(L_HEART, C_MYO));
    d = ellD(E_RA, x, y, z); if (d < SDH) SDH = d; if (d < 0) return put(43, tg(L_HEART, C_RIGHT)); if (d < 2) return put(40, tg(L_HEART, C_MYO));
    if (wall) return put(46, tg(L_BODY, 0));
    return false;
  }

  function chestWall(x, y, z, dOut) {
    { const u = x / 15, v = (y + 87) / 7; const q = u * u + v * v; if (q < 1) return put(q > 0.72 ? 740 : 260, tg(L_BONE, 0)); }
    if (dOut < 12) {
      if (dOut > 1.5 && dOut < 11) {
        const ph = Math.atan2(y - 8, x);
        const f = frac((z + 22 * Math.sin(ph) + 6) / 25);
        if (f < 0.3) {
          const cart = y < -50 && Math.abs(x) < 62;
          const edge = Math.min(f, 0.3 - f) / 0.3;
          if (cart) return put(118, tg(L_BODY, 0));
          return put(edge < 0.25 ? 690 : 260, tg(L_BONE, 0));
        }
      }
      return put(48, tg(L_BODY, 0));
    }
    if (dOut < 24 && y < -30) return put(50, tg(L_BODY, 0));
    return put(-98, tg(L_BODY, 0));
  }

  function mediast(x, y, z) {
    // superior mediastinum (around the great vessels), posterior mediastinum, retrosternal fat
    const ws = sstep(18, 34, z);
    if (ws > 0) { const u = (x + 8) / (24 + 14 * ws), v = (y + 14) / 62; if (u * u + v * v < ws) return true; }
    { const u = (x - 14) / 26, v = (y - 50) / 24; if (z > -46 && u * u + v * v < 1) return true; }
    { const u = (x - 2) / 30, v = (y + 74) / 12; if (z > -20 && u * u + v * v < 1) return true; }
    return false;
  }

  function scene(x, y, z) {
    let u = x / 165, v = (y - 5) / 118;
    if (u * u + v * v > 1) return put(-1000, 0);
    u = x / 135; v = (y - 8) / 88;
    const qc = u * u + v * v;
    if (qc >= 1) return chestWall(x, y, z, (Math.sqrt(qc) - 1) * 100);
    const sx = x - 2, sy = y - 80, sd = hyp(sx, sy);
    if (sd < 19) {
      const disc = frac((z + 10) / 27) < 0.19;
      return put(disc ? 85 : sd > 17 ? 720 : 235, tg(L_BONE, 0));
    }
    if (sy > -4 && sd < 27) return put(46, tg(L_BODY, 0));
    if (heartScene(x, y, z)) return true;
    const zd = -47 - 0.07 * x - 0.06 * y;
    if (z < zd) {
      if (zd - z < 4) return put(45, tg(L_BODY, 0));
      if (x < 18) return put(56, tg(L_ABD, C_ABD));
      { const u = (x - 52) / 27, v = (y + 16) / 32, w = (z - zd) / 15; if (u * u + v * v + w * w < 1) return put(-990, 0); } // gastric air
      if (y > 24 && x > 36) return put(50, tg(L_ABD, C_ABD));
      return put(34, tg(L_ABD, 0));
    }
    if (SDH < 7.4) return SDH > 6.5 ? put(32, tg(L_BODY, 0)) : put(-95, tg(L_FAT, 0));
    if (SDV < 4.5 || mediast(x, y, z)) return put(-92, tg(L_BODY, 0));
    if (z < zd + 4) return put(45, tg(L_BODY, 0));
    return put(-865, tg(L_LUNG, 0));
  }

  function genSlices(k0, k1) {
    for (let k = k0; k < k1; k++) {
      const z = Z0 + (k + 0.5) * DZ;
      for (let j = 0; j < NY; j++) {
        const y = Y0 + (j + 0.5) * DX;
        let o = (k * NY + j) * NX;
        for (let i = 0; i < NX; i++, o++) {
          scene(X0 + (i + 0.5) * DX, y, z);
          baseHU[o] = OH; baseTag[o] = OT;
        }
      }
    }
  }

  function stampLungVessels() {
    seed = 31;
    const hila = [[-42, 18, 34], [44, 22, 36]];
    for (let n = 0; n < 420; n++) {
      const x = X0 + rnd() * FOV, y = Y0 + rnd() * FOV, z = Z0 + 8 + rnd() * (ZLEN - 16);
      const i = ((x - X0) / DX) | 0, j = ((y - Y0) / DX) | 0, k = ((z - Z0) / DZ) | 0;
      if (baseTag[(k * NY + j) * NX + i] >> 3 !== L_LUNG) continue;
      const h = hila[x < 0 ? 0 : 1];
      const dh = vlen(sub([x, y, z], h));
      const dir = nrm(add(nrm(sub([x, y, z], h)), [rnd() * 0.8 - 0.4, rnd() * 0.8 - 0.4, rnd() * 0.8 - 0.4]));
      const L = 10 + rnd() * 26, r = clamp(3.2 - dh / 32, 0.6, 3) * (0.7 + rnd() * 0.5);
      const p0 = [x, y, z], p1 = add(p0, mul(dir, L));
      const comp = rnd() < 0.55 ? C_RIGHT : C_LEFT;
      const t = tube([p0, p1], r, 1);
      const i0 = Math.max(0, ((t.bb[0] - X0) / DX) | 0), i1 = Math.min(NX - 1, ((t.bb[1] - X0) / DX) | 0);
      const j0 = Math.max(0, ((t.bb[2] - Y0) / DX) | 0), j1 = Math.min(NY - 1, ((t.bb[3] - Y0) / DX) | 0);
      const k0 = Math.max(0, ((t.bb[4] - Z0) / DZ) | 0), k1 = Math.min(NZ - 1, ((t.bb[5] - Z0) / DZ) | 0);
      for (let kk = k0; kk <= k1; kk++) for (let jj = j0; jj <= j1; jj++) for (let ii = i0; ii <= i1; ii++) {
        const o = (kk * NY + jj) * NX + ii;
        if (baseTag[o] >> 3 !== L_LUNG) continue;
        const dd = tubeD(t, X0 + (ii + 0.5) * DX, Y0 + (jj + 0.5) * DX, Z0 + (kk + 0.5) * DZ);
        if (dd < 0) { baseHU[o] = 42; baseTag[o] = tg(L_LUNG, comp); } else if (dd < 0.6) baseHU[o] = Math.max(baseHU[o], -420);
      }
    }
  }

  function genNoise() {
    const f = new Float32Array(NV);
    seed = 99;
    for (let o = 0; o < NV; o++) f[o] = rnd() + rnd() + rnd() - 1.5;
    const row = new Float32Array(Math.max(NX, NY, NZ));
    // separable [1 2 1] smoothing gives a slightly correlated CT-like grain
    for (let k = 0; k < NZ; k++) for (let j = 0; j < NY; j++) {
      const o = (k * NY + j) * NX;
      for (let i = 0; i < NX; i++) row[i] = f[o + i];
      for (let i = 1; i < NX - 1; i++) f[o + i] = (row[i - 1] + 2 * row[i] + row[i + 1]) * 0.25;
    }
    for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) {
      const o = k * NXY + i;
      for (let j = 0; j < NY; j++) row[j] = f[o + j * NX];
      for (let j = 1; j < NY - 1; j++) f[o + j * NX] = (row[j - 1] + 2 * row[j] + row[j + 1]) * 0.25;
    }
    let s2 = 0;
    for (let o = 0; o < NV; o += 97) s2 += f[o] * f[o];
    const sd = Math.sqrt(s2 / (NV / 97));
    for (let o = 0; o < NV; o++) NOISE[o] = clamp(Math.round((f[o] / sd) * 30), -127, 127);
  }

  // ───────────────────────── coronary arteries ─────────────────────────
  function catmull(anch, step = 0.5) {
    const dense = [];
    const n = anch.length;
    for (let i = 0; i < n - 1; i++) {
      const p0 = anch[Math.max(0, i - 1)], p1 = anch[i], p2 = anch[i + 1], p3 = anch[Math.min(n - 1, i + 2)];
      for (let s = 0; s < 24; s++) {
        const t = s / 24, t2 = t * t, t3 = t2 * t;
        const q = [0, 1, 2].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3));
        dense.push(q);
      }
    }
    dense.push(anch[n - 1].slice());
    const out = [dense[0]];
    let acc = 0;
    for (let i = 1; i < dense.length; i++) {
      let a = dense[i - 1];
      const b = dense[i];
      let seg = vlen(sub(b, a));
      while (acc + seg >= step) {
        const t = (step - acc) / seg;
        const p = add(a, mul(sub(b, a), t));
        out.push(p);
        a = p; seg = vlen(sub(b, a)); acc = 0;
      }
      acc += seg;
    }
    return out;
  }
  function frames(pts) {
    const n = pts.length, T = [], N = [], Bn = [];
    for (let i = 0; i < n; i++) T.push(nrm(sub(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)])));
    let ref = Math.abs(T[0][2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    let nn = nrm(sub(ref, mul(T[0], dot(ref, T[0]))));
    for (let i = 0; i < n; i++) {
      nn = nrm(sub(nn, mul(T[i], dot(nn, T[i]))));
      N.push(nn); Bn.push(cross(T[i], nn));
    }
    return { T, N, Bn };
  }

  const VSPEC = {
    LM: { name: 'Left main', group: 'LM', mg: 'A', r0: 2.2, r1: 2.1 },
    LAD: { name: 'LAD', group: 'LAD', mg: 'A', r0: 1.8, r1: 0.8 },
    D1: { name: 'Diagonal 1', group: 'LAD', mg: 'A', r0: 1.15, r1: 0.6 },
    LCX: { name: 'LCx', group: 'LCX', mg: 'C', r0: 1.7, r1: 1.05 },
    OM1: { name: 'Obtuse marginal 1', group: 'LCX', mg: 'C', r0: 1.15, r1: 0.6 },
    RCA: { name: 'RCA', group: 'RCA', mg: 'R', r0: 1.9, r1: 1.45 },
    AM: { name: 'Acute marginal', group: 'RCA', mg: 'R', r0: 0.85, r1: 0.55 },
    PDA: { name: 'PDA', group: 'RCA', mg: 'R', r0: 1.0, r1: 0.6 },
    PLB: { name: 'PLB', group: 'RCA', mg: 'R', r0: 1.0, r1: 0.65 },
  };
  const TRACKS = {
    LAD: { name: 'LM → LAD', chain: ['LM', 'LAD'] },
    D1: { name: 'Diagonal 1', chain: ['LM', 'LAD', 'D1'] },
    LCX: { name: 'LM → LCx', chain: ['LM', 'LCX'] },
    OM1: { name: 'Obtuse marginal 1', chain: ['LM', 'LCX', 'OM1'] },
    RCA: { name: 'RCA', chain: ['RCA'] },
    AM: { name: 'Acute marginal', chain: ['RCA', 'AM'] },
    PDA: { name: 'RCA → PDA', chain: ['RCA', 'PDA'] },
    PLB: { name: 'RCA → PLB', chain: ['RCA', 'PLB'] },
  };
  const TYP = { none: 0, soft: 1, calc: 2, mixed: 3, hrp: 4, occl: 5, fibrous: 6, slit: 7 };
  const TYPNAME = ['', 'non-calcified', 'calcified', 'partly calcified', 'high-risk (low attenuation, positive remodelling, spotty calcium, napkin-ring)', 'total occlusion', 'fibrous', 'slit-like ostium'];

  let VES = {}, VLIST = [];

  function nearestIdx(v, p) { let bi = 0, bd = 1e9; v.pts.forEach((q, i) => { const d = vlen(sub(q, p)); if (d < bd) { bd = d; bi = i; } }); return bi; }

  function buildCoronaries(cs) {
    VES = {}; VLIST = [];
    const gtn = S.gtn ? 1 : 0.9;
    const mk = (id, anchors, parent, bi) => {
      const pts = catmull(anchors);
      const v = { id, ...VSPEC[id], parent, bi, pts, n: pts.length };
      v.len = (v.n - 1) * 0.5;
      VES[id] = v; VLIST.push(v);
      return v;
    };
    const Bif = epiPt(3, 105, 4);
    const dL = nrm(sub(Bif, ROOT));
    mk('LM', [add(ROOT, mul(dL, ROOT_R - 4)), add(ROOT, mul(dL, ROOT_R + 3)), Bif]);
    const lad = [Bif, epiPt(7, phA(7) + 12, 4), epiPt(13, phA(13) + 3, 3)];
    for (let a = 20; a <= 76; a += 7) lad.push(epiPt(a, phA(a), 2.6));
    lad.push(epiPt(HL - 3, phA(66), 2.1), H2W(HL + 2.4, 0, 0));
    const LAD = mk('LAD', lad, 'LM', VES.LM.n - 1);
    const lcx = [Bif, epiPt(2, 128, 4.2), epiPt(3, 152, 4), epiPt(5, 178, 4), epiPt(7, 203, 3.8), epiPt(9, 225, 3.6), epiPt(12, 242, 3.2)];
    const LCX = mk('LCX', lcx, 'LM', VES.LM.n - 1);
    const dR = nrm([-0.45, -0.85, -0.12]);
    let rca;
    if (cs.anomaly === 'rca-left') {
      const oA = nrm([0.12, -0.99, 0.04]);
      rca = [add(ROOT, mul(oA, ROOT_R - 4)), add(ROOT, mul(oA, ROOT_R + 2.2)), add(ROOT, [-9, -19.5, -1.5]), add(ROOT, [-19, -18, -3])];
    } else rca = [add(ROOT, mul(dR, ROOT_R - 4)), add(ROOT, mul(dR, ROOT_R + 4))];
    rca.push(rvRing(-7, 72, 4.5), rvRing(-8, 40, 4.5), rvRing(-8, 10, 4.5), rvRing(-8, -20, 4.5), rvRing(-8, -50, 4.5), rvRing(-6, -78, 4.5));
    const crux = epiPt(2, phP(2) - 4, 4.2);
    rca.push(crux);
    const RCA = mk('RCA', rca);
    const pda = [crux];
    for (let a = 9; a <= 65; a += 8) pda.push(epiPt(a, phP(a), a < 12 ? 3 : 2.4));
    mk('PDA', pda, 'RCA', RCA.n - 1);
    mk('PLB', [crux, epiPt(4, phP(4) - 22, 3.4), epiPt(7, phP(7) - 45, 3), epiPt(11, -168, 2.6), epiPt(16, -186, 2.2)], 'RCA', RCA.n - 1);
    let bi = nearestIdx(LAD, epiPt(22, phA(22), 2.6));
    mk('D1', [LAD.pts[bi], epiPt(30, phA(30) + 25, 1.8), epiPt(42, phA(42) + 42, 1.6), epiPt(56, phA(56) + 52, 1.4), epiPt(68, phA(68) + 55, 1.3)], 'LAD', bi);
    bi = nearestIdx(LCX, epiPt(5, 178, 4));
    mk('OM1', [LCX.pts[bi], epiPt(14, 180, 1.9), epiPt(28, 182, 1.6), epiPt(44, 180, 1.5), epiPt(60, 177, 1.3)], 'LCX', bi);
    bi = nearestIdx(RCA, rvRing(-8, 5, 4.5));
    mk('AM', [RCA.pts[bi], rvRing(4, 0, 1.6), rvRing(20, -10, 1.6), rvRing(38, -20, 1.4), rvRing(52, -25, 1.2)], 'RCA', bi);

    // myocardial bridge: push a stretch of the LAD into the myocardium
    for (const br of cs.bridges || []) {
      const v = VES[br.v], c = br.at * v.len, h = br.len / 2;
      v.pts = v.pts.map((p, i) => {
        const s = i * 0.5;
        if (Math.abs(s - c) >= h) return p;
        const b = Math.cos(((s - c) / h) * Math.PI * 0.5) ** 2;
        const hp = toH(p), rr = hyp(hp[1], hp[2]);
        return H2W(hp[0], hp[1] * (1 - (br.depth * b) / rr), hp[2] * (1 - (br.depth * b) / rr));
      });
      v.bridge = br;
    }

    for (const v of VLIST) {
      const n = v.n, f = frames(v.pts);
      Object.assign(v, f);
      v.rad = new Float32Array(n); v.D = new Float32Array(n); v.bmp = new Float32Array(n); v.ecc = new Float32Array(n);
      v.ang = new Float32Array(n); v.rem = new Float32Array(n); v.typ = new Uint8Array(n); v.stent = new Uint8Array(n);
      v.lcomp = new Uint8Array(n).fill(C_LEFT); v.spot = new Uint8Array(n);
      for (let i = 0; i < n; i++) v.rad[i] = (v.r0 + (v.r1 - v.r0) * Math.pow(i / (n - 1), 0.8)) * gtn;
      v.lesions = (cs.lesions || []).filter((l) => l.v === v.id);
      for (const L of v.lesions) {
        const c = L.at * v.len, h = L.len / 2;
        L.s = c;
        for (let i = 0; i < n; i++) {
          const s = i * 0.5;
          if (Math.abs(s - c) >= h) continue;
          const b = L.type === 'occl' ? sstep(h, h - 2.5, Math.abs(s - c)) : Math.cos(((s - c) / h) * Math.PI * 0.5) ** 2;
          const Dv = L.sten * b;
          if (Dv >= v.D[i]) {
            v.D[i] = Dv; v.bmp[i] = b; v.ecc[i] = L.ecc ?? 0.5; v.ang[i] = (L.ang ?? 0) * DEG;
            v.rem[i] = L.rem ?? (L.type === 'calc' ? 0.12 : 0.22); v.typ[i] = TYP[L.type];
            if (L.type === 'hrp' && Math.abs(s - c) < 2) v.spot[i] = 1;
          }
        }
        if (L.type === 'occl') for (let i = 0; i < n; i++) if (i * 0.5 > c + h - 1) v.lcomp[i] = C_COLL;
      }
      for (const st of cs.stents || []) if (st.v === v.id) for (let i = 0; i < n; i++) { const s = i * 0.5; if (s >= st.from * v.len && s <= st.to * v.len) v.stent[i] = 1; }
    }
    // branches distal to an occlusion fill late through collaterals
    for (const v of VLIST) {
      if (!v.parent) continue;
      const p = VES[v.parent];
      if (p.lcomp[Math.min(v.bi, p.n - 1)] === C_COLL) v.lcomp.fill(C_COLL);
    }
  }

  // Cross-section model of one coronary sample. rho, th in the vessel frame. Writes XS.
  const XS = { wl: 0, wo: 0, ph: 0, lc: 1, ws: 0, rl: 0, ro: 0 };
  function xsec(v, i, rho, th, edge) {
    const r = v.rad[i], D = v.D[i], typ = v.typ[i];
    XS.lc = v.lcomp[i]; XS.ws = 0;
    let rl = r, ro = r + 0.15, cx = 0, cy = 0, ph = 40;
    if (D > 0.002 || typ) {
      const b = v.bmp[i];
      if (typ === TYP.slit) {
        // elliptical, compressed ostium: no plaque
        const ca = Math.cos(v.ang[i]), sa = Math.sin(v.ang[i]);
        const px = rho * Math.cos(th), py = rho * Math.sin(th);
        const pa = (px * ca + py * sa) / (1 - D), pb = -px * sa + py * ca;
        const dl = hyp(pa, pb) * (1 - D * 0.5);
        XS.wl = clamp(0.5 + (r - dl) / edge, 0, 1); XS.wo = XS.wl; XS.ph = 40; XS.rl = r * (1 - D); XS.ro = r;
        return;
      }
      rl = r * (1 - D);
      ro = r * (1 + v.rem[i] * b) + 0.25 * b * r + 0.15;
      if (typ === TYP.calc) { rl = Math.max(0, rl - 0.35 * b); ro += 0.3 * b; }
      const off = (ro - 0.15 - rl) * v.ecc[i] * 0.8;
      cx = -off * Math.cos(v.ang[i]); cy = -off * Math.sin(v.ang[i]);
      // plaque attenuation
      let dth = Math.abs(th - v.ang[i]) % (2 * Math.PI); if (dth > Math.PI) dth = 2 * Math.PI - dth;
      switch (typ) {
        case TYP.soft: ph = 48; break;
        case TYP.fibrous: ph = 95; break;
        case TYP.calc: ph = 980; break;
        case TYP.mixed: ph = dth < 0.75 && rho > (rl + ro) * 0.5 ? 880 : 62; break;
        case TYP.hrp: ph = rho > ro - 0.5 ? 78 : 18; if (v.spot[i] && dth < 0.45 && rho > ro - 0.95) ph = 760; break;
        case TYP.occl: ph = dth < 0.5 && rho > ro - 0.8 ? 640 : 38; break;
        default: ph = 45;
      }
    }
    const px = rho * Math.cos(th) - cx, py = rho * Math.sin(th) - cy;
    const dl = hyp(px, py);
    XS.wl = rl <= 0.01 ? 0 : clamp(0.5 + (rl - dl) / edge, 0, 1);
    XS.wo = clamp(0.5 + (ro - rho) / edge, 0, 1);
    XS.ph = ph; XS.rl = rl; XS.ro = ro;
    if (v.stent[i]) {
      const zz = i * 0.5;
      const a1 = frac(th / (2 * Math.PI) * 8 + zz / 2.6), a2 = frac(th / (2 * Math.PI) * 8 - zz / 2.6);
      const onStrut = Math.min(a1, 1 - a1, a2, 1 - a2) < 0.14;
      const band = 1 - clamp(Math.abs(rho - r) / (edge * 1.2 + 0.25), 0, 1);
      XS.ws = onStrut ? band : band * 0.45;
      XS.wo = Math.max(XS.wo, XS.ws);
    }
  }

  function stampCoronaries() {
    BEST.fill(255);
    for (const v of VLIST) {
      for (let i = 0; i < v.n; i++) {
        const p = v.pts[i], T = v.T[i], N = v.N[i], Bn = v.Bn[i];
        const Rb = v.rad[i] * 1.6 + 1.4;
        const i0 = Math.max(0, Math.floor((p[0] - Rb - X0) / DX)), i1 = Math.min(NX - 1, Math.ceil((p[0] + Rb - X0) / DX));
        const j0 = Math.max(0, Math.floor((p[1] - Rb - Y0) / DX)), j1 = Math.min(NY - 1, Math.ceil((p[1] + Rb - Y0) / DX));
        const k0 = Math.max(0, Math.floor((p[2] - Rb - Z0) / DZ)), k1 = Math.min(NZ - 1, Math.ceil((p[2] + Rb - Z0) / DZ));
        for (let k = k0; k <= k1; k++) {
          const dz = Z0 + (k + 0.5) * DZ - p[2];
          for (let j = j0; j <= j1; j++) {
            const dy = Y0 + (j + 0.5) * DX - p[1];
            for (let ii = i0; ii <= i1; ii++) {
              const dx = X0 + (ii + 0.5) * DX - p[0];
              const d2 = dx * dx + dy * dy + dz * dz;
              if (d2 > Rb * Rb) continue;
              const enc = Math.min(254, (d2 * 10) | 0);
              const o = (k * NY + j) * NX + ii;
              if (enc >= BEST[o]) continue;
              BEST[o] = enc;
              const al = dx * T[0] + dy * T[1] + dz * T[2];
              const qx = dx * N[0] + dy * N[1] + dz * N[2], qy = dx * Bn[0] + dy * Bn[1] + dz * Bn[2];
              if (Math.abs(al) > 0.9) continue;
              xsec(v, i, hyp(qx, qy), Math.atan2(qy, qx), 0.9);
              const old = baseHU[o];
              if (XS.ws > 0.35) { HU[o] = Math.round(lerp(old, 1500, XS.ws)); TAG[o] = tg(L_COR, 0); }
              else if (XS.wl >= 0.55) { HU[o] = 43; TAG[o] = tg(L_COR, XS.lc); }
              else if (XS.wl >= 0.2) { HU[o] = Math.round(lerp(XS.wo > 0.5 ? XS.ph : old, 43, 0.5)); TAG[o] = tg(L_COR, XS.lc === C_LEFT ? C_HALF : XS.lc); }
              else if (XS.wo >= 0.5) { HU[o] = Math.round(XS.ph); TAG[o] = tg(L_COR, 0); }
              else if (XS.wo > 0.05) { HU[o] = Math.round(lerp(old, XS.ph, XS.wo)); }
            }
          }
        }
      }
    }
  }

  // old inferior infarct: thin, non-enhancing subendocardium
  function applyInfarct() {
    for (let k = 0; k < NZ; k++) for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const o = (k * NY + j) * NX + i;
      if (TAG[o] !== tg(L_HEART, C_MYO)) continue;
      const h = toH([X0 + (i + 0.5) * DX, Y0 + (j + 0.5) * DX, Z0 + (k + 0.5) * DZ]);
      if (h[0] < 14 || h[0] > 72) continue;
      const ph = Math.atan2(h[2], h[1]) / DEG;
      if (ph > -128 && ph < -52) {
        const rho = hyp(h[1], h[2]), rn = Rendo(h[0]), re = Repi(h[0]);
        if (rho < rn + (re - rn) * 0.55) { HU[o] = 12; TAG[o] = tg(L_HEART, 0); }
      }
    }
  }

  // ───────────────────────── cases ─────────────────────────
  const CASES = [
    {
      id: 'normal', title: 'Normal coronaries', pt: '44 F', hr: 64, bmi: 24, circ: 14, rhythm: 'sinus',
      hx: 'Atypical chest pain, intermediate pre-test probability, normal ECG. CCTA to rule out coronary disease.',
      lesions: [], teach: ['A clean CCTA with CAC 0 has a very high negative predictive value: CAD-RADS 0, no further testing needed.', 'Check every segment, including the distal vessels and branches, before calling it normal.'],
    },
    {
      id: 'lad-soft', title: 'Proximal LAD non-calcified plaque', pt: '54 M', hr: 72, bmi: 27, circ: 14, rhythm: 'sinus',
      hx: 'Smoker, typical exertional angina for 6 weeks, borderline exercise ECG.',
      lesions: [{ v: 'LAD', at: 0.13, len: 13, sten: 0.76, type: 'soft', ecc: 0.75, ang: 40 }],
      teach: ['Calcium score is 0, yet there is a severe non-calcified stenosis: CAC 0 does not exclude obstructive disease in a symptomatic patient.', '70–99% in one vessel is CAD-RADS 4A: invasive angiography or functional testing is suggested.', 'Rotate the CPR: the eccentric plaque looks milder in some planes.'],
    },
    {
      id: 'calcified', title: 'Heavy calcification, multivessel', pt: '71 M', hr: 66, bmi: 29, circ: 16, rhythm: 'sinus',
      hx: 'Type 2 diabetes, hypertension, dyspnoea on exertion. Referred for CCTA.',
      lesions: [
        { v: 'RCA', at: 0.33, len: 16, sten: 0.6, type: 'calc', ecc: 0.7, ang: 120 },
        { v: 'RCA', at: 0.62, len: 9, sten: 0.3, type: 'calc', ecc: 0.8, ang: -60 },
        { v: 'LAD', at: 0.22, len: 12, sten: 0.38, type: 'calc', ecc: 0.85, ang: 160 },
        { v: 'LAD', at: 0.48, len: 7, sten: 0.22, type: 'mixed', ecc: 0.6, ang: 30 },
        { v: 'LCX', at: 0.3, len: 9, sten: 0.2, type: 'calc', ecc: 0.9, ang: 90 },
        { v: 'LM', at: 0.55, len: 5, sten: 0.15, type: 'calc', ecc: 0.9, ang: -90 },
      ],
      teach: ['Blooming makes dense calcium look bigger than it is and overestimates stenosis. Use a wide window (1500/450) and grade carefully.', 'The highest grade is a 50–69% RCA lesion: CAD-RADS 3, with plaque burden from the calcium score.', 'Heavy calcium (high CAC) lowers the specificity of CCTA; functional testing is often the next step.'],
    },
    {
      id: 'hrp', title: 'High-risk plaque, proximal LAD', pt: '49 M', hr: 61, bmi: 26, circ: 13, rhythm: 'sinus',
      hx: 'Family history of premature CAD, LDL 5.1 mmol/l, two episodes of rest chest pain.',
      lesions: [{ v: 'LAD', at: 0.16, len: 16, sten: 0.58, type: 'hrp', ecc: 0.7, ang: -30, rem: 0.5 }],
      teach: ['High-risk plaque features: positive remodelling (index ≥1.1), low attenuation (<30 HU), spotty calcium and the napkin-ring sign. Two or more = HRP.', 'A 50–69% stenosis with HRP is CAD-RADS 3/HRP. The plaque, not just the stenosis, drives the risk.'],
    },
    {
      id: 'cto', title: 'RCA chronic total occlusion', pt: '63 M', hr: 60, bmi: 28, circ: 15, rhythm: 'sinus', infarct: true,
      hx: 'Old inferior MI (Q waves in III, aVF), now class II angina.',
      lesions: [
        { v: 'RCA', at: 0.42, len: 14, sten: 1, type: 'occl', ecc: 0.3, ang: 60 },
        { v: 'LAD', at: 0.3, len: 10, sten: 0.35, type: 'mixed', ecc: 0.7, ang: 100 },
      ],
      teach: ['A segment with no contrast and faint distal filling (via collaterals) is a total occlusion: CAD-RADS 5.', 'Look at the inferior wall: the thin, low-attenuation subendocardium is an old infarct in the RCA territory.', 'Report occlusion length, calcium in the occluded segment and the distal vessel: these guide CTO PCI planning.'],
    },
    {
      id: 'bridge', title: 'Myocardial bridge, mid LAD', pt: '38 M', hr: 58, bmi: 23, circ: 13, rhythm: 'sinus',
      hx: 'Athletic, chest tightness during sprinting, normal resting ECG.',
      lesions: [], bridges: [{ v: 'LAD', at: 0.45, len: 22, depth: 3.4 }],
      teach: ['The mid LAD dives into the myocardium for about 2 cm: a myocardial bridge. Look for myocardium on top of the artery in the CPR and cross-section.', 'Bridges are common and usually benign. They are described but not given a stenosis grade: CAD-RADS 0 here.', 'Deep, long bridges can cause systolic compression; image in diastole and mention depth and length.'],
    },
    {
      id: 'anomalous', title: 'Anomalous RCA from the left sinus', pt: '26 M', hr: 56, bmi: 22, circ: 12, rhythm: 'sinus', anomaly: 'rca-left',
      hx: 'Footballer with exertional syncope. Echo normal. CCTA for coronary anatomy.',
      lesions: [{ v: 'RCA', at: 0.03, len: 9, sten: 0.5, type: 'slit', ang: 90 }],
      teach: ['The RCA arises from the left coronary sinus and runs between the aorta and the pulmonary artery (inter-arterial course), with a slit-like ostium.', 'An inter-arterial course with an intramural, slit-like origin is the high-risk form, linked to sudden death in young athletes.', 'No atherosclerosis: CAD-RADS 0 with the E modifier (exception: coronary anomaly).'],
    },
    {
      id: 'stent', title: 'Patent LAD stent', pt: '66 M', hr: 61, bmi: 27, circ: 15, rhythm: 'sinus',
      hx: 'PCI to the proximal LAD 3 years ago. New atypical chest pain.',
      lesions: [{ v: 'LCX', at: 0.5, len: 9, sten: 0.36, type: 'soft', ecc: 0.7, ang: 0 }],
      stents: [{ v: 'LAD', from: 0.08, to: 0.27 }],
      teach: ['Stent struts bloom. Use the wide window: contrast in the stent lumen with no dark rim means it is patent.', 'Native disease is graded as usual (25–49% LCx here = CAD-RADS 2), with the S modifier for the stent.', 'Stents of 3 mm or more are assessable on modern scanners; small stents often are not.'],
    },
    {
      id: 'lm', title: 'Left main disease', pt: '68 F', hr: 64, bmi: 25, circ: 16, rhythm: 'sinus',
      hx: 'Progressive exertional dyspnoea and angina, hypertension, dyslipidaemia.',
      lesions: [
        { v: 'LM', at: 0.62, len: 6, sten: 0.6, type: 'mixed', ecc: 0.6, ang: 70 },
        { v: 'LAD', at: 0.09, len: 9, sten: 0.42, type: 'calc', ecc: 0.85, ang: -120 },
      ],
      teach: ['Left main stenosis of 50% or more is CAD-RADS 4B, whatever the rest of the tree shows. It needs invasive assessment.', 'The LM is short: scroll the cross-section from the ostium to the bifurcation.'],
    },
    {
      id: 'tachy', title: 'Fast heart rate, ectopics', pt: '58 F', hr: 84, bmi: 31, circ: 14, rhythm: 'ectopy',
      hx: 'Anxious, palpitations, frequent ventricular ectopics. Typical angina. Plan the scan to beat the motion.',
      lesions: [{ v: 'RCA', at: 0.5, len: 10, sten: 0.45, type: 'soft', ecc: 0.6, ang: 200 }],
      teach: ['At high heart rates diastasis disappears: give a beta-blocker, use end-systole (35–45%) or a faster scanner.', 'Ectopic beats in step-and-shoot mode cause misregistration (stair-step) artefacts; a single-beat wide-detector scan avoids them.', 'If motion makes a segment unreadable, say so: CAD-RADS N or the segment is non-diagnostic.'],
    },
  ];
  const GROUPS = ['LM', 'LAD', 'LCX', 'RCA'];
  const GROUP_NAME = { LM: 'Left main', LAD: 'LAD', LCX: 'LCx', RCA: 'RCA' };
  const GRADES = ['0% — none', '1–24% minimal', '25–49% mild', '50–69% moderate', '70–99% severe', '100% occluded'];
  const gradeOf = (s) => (s <= 0 ? 0 : s < 0.25 ? 1 : s < 0.5 ? 2 : s < 0.7 ? 3 : s < 1 ? 4 : 5);

  function answerKey(cs, cacTotal) {
    const g = { LM: 0, LAD: 0, LCX: 0, RCA: 0 };
    let hrp = false;
    for (const L of cs.lesions || []) {
      if (L.type === 'slit') continue;
      const grp = VSPEC[L.v].group;
      g[grp] = Math.max(g[grp], gradeOf(L.sten));
      if (L.type === 'hrp') hrp = true;
    }
    const max = Math.max(...Object.values(g));
    let cr = String(max);
    if (max === 4) cr = '4A';
    if (g.LM >= 3 || (g.LAD >= 4 && g.LCX >= 4 && g.RCA >= 4)) cr = max === 5 ? '5' : '4B';
    const mods = [];
    if (hrp) mods.push('HRP');
    if ((cs.stents || []).length) mods.push('S');
    if (cs.anomaly) mods.push('E');
    const P = cacTotal <= 0 ? '' : cacTotal <= 100 ? 'P1' : cacTotal <= 300 ? 'P2' : cacTotal < 1000 ? 'P3' : 'P4';
    return { g, cr, mods, P };
  }

  // ───────────────────────── state ─────────────────────────
  const SCANNERS = { ds: { name: 'Dual-source', tr: 66, cov: 58 }, wide: { name: '256-row', tr: 135, cov: 160 }, s64: { name: '64-slice', tr: 165, cov: 38 } };
  const S = {
    caseIdx: 0, cs: CASES[0], meto: 0, gtn: true, scanner: 'wide', kv: 100, mas: 250, gating: 'pro', phase: 75, pad: 5,
    range: [-58, 50], step: 'plan', scanDone: false, cacDone: false,
    bolus: { rate: 5, vol: 60, conc: 350, chaser: true, thr: 150, delay: 6, roi: [-18, -21], z: 50, t: 0, running: false, trig: null, tScan: null, curve: [] },
    scan: null, cac: null, cacUser: {}, art: 'LAD',
    read: { wl: [800, 250], slab: 0, track: 'LAD', alpha: 0, cur: 40, vr: 'heart', yaw: -35, pitch: 18, zoomVr: 1, mpr: 'cor', recon: 75, zoom: 1 },
    cp: [0, -20, 10],
  };
  const hrNow = () => Math.max(50, S.cs.hr - 7 * S.meto + (S.gtn ? 3 : 0));
  const RR = () => 60000 / hrNow();

  // ───────────────────────── motion model ─────────────────────────
  // Coronary velocity is low in end-systole (~330 ms after R) and in diastasis, which shrinks as heart rate rises.
  function velAt(t, rr) {
    t = ((t % rr) + rr) % rr;
    const sys = 1 - sstep(30, 75, Math.abs(t - 330));
    const dia = sstep(560, 620, t) * (1 - sstep(rr - 190, rr - 120, t));
    return 1 - Math.max(sys, dia);
  }
  function blurFor(phasePct) {
    const rr = RR(), tr = SCANNERS[S.scanner].tr, tc = (phasePct / 100) * rr;
    let m = 0;
    for (let k = 0; k <= 10; k++) m += velAt(tc + (k / 10 - 0.5) * tr, rr);
    m /= 11;
    let extra = 0;
    if (S.gating === 'flash' && hrNow() > 65) extra = (hrNow() - 65) * 0.12;
    const f = (tr / 1000) * m;
    return { R: Math.min(5, 75 * f + extra), C: Math.min(5, 52 * f + extra * 0.7), A: Math.min(5, 38 * f + extra * 0.5) };
  }
  const motionGrade = (b) => (b < 0.5 ? 'none' : b < 1.2 ? 'mild' : b < 2.5 ? 'moderate' : 'severe');

  const GX = 50, GY = 50, GZ = 35, GN = GX * GY * GZ;
  const GD = { R: new Float32Array(GN), C: new Float32Array(GN), A: new Float32Array(GN) };
  const BLUR = new Float32Array(GN), HW = new Float32Array(GN);
  const MOT = nrm([0.75, -0.45, 0.48]);
  let MIS = null;
  function buildMotionGrid() {
    const pts = { R: [], C: [], A: [] };
    for (const v of VLIST) for (let i = 0; i < v.n; i += 4) pts[v.mg].push(v.pts[i]);
    for (let k = 0; k < GZ; k++) for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
      const x = X0 + (i + 0.5) * 4, y = Y0 + (j + 0.5) * 4, z = Z0 + (k + 0.5) * 4;
      const o = (k * GY + j) * GX + i;
      let dmin = 1e9;
      for (const g of ['R', 'C', 'A']) {
        let m = 1e18;
        for (const p of pts[g]) { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2 + (p[2] - z) ** 2; if (d < m) m = d; }
        GD[g][o] = Math.sqrt(m);
        dmin = Math.min(dmin, GD[g][o]);
      }
      HW[o] = 1 - sstep(22, 40, dmin);
    }
  }
  function updateBlur(phasePct) {
    const b = blurFor(phasePct);
    for (let o = 0; o < GN; o++) {
      const w = HW[o];
      if (w <= 0) { BLUR[o] = 0; continue; }
      BLUR[o] = Math.max(b.R * Math.exp(-GD.R[o] / 13), b.C * Math.exp(-GD.C[o] / 13), b.A * Math.exp(-GD.A[o] / 13), Math.min(b.R, b.C, b.A) * 0.6) * w;
    }
    // ectopic beats in multi-beat acquisitions shift the heart between steps
    const sc = SCANNERS[S.scanner];
    const len = S.range[1] - S.range[0];
    const beats = S.gating === 'pro' ? Math.max(1, Math.ceil(len / (sc.cov * 0.92))) : 1;
    MIS = null;
    if (S.cs.rhythm === 'ectopy' && S.gating === 'pro' && beats > 1) {
      seed = 5;
      MIS = { cov: sc.cov * 0.92, off: Array.from({ length: beats }, (_, i) => (i % 2 ? [2.6 * (rnd() + 0.5), -1.6 * rnd(), 0] : [0, 0, 0])) };
    }
    return b;
  }
  function gridLerp(G, x, y, z) {
    let fx = (x - X0) / 4 - 0.5, fy = (y - Y0) / 4 - 0.5, fz = (z - Z0) / 4 - 0.5;
    fx = clamp(fx, 0, GX - 1.001); fy = clamp(fy, 0, GY - 1.001); fz = clamp(fz, 0, GZ - 1.001);
    const i = fx | 0, j = fy | 0, k = fz | 0, tx = fx - i, ty = fy - j, tz = fz - k;
    const o = (k * GY + j) * GX + i;
    const a = G[o] + (G[o + 1] - G[o]) * tx, b = G[o + GX] + (G[o + GX + 1] - G[o + GX]) * tx;
    const c = G[o + GX * GY] + (G[o + GX * GY + 1] - G[o + GX * GY]) * tx, d = G[o + GX * GY + GX] + (G[o + GX * GY + GX + 1] - G[o + GX * GY + GX]) * tx;
    return lerp(lerp(a, b, ty), lerp(c, d, ty), tz);
  }

  // ───────────────────────── sampling ─────────────────────────
  const NODATA = -5000;
  function tri(x, y, z) {
    let fx = (x - X0) / DX - 0.5, fy = (y - Y0) / DX - 0.5, fz = (z - Z0) / DZ - 0.5;
    if (fx < 0 || fy < 0 || fx >= NX - 1 || fy >= NY - 1) return -1024;
    if (fz < 0) fz = 0; else if (fz >= NZ - 1) fz = NZ - 1.001;
    const i = fx | 0, j = fy | 0, k = fz | 0, tx = fx - i, ty = fy - j, tz = fz - k;
    const o = (k * NY + j) * NX + i, o2 = o + NXY;
    const h0 = HU[o] + GA[TAG[o] & 7] + NAMP * NOISE[o], h1 = HU[o + 1] + GA[TAG[o + 1] & 7] + NAMP * NOISE[o + 1];
    const h2 = HU[o + NX] + GA[TAG[o + NX] & 7] + NAMP * NOISE[o + NX], h3 = HU[o + NX + 1] + GA[TAG[o + NX + 1] & 7] + NAMP * NOISE[o + NX + 1];
    const h4 = HU[o2] + GA[TAG[o2] & 7] + NAMP * NOISE[o2], h5 = HU[o2 + 1] + GA[TAG[o2 + 1] & 7] + NAMP * NOISE[o2 + 1];
    const h6 = HU[o2 + NX] + GA[TAG[o2 + NX] & 7] + NAMP * NOISE[o2 + NX], h7 = HU[o2 + NX + 1] + GA[TAG[o2 + NX + 1] & 7] + NAMP * NOISE[o2 + NX + 1];
    const a = h0 + (h1 - h0) * tx, b = h2 + (h3 - h2) * tx, c = h4 + (h5 - h4) * tx, d = h6 + (h7 - h6) * tx;
    const e = a + (b - a) * ty, f = c + (d - c) * ty;
    return e + (f - e) * tz;
  }
  function triNN(x, y, z) {
    let fx = (x - X0) / DX - 0.5, fy = (y - Y0) / DX - 0.5, fz = (z - Z0) / DZ - 0.5;
    if (fx < 0 || fy < 0 || fz < 0 || fx >= NX - 1 || fy >= NY - 1 || fz >= NZ - 1) return -1000;
    const i = fx | 0, j = fy | 0, k = fz | 0, tx = fx - i, ty = fy - j, tz = fz - k;
    const o = (k * NY + j) * NX + i, o2 = o + NXY;
    const h0 = HU[o] + GA[TAG[o] & 7], h1 = HU[o + 1] + GA[TAG[o + 1] & 7], h2 = HU[o + NX] + GA[TAG[o + NX] & 7], h3 = HU[o + NX + 1] + GA[TAG[o + NX + 1] & 7];
    const h4 = HU[o2] + GA[TAG[o2] & 7], h5 = HU[o2 + 1] + GA[TAG[o2 + 1] & 7], h6 = HU[o2 + NX] + GA[TAG[o2 + NX] & 7], h7 = HU[o2 + NX + 1] + GA[TAG[o2 + NX + 1] & 7];
    const a = h0 + (h1 - h0) * tx, b = h2 + (h3 - h2) * tx, c = h4 + (h5 - h4) * tx, d = h6 + (h7 - h6) * tx;
    const e = a + (b - a) * ty, f = c + (d - c) * ty;
    return e + (f - e) * tz;
  }
  function noiseAt(x, y, z) {
    let fx = (x - X0) / DX - 0.5, fy = (y - Y0) / DX - 0.5, fz = (z - Z0) / DZ - 0.5;
    fx = clamp(fx, 0, NX - 1.001); fy = clamp(fy, 0, NY - 1.001); fz = clamp(fz, 0, NZ - 1.001);
    const i = fx | 0, j = fy | 0, k = fz | 0, tx = fx - i, ty = fy - j, tz = fz - k;
    const o = (k * NY + j) * NX + i, o2 = o + NXY, N = NOISE;
    const a = N[o] + (N[o + 1] - N[o]) * tx, b = N[o + NX] + (N[o + NX + 1] - N[o + NX]) * tx;
    const c = N[o2] + (N[o2 + 1] - N[o2]) * tx, d = N[o2 + NX] + (N[o2 + NX + 1] - N[o2 + NX]) * tx;
    const e = a + (b - a) * ty, f = c + (d - c) * ty;
    return NAMP * (e + (f - e) * tz) * 1.35;
  }
  let USE_MOTION = false, USE_RANGE = true;
  function sampleScan(x, y, z) {
    if (USE_RANGE && (z < S.range[0] || z > S.range[1])) return NODATA;
    if (!USE_MOTION) return tri(x, y, z);
    if (MIS) {
      const band = clamp(Math.floor((S.range[1] - z) / MIS.cov), 0, MIS.off.length - 1);
      const w = gridLerp(HW, x, y, z), o = MIS.off[band];
      x += o[0] * w; y += o[1] * w;
    }
    const b = gridLerp(BLUR, x, y, z);
    if (b < 0.3) return tri(x, y, z);
    const h = b * 0.5, dx = MOT[0] * h, dy = MOT[1] * h, dz = MOT[2] * h;
    let v = 0.5 * tri(x, y, z) + 0.25 * tri(x - dx, y - dy, z - dz) + 0.25 * tri(x + dx, y + dy, z + dz);
    if (b > 1.8) v = 0.78 * v + 0.22 * tri(x + MOT[0] * b * 1.3, y + MOT[1] * b * 1.3, z + MOT[2] * b * 1.3);
    return v;
  }

  // ───────────────────────── contrast and dose physics ─────────────────────────
  const KVC = { 80: 1.5, 100: 1.22, 120: 1 }, KVN = { 80: 1.75, 100: 1.3, 120: 1 };
  function enh(t) {
    const b = S.bolus, cs = S.cs;
    const P = 68 * b.rate * (b.conc / 350) * Math.pow(25 / cs.bmi, 0.6);
    const Ti = b.vol / b.rate, t0 = cs.circ, tr0 = t0 - 6;
    const eA = P * sstep(t0, t0 + 7, t) * (1 - 0.75 * sstep(t0 + Ti + 1, t0 + Ti + 8, t));
    const eR = 1.15 * P * sstep(tr0, tr0 + 4, t) * (1 - (b.chaser ? 0.8 : 0.4) * sstep(tr0 + Ti, tr0 + Ti + 4, t));
    const eS = 2.6 * P * sstep(2, 4, t) * (1 - (b.chaser ? 0.95 : 0.5) * sstep(Ti, Ti + 3, t));
    const eM = 0.2 * P * sstep(t0 + 2, t0 + 9, t) * (1 - 0.6 * sstep(t0 + Ti + 3, t0 + Ti + 12, t));
    const eL = 0.12 * P * sstep(t0 + 4, t0 + 16, t);
    return { eA, eR, eS, eM, eL };
  }
  function setGains(e, kvc) {
    GA[C_NONE] = 0; GA[C_LEFT] = e.eA * kvc; GA[C_RIGHT] = e.eR * kvc; GA[C_MYO] = e.eM * kvc; GA[C_COLL] = e.eA * 0.5 * kvc;
    GA[C_SVC] = e.eS * kvc; GA[C_HALF] = e.eA * 0.5 * kvc; GA[C_ABD] = e.eL * kvc;
  }
  function noiseSigma(kv, mas) { return 24 * Math.sqrt(250 / mas) * KVN[kv] * Math.pow(S.cs.bmi / 25, 1.4); }
  function doseEst() {
    const sc = SCANNERS[S.scanner], kf = Math.pow(S.kv / 120, 2.6);
    let ctdi = 6.5 * (S.mas / 100) * kf;
    if (S.gating === 'pro') ctdi *= 1 + S.pad / 12;
    else if (S.gating === 'retro') ctdi *= 3.2;
    else ctdi *= 0.55;
    const L = (S.range[1] - S.range[0]) / 10;
    const beats = S.gating === 'pro' ? Math.max(1, Math.ceil((L * 10) / (sc.cov * 0.92))) : 1;
    const dlp = ctdi * L * (beats > 1 ? 1.08 : 1);
    return { ctdi, dlp, msv: dlp * 0.026, beats, L };
  }

  // ───────────────────────── viewport helper ─────────────────────────
  class VP {
    constructor(id) {
      this.el = $('#' + id); this.cv = $('canvas', this.el); this.ctx = this.cv.getContext('2d');
      this.off = document.createElement('canvas'); this.octx = this.off.getContext('2d'); this.data = null;
      this.dpr = 1; this.fit = { x: 0, y: 0, s: 1 };
    }
    resize() {
      const r = this.el.getBoundingClientRect();
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(2, Math.round(r.width * this.dpr)), h = Math.max(2, Math.round(r.height * this.dpr));
      if (w !== this.cv.width || h !== this.cv.height) { this.cv.width = w; this.cv.height = h; return true; }
      return false;
    }
    get W() { return this.cv.width; }
    get H() { return this.cv.height; }
    img(c, r) {
      if (!this.data || this.off.width !== c || this.off.height !== r) { this.off.width = c; this.off.height = r; this.data = this.octx.createImageData(c, r); }
      return this.data;
    }
    layout(wmm, hmm, pad = 0) { const s = Math.min((this.W - pad * 2) / wmm, (this.H - pad * 2) / hmm); this.fit = { x: (this.W - wmm * s) / 2, y: (this.H - hmm * s) / 2, s }; return this.fit; }
    blit(wmm, hmm) {
      this.layout(wmm, hmm);
      const { x, y, s } = this.fit, c = this.ctx;
      this.octx.putImageData(this.data, 0, 0);
      c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, this.W, this.H);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(this.off, x, y, wmm * s, hmm * s);
    }
    toMM(ev) { const r = this.cv.getBoundingClientRect(); const px = (ev.clientX - r.left) * this.dpr, py = (ev.clientY - r.top) * this.dpr; return [(px - this.fit.x) / this.fit.s, (py - this.fit.y) / this.fit.s]; }
    fromMM(u, v) { return [this.fit.x + u * this.fit.s, this.fit.y + v * this.fit.s]; }
  }
  const gray = (h, W, L) => { const g = ((h - (L - W / 2)) / W) * 255; return g < 0 ? 0 : g > 255 ? 255 : g; };

  // sample spacing so the image is about one sample per screen pixel
  function gridFor(vp, wmm, hmm, maxPx = 560, minMM = 0.28) {
    const s = Math.min(vp.W / wmm, vp.H / hmm);
    const sp = Math.max(minMM, 1 / s, Math.max(wmm, hmm) / maxPx);
    return { sp, c: Math.max(8, Math.round(wmm / sp)), r: Math.max(8, Math.round(hmm / sp)) };
  }

  // ───────────────────────── MPR views ─────────────────────────
  // Plane geometry for axial / coronal / sagittal with zoom around the crosshair.
  function planeOf(orient, zoom) {
    const full = orient === 'ax' ? [FOV, FOV] : [FOV, ZLEN];
    const w = full[0] / zoom, h = full[1] / zoom;
    const cp = S.cp;
    const cu = orient === 'sag' ? cp[1] - Y0 : cp[0] - X0;
    const cv = orient === 'ax' ? cp[1] - Y0 : ZTOP - cp[2];
    const u0 = zoom === 1 ? 0 : clamp(cu - w / 2, 0, full[0] - w), v0 = zoom === 1 ? 0 : clamp(cv - h / 2, 0, full[1] - h);
    return { w, h, u0, v0 };
  }
  function planePt(orient, u, v) {
    if (orient === 'ax') return [X0 + u, Y0 + v, S.cp[2]];
    if (orient === 'cor') return [X0 + u, S.cp[1], ZTOP - v];
    return [S.cp[0], Y0 + u, ZTOP - v];
  }
  const NORMAL = { ax: [0, 0, 1], cor: [0, 1, 0], sag: [1, 0, 0] };

  function renderMPR(vp, orient, opts = {}) {
    const zoom = opts.zoom ?? S.read.zoom;
    const pl = planeOf(orient, zoom);
    const g = gridFor(vp, pl.w, pl.h, opts.maxPx || 560);
    const id = vp.img(g.c, g.r), d = id.data;
    const [W, L] = opts.wl || S.read.wl;
    const slab = opts.slab ?? S.read.slab, nn = NORMAL[orient];
    const ns = slab > 0 ? Math.max(2, Math.round(slab / 0.8)) : 1;
    for (let r = 0; r < g.r; r++) {
      const v = pl.v0 + (r + 0.5) * (pl.h / g.r);
      for (let c = 0; c < g.c; c++) {
        const u = pl.u0 + (c + 0.5) * (pl.w / g.c);
        const p = planePt(orient, u, v);
        let h;
        if (ns === 1) h = sampleScan(p[0], p[1], p[2]);
        else {
          h = -1e9;
          for (let s = 0; s < ns; s++) { const o = (s / (ns - 1) - 0.5) * slab; const q = sampleScan(p[0] + nn[0] * o, p[1] + nn[1] * o, p[2] + nn[2] * o); if (q > h) h = q; }
        }
        const k = (r * g.c + c) * 4;
        if (h === NODATA) { d[k] = 6; d[k + 1] = 8; d[k + 2] = 22; }
        else { const gg = gray(h, W, L); d[k] = d[k + 1] = d[k + 2] = gg; }
        d[k + 3] = 255;
      }
    }
    vp.blit(pl.w, pl.h);
    vp.plane = { orient, ...pl };
    return pl;
  }
  // map a world point to the view's canvas coordinates
  function worldToView(vp, p) {
    const pl = vp.plane;
    if (!pl) return null;
    let u, v;
    if (pl.orient === 'ax') { u = p[0] - X0; v = p[1] - Y0; }
    else if (pl.orient === 'cor') { u = p[0] - X0; v = ZTOP - p[2]; }
    else { u = p[1] - Y0; v = ZTOP - p[2]; }
    return vp.fromMM(u - pl.u0, v - pl.v0);
  }
  function viewToWorld(vp, ev) {
    const pl = vp.plane, m = vp.toMM(ev);
    const u = m[0] + pl.u0, v = m[1] + pl.v0;
    const p = planePt(pl.orient, u, v);
    p[0] = clamp(p[0], X0 + 1, X0 + FOV - 1); p[1] = clamp(p[1], Y0 + 1, Y0 + FOV - 1); p[2] = clamp(p[2], Z0 + 1, ZTOP - 1);
    return p;
  }
  function drawCross(vp, colorH = 'rgba(245,179,1,.55)', colorV = 'rgba(111,179,255,.55)') {
    const q = worldToView(vp, S.cp);
    if (!q) return;
    const c = vp.ctx, gap = 14 * vp.dpr;
    c.lineWidth = 1 * vp.dpr;
    c.strokeStyle = colorH; c.beginPath(); c.moveTo(0, q[1]); c.lineTo(q[0] - gap, q[1]); c.moveTo(q[0] + gap, q[1]); c.lineTo(vp.W, q[1]); c.stroke();
    c.strokeStyle = colorV; c.beginPath(); c.moveTo(q[0], 0); c.lineTo(q[0], q[1] - gap); c.moveTo(q[0], q[1] + gap); c.lineTo(q[0], vp.H); c.stroke();
  }
  function orientLabels(vp, o) {
    const c = vp.ctx, f = vp.fit, pl = vp.plane;
    c.font = `${11 * vp.dpr}px "IBM Plex Mono", monospace`; c.fillStyle = 'rgba(207,214,238,.7)'; c.textAlign = 'center';
    const L = o === 'ax' ? ['A', 'P', 'R', 'L'] : o === 'cor' ? ['S', 'I', 'R', 'L'] : ['S', 'I', 'A', 'P'];
    const x0 = f.x, x1 = f.x + pl.w * f.s, y0 = f.y, y1 = f.y + pl.h * f.s;
    c.fillText(L[0], (x0 + x1) / 2, y0 + 14 * vp.dpr); c.fillText(L[1], (x0 + x1) / 2, y1 - 6 * vp.dpr);
    c.textAlign = 'left'; c.fillText(L[2], x0 + 4 * vp.dpr, (y0 + y1) / 2); c.textAlign = 'right'; c.fillText(L[3], x1 - 4 * vp.dpr, (y0 + y1) / 2);
    c.textAlign = 'left';
  }

  // ───────────────────────── 3D rendering ─────────────────────────
  const VRBOX = [-72, 98, -88, 66, -80, 64];
  const VR_CENTER = [10, -20, -2];
  function camera() {
    const y = S.read.yaw * DEG, p = S.read.pitch * DEG;
    const dir = [Math.sin(y) * Math.cos(p), Math.cos(y) * Math.cos(p), -Math.sin(p)];
    const right = [Math.cos(y), -Math.sin(y), 0];
    const up = cross(right, dir);
    return { dir, right, up, ext: 82 / S.read.zoomVr };
  }
  let vrCache = null;
  function renderVR(vp, fast) {
    const cam = camera(), mode = S.read.vr;
    const asp = vp.W / vp.H;
    const res = fast ? 150 : 300;
    const cols = asp >= 1 ? Math.round(res * asp) : res, rows = asp >= 1 ? res : Math.round(res / asp);
    const id = vp.img(cols, rows), d = id.data;
    const ex = cam.ext * (asp >= 1 ? asp : 1), ey = cam.ext * (asp >= 1 ? 1 : 1 / asp);
    const mask = new Uint8Array(8);
    if (mode === 'tree') { mask[L_COR] = 1; mask[L_AORTA] = 1; } else { mask[L_HEART] = 1; mask[L_COR] = 1; mask[L_AORTA] = 1; }
    // thresholds halfway between fat and enhanced tissue give smooth surfaces
    const thr = mode === 'tree' ? 190 : 20;
    const step = fast ? 1.1 : 0.7;
    const { dir, right, up } = cam;
    const light = nrm(add(mul(dir, -1), mul(up, 0.45)));
    const lightR = nrm(add(mul(dir, -0.6), add(mul(right, -0.6), mul(up, 0.3))));
    const rangeLo = S.range[0], rangeHi = S.range[1];
    for (let r = 0; r < rows; r++) {
      const v = ey - ((r + 0.5) / rows) * 2 * ey;
      for (let c = 0; c < cols; c++) {
        const u = ((c + 0.5) / cols) * 2 * ex - ex;
        const o0 = [VR_CENTER[0] + u * right[0] + v * up[0] - 150 * dir[0], VR_CENTER[1] + u * right[1] + v * up[1] - 150 * dir[1], VR_CENTER[2] + u * right[2] + v * up[2] - 150 * dir[2]];
        // ray-box clip
        let t0 = 0, t1 = 300;
        for (let k = 0; k < 3; k++) {
          const lo = VRBOX[2 * k], hi = VRBOX[2 * k + 1];
          if (Math.abs(dir[k]) < 1e-6) { if (o0[k] < lo || o0[k] > hi) { t0 = 1; t1 = 0; } continue; }
          let ta = (lo - o0[k]) / dir[k], tb = (hi - o0[k]) / dir[k];
          if (ta > tb) { const tt = ta; ta = tb; tb = tt; }
          if (ta > t0) t0 = ta; if (tb < t1) t1 = tb;
        }
        const kk = (r * cols + c) * 4;
        let R = 0, G = 0, Bc = 0;
        if (t1 > t0) {
          let mx = -1e9, hit = -1;
          for (let t = t0; t < t1; t += step) {
            const x = o0[0] + dir[0] * t, y = o0[1] + dir[1] * t, z = o0[2] + dir[2] * t;
            if (z < rangeLo || z > rangeHi) continue;
            const i = ((x - X0) / DX) | 0, j = ((y - Y0) / DX) | 0, k = ((z - Z0) / DZ) | 0;
            if (i < 0 || j < 0 || k < 0 || i >= NX || j >= NY || k >= NZ) continue;
            const o = (k * NY + j) * NX + i, tgv = TAG[o];
            if (!mask[tgv >> 3]) continue;
            const h = HU[o] + GA[tgv & 7];
            if (mode === 'mip') { if (h > mx) mx = h; continue; }
            if (h > thr) { hit = t; break; }
          }
          if (mode === 'mip') {
            if (mx > -1e8) { const g = gray(mx, 900, 380); R = G = Bc = g; }
          } else if (hit >= 0) {
            // the coarse hit is on the voxel grid: re-march finely on interpolated values, then bisect
            let a = Math.max(t0, hit - 2.2), b = hit + 1.2;
            for (let t = a; t <= hit + 1.2; t += 0.3) { if (triNN(o0[0] + dir[0] * t, o0[1] + dir[1] * t, o0[2] + dir[2] * t) > thr) { b = t; a = t - 0.3; break; } }
            for (let it = 0; it < 4; it++) { const m = (a + b) / 2; if (triNN(o0[0] + dir[0] * m, o0[1] + dir[1] * m, o0[2] + dir[2] * m) > thr) b = m; else a = m; }
            const x = o0[0] + dir[0] * b, y = o0[1] + dir[1] * b, z = o0[2] + dir[2] * b;
            const e = 1.7;
            let nx = triNN(x - e, y, z) - triNN(x + e, y, z), ny = triNN(x, y - e, z) - triNN(x, y + e, z), nz = triNN(x, y, z - e) - triNN(x, y, z + e);
            const nl = hyp(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
            const inner = triNN(x + dir[0] * 1.3, y + dir[1] * 1.3, z + dir[2] * 1.3);
            const ii = ((x + dir[0] * 0.8 - X0) / DX) | 0, jj = ((y + dir[1] * 0.8 - Y0) / DX) | 0, k2 = ((z + dir[2] * 0.8 - Z0) / DZ) | 0;
            const lab = TAG[(clamp(k2, 0, NZ - 1) * NY + clamp(jj, 0, NY - 1)) * NX + clamp(ii, 0, NX - 1)] >> 3;
            let base;
            if (lab === L_COR || (mode === 'tree' && inner > 200)) base = mode === 'tree' ? [236, 120, 96] : [246, 170, 132];
            else if (lab === L_AORTA) base = [214, 92, 78];
            else if (inner > 240) base = [212, 96, 82];
            else base = [168, 74, 58];
            const lam = Math.max(0, nx * light[0] + ny * light[1] + nz * light[2]);
            const lam2 = Math.max(0, nx * lightR[0] + ny * lightR[1] + nz * lightR[2]);
            const hv = nrm(add(light, mul(dir, -1)));
            const spec = Math.pow(Math.max(0, nx * hv[0] + ny * hv[1] + nz * hv[2]), 28);
            const depth = 1 - clamp((b - t0) / 170, 0, 0.55);
            const sh = (0.22 + 0.65 * lam + 0.22 * lam2) * depth;
            R = clamp(base[0] * sh + 160 * spec, 0, 255); G = clamp(base[1] * sh + 140 * spec, 0, 255); Bc = clamp(base[2] * sh + 130 * spec, 0, 255);
          }
        }
        d[kk] = R; d[kk + 1] = G; d[kk + 2] = Bc; d[kk + 3] = 255;
      }
    }
    vp.octx.putImageData(id, 0, 0);
    const ctx = vp.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, vp.W, vp.H);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(vp.off, 0, 0, vp.W, vp.H);
    vrCache = { cam, ex, ey };
    drawVROverlay(vp);
  }
  function drawVROverlay(vp) {
    if (!vrCache) return;
    const { cam, ex, ey } = vrCache, ctx = vp.ctx;
    const proj = (p) => { const q = sub(p, VR_CENTER); return [((dot(q, cam.right) + ex) / (2 * ex)) * vp.W, ((ey - dot(q, cam.up)) / (2 * ey)) * vp.H]; };
    const tr = TRACK;
    if (tr && S.read.vr !== 'mip') {
      ctx.strokeStyle = 'rgba(245,179,1,.22)'; ctx.lineWidth = 1 * vp.dpr; ctx.beginPath();
      for (let i = 0; i < tr.n; i += 3) { const q = proj(tr.p[i]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }
      ctx.stroke();
    }
    const q = proj(S.cp);
    ctx.strokeStyle = '#f5b301'; ctx.lineWidth = 2 * vp.dpr; ctx.beginPath(); ctx.arc(q[0], q[1], 6 * vp.dpr, 0, Math.PI * 2); ctx.stroke();
  }

  // ───────────────────────── tracks, CPR, cross-section ─────────────────────────
  let TRACK = null;
  function buildTrack(key) {
    const chain = TRACKS[key].chain;
    const parts = [];
    for (let c = 0; c < chain.length; c++) {
      const v = VES[chain[c]];
      const next = VES[chain[c + 1]];
      const i1 = next ? next.bi : v.n - 1;
      const i0 = c === 0 ? 0 : 1;
      parts.push([v, i0, i1]);
    }
    const p = [], tv = [], ti = [];
    for (const [v, i0, i1] of parts) for (let i = i0; i <= i1; i++) { p.push(v.pts[i]); tv.push(v); ti.push(i); }
    const f = frames(p);
    // vessel boundaries for labels
    const marks = [];
    let acc = 0;
    for (const [v, i0, i1] of parts) { marks.push({ s: acc * 0.5, name: v.id }); acc += i1 - i0 + 1; }
    TRACK = { key, n: p.length, p, tv, ti, T: f.T, N: f.N, Bn: f.Bn, len: (p.length - 1) * 0.5, marks };
    S.read.cur = clamp(S.read.cur, 0, TRACK.n - 1);
  }
  // HU at a point near track sample k: volume background blended with the analytic vessel
  function cprHU(k, pt, dirW, rhoSigned, edge) {
    const v = TRACK.tv[k], i = TRACK.ti[k];
    let bg = sampleScan(pt[0], pt[1], pt[2]);
    if (bg === NODATA) return NODATA;
    const rho = Math.abs(rhoSigned);
    if (rho > v.rad[i] * 1.8 + 1.4) return bg;
    const dw = rhoSigned >= 0 ? dirW : mul(dirW, -1);
    const th = Math.atan2(dot(dw, v.Bn[i]), dot(dw, v.N[i]));
    xsec(v, i, rho, th, edge);
    if (XS.wo <= 0.001) return bg;
    const lum = 43 + GA[XS.lc];
    let h = XS.wl * lum + (XS.wo - XS.wl) * XS.ph + (1 - XS.wo) * bg;
    if (XS.wo > 0.3) h += noiseAt(pt[0], pt[1], pt[2]) * 0.8;
    if (XS.ws > 0) h = lerp(h, 1500, XS.ws * 0.85);
    return h;
  }
  function trackDir(k, alpha) {
    const c = Math.cos(alpha), s = Math.sin(alpha);
    const N = TRACK.N[k], Bn = TRACK.Bn[k];
    return [N[0] * c + Bn[0] * s, N[1] * c + Bn[1] * s, N[2] * c + Bn[2] * s];
  }
  function blurAtTrack(k) { const p = TRACK.p[k]; return USE_MOTION ? gridLerp(BLUR, p[0], p[1], p[2]) : 0; }

  let cprGeo = null;
  function renderCPR(vp) {
    const tr = TRACK; if (!tr) return;
    const prof = 64 * vp.dpr;
    const imgH = vp.H - prof;
    const lenmm = tr.len + 4;
    const half = clamp((imgH / vp.W) * lenmm * 0.5, 7, 22);
    const cols = clamp(Math.round(Math.min(vp.W, lenmm / 0.12)), 64, 900);
    const sp = lenmm / cols;
    const rows = clamp(Math.round((2 * half) / sp), 16, 400);
    const id = vp.img(cols, rows), d = id.data;
    const [W, L] = S.read.wl;
    const alpha = S.read.alpha * DEG;
    const col = new Float32Array(rows);
    for (let c = 0; c < cols; c++) {
      const s = (c + 0.5) * sp - 2;
      const k = clamp(Math.round(s / 0.5), 0, tr.n - 1);
      const P = tr.p[k];
      const dw = trackDir(k, alpha);
      const ext = s < 0 || s > tr.len;
      for (let r = 0; r < rows; r++) {
        const u = half - (r + 0.5) * ((2 * half) / rows);
        const pt = [P[0] + dw[0] * u, P[1] + dw[1] * u, P[2] + dw[2] * u];
        col[r] = ext ? sampleScan(pt[0], pt[1], pt[2]) : cprHU(k, pt, dw, u, 0.35);
      }
      // motion: smear along the image vertical
      const b = blurAtTrack(k);
      if (b > 0.3) {
        const rad = Math.max(1, Math.round((b * 0.6) / ((2 * half) / rows)));
        const tmp = col.slice();
        for (let r = 0; r < rows; r++) { let acc = 0, n = 0; for (let q = -rad; q <= rad; q++) { const rr = clamp(r + q, 0, rows - 1); if (tmp[rr] !== NODATA) { acc += tmp[rr]; n++; } } col[r] = n ? acc / n : NODATA; }
      }
      for (let r = 0; r < rows; r++) {
        const kk = (r * cols + c) * 4, h = col[r];
        if (h === NODATA) { d[kk] = 6; d[kk + 1] = 8; d[kk + 2] = 22; } else { const g = gray(h, W, L); d[kk] = d[kk + 1] = d[kk + 2] = g; }
        d[kk + 3] = 255;
      }
    }
    vp.octx.putImageData(id, 0, 0);
    const ctx = vp.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, vp.W, vp.H);
    const sc = Math.min(vp.W / lenmm, imgH / (2 * half));
    const dw = lenmm * sc, dh = 2 * half * sc, ox = (vp.W - dw) / 2, oy = (imgH - dh) / 2;
    ctx.imageSmoothingEnabled = true; ctx.drawImage(vp.off, ox, oy, dw, dh);
    cprGeo = { ox, oy, dw, dh, sc, lenmm, half, imgH, prof };
    drawCPROverlay(vp);
  }
  // apparent lumen diameter (what CT shows, with blooming) and the expected reference diameter
  function lumenAt(v, i) {
    const r = v.rad[i], D = v.D[i], typ = v.typ[i];
    if (v.stent[i]) return { lum: 2 * Math.max(0.2, r - 0.35), ref: 2 * r };
    if (typ === TYP.slit) return { lum: 2 * r * (1 - D), ref: 2 * r };
    let rl = r * (1 - D);
    if (typ === TYP.calc) rl = Math.max(0, rl - 0.35 * v.bmp[i]);
    return { lum: 2 * rl, ref: 2 * r };
  }
  function drawCPROverlay(vp) {
    const g = cprGeo, tr = TRACK, ctx = vp.ctx;
    if (!g) return;
    const sx = (s) => g.ox + (s + 2) * g.sc;
    ctx.font = `${10.5 * vp.dpr}px "IBM Plex Mono", monospace`;
    // segment labels
    ctx.fillStyle = 'rgba(245,179,1,.85)';
    for (const m of tr.marks) { const x = sx(m.s); ctx.fillRect(x, g.oy + g.dh - 5 * vp.dpr, 1 * vp.dpr, 5 * vp.dpr); ctx.fillText(m.name, x + 3 * vp.dpr, g.oy + g.dh - 6 * vp.dpr); }
    // cursor
    const cs = S.read.cur * 0.5, cx = sx(cs);
    ctx.strokeStyle = 'rgba(245,179,1,.9)'; ctx.lineWidth = 1 * vp.dpr; ctx.setLineDash([4 * vp.dpr, 4 * vp.dpr]);
    ctx.beginPath(); ctx.moveTo(cx, g.oy); ctx.lineTo(cx, g.oy + g.dh); ctx.stroke(); ctx.setLineDash([]);
    // lumen profile
    const y0 = g.imgH + 6 * vp.dpr, y1 = vp.H - 12 * vp.dpr;
    ctx.fillStyle = '#060b22'; ctx.fillRect(0, g.imgH, vp.W, g.prof);
    let maxD = 0;
    const L = [], R = [];
    for (let k = 0; k < tr.n; k++) { const a = lumenAt(tr.tv[k], tr.ti[k]); L.push(a.lum); R.push(a.ref); maxD = Math.max(maxD, a.ref); }
    maxD = Math.max(maxD, 3) * 1.1;
    const yy = (dmm) => y1 - (dmm / maxD) * (y1 - y0);
    ctx.strokeStyle = 'rgba(143,156,194,.55)'; ctx.setLineDash([3 * vp.dpr, 3 * vp.dpr]); ctx.beginPath();
    for (let k = 0; k < tr.n; k += 2) { const x = sx(k * 0.5), y = yy(R[k]); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#4fd1a1'; ctx.lineWidth = 1.5 * vp.dpr; ctx.beginPath();
    for (let k = 0; k < tr.n; k += 2) { const x = sx(k * 0.5), y = yy(L[k]); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(245,179,1,.9)'; ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx, y1); ctx.stroke();
    const k = S.read.cur, sten = R[k] > 0 ? 1 - L[k] / R[k] : 0;
    ctx.fillStyle = '#cfd6ee';
    ctx.fillText(`lumen ${L[k].toFixed(1)} mm / ref ${R[k].toFixed(1)} mm  ·  ${Math.round(sten * 100)}% diameter stenosis  ·  ${TRACK.tv[k].name} ${(TRACK.ti[k] * 0.5).toFixed(0)} mm`, 8 * vp.dpr, vp.H - 2 * vp.dpr);
    ctx.fillStyle = '#9aa6cc'; ctx.textAlign = 'right';
    ctx.fillText('— lumen   - - reference', vp.W - 8 * vp.dpr, g.imgH + 12 * vp.dpr); ctx.textAlign = 'left';
  }
  function renderXS(vp) {
    const tr = TRACK; if (!tr) return;
    const k = S.read.cur, v = tr.tv[k], i = tr.ti[k];
    const size = clamp(v.rad[i] * 7, 9, 16);
    const g = gridFor(vp, size, size, 240, 0.05);
    const id = vp.img(g.c, g.r), d = id.data;
    const [W, L] = S.read.wl;
    const alpha = S.read.alpha * DEG;
    const P = tr.p[k], ax = trackDir(k, alpha + Math.PI / 2), ay = trackDir(k, alpha);
    const b = blurAtTrack(k);
    const buf = new Float32Array(g.c * g.r);
    for (let r = 0; r < g.r; r++) for (let c = 0; c < g.c; c++) {
      const u = (c + 0.5) * (size / g.c) - size / 2, w = size / 2 - (r + 0.5) * (size / g.r);
      const pt = [P[0] + ax[0] * u + ay[0] * w, P[1] + ax[1] * u + ay[1] * w, P[2] + ax[2] * u + ay[2] * w];
      const rho = hyp(u, w);
      const dirW = rho > 1e-6 ? nrm(sub(pt, P)) : ay;
      buf[r * g.c + c] = cprHU(k, pt, dirW, rho, 0.3);
    }
    if (b > 0.3) {
      const rad = Math.max(1, Math.round((b * 0.6) / (size / g.c)));
      const tmp = buf.slice();
      for (let r = 0; r < g.r; r++) for (let c = 0; c < g.c; c++) { let a = 0, n = 0; for (let q = -rad; q <= rad; q++) { const cc = clamp(c + q, 0, g.c - 1), rr = clamp(r + Math.round(q * 0.6), 0, g.r - 1); const hv = tmp[rr * g.c + cc]; if (hv !== NODATA) { a += hv; n++; } } buf[r * g.c + c] = n ? a / n : NODATA; }
    }
    for (let o = 0; o < buf.length; o++) { const h = buf[o], kk = o * 4; if (h === NODATA) { d[kk] = 6; d[kk + 1] = 8; d[kk + 2] = 22; } else { const gg = gray(h, W, L); d[kk] = d[kk + 1] = d[kk + 2] = gg; } d[kk + 3] = 255; }
    vp.blit(size, size);
    const ctx = vp.ctx, f = vp.fit;
    // scale bar 2 mm
    ctx.fillStyle = '#cfd6ee'; ctx.fillRect(f.x + 8 * vp.dpr, f.y + size * f.s - 10 * vp.dpr, 2 * f.s, 2 * vp.dpr);
    ctx.font = `${10 * vp.dpr}px "IBM Plex Mono", monospace`; ctx.fillText('2 mm', f.x + 8 * vp.dpr, f.y + size * f.s - 14 * vp.dpr);
    const lm = lumenAt(v, i);
    const area = v.typ[i] === TYP.slit ? Math.PI * v.rad[i] * v.rad[i] * (1 - v.D[i]) : Math.PI * (lm.lum / 2) ** 2;
    $('#xsLbl').textContent = `${v.name} · MLD ${lm.lum.toFixed(1)} mm · area ${area.toFixed(1)} mm²`;
  }

  // ───────────────────────── Agatston calcium score ─────────────────────────
  const CAC_G = 320, CAC_SP = FOV / CAC_G, CAC_T = 3;
  const CAC_CROP = [22, 12, 150]; // u0, v0, size (mm) of the calcium view
  const ART_COL = { LM: [245, 179, 1], LAD: [255, 107, 107], LCX: [79, 209, 161], RCA: [90, 169, 255] };
  function buildCAC() {
    const nS = Math.floor((S.range[1] - S.range[0]) / CAC_T);
    const img = new Int16Array(CAC_G * CAC_G * nS), map = new Int16Array(CAC_G * CAC_G * nS);
    GA.fill(0); NAMP = noiseSigma(120, 80) / 30 * 0.6 / 1.25;
    for (let s = 0; s < nS; s++) {
      const zc = S.range[1] - (s + 0.5) * CAC_T;
      for (let r = 0; r < CAC_G; r++) {
        const y = Y0 + (r + 0.5) * CAC_SP;
        for (let c = 0; c < CAC_G; c++) {
          const x = X0 + (c + 0.5) * CAC_SP;
          const h = (tri(x, y, zc - 1) + tri(x, y, zc) + tri(x, y, zc + 1)) / 3;
          img[(s * CAC_G + r) * CAC_G + c] = Math.round(h);
        }
      }
    }
    // connected components ≥130 HU per slice
    const comps = [];
    const stack = new Int32Array(CAC_G * CAC_G);
    const pxA = CAC_SP * CAC_SP;
    for (let s = 0; s < nS; s++) {
      const base = s * CAC_G * CAC_G;
      for (let p = 0; p < CAC_G * CAC_G; p++) {
        if (img[base + p] < 130 || map[base + p]) continue;
        const id = comps.length + 1;
        let sp = 0, n = 0, mx = 0, sx = 0, sy = 0;
        stack[sp++] = p; map[base + p] = id;
        while (sp) {
          const q = stack[--sp], h = img[base + q];
          n++; if (h > mx) mx = h; sx += q % CAC_G; sy += (q / CAC_G) | 0;
          const qx = q % CAC_G, qy = (q / CAC_G) | 0;
          const nb = [qx > 0 ? q - 1 : -1, qx < CAC_G - 1 ? q + 1 : -1, qy > 0 ? q - CAC_G : -1, qy < CAC_G - 1 ? q + CAC_G : -1];
          for (const t of nb) if (t >= 0 && !map[base + t] && img[base + t] >= 130) { map[base + t] = id; stack[sp++] = t; }
        }
        const area = n * pxA;
        const wgt = mx >= 400 ? 4 : mx >= 300 ? 3 : mx >= 200 ? 2 : 1;
        const cx = X0 + (sx / n + 0.5) * CAC_SP, cy = Y0 + (sy / n + 0.5) * CAC_SP, cz = S.range[1] - (s + 0.5) * CAC_T;
        // which artery, if any (reference)
        let ref = null, bd = 1e9;
        for (const v of VLIST) for (let i = 0; i < v.n; i += 2) {
          const q = v.pts[i], dd = (q[0] - cx) ** 2 + (q[1] - cy) ** 2 + (q[2] - cz) ** 2;
          if (dd < bd) { bd = dd; ref = v; }
        }
        const refG = ref && Math.sqrt(bd) < 4.5 ? ref.group : null;
        comps.push({ id, s, n, area, mx, wgt, score: area >= 1 ? area * wgt : 0, ok: area >= 1, cx, cy, cz, ref: refG });
      }
    }
    const tot = { LM: 0, LAD: 0, LCX: 0, RCA: 0 };
    for (const c of comps) if (c.ok && c.ref) tot[c.ref] += c.score;
    S.cac = { nS, img, map, comps, ref: tot, refTotal: tot.LM + tot.LAD + tot.LCX + tot.RCA };
    S.cacUser = {};
  }
  function cacUserTotals() {
    const t = { LM: 0, LAD: 0, LCX: 0, RCA: 0 };
    for (const [id, a] of Object.entries(S.cacUser)) { const c = S.cac.comps[id - 1]; if (c && c.ok) t[a] += c.score; }
    return t;
  }
  const cacDRS = (v) => (v <= 0 ? 'CAC-DRS 0' : v < 100 ? 'CAC-DRS 1' : v < 300 ? 'CAC-DRS 2' : 'CAC-DRS 3');

  // ───────────────────────── UI: views ─────────────────────────
  const vp = {};
  ['vpTopo', 'vpPlanAx', 'vpEcg', 'vpCac', 'vpMon', 'vpTac', 'vpAx', 'vpMpr', 'vpVr', 'vpCpr', 'vpXs'].forEach((k) => (vp[k] = new VP(k)));
  const dirty = new Set();
  let raf = 0;
  const mark = (...k) => { k.forEach((x) => dirty.add(x)); if (!raf) raf = requestAnimationFrame(flush); };
  let vrFast = false;
  function flush() {
    raf = 0;
    const list = [...dirty]; dirty.clear();
    for (const k of list) {
      try { RENDER[k] && RENDER[k](); } catch (e) { console.error(k, e); }
    }
  }
  function withNonContrast(fn) {
    const g = GA.slice(), n = NAMP, m = USE_MOTION;
    GA.fill(0); NAMP = 0.35; USE_MOTION = false;
    try { fn(); } finally { GA.set(g); NAMP = n; USE_MOTION = m; }
  }
  function applyReadGains() {
    const sc = S.scan;
    if (!sc) return;
    setGains(sc.e, KVC[S.kv]);
    NAMP = (sc.sigma / 30) * 1.25;
    USE_MOTION = true;
  }
  let planZ = 30;
  const RENDER = {
    topo() {
      const v = vp.vpTopo; v.resize();
      if (!TOPO) buildTopo();
      const id = v.img(NX, NZ); id.data.set(TOPO);
      v.blit(FOV, ZLEN);
      const c = v.ctx, f = v.fit;
      const yT = f.y + (ZTOP - S.range[1]) * f.s, yB = f.y + (ZTOP - S.range[0]) * f.s;
      c.fillStyle = 'rgba(245,179,1,.10)'; c.fillRect(f.x, yT, FOV * f.s, yB - yT);
      c.strokeStyle = '#f5b301'; c.lineWidth = 2 * v.dpr;
      for (const y of [yT, yB]) { c.beginPath(); c.moveTo(f.x, y); c.lineTo(f.x + FOV * f.s, y); c.stroke(); }
      c.fillStyle = '#f5b301'; c.font = `${11 * v.dpr}px "IBM Plex Mono", monospace`;
      c.fillText(`start ${S.range[1].toFixed(0)} mm`, f.x + 6 * v.dpr, yT - 5 * v.dpr);
      c.fillText(`end ${S.range[0].toFixed(0)} mm`, f.x + 6 * v.dpr, yB + 14 * v.dpr);
      const yz = f.y + (ZTOP - planZ) * f.s;
      c.strokeStyle = 'rgba(111,179,255,.6)'; c.lineWidth = 1 * v.dpr; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(f.x, yz); c.lineTo(f.x + FOV * f.s, yz); c.stroke(); c.setLineDash([]);
      $('#topoLbl').textContent = `range ${(S.range[1] - S.range[0]).toFixed(0)} mm`;
    },
    planAx() {
      const v = vp.vpPlanAx; v.resize();
      const cp = S.cp.slice(); S.cp[2] = planZ;
      withNonContrast(() => { const r0 = USE_RANGE; USE_RANGE = false; renderMPR(v, 'ax', { zoom: 1, wl: [400, 40], slab: 0, maxPx: 400 }); USE_RANGE = r0; });
      orientLabels(v, 'ax');
      S.cp = cp;
      $('#planAxLbl').textContent = `z ${planZ.toFixed(0)} mm · hover the topogram to move`;
    },
    ecg() { drawECG(vp.vpEcg); },
    cac() { drawCAC(); },
    mon() { drawMonitor(); },
    tac() { drawTAC(); },
    ax() {
      const v = vp.vpAx; v.resize(); renderMPR(v, 'ax'); drawCross(v); orientLabels(v, 'ax');
      $('#axLbl').textContent = `z ${S.cp[2].toFixed(1)} mm${S.read.slab ? ' · MIP ' + S.read.slab + ' mm' : ''}`;
      $('#axWl').textContent = `W ${S.read.wl[0]} L ${S.read.wl[1]}`;
    },
    mpr() {
      const v = vp.vpMpr; v.resize(); renderMPR(v, S.read.mpr); drawCross(v); orientLabels(v, S.read.mpr);
      $('#mprName').textContent = S.read.mpr === 'cor' ? 'CORONAL' : 'SAGITTAL';
      $('#mprLbl').textContent = S.read.mpr === 'cor' ? `y ${S.cp[1].toFixed(1)} mm` : `x ${S.cp[0].toFixed(1)} mm`;
    },
    vr() { const v = vp.vpVr; v.resize(); renderVR(v, vrFast); $('#vrLbl').textContent = { heart: 'volume rendering', tree: 'coronary tree', mip: 'MIP' }[S.read.vr] + ' · drag to rotate'; },
    vrOverlay() { const v = vp.vpVr; if (!vrCache) return mark('vr'); renderVR(v, true); },
    cpr() { const v = vp.vpCpr; v.resize(); renderCPR(v); $('#cprLbl').textContent = `${TRACKS[S.read.track].name} · straightened · ${S.read.alpha}° · click to move the cursor`; },
    xs() { const v = vp.vpXs; v.resize(); renderXS(v); },
    readKv() { updateReadKv(); },
  };

  // topogram: AP projection of the non-contrast volume
  let TOPO = null;
  function buildTopo() {
    TOPO = new Uint8ClampedArray(NX * NZ * 4);
    for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) {
      let s = 0;
      for (let j = 0; j < NY; j++) { const o = (k * NY + j) * NX + i; s += Math.max(0, HU[o] + 1000); }
      const L = (s / 1000) * DX * 0.02;
      const g = 255 * Math.pow(clamp((L - 0.6) / 4.2, 0, 1), 0.85);
      const o = ((NZ - 1 - k) * NX + i) * 4;
      TOPO[o] = TOPO[o + 1] = TOPO[o + 2] = g; TOPO[o + 3] = 255;
    }
  }

  function drawECG(v) {
    v.resize();
    const c = v.ctx, W = v.W, H = v.H, dpr = v.dpr;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#020617'; c.fillRect(0, 0, W, H);
    const msPx = 3000 / W, rr = RR();
    c.strokeStyle = 'rgba(79,209,161,.07)'; c.lineWidth = 1;
    for (let x = 0; x < W; x += 40 / msPx) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    const mid = H * 0.62, amp = H * 0.42;
    // acquisition windows
    const beats = Math.ceil(3000 / rr) + 1;
    let tEct = S.cs.rhythm === 'ectopy' ? 1 : -1;
    const rTimes = [];
    let t = 120;
    for (let b = 0; b < beats + 1; b++) { rTimes.push(t); t += b === tEct ? rr * 0.62 : b === tEct + 1 ? rr * 1.35 : rr; }
    for (let b = 0; b < rTimes.length - 1; b++) {
      const r0 = rTimes[b], len = rTimes[b + 1] - r0;
      if (S.gating === 'retro') {
        c.fillStyle = 'rgba(245,179,1,.10)'; c.fillRect(r0 / msPx, 0, len / msPx, H);
        c.fillStyle = 'rgba(245,179,1,.28)'; c.fillRect((r0 + len * 0.65) / msPx, 0, (len * 0.2) / msPx, H);
      } else {
        const pad = S.gating === 'pro' ? S.pad : 0;
        const ph = S.gating === 'flash' ? 0.65 : S.phase / 100;
        const tr = SCANNERS[S.scanner].tr;
        const a = r0 + (ph - pad / 100) * rr - tr / 2, w = (pad / 50) * rr + tr;
        c.fillStyle = 'rgba(245,179,1,.32)'; c.fillRect(a / msPx, 0, w / msPx, H);
      }
    }
    c.strokeStyle = '#4fd1a1'; c.lineWidth = 1.6 * dpr; c.beginPath();
    for (let x = 0; x < W; x++) {
      const tm = x * msPx;
      let y = 0;
      for (let b = 0; b < rTimes.length; b++) {
        const dt = tm - rTimes[b];
        const ect = b === tEct + 1;
        if (ect) { y += -0.15 * Math.exp(-((dt - 0) ** 2) / 1800) + 0.9 * Math.exp(-((dt - 20) ** 2) / 900) - 0.35 * Math.exp(-((dt - 230) ** 2) / 5000); continue; }
        y += 0.12 * Math.exp(-((dt + 150) ** 2) / 900) - 0.1 * Math.exp(-((dt + 12) ** 2) / 60) + 1 * Math.exp(-(dt ** 2) / 80) - 0.22 * Math.exp(-((dt - 14) ** 2) / 70) + 0.28 * Math.exp(-((dt - 300) ** 2) / 2800);
      }
      const yy = mid - y * amp;
      if (x) c.lineTo(x, yy); else c.moveTo(x, yy);
    }
    c.stroke();
    const lbl = S.gating === 'retro' ? 'retrospective: tube on through the cycle, full dose at 65–85%' : S.gating === 'flash' ? 'high-pitch spiral: whole heart in one beat at ~65%' : `prospective: ${S.phase}% ± ${S.pad}% of R–R`;
    $('#ecgLbl').textContent = `${hrNow()} bpm · R–R ${Math.round(rr)} ms · ${lbl}${S.cs.rhythm === 'ectopy' ? ' · ectopic beats' : ''}`;
  }

  // ───────────────────────── calcium step view ─────────────────────────
  let cacSlice = 10;
  function drawCAC() {
    const v = vp.vpCac; v.resize();
    if (!S.cac) return;
    const s = clamp(cacSlice, 0, S.cac.nS - 1);
    const id = v.img(CAC_G, CAC_G), d = id.data, base = s * CAC_G * CAC_G;
    for (let p = 0; p < CAC_G * CAC_G; p++) {
      const h = S.cac.img[base + p], k = p * 4, g = gray(h, 400, 40);
      const cid = S.cac.map[base + p];
      if (cid && S.cac.comps[cid - 1].ok) {
        const a = S.cacUser[cid];
        const col = a ? ART_COL[a] : [255, 95, 162];
        d[k] = lerp(g, col[0], 0.75); d[k + 1] = lerp(g, col[1], 0.75); d[k + 2] = lerp(g, col[2], 0.75);
      } else { d[k] = d[k + 1] = d[k + 2] = g; }
      d[k + 3] = 255;
    }
    // show the central 150 mm around the heart
    v.octx.putImageData(id, 0, 0);
    v.layout(CAC_CROP[2], CAC_CROP[2]);
    const f = v.fit, cx = v.ctx, k0 = CAC_CROP[0] / CAC_SP, k1 = CAC_CROP[1] / CAC_SP, kw = CAC_CROP[2] / CAC_SP;
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = '#000'; cx.fillRect(0, 0, v.W, v.H);
    cx.imageSmoothingEnabled = true; cx.drawImage(v.off, k0, k1, kw, kw, f.x, f.y, CAC_CROP[2] * f.s, CAC_CROP[2] * f.s);
    orientLabels(Object.assign(v, { plane: { w: CAC_CROP[2], h: CAC_CROP[2] } }), 'ax');
    const zc = S.range[1] - (s + 0.5) * CAC_T;
    $('#cacLbl').textContent = `slice ${s + 1} / ${S.cac.nS} · z ${zc.toFixed(0)} mm`;
    $('#cacSliceO').textContent = `${s + 1} / ${S.cac.nS}`;
  }
  function renderCacTable(showRef) {
    const u = cacUserTotals(), r = S.cac.ref;
    const tot = (o) => o.LM + o.LAD + o.LCX + o.RCA;
    let h = `<tr><th>Artery</th><th class="n">You</th>${showRef ? '<th class="n">Reference</th>' : ''}</tr>`;
    for (const g of GROUPS) h += `<tr><td><span class="sw" style="background:rgb(${ART_COL[g]})"></span>${GROUP_NAME[g]}</td><td class="n">${fmt(u[g])}</td>${showRef ? `<td class="n">${fmt(r[g])}</td>` : ''}</tr>`;
    h += `<tr><td><b>Total</b></td><td class="n"><b>${fmt(tot(u))}</b></td>${showRef ? `<td class="n"><b>${fmt(tot(r))}</b></td>` : ''}</tr>`;
    $('#cacTable').innerHTML = h;
  }

  // ───────────────────────── bolus step view ─────────────────────────
  function drawMonitor() {
    const v = vp.vpMon; v.resize();
    const b = S.bolus;
    const e = enh(b.t);
    const g = GA.slice(), n = NAMP, m = USE_MOTION, r0 = USE_RANGE;
    setGains(e, KVC[100]); NAMP = 1.9; USE_MOTION = false; USE_RANGE = false;
    const cp = S.cp.slice(); S.cp[2] = b.z;
    try { renderMPR(v, 'ax', { zoom: 1.35, wl: [600, 150], slab: 0, maxPx: 300 }); } finally { S.cp = cp; GA.set(g); NAMP = n; USE_MOTION = m; USE_RANGE = r0; }
    // ROI
    const pl = v.plane, c = v.ctx;
    const q = v.fromMM(b.roi[0] - X0 - pl.u0, b.roi[1] - Y0 - pl.v0);
    c.strokeStyle = '#f5b301'; c.lineWidth = 2 * v.dpr; c.beginPath(); c.arc(q[0], q[1], 5 * v.fit.s, 0, Math.PI * 2); c.stroke();
    const roi = roiHU(b.t);
    c.fillStyle = '#f5b301'; c.font = `${12 * v.dpr}px "IBM Plex Mono", monospace`; c.fillText(`${Math.round(roi)} HU`, q[0] + 7 * v.fit.s, q[1] - 6 * v.fit.s);
    $('#monLbl').textContent = `z ${b.z} mm (carina level) · t = ${b.t.toFixed(1)} s`;
  }
  function roiHU(t) {
    const b = S.bolus, e = enh(t);
    const g = GA.slice(), n = NAMP, m = USE_MOTION;
    setGains(e, KVC[100]); NAMP = 0; USE_MOTION = false;
    let s = 0, k = 0;
    for (let dy = -4; dy <= 4; dy += 1) for (let dx = -4; dx <= 4; dx += 1) { if (dx * dx + dy * dy > 16) continue; s += tri(b.roi[0] + dx, b.roi[1] + dy, b.z); k++; }
    GA.set(g); NAMP = n; USE_MOTION = m;
    return s / k;
  }
  function drawTAC() {
    const v = vp.vpTac; v.resize();
    const c = v.ctx, W = v.W, H = v.H, dpr = v.dpr, b = S.bolus;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#020617'; c.fillRect(0, 0, W, H);
    const pl = 46 * dpr, pr = 14 * dpr, pt = 34 * dpr, pb = 34 * dpr;
    const tMax = 40, hMax = 600;
    const X = (t) => pl + (t / tMax) * (W - pl - pr), Y = (h) => H - pb - (h / hMax) * (H - pt - pb);
    c.strokeStyle = 'rgba(143,156,194,.15)'; c.lineWidth = 1; c.font = `${10.5 * dpr}px "IBM Plex Mono", monospace`; c.fillStyle = '#8f9cc2';
    for (let h = 0; h <= hMax; h += 100) { c.beginPath(); c.moveTo(pl, Y(h)); c.lineTo(W - pr, Y(h)); c.stroke(); c.fillText(String(h), 6 * dpr, Y(h) + 4 * dpr); }
    for (let t = 0; t <= tMax; t += 5) { c.fillText(t + 's', X(t) - 8 * dpr, H - pb + 16 * dpr); }
    // injection bar
    const Ti = b.vol / b.rate;
    c.fillStyle = 'rgba(111,179,255,.2)'; c.fillRect(X(0), H - pb + 22 * dpr, X(Ti) - X(0), 5 * dpr);
    if (b.chaser) { c.fillStyle = 'rgba(230,234,246,.15)'; c.fillRect(X(Ti), H - pb + 22 * dpr, X(Ti + 40 / b.rate) - X(Ti), 5 * dpr); }
    // threshold
    c.strokeStyle = 'rgba(245,179,1,.7)'; c.setLineDash([5 * dpr, 4 * dpr]); c.beginPath(); c.moveTo(pl, Y(b.thr)); c.lineTo(W - pr, Y(b.thr)); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#f5b301'; c.fillText(`trigger ${b.thr} HU`, W - pr - 100 * dpr, Y(b.thr) - 5 * dpr);
    // ghost curves after the scan: full aorta and RV curves
    if (S.scanDone) {
      const ea = [], er = [];
      for (let t = 0; t <= tMax; t += 0.25) { const e = enh(t); ea.push([t, 40 + e.eA * KVC[S.kv]]); er.push([t, 40 + e.eR * KVC[S.kv]]); }
      for (const [arr, col] of [[ea, 'rgba(255,107,107,.55)'], [er, 'rgba(90,169,255,.55)']]) { c.strokeStyle = col; c.lineWidth = 1.4 * dpr; c.beginPath(); arr.forEach(([t, h], i) => (i ? c.lineTo(X(t), Y(h)) : c.moveTo(X(t), Y(h)))); c.stroke(); }
      c.fillStyle = 'rgba(255,107,107,.8)'; c.fillText('aorta (scan kV)', pl + 6 * dpr, pt - 8 * dpr);
      c.fillStyle = 'rgba(90,169,255,.8)'; c.fillText('right heart', pl + 130 * dpr, pt - 8 * dpr);
    }
    // monitoring points
    c.fillStyle = '#4fd1a1';
    c.strokeStyle = '#4fd1a1'; c.lineWidth = 1.6 * dpr; c.beginPath();
    b.curve.forEach(([t, h], i) => (i ? c.lineTo(X(t), Y(h)) : c.moveTo(X(t), Y(h)))); c.stroke();
    b.curve.forEach(([t, h]) => { c.beginPath(); c.arc(X(t), Y(h), 2.6 * dpr, 0, Math.PI * 2); c.fill(); });
    if (b.trig != null) { c.strokeStyle = '#f5b301'; c.beginPath(); c.moveTo(X(b.trig), pt); c.lineTo(X(b.trig), H - pb); c.stroke(); c.fillStyle = '#f5b301'; c.fillText('trigger', X(b.trig) + 4 * dpr, pt + 12 * dpr); }
    if (b.tScan != null) { c.fillStyle = 'rgba(79,209,161,.25)'; c.fillRect(X(b.tScan - 0.6), pt, X(b.tScan + 0.6) - X(b.tScan - 0.6), H - pt - pb); c.fillStyle = '#4fd1a1'; c.fillText('scan', X(b.tScan) + 4 * dpr, pt + 26 * dpr); }
  }

  // ───────────────────────── read panel info ─────────────────────────
  function updateReadKv() {
    const sc = S.scan; if (!sc) return;
    const b = blurFor(S.read.recon);
    const lv = 43 + GA[C_LEFT], rv = 43 + GA[C_RIGHT];
    const myo = 40 + GA[C_MYO];
    const rows = [
      ['Aorta / LV', `${Math.round(lv)} HU`], ['Right heart', `${Math.round(rv)} HU`], ['Noise (SD)', `${sc.sigma.toFixed(0)} HU`],
      ['SNR · CNR', `${(lv / sc.sigma).toFixed(1)} · ${((lv - myo) / sc.sigma).toFixed(1)}`],
      ['Motion RCA', motionGrade(b.R)], ['Motion LCx', motionGrade(b.C)], ['Motion LAD', motionGrade(b.A)],
      ['Dose', `${sc.dose.dlp.toFixed(0)} mGy·cm · ${sc.dose.msv.toFixed(1)} mSv`],
      ['Crosshair', `${S.cp.map((x) => x.toFixed(0)).join(', ')}`],
    ];
    $('#readKv').innerHTML = rows.map(([a, c]) => `<dt>${a}</dt><dd>${c}</dd>`).join('');
    const notes = [];
    if (b.R >= 2.5 || b.C >= 2.5) notes.push(['warn', 'Severe motion at this phase. Try another reconstruction phase (if your acquisition window allows it).']);
    else if (b.R >= 1.2) notes.push(['gold', 'Moderate RCA motion. A different phase may sharpen the mid RCA.']);
    if (lv < 250) notes.push(['warn', 'Coronary enhancement is below 250 HU: the study is suboptimal and small plaques can be missed.']);
    if (MIS) notes.push(['warn', 'Step artefacts: an ectopic beat shifted the heart between acquisition steps.']);
    if (sc.cut) notes.push(['warn', sc.cut]);
    $('#readNotes').innerHTML = notes.map(([c, t]) => `<div class="note ${c}">${t}</div>`).join('');
  }

  // ───────────────────────── interaction ─────────────────────────
  function onDrag(el, { down, move, up, wheel, hover }) {
    let active = false, btn = 0, last = null;
    el.addEventListener('pointerdown', (e) => { active = true; btn = e.button === 2 || e.shiftKey ? 2 : 0; last = e; el.setPointerCapture(e.pointerId); down && down(e, btn); e.preventDefault(); });
    el.addEventListener('pointermove', (e) => { if (active) { move && move(e, btn, e.clientX - last.clientX, e.clientY - last.clientY); last = e; } else hover && hover(e); });
    const end = (e) => { if (!active) return; active = false; up && up(e, btn); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    if (wheel) el.addEventListener('wheel', (e) => { e.preventDefault(); wheel(e); }, { passive: false });
  }
  function syncCursorToCP() {
    if (!TRACK) return;
    let bi = -1, bd = 25;
    for (let k = 0; k < TRACK.n; k++) { const d = (TRACK.p[k][0] - S.cp[0]) ** 2 + (TRACK.p[k][1] - S.cp[1]) ** 2 + (TRACK.p[k][2] - S.cp[2]) ** 2; if (d < bd) { bd = d; bi = k; } }
    if (bi >= 0) { S.read.cur = bi; mark('cpr', 'xs'); }
  }
  function mprHandlers(key, getOrient) {
    const v = vp[key];
    onDrag(v.cv, {
      down(e, b) { if (b === 0) { S.cp = viewToWorld(v, e); syncCursorToCP(); mark('ax', 'mpr', 'vrOverlay', 'readKv'); } },
      move(e, b, dx, dy) {
        if (b === 2) { S.read.wl = [clamp(S.read.wl[0] + dx * 4, 50, 4000), clamp(S.read.wl[1] - dy * 2, -1000, 1500)]; mark('ax', 'mpr', 'cpr', 'xs'); }
        else { S.cp = viewToWorld(v, e); syncCursorToCP(); mark('ax', 'mpr', 'vrOverlay', 'readKv'); }
      },
      up() { mark('vrOverlay'); },
      wheel(e) {
        const o = getOrient(), n = NORMAL[o], st = (e.deltaY > 0 ? -1 : 1) * (o === 'ax' ? DZ : DX) * (e.shiftKey ? 4 : 1);
        if (e.ctrlKey) { S.read.zoom = clamp(S.read.zoom * (e.deltaY > 0 ? 0.85 : 1.18), 1, 4); }
        else { S.cp = [clamp(S.cp[0] + n[0] * st, X0 + 1, X0 + FOV - 1), clamp(S.cp[1] + n[1] * st, Y0 + 1, Y0 + FOV - 1), clamp(S.cp[2] + n[2] * st, Z0 + 1, ZTOP - 1)]; }
        mark('ax', 'mpr', 'vrOverlay', 'readKv');
      },
      hover(e) {
        if (key !== 'vpAx' || !v.plane) return;
        const p = viewToWorld(v, e), h = sampleScan(p[0], p[1], p[2]);
        $('#axHu').textContent = h === NODATA ? 'outside scan range' : `${Math.round(h)} HU`;
      },
    });
  }
  mprHandlers('vpAx', () => 'ax');
  mprHandlers('vpMpr', () => S.read.mpr);
  onDrag(vp.vpVr.cv, {
    down() { },
    move(e, b, dx, dy) { S.read.yaw -= dx * 0.5; S.read.pitch = clamp(S.read.pitch + dy * 0.4, -85, 85); vrFast = true; mark('vr'); },
    up() { vrFast = false; mark('vr'); },
    wheel(e) { S.read.zoomVr = clamp(S.read.zoomVr * (e.deltaY > 0 ? 0.9 : 1.1), 0.7, 3); mark('vr'); },
  });
  $$('#vpVr .tools button').forEach((b) => b.addEventListener('click', () => {
    const p = { ant: [0, 0], lao: [-45, 20], rao: [35, 15], inf: [-10, -65] }[b.dataset.p];
    S.read.yaw = p[0]; S.read.pitch = p[1]; mark('vr');
  }));
  $$('#vpMpr .tools button').forEach((b) => b.addEventListener('click', () => {
    S.read.mpr = b.dataset.o; $$('#vpMpr .tools button').forEach((x) => x.classList.toggle('on', x === b)); mark('mpr');
  }));
  onDrag(vp.vpCpr.cv, {
    down(e, b) { if (b === 0) cprPick(e); },
    move(e, b, dx) { if (b === 2) { S.read.alpha = ((S.read.alpha + Math.round(dx)) % 360 + 360) % 360; $('#rotR').value = S.read.alpha; $('#rotO').textContent = S.read.alpha + '°'; mark('cpr', 'xs'); } else cprPick(e); },
    wheel(e) { S.read.cur = clamp(S.read.cur + (e.deltaY > 0 ? 2 : -2), 0, TRACK.n - 1); cursorToCP(); },
  });
  function cprPick(e) {
    const g = cprGeo; if (!g) return;
    const r = vp.vpCpr.cv.getBoundingClientRect(), x = (e.clientX - r.left) * vp.vpCpr.dpr;
    const s = (x - g.ox) / g.sc - 2;
    S.read.cur = clamp(Math.round(s / 0.5), 0, TRACK.n - 1);
    cursorToCP();
  }
  function cursorToCP() { S.cp = TRACK.p[S.read.cur].slice(); mark('cpr', 'xs', 'ax', 'mpr', 'vrOverlay', 'readKv'); }

  // topogram: drag the range lines, hover to preview axial level
  onDrag(vp.vpTopo.cv, {
    down(e) { const z = ZTOP - vp.vpTopo.toMM(e)[1]; drag = Math.abs(z - S.range[1]) < Math.abs(z - S.range[0]) ? 1 : 0; setRange(z); },
    move(e) { setRange(ZTOP - vp.vpTopo.toMM(e)[1]); },
    up() { drag = -1; },
    hover(e) { planZ = clamp(ZTOP - vp.vpTopo.toMM(e)[1], Z0 + 1, ZTOP - 1); mark('planAx', 'topo'); },
  });
  let drag = -1;
  function setRange(z) {
    if (drag < 0) return;
    z = clamp(Math.round(z), Z0 + 2, ZTOP - 2);
    if (drag === 1) S.range[1] = Math.max(z, S.range[0] + 30); else S.range[0] = Math.min(z, S.range[1] - 30);
    planZ = z;
    invalidateScan();
    updatePlan();
    mark('topo', 'planAx');
  }

  // calcium: click to assign
  onDrag(vp.vpCac.cv, {
    down(e) {
      if (!S.cac) return;
      const m = vp.vpCac.toMM(e), c = Math.floor((m[0] + CAC_CROP[0]) / CAC_SP), r = Math.floor((m[1] + CAC_CROP[1]) / CAC_SP);
      if (c < 0 || r < 0 || c >= CAC_G || r >= CAC_G) return;
      const s = cacSlice, base = s * CAC_G * CAC_G;
      // pick the nearest component within 2 mm
      let id = S.cac.map[base + r * CAC_G + c];
      if (!id) {
        let bd = 1e9;
        for (let dr = -4; dr <= 4; dr++) for (let dc = -4; dc <= 4; dc++) { const rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= CAC_G || cc >= CAC_G) continue; const q = S.cac.map[base + rr * CAC_G + cc]; if (q && dr * dr + dc * dc < bd) { bd = dr * dr + dc * dc; id = q; } }
      }
      if (!id || !S.cac.comps[id - 1].ok) return;
      if (S.art === 'X' || S.cacUser[id] === S.art) delete S.cacUser[id]; else S.cacUser[id] = S.art;
      renderCacTable(false); $('#cacFb').innerHTML = ''; mark('cac');
    },
    wheel(e) { cacSlice = clamp(cacSlice + (e.deltaY > 0 ? 1 : -1), 0, S.cac.nS - 1); $('#cacSlice').value = cacSlice; mark('cac'); },
    hover(e) {
      if (!S.cac) return;
      const m = vp.vpCac.toMM(e), c = Math.floor((m[0] + CAC_CROP[0]) / CAC_SP), r = Math.floor((m[1] + CAC_CROP[1]) / CAC_SP);
      if (c < 0 || r < 0 || c >= CAC_G || r >= CAC_G) return;
      const h = S.cac.img[(cacSlice * CAC_G + r) * CAC_G + c];
      $('#cacHu').textContent = `${h} HU`;
    },
  });

  onDrag(vp.vpMon.cv, {
    down(e) {
      const v = vp.vpMon, pl = v.plane, m = v.toMM(e);
      S.bolus.roi = [X0 + m[0] + pl.u0, Y0 + m[1] + pl.v0];
      mark('mon');
    },
  });

  // ───────────────────────── workflow ─────────────────────────
  function setStep(st) {
    S.step = st;
    $$('#steps button').forEach((b) => b.classList.toggle('on', b.dataset.step === st));
    $$('.panel').forEach((p) => p.classList.toggle('on', p.dataset.panel === st));
    const view = { plan: 'vPlan', cac: 'vCac', bolus: 'vBolus', read: 'vRead', report: 'vRead' }[st];
    $$('.view').forEach((v) => v.classList.toggle('on', v.id === view));
    $('#stepPill').textContent = { plan: 'Plan', cac: 'Calcium score', bolus: 'Contrast', read: 'Reading', report: 'Report' }[st];
    const hint = { plan: 'Drag the yellow lines to set the range · hover to preview a level', cac: 'Pick an artery, click each pink calcium · wheel scrolls slices', bolus: 'Click the image to move the ROI', read: 'Click CPR to move the cursor · drag 3D to rotate · wheel scrolls · right-drag sets window', report: 'Grade each artery, then check' }[st];
    $('#hint').textContent = hint;
    if (st === 'plan') mark('topo', 'planAx', 'ecg');
    if (st === 'cac') { if (!S.cac) { buildCAC(); cacSlice = Math.round(S.cac.nS * 0.3); } $('#cacSlice').max = S.cac.nS - 1; $('#cacSlice').value = cacSlice; renderCacTable(false); markDone('cac'); mark('cac'); }
    if (st === 'bolus') mark('mon', 'tac');
    if (st === 'read' || st === 'report') { applyReadGains(); updateBlur(S.read.recon); mark('ax', 'mpr', 'vr', 'cpr', 'xs', 'readKv'); }
    if (st === 'report') buildReportForm();
  }
  function markDone(st) { const b = $(`#steps button[data-step="${st}"]`); b && b.classList.add('done'); }
  $$('#steps button').forEach((b) => b.addEventListener('click', () => !b.disabled && setStep(b.dataset.step)));

  function invalidateScan() {
    S.scanDone = false; S.scan = null; S.cac = null;
    S.bolus.curve = []; S.bolus.trig = null; S.bolus.tScan = null; S.bolus.t = 0; S.bolus.running = false;
    $('#steps button[data-step="read"]').disabled = true; $('#steps button[data-step="report"]').disabled = true;
    $$('#steps button').forEach((b) => b.classList.remove('done'));
    $('#btnToRead').disabled = true; $('#scanResult').innerHTML = ''; $('#bolusStatus').innerHTML = '';
    $('#btnInject').disabled = false; $('#btnTrigger').disabled = true;
  }

  // plan panel
  function updatePlan() {
    const hr = hrNow(), cs = S.cs;
    $('#hrKv').innerHTML = `<dt>Baseline</dt><dd>${cs.hr} bpm</dd><dt>Now</dt><dd>${hr} bpm${S.meto ? ` (${S.meto * 5} mg metoprolol)` : ''}</dd><dt>Rhythm</dt><dd>${cs.rhythm === 'ectopy' ? 'sinus + ectopics' : 'sinus'}</dd>`;
    $('#btnMeto').disabled = S.meto >= 3 || hr <= 55;
    const hn = [];
    if (hr > 65) hn.push(['gold', `Heart rate ${hr}: aim for under 65 bpm. Give metoprolol, or plan an end-systolic (35–45%) acquisition.`]);
    else hn.push(['ok', `Heart rate ${hr} bpm: good for a mid-diastolic acquisition.`]);
    if (!S.gtn) hn.push(['gold', 'No nitrate: the coronaries are about 10% smaller, so lumen and plaque are harder to judge.']);
    $('#hrNote').innerHTML = hn.map(([c, t]) => `<div class="note ${c}">${t}</div>`).join('');
    $('#phaseRow').style.display = S.gating === 'pro' ? '' : 'none';
    $('#padRow').style.display = S.gating === 'pro' ? '' : 'none';
    const sc = SCANNERS[S.scanner], ds = doseEst();
    const b = blurFor(S.gating === 'flash' ? 65 : S.gating === 'retro' ? bestPhase() : S.phase);
    $('#planKv').innerHTML = [
      ['Scan length', `${ds.L.toFixed(1)} cm`], ['Temporal resolution', `${sc.tr} ms`], ['Heartbeats', S.gating === 'pro' ? `${ds.beats} (${sc.cov} mm coverage)` : S.gating === 'flash' ? '1 (spiral)' : 'spiral, all beats'],
      ['Expected motion', `RCA ${motionGrade(b.R)} · LCx ${motionGrade(b.C)} · LAD ${motionGrade(b.A)}`],
      ['Noise estimate', `${noiseSigma(S.kv, S.mas).toFixed(0)} HU SD`],
      ['CTDIvol · DLP', `${ds.ctdi.toFixed(1)} mGy · ${ds.dlp.toFixed(0)} mGy·cm`], ['Effective dose', `${ds.msv.toFixed(1)} mSv`],
    ].map(([a, c]) => `<dt>${a}</dt><dd>${c}</dd>`).join('');
    const n = [];
    const hrv = hrNow();
    if (S.gating === 'flash' && hrv > 65) n.push(['warn', 'High-pitch spiral needs a slow, regular rhythm (≤60–65 bpm). Expect motion at this rate.']);
    if (S.gating === 'flash' && S.scanner !== 'ds') n.push(['warn', 'High-pitch spiral is a dual-source technique. Choose the dual-source scanner.']);
    if (S.gating === 'retro') n.push(['gold', 'Retrospective gating lets you reconstruct any phase but costs about three times the dose.']);
    if (S.gating === 'pro' && hrv > 68 && S.phase > 60) n.push(['gold', 'At this heart rate mid-diastole is short. Try a phase near 40% or widen the padding.']);
    if (cs.rhythm === 'ectopy' && S.gating === 'pro' && ds.beats > 1) n.push(['warn', 'Ectopic beats with a multi-beat step-and-shoot scan will cause misregistration. A single-beat wide detector avoids it.']);
    if (S.kv === 80 && cs.bmi > 28) n.push(['gold', '80 kV in a larger patient gives high noise. 100 kV is a better balance.']);
    const cut = coverageProblem();
    if (cut) n.push(['warn', cut]);
    $('#planNotes').innerHTML = n.map(([c, t]) => `<div class="note ${c}">${t}</div>`).join('');
    mark('ecg');
  }
  function bestPhase() { let best = 75, bv = 1e9; for (let p = 30; p <= 85; p++) { const b = blurFor(p); if (b.R < bv - 0.01) { bv = b.R; best = p; } } return best; }
  function coverageProblem() {
    let top = -1e9, bot = 1e9;
    for (const v of VLIST) for (const p of v.pts) { top = Math.max(top, p[2]); bot = Math.min(bot, p[2]); }
    const apex = H2W(HL, 0, 0)[2] - 4;
    bot = Math.min(bot, apex);
    if (S.range[1] < top + 3) return 'The scan starts below the coronary ostia: the left main and proximal arteries will be cut off.';
    if (S.range[0] > bot - 3) return 'The scan ends above the inferior heart: the distal vessels and apex will be cut off.';
    return '';
  }

  function caseCard() {
    const cs = S.cs;
    $('#caseCard').innerHTML = `<b>${esc(cs.pt)}</b> · BMI ${cs.bmi} · HR ${cs.hr} bpm<br><span class="muted small">${esc(cs.hx)}</span>`;
    $('#casePill').textContent = `Case ${S.caseIdx + 1} · ${cs.pt}`;
  }

  let ready = false;
  function loadCase(idx) {
    S.caseIdx = idx; S.cs = CASES[idx]; S.meto = 0;
    HU.set(baseHU); TAG.set(baseTag);
    if (S.cs.infarct) applyInfarct();
    buildCoronaries(S.cs);
    stampCoronaries();
    buildMotionGrid();
    TOPO = null;
    buildTrack(S.read.track);
    S.read.cur = Math.round(TRACK.n * 0.15);
    S.cp = TRACK.p[S.read.cur].slice();
    planZ = VES.LM.pts[0][2];
    invalidateScan();
    caseCard(); updatePlan();
    $('#repFb').innerHTML = '';
    setStep('plan');
  }
  function rebuildCoronaries() {
    // GTN changes vessel calibre
    HU.set(baseHU); TAG.set(baseTag);
    if (S.cs.infarct) applyInfarct();
    buildCoronaries(S.cs); stampCoronaries(); buildMotionGrid(); buildTrack(S.read.track);
  }

  // controls: plan
  const caseSel = $('#caseSel');
  CASES.forEach((c, i) => caseSel.add(new Option(`${i + 1}. ${c.title}`, i)));
  caseSel.addEventListener('change', () => loadCase(+caseSel.value));
  $('#btnMeto').addEventListener('click', () => { S.meto++; invalidateScan(); updatePlan(); });
  $('#chkGtn').addEventListener('change', (e) => { S.gtn = e.target.checked; rebuildCoronaries(); invalidateScan(); updatePlan(); });
  $('#scanSel').addEventListener('change', (e) => { S.scanner = e.target.value; invalidateScan(); updatePlan(); });
  function seg(id, fn) { $$(`#${id} button`).forEach((b) => b.addEventListener('click', () => { $$(`#${id} button`).forEach((x) => x.classList.toggle('on', x === b)); fn(b.dataset.v); })); }
  seg('kvSeg', (v) => { S.kv = +v; invalidateScan(); updatePlan(); });
  seg('gateSeg', (v) => { S.gating = v; invalidateScan(); updatePlan(); });
  seg('vrSeg', (v) => { S.read.vr = v; mark('vr'); });
  const range = (id, out, fn, f = (x) => x) => { const el = $('#' + id); const h = () => { const v = +el.value; $('#' + out).textContent = f(v); fn(v); }; el.addEventListener('input', h); };
  range('masR', 'masO', (v) => { S.mas = v; invalidateScan(); updatePlan(); }, (v) => v + ' mAs');
  range('phaseR', 'phaseO', (v) => { S.phase = v; invalidateScan(); updatePlan(); }, (v) => v + '%');
  range('padR', 'padO', (v) => { S.pad = v; invalidateScan(); updatePlan(); }, (v) => '±' + v + '%');
  $('#btnToCac').addEventListener('click', () => { markDone('plan'); setStep('cac'); });
  $('#btnQuick').addEventListener('click', quickStart);

  // controls: calcium
  $$('#artBtns button').forEach((b) => b.addEventListener('click', () => { S.art = b.dataset.a; $$('#artBtns button').forEach((x) => x.classList.toggle('on', x === b)); }));
  range('cacSlice', 'cacSliceO', (v) => { cacSlice = v; mark('cac'); }, (v) => `${v + 1} / ${S.cac ? S.cac.nS : ''}`);
  $('#btnCacCheck').addEventListener('click', () => {
    renderCacTable(true);
    const u = cacUserTotals(), r = S.cac.ref;
    const ut = u.LM + u.LAD + u.LCX + u.RCA, rt = S.cac.refTotal;
    const wrong = Object.entries(S.cacUser).filter(([id, a]) => S.cac.comps[id - 1].ref !== a).length;
    const missed = S.cac.comps.filter((c) => c.ok && c.ref && !S.cacUser[c.id]).length;
    let h = `<div class="note ${Math.abs(ut - rt) < Math.max(5, rt * 0.05) && !wrong ? 'ok' : 'gold'}">Reference Agatston score <b>${fmt(rt)}</b> (${cacDRS(rt)}). Yours: <b>${fmt(ut)}</b>.`;
    if (missed) h += ` ${missed} coronary lesion slice${missed > 1 ? 's' : ''} not assigned.`;
    if (wrong) h += ` ${wrong} assigned to the wrong artery or to a non-coronary structure.`;
    h += '</div>';
    if (rt === 0) h += '<div class="note">CAC 0. In a symptomatic patient this does not rule out non-calcified plaque: the CTA still matters.</div>';
    $('#cacFb').innerHTML = h;
    S.cacDone = true;
  });
  $('#btnCacAuto').addEventListener('click', () => { S.cacUser = {}; for (const c of S.cac.comps) if (c.ok && c.ref) S.cacUser[c.id] = c.ref; renderCacTable(true); mark('cac'); });
  $('#btnToBolus').addEventListener('click', () => setStep('bolus'));

  // controls: bolus
  range('rateR', 'rateO', (v) => { S.bolus.rate = v; resetBolus(); }, (v) => v + ' ml/s');
  range('volR', 'volO', (v) => { S.bolus.vol = v; resetBolus(); }, (v) => v + ' ml');
  range('thrR', 'thrO', (v) => { S.bolus.thr = v; mark('tac'); }, (v) => v + ' HU');
  range('delayR', 'delayO', (v) => { S.bolus.delay = v; }, (v) => v + ' s');
  $('#concSel').addEventListener('change', (e) => { S.bolus.conc = +e.target.value; resetBolus(); });
  $('#chkChaser').addEventListener('change', (e) => { S.bolus.chaser = e.target.checked; resetBolus(); });
  function resetBolus() { if (S.bolus.running) return; if (S.scanDone) { S.scanDone = false; S.scan = null; $('#btnToRead').disabled = true; $('#steps button[data-step="read"]').disabled = true; $('#steps button[data-step="report"]').disabled = true; $('#scanResult').innerHTML = ''; } S.bolus.curve = []; S.bolus.trig = null; S.bolus.tScan = null; S.bolus.t = 0; $('#bolusStatus').innerHTML = ''; mark('mon', 'tac'); }
  let bolusTimer = 0;
  $('#btnInject').addEventListener('click', () => {
    resetBolus();
    const b = S.bolus; b.running = true; b.t = 0;
    $('#btnInject').disabled = true; $('#btnTrigger').disabled = false;
    let last = performance.now(), nextMon = 8;
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000) * 4; last = now;
      b.t += dt;
      if (b.trig == null && b.t >= nextMon) {
        const h = roiHU(nextMon) + (rnd() - 0.5) * 12;
        b.curve.push([nextMon, h]); nextMon += 1;
        mark('mon', 'tac');
        if (h >= b.thr) doTrigger(b.curve[b.curve.length - 1][0]);
      }
      if (b.trig == null && b.t > 38) { doTrigger(b.t, true); }
      if (b.trig != null && b.t >= b.trig + b.delay) { finishScan(); return; }
      $('#bolusStatus').innerHTML = `<div class="note">${b.trig == null ? `Injecting… t = ${b.t.toFixed(0)} s. ${b.t < 8 ? 'Monitoring starts at 8 s.' : 'Monitoring every second.'}` : `Triggered at ${b.trig.toFixed(0)} s. Breath-hold instruction… scan at ${(b.trig + b.delay).toFixed(0)} s.`}</div>`;
      bolusTimer = requestAnimationFrame(tick);
    };
    bolusTimer = requestAnimationFrame(tick);
  });
  $('#btnTrigger').addEventListener('click', () => { if (S.bolus.running && S.bolus.trig == null) doTrigger(S.bolus.t); });
  function doTrigger(t, forced) {
    S.bolus.trig = t; $('#btnTrigger').disabled = true;
    if (forced) S.bolus.forced = true;
    mark('tac');
  }
  function finishScan() {
    const b = S.bolus; b.running = false; b.tScan = b.trig + b.delay; b.t = b.tScan;
    const e = enh(b.tScan);
    completeScan(e);
    const lv = 43 + e.eA * KVC[S.kv], rv = 43 + e.eR * KVC[S.kv];
    const q = [];
    if (b.forced) q.push(['warn', 'The ROI never reached the threshold, so the scan fired late as a fallback. Check where the ROI is.']);
    if (lv >= 300 && lv <= 550 && rv < lv * 0.8) q.push(['ok', `Good timing: aorta ${Math.round(lv)} HU, right heart ${Math.round(rv)} HU.`]);
    else {
      if (lv < 250) q.push(['warn', `Poor coronary enhancement (${Math.round(lv)} HU). ${b.tScan < S.cs.circ + 5 ? 'The scan was too early: the bolus had not arrived yet.' : 'The scan was too late, or the bolus was too short or too dilute.'}`]);
      else if (lv < 300) q.push(['gold', `Acceptable but low enhancement (${Math.round(lv)} HU). Aim for 300–500 HU.`]);
      else if (lv > 550) q.push(['gold', `Very dense (${Math.round(lv)} HU): fine for the lumen but calcium and contrast blur together. Consider a lower rate or higher kV.`]);
      if (rv >= lv * 0.8) q.push(['gold', `Right heart is dense (${Math.round(rv)} HU): streaks may hide the RCA. A saline chaser helps.`]);
    }
    $('#bolusStatus').innerHTML = q.map(([c, t]) => `<div class="note ${c}">${t}</div>`).join('');
    showScanResult();
    mark('mon', 'tac');
  }
  function completeScan(e) {
    const sigma = noiseSigma(S.kv, S.mas);
    const dose = doseEst();
    S.scan = { e, sigma, dose, cut: coverageProblem() };
    S.scanDone = true;
    // reconstruction phase limits
    const r = $('#reconR');
    if (S.gating === 'pro') { r.min = Math.max(0, S.phase - S.pad); r.max = Math.min(95, S.phase + S.pad); r.value = S.phase; S.read.recon = S.phase; }
    else if (S.gating === 'flash') { r.min = 65; r.max = 65; r.value = 65; S.read.recon = 65; }
    else { r.min = 0; r.max = 95; S.read.recon = bestPhase(); r.value = S.read.recon; }
    $('#reconO').textContent = S.read.recon + '%';
    $('#reconRow').querySelector('label').textContent = S.gating === 'retro' ? 'Recon phase (any)' : S.gating === 'pro' ? 'Recon phase (window)' : 'Recon phase (fixed)';
    if (!S.cac) buildCAC();
    $('#btnToRead').disabled = false;
    $('#steps button[data-step="read"]').disabled = false;
    $('#steps button[data-step="report"]').disabled = false;
    markDone('bolus');
  }
  function showScanResult() {
    const sc = S.scan, b = blurFor(S.read.recon);
    $('#scanResult').innerHTML = `<div class="card"><dl class="kv">
      <dt>Scan time</dt><dd>${S.bolus.tScan.toFixed(0)} s</dd>
      <dt>Aorta</dt><dd>${Math.round(43 + sc.e.eA * KVC[S.kv])} HU</dd>
      <dt>Noise</dt><dd>${sc.sigma.toFixed(0)} HU</dd>
      <dt>Motion R / Cx / LAD</dt><dd>${motionGrade(b.R)} / ${motionGrade(b.C)} / ${motionGrade(b.A)}</dd>
      <dt>Dose</dt><dd>${sc.dose.msv.toFixed(1)} mSv</dd></dl></div>${sc.cut ? `<div class="note warn">${sc.cut}</div>` : ''}`;
  }
  $('#btnToRead').addEventListener('click', () => setStep('read'));

  function quickStart() {
    while (hrNow() > 62 && S.meto < 3) S.meto++;
    if (!S.gtn) { S.gtn = true; $('#chkGtn').checked = true; rebuildCoronaries(); }
    S.gating = 'pro'; S.phase = hrNow() > 66 ? 42 : 75; S.pad = 5;
    $$('#gateSeg button').forEach((x) => x.classList.toggle('on', x.dataset.v === 'pro'));
    $('#phaseR').value = S.phase; $('#phaseO').textContent = S.phase + '%'; $('#padR').value = 5; $('#padO').textContent = '±5%';
    invalidateScan(); updatePlan();
    const b = S.bolus; b.tScan = S.cs.circ + 9; b.trig = b.tScan - b.delay;
    completeScan(enh(b.tScan));
    showScanResult();
    $('#bolusStatus').innerHTML = '<div class="note">Ideal timing used (quick start). Run the injection yourself for the full workflow.</div>';
    ['plan', 'cac'].forEach(markDone);
    setStep('read');
  }

  // controls: read
  const trackSel = $('#trackSel');
  Object.entries(TRACKS).forEach(([k, t]) => trackSel.add(new Option(t.name, k)));
  trackSel.addEventListener('change', () => { S.read.track = trackSel.value; buildTrack(S.read.track); S.read.cur = Math.round(TRACK.n * 0.15); cursorToCP(); mark('vr'); });
  range('rotR', 'rotO', (v) => { S.read.alpha = v; mark('cpr', 'xs'); }, (v) => v + '°');
  $('#wlSel').addEventListener('change', (e) => { S.read.wl = e.target.value.split(',').map(Number); mark('ax', 'mpr', 'cpr', 'xs'); });
  $('#slabSel').addEventListener('change', (e) => { S.read.slab = +e.target.value; mark('ax', 'mpr'); });
  range('reconR', 'reconO', (v) => { S.read.recon = v; updateBlur(v); mark('ax', 'mpr', 'cpr', 'xs', 'readKv'); }, (v) => v + '%');
  $('#btnToReport').addEventListener('click', () => { markDone('read'); setStep('report'); });

  // report
  function buildReportForm() {
    if ($('#repTable').dataset.case === S.cs.id) return;
    $('#repTable').dataset.case = S.cs.id;
    $('#repTable').innerHTML = '<tr><th>Artery</th><th>Worst stenosis</th></tr>' + GROUPS.map((g) => `<tr><td>${GROUP_NAME[g]}</td><td><select data-g="${g}"><option value="">Choose…</option>${GRADES.map((t, i) => `<option value="${i}">${t}</option>`).join('')}</select></td></tr>`).join('');
    $('#repCr').value = ''; $('#repP').value = '';
    $$('#repMods input').forEach((i) => (i.checked = false));
    $('#repFb').innerHTML = '';
  }
  function checkReport(reveal) {
    const key = answerKey(S.cs, S.cac ? S.cac.refTotal : 0);
    let ok = 0, n = 0;
    const li = [];
    for (const g of GROUPS) {
      const sel = $(`#repTable select[data-g="${g}"]`);
      if (reveal) sel.value = key.g[g];
      const v = sel.value === '' ? null : +sel.value;
      n++;
      if (v === key.g[g]) { ok++; li.push(`<li class="good">✓ ${GROUP_NAME[g]}: ${GRADES[key.g[g]]}</li>`); }
      else li.push(`<li class="bad">✗ ${GROUP_NAME[g]}: you said ${v == null ? 'nothing' : GRADES[v]}; answer ${GRADES[key.g[g]]}</li>`);
    }
    if (reveal) $('#repCr').value = key.cr;
    const cr = $('#repCr').value;
    n++; if (cr === key.cr) { ok++; li.push(`<li class="good">✓ CAD-RADS ${key.cr}</li>`); } else li.push(`<li class="bad">✗ CAD-RADS: you said ${cr || 'nothing'}; answer ${key.cr}</li>`);
    if (reveal) $('#repP').value = key.P;
    const P = $('#repP').value;
    n++; if (P === key.P) { ok++; li.push(`<li class="good">✓ Plaque burden ${key.P || 'none'} (CAC ${fmt(S.cac ? S.cac.refTotal : 0)})</li>`); } else li.push(`<li class="bad">✗ Plaque burden: answer ${key.P || 'none (CAC 0)'} from CAC ${fmt(S.cac ? S.cac.refTotal : 0)}</li>`);
    if (reveal) $$('#repMods input').forEach((i) => (i.checked = key.mods.includes(i.value)));
    const mods = $$('#repMods input').filter((i) => i.checked).map((i) => i.value);
    const modOK = ['HRP', 'S', 'G', 'E'].every((m) => mods.includes(m) === key.mods.includes(m));
    n++; if (modOK) { ok++; li.push(`<li class="good">✓ Modifiers: ${key.mods.join(', ') || 'none'}</li>`); } else li.push(`<li class="bad">✗ Modifiers: answer ${key.mods.join(', ') || 'none'}</li>`);
    const full = `CAD-RADS ${key.cr}${key.P ? '/' + key.P : ''}${key.mods.length ? '/' + key.mods.join('/') : ''}`;
    const lesions = (S.cs.lesions || []).map((L, i) => `<button class="btn" data-go="${i}" style="margin:3px 4px 0 0;padding:4px 8px">${VES[L.v].name} ${Math.round(L.sten * 100)}% · ${TYPNAME[TYP[L.type]].split(' (')[0]}</button>`).join('') + (S.cs.bridges || []).map((b, i) => `<button class="btn" data-gob="${i}" style="margin:3px 4px 0 0;padding:4px 8px">${VES[b.v].name} bridge</button>`).join('') + (S.cs.stents || []).map((s, i) => `<button class="btn" data-gos="${i}" style="margin:3px 4px 0 0;padding:4px 8px">${VES[s.v].name} stent</button>`).join('');
    $('#repFb').innerHTML = `<div class="card"><div class="row" style="margin:0"><div class="score">${ok}/${n}</div><div class="small">Final report: <b class="mono">${full}</b></div></div><ul class="tight fb">${li.join('')}</ul>${lesions ? `<div class="small muted" style="margin-top:6px">Go to finding:</div>${lesions}` : ''}</div>` + S.cs.teach.map((t) => `<div class="note">${t}</div>`).join('');
    $$('#repFb [data-go]').forEach((b) => b.addEventListener('click', () => { const L = S.cs.lesions[+b.dataset.go]; goTo(L.v, L.s); }));
    $$('#repFb [data-gob]').forEach((b) => b.addEventListener('click', () => { const B2 = S.cs.bridges[+b.dataset.gob], v = VES[B2.v]; goTo(B2.v, B2.at * v.len); }));
    $$('#repFb [data-gos]').forEach((b) => b.addEventListener('click', () => { const st = S.cs.stents[+b.dataset.gos], v = VES[st.v]; goTo(st.v, ((st.from + st.to) / 2) * v.len); }));
  }
  function goTo(vid, s) {
    const tk = Object.keys(TRACKS).find((k) => TRACKS[k].chain[TRACKS[k].chain.length - 1] === vid) || 'LAD';
    S.read.track = tk; trackSel.value = tk; buildTrack(tk);
    const k = TRACK.tv.findIndex((v, i) => v.id === vid && TRACK.ti[i] * 0.5 >= s);
    S.read.cur = k >= 0 ? k : 0;
    cursorToCP(); mark('vr');
  }
  $('#btnCheck').addEventListener('click', () => checkReport(false));
  $('#btnAnswer').addEventListener('click', () => checkReport(true));
  $('#btnNewCase').addEventListener('click', () => { const n = (S.caseIdx + 1) % CASES.length; caseSel.value = n; loadCase(n); });

  // resize
  const ro = new ResizeObserver(() => {
    if (!ready) return;
    const st = S.step;
    if (st === 'plan') mark('topo', 'planAx', 'ecg');
    else if (st === 'cac') mark('cac');
    else if (st === 'bolus') mark('mon', 'tac');
    else mark('ax', 'mpr', 'vr', 'cpr', 'xs');
  });
  ro.observe($('#stage'));

  // ───────────────────────── boot ─────────────────────────
  async function boot() {
    const bar = $('#loadBar'), txt = $('#loadTxt');
    // yield between chunks so the progress bar can paint (message channel: not throttled in background tabs)
    const frame = () => new Promise((r) => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
    const chunk = 6;
    for (let k = 0; k < NZ; k += chunk) {
      genSlices(k, Math.min(NZ, k + chunk));
      bar.style.width = `${(k / NZ) * 80}%`; txt.textContent = 'Chest, heart and great vessels';
      await frame();
    }
    txt.textContent = 'Lung vessels'; bar.style.width = '84%'; await frame();
    stampLungVessels();
    txt.textContent = 'Detector noise'; bar.style.width = '90%'; await frame();
    genNoise();
    txt.textContent = 'Coronary arteries'; bar.style.width = '97%'; await frame();
    ready = true;
    const q = new URLSearchParams(location.search).get('case');
    const idx = Math.max(0, CASES.findIndex((c) => c.id === q));
    caseSel.value = idx;
    loadCase(idx);
    $('#loading').style.display = 'none';
  }
  boot();
})();
