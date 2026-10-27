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
  // smooth 3D value noise in [-1, 1], used for irregular anatomy
  function hash3(i, j, k) {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1274126177)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) & 0xffff) / 32767.5 - 1;
  }
  function vnoise(x, y, z) {
    const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z);
    let u = x - i, v = y - j, w = z - k;
    u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v); w = w * w * (3 - 2 * w);
    const a = lerp(hash3(i, j, k), hash3(i + 1, j, k), u), b = lerp(hash3(i, j + 1, k), hash3(i + 1, j + 1, k), u);
    const c = lerp(hash3(i, j, k + 1), hash3(i + 1, j, k + 1), u), d = lerp(hash3(i, j + 1, k + 1), hash3(i + 1, j + 1, k + 1), u);
    return lerp(lerp(a, b, v), lerp(c, d, v), w);
  }
  // fast atan2 (max error ~0.01 rad)
  function fatan2(y, x) {
    const ax = Math.abs(x), ay = Math.abs(y), a = Math.min(ax, ay) / (Math.max(ax, ay) || 1), s = a * a;
    let r = ((-0.0464964749 * s + 0.15931422) * s - 0.327622764) * s * a + a;
    if (ay > ax) r = 1.57079637 - r;
    if (x < 0) r = 3.14159274 - r;
    return y < 0 ? -r : r;
  }

  // ───────────────────────── volume grid ─────────────────────────
  // World mm: +x patient left, +y posterior, +z superior. Axial images: patient right on screen left, anterior up.
  const NX = 224, NY = 224, NZ = 160, NXY = NX * NY, NV = NXY * NZ;
  const FOV = 200, ZLEN = 140, X0 = -95, Y0 = -100, Z0 = -80, ZTOP = Z0 + ZLEN;
  const DX = FOV / NX, DZ = ZLEN / NZ;
  const L_BODY = 0, L_HEART = 1, L_BONE = 2, L_COR = 3, L_AORTA = 4, L_FAT = 5, L_LUNG = 6, L_ABD = 7;
  const C_NONE = 0, C_LEFT = 1, C_RIGHT = 2, C_MYO = 3, C_COLL = 4, C_SVC = 5, C_HALF = 6, C_ABD = 7;
  const tg = (l, c) => (l << 3) | c;
  // The same file runs as a web worker to build slabs of the volume in parallel (see the end of "base scene").
  const IS_WORKER = typeof document === 'undefined';
  const SELF_SRC = !IS_WORKER && document.currentScript ? document.currentScript.src : '';

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

  // aortic valve: three closed cusps (diastole) whose bellies sag toward the LV, cusp centres facing the coronary sinuses
  const AV_AX = nrm(sub(A0, H2W(12, 6, 4)));
  const AV_C = sub(A0, mul(AV_AX, 13));
  const AV_U = nrm(cross(AV_AX, [0, 0, 1])), AV_V = cross(AV_AX, AV_U);
  const AV_TH0 = (() => { const d = sub(epiPt(3, 105, 4), ROOT); return Math.atan2(dot(d, AV_V), dot(d, AV_U)); })();
  const SECT = (2 * Math.PI) / 3;
  function aorticLeaf(x, y, z) {
    const px = x - AV_C[0], py = y - AV_C[1], pz = z - AV_C[2];
    if (px * px + py * py + pz * pz > 196) return false;
    const h = px * AV_AX[0] + py * AV_AX[1] + pz * AV_AX[2];
    if (h < -7.5 || h > 1.2) return false;
    const u = px * AV_U[0] + py * AV_U[1] + pz * AV_U[2], v = px * AV_V[0] + py * AV_V[1] + pz * AV_V[2];
    const r = hyp(u, v);
    if (r > 13) return false;
    // angle from the nearest cusp centre (cusp centres face the sinuses and the coronary ostia)
    let ph = Math.atan2(v, u) - AV_TH0;
    ph = ((((ph + SECT / 2) % SECT) + SECT) % SECT) - SECT / 2;
    const t = r / 13, hs = -22 * t * (1 - t) * Math.cos(1.5 * ph);
    return Math.abs(h - hs) < 0.75;
  }
  // aortic root: three sinuses of Valsalva bulge out behind the cusps; narrower at the commissures
  function rootD(x, y, z) {
    const px = x - ROOT[0], py = y - ROOT[1], pz = z - ROOT[2];
    if (px * px + py * py + pz * pz > 484) return 99;
    const h = px * AV_AX[0] + py * AV_AX[1] + pz * AV_AX[2];
    const u = px * AV_U[0] + py * AV_U[1] + pz * AV_U[2], v = px * AV_V[0] + py * AV_V[1] + pz * AV_V[2];
    const lobe = Math.pow(0.5 + 0.5 * Math.cos(3 * (Math.atan2(v, u) - AV_TH0)), 1.5);
    const R = 14.2 + 3.6 * lobe;
    return ((hyp(hyp(u, v) * (ROOT_R / R), h) - ROOT_R) * R) / ROOT_R;
  }
  // mitral valve, open in diastole: long anterior leaflet beside the LVOT, short posterior leaflet
  function mitralLeaf(a, c2, c3) {
    if (a < 0.5 || a > 24) return false;
    const am = -2 - 0.2 * a - 0.008 * a * a;
    if (Math.abs(c2 - am) < 0.7 && Math.abs(c3 - 1) < 12.5 * Math.sqrt(1 - (a / 24.5) ** 2)) return true;
    if (a < 13) { const pm = -16.5 + 0.5 * a; if (Math.abs(c2 - pm) < 0.7 && Math.abs(c3) < 13 * Math.sqrt(1 - (a / 13.5) ** 2)) return true; }
    return false;
  }

  // ───────────────────────── base scene ─────────────────────────
  let OH = 0, OT = 0, OM = 0, SDH = 1e9, SDV = 1e9; // OM: contrast-mixing code, written to the partial-volume array
  const put = (h, t) => { OH = h; OT = t; return true; };

  function heartScene(x, y, z) {
    SDH = 1e9; SDV = 1e9;
    if (x < -85 || x > 105 || y < -90 || y > 82 || z < -95 || z > 80) return false;
    let d, wall = false;
    const dRoot = rootD(x, y, z);
    if (aorticLeaf(x, y, z) && (dRoot < 0 || tubeD(T_LVOT, x, y, z) < 0)) return put(62, tg(L_HEART, 0));
    d = tubeD(T_ASC, x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(44, tg(L_AORTA, C_LEFT)); if (d < 1.6) wall = true;
    d = dRoot; if (d < SDV) SDV = d; if (d < 0) return put(44, tg(L_AORTA, C_LEFT)); if (d < 1.6) wall = true;
    d = tubeD(T_LVOT, x, y, z); if (d < 0) return put(44, tg(L_HEART, C_LEFT));
    d = tubeD(T_DESC, x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(44, tg(L_BODY, C_LEFT)); if (d < 1.6) wall = true;
    d = tubeD(T_SVC, x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(44, tg(L_BODY, C_SVC));
    d = tubeD(T_IVC, x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(40, tg(L_BODY, 0));
    // (the fat sleeve stops at the hilum: out in the lung the vessels carry on as the stamped lung trees)
    for (let i = 0; i < 4; i++) { d = tubeD(T_PVS[i], x, y, z); if (d < SDV && Math.abs(x) < 40) SDV = d; if (d < 0) return put(44, tg(L_HEART, C_LEFT)); }

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
          // trabeculae: irregular, run base to apex, thicker toward the apex
          if (a > 32 && rho > rn - 3.4) {
            const s = Math.atan2(c3, c2) * rn;
            const n = vnoise(a * 0.15, s * 0.5, rho * 0.35);
            if (n > 0.1 + (rn - rho) * 0.17 - (a - 32) * 0.004) return put(40, tg(L_HEART, C_MYO));
          }
          if (mitralLeaf(a, c2, c3)) return put(60, tg(L_HEART, 0));
          return put(43, tg(L_HEART, C_LEFT));
        }
        return put(40, tg(L_HEART, C_MYO));
      }
      if (a < 0 && a > -3 && rho < 17) return put(43, tg(L_HEART, C_LEFT));
    }
    // RV outflow and pulmonary arteries
    d = tubeD(T_PA, x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(44, tg(L_HEART, C_RIGHT));
    d = tubeD(T_LPA, x, y, z); if (d < SDV && x < 38) SDV = d; if (d < 0) return put(44, tg(L_HEART, C_RIGHT));
    d = tubeD(T_RPA, x, y, z); if (d < SDV && x > -36) SDV = d; if (d < 0) return put(44, tg(L_HEART, C_RIGHT));
    // right ventricle
    if (a > -16 && a < 72) {
      const q = rvQ(a, c2, c3, 0), sdr = (Math.sqrt(q) - 1) * 30;
      if (sdr < SDH) SDH = sdr;
      if (q < 1 && (a >= 0 ? rho >= Repi(a) : c2 > 6)) {
        if (rvQ(a, c2, c3, 3.5) < 1) {
          if (a > 18 && rvQ(a, c2, c3, 7) > 1 && vnoise(a * 0.13, c3 * 0.42, c2 * 0.42) > 0.12 + (a < 30 ? (30 - a) * 0.04 : 0)) return put(40, tg(L_HEART, C_MYO));
          return put(43, tg(L_HEART, C_RIGHT));
        }
        return put(40, tg(L_HEART, C_MYO));
      }
    }
    d = tubeD(T_MV, x, y, z); if (d < 0) return put(43, tg(L_HEART, C_LEFT));
    d = tubeD(T_TV, x, y, z); if (d < 0) return put(43, tg(L_HEART, C_RIGHT));
    // atria
    d = ellD(E_LA, x, y, z); if (d < SDH) SDH = d; if (d < 0) return put(43, tg(L_HEART, C_LEFT)); if (d < 2) return put(40, tg(L_HEART, C_MYO));
    d = ellD(E_LAA, x, y, z);
    if (d < 6) d += 2.6 * vnoise(x * 0.16, y * 0.16, z * 0.16); // lobulated appendage
    if (d < SDH) SDH = d;
    if (d < 0) return d > -4.5 && vnoise(x * 0.55 + 9, y * 0.55, z * 0.55) > 0.3 ? put(40, tg(L_HEART, C_MYO)) : put(43, tg(L_HEART, C_LEFT)); // pectinate muscles
    if (d < 1.6) return put(40, tg(L_HEART, C_MYO));
    d = ellD(E_RA, x, y, z); if (d < SDH) SDH = d; if (d < 0) { OM = raMix(x, y, z); return put(43, tg(L_HEART, C_RIGHT)); } if (d < 2) return put(40, tg(L_HEART, C_MYO));
    // oesophagus and airways sit behind the left atrium; the atrium wins where they would overlap
    d = tubeD(T_ESO, x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(z > -40 && d < -5.4 ? -960 : 38, tg(L_BODY, 0));
    for (let i = 0; i < 3; i++) { d = tubeD(T_AIR[i], x, y, z); if (d < SDV) SDV = d; if (d < 0) return put(d < -1.8 ? -990 : 50, tg(L_BODY, 0)); }
    if (wall) return put(46, tg(L_BODY, 0));
    return false;
  }

  // Contrast mixing in the right atrium, as on most CTAs: unopacified blood from the IVC swirls in from below and the
  // SVC jet (dense contrast, or saline once the chaser arrives) from above. Coded like partial volume: the second
  // compartment in the top 3 bits and its share of the voxel in 1/31.
  function raMix(x, y, z) {
    const w = 6 * vnoise(x * 0.05 + 3.1, y * 0.05, z * 0.05);
    const lo = (1 - sstep(2, 24, z)) * sstep(-0.05, 0.4, vnoise((x + w) * 0.12, (y - w) * 0.1, z * 0.075 + w * 0.05)) * 0.85;
    const hi = sstep(10, 30, z) * sstep(0.15, 0.5, vnoise((x - w) * 0.14 + 7.7, (y + w) * 0.12, z * 0.09)) * 0.7;
    if (lo < 0.04 && hi < 0.04) return 0;
    return lo >= hi ? (C_NONE << 5) | Math.round(lo * 31) : (C_SVC << 5) | Math.round(hi * 31);
  }

  // cancellous (marrow) bone with a trabecular texture
  const marrow = (x, y, z, base) => Math.round(base + 50 * vnoise(x * 0.75, y * 0.75, z * 0.75) + 40 * vnoise(x * 1.7 + 3.1, y * 1.7, z * 1.7));

  function chestWall(x, y, z, dOut) {
    // sternum: flat bone with a cortex; the manubrium higher up is wider
    {
      const sw = 15 + 7 * sstep(30, 48, z), u = x / sw, v = (y + 87) / 6.5, q = u * u + v * v;
      if (q < 1) return put(q > 0.8 ? 720 : marrow(x, y, z, 300), tg(L_BONE, 0));
    }
    const ph = Math.atan2(y - 8, x);
    if (dOut < 12) {
      // ribs run obliquely, so each one is cut as an oval with a bright cortex and marrow inside;
      // in front they become costal cartilage
      const f = frac((z + 22 * Math.sin(ph) + 6) / 25);
      const zr = (f - 0.15) / 0.15, rr = (dOut - 5.6) / 3.2, q = zr * zr + rr * rr;
      if (q < 1) {
        if (y < -50 && Math.abs(x) < 62) return put(q > 0.78 ? 165 : 112, tg(L_BODY, 0));
        return put(q > 0.6 ? 820 : marrow(x, y, z, 240), tg(L_BONE, 0));
      }
      // thin extrapleural fat line, then intercostal muscle
      return put(dOut < 1.1 ? -70 : 46, tg(L_BODY, 0));
    }
    // scapula: a thin curved plate behind the posterolateral ribs, ending at the inferior angle
    const pa = Math.atan2(y - 8, Math.abs(x)) / DEG;
    const half = 19 * sstep(-38, -8, z);
    if (half > 0.5) {
      const dp = Math.abs(dOut - 19.5), da = Math.abs(pa - 44);
      if (da < half) {
        if (dp < 2) return put(dp > 1 ? 760 : marrow(x, y, z, 260), tg(L_BONE, 0));
        if (dp < 10) return put(50, tg(L_BODY, 0)); // subscapularis and infraspinatus
      } else if (da < half + 7 && dp < 9) return put(50, tg(L_BODY, 0));
    }
    // pectoral muscles in front (none over the sternum), back muscles behind, then subcutaneous fat
    if (y < -30 && Math.abs(x) > 16 && dOut < 8 + 15 * sstep(16, 70, Math.abs(x))) return put(52, tg(L_BODY, 0));
    if (pa > 55 && dOut < 22 + 10 * sstep(70, 88, pa)) return put(49, tg(L_BODY, 0));
    if (dOut < 15 && y > -30) return put(48, tg(L_BODY, 0));
    return put(-100, tg(L_BODY, 0));
  }

  // thoracic vertebra: body with cortex and trabecular bone, discs and end plates, canal with cord,
  // pedicles and laminae, transverse and spinous processes, and the paraspinal muscles
  const VB = [2, 70];
  function spine(x, y, z, inChest) {
    const u = x - VB[0], v = y - VB[1];
    if (u < -44 || u > 44 || v < -16 || v > 50) return false;
    const lv = frac((z + 10) / 26), disc = lv < 0.19;
    // body: about 32 mm wide and 25 mm deep, with a concave back wall facing the canal
    const bq = (u / 16) ** 2 + (v / (v < 0 ? 13 : 12)) ** 2, back = v - (10 + 2.4 * (u / 11) ** 2);
    if (bq < 1 && back < 0 && tubeD(T_DESC, x, y, z) > 1.5) {
      if (disc) return put(bq > 0.7 ? 105 : 84, tg(L_BONE, 0));
      if (lv < 0.23 || lv > 0.965 || bq > 0.88 || back > -1.1) return put(720, tg(L_BONE, 0));
      return put(marrow(x, y, z, 280) + Math.round(45 * vnoise(x * 2.3, y * 2.3, z * 1.2)), tg(L_BONE, 0));
    }
    const cv = v - 19, cr = hyp(u, cv * 1.1);
    if (cr < 7.5) return put(cr < 4.6 ? 34 : 8, tg(L_BODY, 0)); // cord in CSF
    if (disc && lv < 0.1) {
      // between the pedicles at disc level: ligaments and facet joints
      if (cr < 11.6 && cv > -10) return put(58, tg(L_BODY, 0));
    } else {
      // pedicles and laminae
      if (cr < 11.6 && cv > -10) return put(cr > 10.6 ? 760 : cr < 8.2 ? 520 : marrow(x, y, z, 360), tg(L_BONE, 0));
      // transverse processes reach out and back toward the rib heads
      const au = Math.abs(u), tv = cv - 0.3 * (au - 9);
      if (au > 8 && au < 29 && Math.abs(tv) < 3.4) return put(Math.abs(tv) > 2.2 ? 760 : marrow(x, y, z, 250), tg(L_BONE, 0));
      // spinous process slopes down, so it shows on most levels as a midline bar
      const sv = cv - 10;
      if (sv > 0 && sv < 26 && Math.abs(u) < 3.4 - sv * 0.05 && frac((z + 10 + sv * 0.6) / 26) < 0.7) return put(Math.abs(u) > 2 ? 760 : marrow(x, y, z, 260), tg(L_BONE, 0));
    }
    // erector spinae either side of the posterior elements; lung fills the gutters beside the body
    if (inChest && v > 17 + 0.012 * u * u && Math.abs(u) < 40) return put(48, tg(L_BODY, 0));
    return false;
  }

  // Diaphragm: domes over the liver (right, higher) and the stomach (left); the central tendon under the heart is lower
  function diaphragmZ(x, y) {
    const rec = 0.006 * Math.max(0, y - 38) ** 2; // the posterior recesses reach lower
    const c = -47 - 0.07 * x - 0.06 * y;
    const r = -31 - ((x + 50) ** 2 + 0.6 * (y - 5) ** 2) / 240, l = -41 - ((x - 48) ** 2 + 0.6 * (y - 15) ** 2) / 240;
    return Math.max(c, r, l) - rec;
  }
  function abdomen(x, y, z, zd) {
    if (zd - z < 3) return put(45, tg(L_BODY, 0));
    // stomach: fundus under the left dome, supine so air lies on top (anterior) of the fluid
    {
      const u = (x - 50) / 29, v = (y - 2) / 36, w = (z + 66) / 28, q = u * u + v * v + w * w;
      if (q < 1) {
        if (Math.sqrt(q) > 1 - (3.2 + 1.4 * vnoise(x * 0.3, y * 0.3, z * 0.3)) / 29) return put(42, tg(L_ABD, C_ABD));
        return y < -8 ? put(-990, 0) : put(14, tg(L_ABD, 0));
      }
    }
    // liver, with the left lobe reaching across in front; its edge curves back around the IVC and spine
    if (x < 30 - 0.28 * y - 0.0025 * (y + 10) ** 2 + 5 * vnoise(y * 0.05, z * 0.05, 3.3)) return put(58, tg(L_ABD, C_ABD));
    { const u = (x - 80) / 20, v = (y - 50) / 30, w = (z + 70) / 32; if (u * u + v * v + w * w < 1) return put(50, tg(L_ABD, C_ABD)); } // spleen
    // splenic flexure of the colon low and in front, with some gas; otherwise fat
    if (z < zd - 16 && y < 30) {
      const n = vnoise(x * 0.08, y * 0.08, z * 0.08);
      if (n > 0.16) return put(n > 0.3 ? -940 : 22, tg(L_ABD, 0));
    }
    return put(-95, tg(L_BODY, 0));
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
    // body and chest outlines are not true ellipses: a slow wobble at the sides (none at the sternum or spine)
    const wf = sstep(18, 55, Math.abs(x));
    const bx = x + wf * 5 * vnoise(y * 0.018 + 1.3, z * 0.012, 2.1), by = y + wf * 4 * vnoise(x * 0.018 + 4.7, z * 0.012, 7.3);
    let u = bx / 165, v = (by - 5) / 118;
    const qo = u * u + v * v;
    if (qo > 1) return put(-1000, 0);
    if ((1 - Math.sqrt(qo)) * 118 < 1.6) return put(28, tg(L_BODY, 0)); // skin
    u = bx / 135; v = (by - 8) / 88;
    const qc = u * u + v * v;
    if (spine(x, y, z, qc < 1)) return true;
    if (qc >= 1) return chestWall(x, y, z, (Math.sqrt(qc) - 1) * 100);
    if (heartScene(x, y, z)) return true;
    const zd = diaphragmZ(x, y);
    if (z < zd) return abdomen(x, y, z, zd);
    if (SDH < 7.4) return SDH > 6.5 ? put(32, tg(L_BODY, 0)) : put(-95, tg(L_FAT, 0));
    if (SDV < 4.5 || mediast(x, y, z)) return put(-92, tg(L_BODY, 0));
    if (z < zd + 4) return put(45, tg(L_BODY, 0));
    // dependent (posterior) lung is denser; faint parenchymal texture
    return put(Math.round(-884 + 0.3 * (y + 40) + 14 * vnoise(x * 0.22, y * 0.22, z * 0.22)), tg(L_LUNG, 0));
  }

  // ───────────────────────── building the volume in slabs ─────────────────────────
  // Sample the scene at voxel centres for slices [k0, k1) into slab arrays whose first slice is kb.
  function genSlab(hu, tag, mix, kb, k0, k1) {
    for (let k = k0; k < k1; k++) {
      const z = Z0 + (k + 0.5) * DZ;
      for (let j = 0; j < NY; j++) {
        const y = Y0 + (j + 0.5) * DX;
        let o = ((k - kb) * NY + j) * NX;
        for (let i = 0; i < NX; i++, o++) { OM = 0; scene(X0 + (i + 0.5) * DX, y, z); hu[o] = OH; tag[o] = OT; mix[o] = OM; }
      }
    }
  }
  // Partial volume: boundary voxels (found on the original values) are re-sampled at four sub-points, so edges get
  // in-between values instead of stair steps. The second contrast compartment and its share go to fr.
  const SUB = [[0.25, 0.25, 0.25], [0.25, -0.25, -0.25], [-0.25, 0.25, -0.25], [-0.25, -0.25, 0.25]];
  function antialiasSlab(hu0, tag0, hu, fr, kb, k0, k1) {
    const cnt = new Uint8Array(8), off = (k0 - kb) * NXY;
    for (let k = Math.max(1, k0); k < Math.min(NZ - 1, k1); k++) {
      const z = Z0 + (k + 0.5) * DZ;
      for (let j = 1; j < NY - 1; j++) {
        const y = Y0 + (j + 0.5) * DX, vy = (y - 5) / 123;
        for (let i = 1; i < NX - 1; i++) {
          const x = X0 + (i + 0.5) * DX;
          if ((x / 171) ** 2 + vy * vy > 1) continue;
          const o = ((k - kb) * NY + j) * NX + i, t = tag0[o], h = hu0[o], c0 = t & 7;
          // contrast boundaries, and big density steps (air, bone, fat against soft tissue)
          if (!(((tag0[o - 1] & 7) !== c0) || ((tag0[o + 1] & 7) !== c0) || ((tag0[o - NX] & 7) !== c0) || ((tag0[o + NX] & 7) !== c0) ||
            ((tag0[o - NXY] & 7) !== c0) || ((tag0[o + NXY] & 7) !== c0) ||
            Math.abs(hu0[o - 1] - h) > 130 || Math.abs(hu0[o + 1] - h) > 130 || Math.abs(hu0[o - NX] - h) > 130 || Math.abs(hu0[o + NX] - h) > 130 ||
            Math.abs(hu0[o - NXY] - h) > 130 || Math.abs(hu0[o + NXY] - h) > 130)) continue;
          let sum = h;
          cnt.fill(0); cnt[c0] = 1;
          for (const s of SUB) { scene(x + s[0] * DX, y + s[1] * DX, z + s[2] * DZ); sum += OH; cnt[OT & 7]++; }
          hu[o - off] = Math.round(sum / 5);
          let c2 = 0, n2 = 0;
          for (let c = 0; c < 8; c++) if (c !== c0 && cnt[c] > n2) { n2 = cnt[c]; c2 = c; }
          if (n2) fr[o - off] = (c2 << 5) | Math.round((n2 / 5) * 31);
        }
      }
    }
  }
  // one finished slab for slices [k0, k1), built with a one-slice halo so edges can be checked across slabs
  function buildSlab(k0, k1) {
    const ka = Math.max(0, k0 - 1), kz = Math.min(NZ, k1 + 1);
    const hu0 = new Int16Array((kz - ka) * NXY), tag0 = new Uint8Array((kz - ka) * NXY), mix0 = new Uint8Array((kz - ka) * NXY);
    genSlab(hu0, tag0, mix0, ka, ka, kz);
    const off = (k0 - ka) * NXY, m = (k1 - k0) * NXY;
    const hu = hu0.slice(off, off + m), tag = tag0.slice(off, off + m), fr = mix0.slice(off, off + m);
    antialiasSlab(hu0, tag0, hu, fr, ka, k0, k1);
    return { k0, k1, hu, tag, fr };
  }
  if (IS_WORKER) {
    self.onmessage = (e) => { const r = buildSlab(e.data.k0, e.data.k1); self.postMessage(r, [r.hu.buffer, r.tag.buffer, r.fr.buffer]); };
    return;
  }

  // ───────────────────────── volume arrays (main page only) ─────────────────────────
  const baseHU = new Int16Array(NV), baseTag = new Uint8Array(NV);
  const HU = new Int16Array(NV), TAG = new Uint8Array(NV), NOISE = new Int8Array(NV), BEST = new Uint8Array(NV);
  // partial volume: second contrast compartment (top 3 bits) and its share of the voxel in 1/31 (low 5 bits)
  const baseFR = new Uint8Array(NV), FR = new Uint8Array(NV);
  const GA = new Float32Array(8); // HU added per contrast compartment
  let NAMP = 0; // noise HU per NOISE unit
  // yield to the browser so the progress bar can paint (message channel: not throttled in background tabs)
  const frame = () => new Promise((r) => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
  // Build the base volume in parallel workers when possible, otherwise slab by slab on this thread.
  async function buildVolume(progress) {
    const jobs = [];
    for (let k = 0; k < NZ; k += 10) jobs.push([k, Math.min(NZ, k + 10)]);
    let done = 0;
    const store = (r) => { const o = r.k0 * NXY; baseHU.set(r.hu, o); baseTag.set(r.tag, o); baseFR.set(r.fr, o); progress(++done / jobs.length); };
    const nW = SELF_SRC && typeof Worker !== 'undefined' && location.protocol !== 'file:' ? clamp((navigator.hardwareConcurrency || 4) - 1, 2, 6) : 0;
    if (nW) {
      try {
        await new Promise((resolve, reject) => {
          const workers = [];
          let next = 0, active = 0;
          const finish = (err) => { workers.forEach((w) => w.terminate()); err ? reject(err) : resolve(); };
          const feed = (w) => {
            if (next < jobs.length) { const [k0, k1] = jobs[next++]; active++; w.postMessage({ k0, k1 }); }
            else if (!active) finish();
          };
          for (let i = 0; i < nW; i++) {
            const w = new Worker(SELF_SRC);
            w.onmessage = (e) => { active--; store(e.data); feed(w); };
            w.onerror = (e) => { e.preventDefault(); finish(e.message || 'worker error'); };
            workers.push(w);
          }
          workers.forEach(feed);
        });
        return;
      } catch (err) {
        console.warn('CT lab: building on the main thread', err);
        done = 0;
      }
    }
    for (const [k0, k1] of jobs) { store(buildSlab(k0, k1)); await frame(); }
  }

  // pulmonary arteries and veins: branching trees from each hilum that taper toward the pleura.
  // Each artery has a bronchus beside it (the bronchovascular bundle), starting from the main bronchus.
  function stampLungVessels() {
    seed = 31;
    const segs = [], bsegs = [];
    const inLung = (p) => {
      const i = ((p[0] - X0) / DX) | 0, j = ((p[1] - Y0) / DX) | 0, k = ((p[2] - Z0) / DZ) | 0;
      if (i < 0 || j < 0 || k < 0 || i >= NX || j >= NY || k >= NZ) return -1;
      return baseTag[(k * NY + j) * NX + i] >> 3 === L_LUNG ? 1 : 0;
    };
    // Trees grow one generation at a time (a queue), so the segment budget trims only the smallest branches, evenly
    // across both lungs. Each entry: [start, direction, radius, depth, contrast compartment, bronchus start or null].
    const queue = [], MAXSEG = 24000;
    const grow = (p, dir, r, depth, comp, bp) => {
      let L = clamp(r * 5 + rnd() * 3, 3, 17), q = null;
      // a branch that would leave the lung tries a couple of other directions first
      for (let tries = 0; tries < 3; tries++) {
        const c = add(p, mul(dir, L)), w = inLung(c);
        if (w > 0 || (w === 0 && depth < 2)) { q = c; break; }
        dir = nrm(add(dir, [(rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.6])); L *= 0.7;
      }
      if (!q) return;
      segs.push([p, q, r, comp]);
      // the bronchus runs alongside, about as wide as its artery, until it is too small to see
      let bq = null;
      if (bp && r > 0.8) {
        const side = nrm(cross(dir, Math.abs(dir[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1]));
        bq = add(q, mul(side, r * 2.2 + 0.4));
        bsegs.push([bp, bq, r * 0.92]);
      }
      const nb = depth < 2 ? 3 : 2;
      for (let b = 0; b < nb; b++) {
        const nd = nrm(add(dir, [(rnd() - 0.5) * 1.15, (rnd() - 0.5) * 1.15, (rnd() - 0.5) * 1.15]));
        const rc = r * (nb === 3 ? 0.68 : 0.79) * (0.92 + rnd() * 0.16);
        if (rc >= 0.36 && depth < 14) queue.push([q, nd, rc, depth + 1, comp, bq]);
      }
    };
    // Trees start where the central vessels end: upper-lobe arteries from the pulmonary artery, the rest from the
    // interlobar artery below it; veins from the superior and inferior pulmonary veins. Trunks point along the lobes.
    const HILA = [
      { side: -1, pa: T_RPA.pts[2], il: [-40, 16, 34], pv: [T_PVS[0].pts[1], T_PVS[1].pts[1]], bronchus: [-32, 34, 46] },
      { side: 1, pa: T_LPA.pts[2], il: [42, 20, 36], pv: [T_PVS[2].pts[1], T_PVS[3].pts[1]], bronchus: [38, 36, 40] },
    ];
    // [lateral, posterior, superior, upper lobe?]: apical, anterior, posterior upper; middle/lingula; superior and two basal lower
    const LOBES = [[0.35, -0.1, 1, 1], [0.6, -0.8, 0.45, 1], [0.6, 0.75, 0.55, 1], [0.75, -0.7, -0.3, 0], [0.5, 0.9, -0.15, 0], [0.35, 0.6, -1, 0], [0.7, -0.15, -1, 0]];
    for (const H of HILA) {
      segs.push([H.pa, H.il, 5.2, C_RIGHT]); // interlobar artery
      for (const art of [true, false]) for (const [lx, ly, lz, up] of LOBES) {
        const dir = nrm([H.side * lx + (rnd() - 0.5) * 0.4, ly + (rnd() - 0.5) * 0.4, lz + (rnd() - 0.5) * 0.4]);
        const r = (art ? 3.1 : 2.9) + rnd() * 0.6;
        queue.push(art ? [up ? H.pa : H.il, dir, r, 0, C_RIGHT, H.bronchus] : [H.pv[up ? 0 : 1], dir, r, 0, C_LEFT, null]);
      }
    }
    for (let qi = 0; qi < queue.length && segs.length < MAXSEG; qi++) grow(...queue[qi]);
    // bronchi: keep the nearest lumen surface per voxel, then draw air lumen with a thin soft-tissue wall
    const BD = new Uint8Array(NV).fill(255), BW = new Uint8Array(NV), touched = [];
    for (const [p0, p1, r] of bsegs) {
      const t = tube([p0, p1], r, 1.6), wT = Math.round(clamp(0.17 * r, 0.35, 1.1) * 100);
      const i0 = Math.max(0, ((t.bb[0] - X0) / DX) | 0), i1 = Math.min(NX - 1, ((t.bb[1] - X0) / DX) | 0);
      const j0 = Math.max(0, ((t.bb[2] - Y0) / DX) | 0), j1 = Math.min(NY - 1, ((t.bb[3] - Y0) / DX) | 0);
      const k0 = Math.max(0, ((t.bb[4] - Z0) / DZ) | 0), k1 = Math.min(NZ - 1, ((t.bb[5] - Z0) / DZ) | 0);
      for (let kk = k0; kk <= k1; kk++) for (let jj = j0; jj <= j1; jj++) for (let ii = i0; ii <= i1; ii++) {
        const o = (kk * NY + jj) * NX + ii;
        if (baseTag[o] !== tg(L_LUNG, 0)) continue;
        const dd = tubeD(t, X0 + (ii + 0.5) * DX, Y0 + (jj + 0.5) * DX, Z0 + (kk + 0.5) * DZ);
        if (dd > 1.5) continue;
        const c = clamp(Math.round((dd + 3) * 50), 0, 254);
        if (c < BD[o]) { if (BD[o] === 255) touched.push(o); BD[o] = c; BW[o] = wT; }
      }
    }
    for (const o of touched) {
      const dd = BD[o] / 50 - 3, wT = BW[o] / 100;
      const fl = clamp(0.5 - dd / 0.9, 0, 1);
      let fw = clamp(0.5 + (wT / 2 - Math.abs(dd - wT / 2)) / 0.9, 0, 1);
      if (fl + fw > 1) fw = 1 - fl;
      baseHU[o] = Math.round(fl * -965 + fw * 30 + (1 - fl - fw) * baseHU[o]);
    }
    for (const [p0, p1, r, comp] of segs) {
      const t = tube([p0, p1], r, 1);
      const i0 = Math.max(0, ((t.bb[0] - X0) / DX) | 0), i1 = Math.min(NX - 1, ((t.bb[1] - X0) / DX) | 0);
      const j0 = Math.max(0, ((t.bb[2] - Y0) / DX) | 0), j1 = Math.min(NY - 1, ((t.bb[3] - Y0) / DX) | 0);
      const k0 = Math.max(0, ((t.bb[4] - Z0) / DZ) | 0), k1 = Math.min(NZ - 1, ((t.bb[5] - Z0) / DZ) | 0);
      for (let kk = k0; kk <= k1; kk++) for (let jj = j0; jj <= j1; jj++) for (let ii = i0; ii <= i1; ii++) {
        const o = (kk * NY + jj) * NX + ii;
        if (baseTag[o] >> 3 !== L_LUNG) continue;
        const dd = tubeD(t, X0 + (ii + 0.5) * DX, Y0 + (jj + 0.5) * DX, Z0 + (kk + 0.5) * DZ);
        const w = 0.5 - dd / 0.9;
        if (w <= 0) continue;
        if (w >= 0.5) { baseHU[o] = 42; baseTag[o] = tg(L_LUNG, comp); baseFR[o] = 0; } else if (!(baseTag[o] & 7)) baseHU[o] = Math.max(baseHU[o], Math.round(lerp(-870, 42, w * 1.3)));
      }
    }
  }

  // stamp a tube (list of 0.5 mm points) into the base volume where ok(tag, hu) allows, with soft edges
  function stampTube(pts, radAt, ok, hu, tag) {
    const best = new Map();
    for (let n = 0; n < pts.length; n++) {
      const p = pts[n], r = radAt(n / (pts.length - 1)), Rb = r + 1.2;
      const i0 = Math.max(0, Math.floor((p[0] - Rb - X0) / DX)), i1 = Math.min(NX - 1, Math.ceil((p[0] + Rb - X0) / DX));
      const j0 = Math.max(0, Math.floor((p[1] - Rb - Y0) / DX)), j1 = Math.min(NY - 1, Math.ceil((p[1] + Rb - Y0) / DX));
      const k0 = Math.max(0, Math.floor((p[2] - Rb - Z0) / DZ)), k1 = Math.min(NZ - 1, Math.ceil((p[2] + Rb - Z0) / DZ));
      for (let k = k0; k <= k1; k++) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const d = hyp(X0 + (i + 0.5) * DX - p[0], Y0 + (j + 0.5) * DX - p[1], Z0 + (k + 0.5) * DZ - p[2]);
        const w = clamp(0.5 + (r - d) / 0.9, 0, 1);
        if (w <= 0.03) continue;
        const o = (k * NY + j) * NX + i, prev = best.get(o);
        if (prev === undefined || w > prev) best.set(o, w);
      }
    }
    for (const [o, w] of best) {
      if (!ok(baseTag[o], baseHU[o])) continue;
      baseHU[o] = Math.round(lerp(baseHU[o], hu, w));
      if (w >= 0.5) { baseTag[o] = tag; baseFR[o] = 0; }
    }
  }
  // cardiac veins: anterior interventricular vein → great cardiac vein → coronary sinus → right atrium,
  // plus the middle cardiac vein. They fill late, so they are only moderately dense in the arterial phase.
  function stampVeins() {
    const ok = (t, h) => { const l = t >> 3; return l === L_FAT || (l === L_BODY && (t & 7) === 0 && h < 60 && h > -200); };
    const gcv = [];
    for (let a = 66; a >= 12; a -= 9) gcv.push(epiPt(a, phA(a) + 11, 2.4));
    gcv.push(epiPt(5, 114, 3.6), epiPt(1.5, 136, 4.2), epiPt(1, 160, 4.4), epiPt(1, 186, 4.6), epiPt(1, 212, 4.8), epiPt(1, 236, 5), epiPt(1, 256, 5), epiPt(0, 270, 5.2), [-26, 4, -8], [-33, 6, -2]);
    const g = catmull(gcv);
    stampTube(g, (t) => (t < 0.42 ? lerp(1.0, 2.1, t / 0.42) : lerp(2.1, 4.2, sstep(0.42, 0.95, t))), ok, 43, tg(L_HEART, C_COLL));
    const mcv = [];
    for (let a = 62; a >= 8; a -= 9) mcv.push(epiPt(a, phP(a) - 11, 2.3));
    mcv.push(epiPt(0.5, 262, 4.6));
    stampTube(catmull(mcv), (t) => lerp(0.9, 2.2, t), ok, 43, tg(L_HEART, C_COLL));
    // hepatic veins: not yet filled in the arterial phase, so darker than the liver; they drain into the IVC below the diaphragm
    const liver = (t) => t === tg(L_ABD, C_ABD);
    for (const [pts, r0, r1] of [
      [[[-100, 30, -78], [-75, 25, -66], [-50, 21, -56], [-31, 19, -50]], 1.6, 4.8],
      [[[-40, -45, -79], [-38, -20, -68], [-33, 2, -57], [-29, 16, -50]], 1.5, 4.2],
      [[[5, -40, -76], [-8, -18, -64], [-22, 6, -55], [-28, 16, -50]], 1.4, 3.8],
    ]) stampTube(catmull(pts), (t) => lerp(r0, r1, t * t), liver, 36, tg(L_ABD, 0));
    // azygos vein: up the right side of the spine, then arches over the right main bronchus into the SVC
    const soft = (t, h) => { const l = t >> 3; return !(t & 7) && (l === L_LUNG || l === L_FAT || (l === L_BODY && h > -300 && h < 100)); };
    stampTube(catmull([[-17, 58, -80], [-17, 57, 15], [-19, 50, 40], [-24, 34, 59], [-31, 14, 52]]), (t) => lerp(3, 4.2, t), soft, 42, tg(L_BODY, 0));
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
    // thin overlapping slices are correlated along z too
    for (let o = 0; o < NXY; o++) {
      for (let k = 0; k < NZ; k++) row[k] = f[o + k * NXY];
      for (let k = 1; k < NZ - 1; k++) f[o + k * NXY] = (row[k - 1] + 2 * row[k] + row[k + 1]) * 0.25;
    }
    // noise is higher in the middle of the body, where the beam passes through the most tissue
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const x = X0 + (i + 0.5) * DX, y = Y0 + (j + 0.5) * DX;
      const fac = 0.78 + 0.45 * Math.exp(-((x / 92) ** 2 + ((y - 12) / 66) ** 2));
      for (let k = 0, o = j * NX + i; k < NZ; k++, o += NXY) f[o] *= fac;
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
    return resample(dense, step);
  }
  function resample(dense, step) {
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
    const last = dense[dense.length - 1];
    if (vlen(sub(last, out[out.length - 1])) > step * 0.5) out.push(last.slice());
    return out;
  }
  // gentle tortuosity: smooth sideways displacement along the heart surface, zero at both ends so branches stay attached
  function wiggle(pts, amp, sd) {
    const n = pts.length, out = [], cum = [0];
    for (let i = 1; i < n; i++) cum.push(cum[i - 1] + vlen(sub(pts[i], pts[i - 1])));
    const tot = cum[n - 1];
    for (let i = 0; i < n; i++) {
      const s = cum[i], p = pts[i];
      const ramp = amp * sstep(0, 9, s) * sstep(0, 6, tot - s);
      if (ramp <= 0) { out.push(p); continue; }
      const t = nrm(sub(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]));
      const hp = toH(p), radial = nrm(add(mul(e2, hp[1]), mul(e3, hp[2])));
      let d = [vnoise(s * 0.085 + sd, 1.3, 7.1), vnoise(s * 0.085 + sd, 5.7, 2.9), vnoise(s * 0.085 + sd, 9.2, 4.4)];
      d = sub(d, mul(t, dot(d, t)));
      d = sub(d, mul(radial, dot(d, radial) * 0.75));
      out.push(add(p, mul(d, ramp)));
    }
    return resample(out, 0.5);
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
    D2: { name: 'Diagonal 2', group: 'LAD', mg: 'A', r0: 0.95, r1: 0.5 },
    S1: { name: 'Septal 1', group: 'LAD', mg: 'A', r0: 0.8, r1: 0.45 },
    S2: { name: 'Septal 2', group: 'LAD', mg: 'A', r0: 0.7, r1: 0.4 },
    OM2: { name: 'Obtuse marginal 2', group: 'LCX', mg: 'C', r0: 1.0, r1: 0.55 },
    CB: { name: 'Conus branch', group: 'RCA', mg: 'R', r0: 0.7, r1: 0.45 },
    RVB: { name: 'RV branch', group: 'RCA', mg: 'R', r0: 0.75, r1: 0.45 },
  };
  const WIG = { LM: 0, LAD: 1.3, LCX: 1.4, RCA: 1.9, D1: 1.1, D2: 1, OM1: 1.2, OM2: 1.1, AM: 1, PDA: 1.1, PLB: 1, S1: 0.6, S2: 0.6, CB: 0.8, RVB: 0.9 };
  const TRACKS = {
    LAD: { name: 'LM → LAD', chain: ['LM', 'LAD'] },
    D1: { name: 'Diagonal 1', chain: ['LM', 'LAD', 'D1'] },
    D2: { name: 'Diagonal 2', chain: ['LM', 'LAD', 'D2'] },
    LCX: { name: 'LM → LCx', chain: ['LM', 'LCX'] },
    OM1: { name: 'Obtuse marginal 1', chain: ['LM', 'LCX', 'OM1'] },
    OM2: { name: 'Obtuse marginal 2', chain: ['LM', 'LCX', 'OM2'] },
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
      const pts = WIG[id] ? wiggle(catmull(anchors), WIG[id], id.charCodeAt(0) * 3.7 + id.length * 11.3 + (id.charCodeAt(1) || 0) * 1.9) : catmull(anchors);
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
    // smaller branches: second diagonal, septal perforators (inside the septum), OM2, conus and RV branches
    const wallPt = (a, phi, f) => { const r = lerp(Rendo(a), Repi(a), f); return H2W(a, r * Math.cos(phi * DEG), r * Math.sin(phi * DEG)); };
    bi = nearestIdx(LAD, epiPt(44, phA(44), 2.6));
    mk('D2', [LAD.pts[bi], epiPt(51, phA(51) + 18, 1.7), epiPt(61, phA(61) + 30, 1.5), epiPt(73, phA(73) + 36, 1.3)], 'LAD', bi);
    bi = nearestIdx(LAD, epiPt(16, phA(16), 2.6));
    mk('S1', [LAD.pts[bi], wallPt(19, phA(19) - 7, 0.85), wallPt(24, phA(24) - 22, 0.6), wallPt(31, phA(31) - 40, 0.55), wallPt(39, phA(39) - 56, 0.55)], 'LAD', bi);
    bi = nearestIdx(LAD, epiPt(33, phA(33), 2.6));
    mk('S2', [LAD.pts[bi], wallPt(36, phA(36) - 7, 0.85), wallPt(42, phA(42) - 24, 0.6), wallPt(50, phA(50) - 42, 0.55)], 'LAD', bi);
    bi = nearestIdx(LCX, epiPt(9, 225, 3.6));
    mk('OM2', [LCX.pts[bi], epiPt(17, 223, 1.9), epiPt(31, 220, 1.6), epiPt(47, 216, 1.4)], 'LCX', bi);
    bi = Math.min(RCA.n - 1, cs.anomaly ? 50 : 18);
    mk('CB', [RCA.pts[bi], rvRing(-4, 96, 3.4), rvRing(2, 112, 2.8), rvRing(9, 126, 2.4)], 'RCA', bi);
    bi = nearestIdx(RCA, rvRing(-8, 32, 4.5));
    mk('RVB', [RCA.pts[bi], rvRing(7, 27, 1.8), rvRing(21, 20, 1.6), rvRing(35, 14, 1.4)], 'RCA', bi);

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
      // tapering calibre with a little natural irregularity
      const vs = v.id.charCodeAt(0) * 1.7 + v.id.length * 5.1;
      for (let i = 0; i < n; i++) v.rad[i] = (v.r0 + (v.r1 - v.r0) * Math.pow(i / (n - 1), 0.8)) * gtn * (1 + 0.045 * vnoise(i * 0.04, vs, 2.2));
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
              if (XS.ws > 0.35) { HU[o] = Math.round(lerp(old, 1500, XS.ws)); TAG[o] = tg(L_COR, 0); FR[o] = 0; }
              else if (XS.wl >= 0.55) { HU[o] = 43; TAG[o] = tg(L_COR, XS.lc); FR[o] = 0; }
              else if (XS.wl >= 0.2) { HU[o] = Math.round(lerp(XS.wo > 0.5 ? XS.ph : old, 43, 0.5)); TAG[o] = tg(L_COR, XS.lc === C_LEFT ? C_HALF : XS.lc); FR[o] = 0; }
              else if (XS.wo >= 0.5) { HU[o] = Math.round(XS.ph); TAG[o] = tg(L_COR, 0); FR[o] = 0; }
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
      teach: ['Stent struts bloom. Use the sharp kernel and the wide window: contrast in the stent lumen with no dark rim means it is patent.', 'Stent metal is not calcium: leave it out of the Agatston score.', 'Native disease is graded as usual (25–49% LCx here = CAD-RADS 2), with the S modifier for the stent.', 'Stents of 3 mm or more are assessable on modern scanners; small stents often are not.'],
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
    {
      id: 'minimal', title: 'Minimal plaque', pt: '52 F', hr: 62, bmi: 25, circ: 14, rhythm: 'sinus',
      hx: 'Atypical chest pain, treated hypertension, mother had an MI at 64. CCTA to look for coronary disease.',
      lesions: [
        { v: 'LAD', at: 0.12, len: 6, sten: 0.2, type: 'soft', ecc: 0.7, ang: 150 },
        { v: 'RCA', at: 0.45, len: 3, sten: 0.12, type: 'mixed', ecc: 0.95, ang: -40 },
      ],
      teach: ['A thin non-calcified plaque in the proximal LAD and a small partly calcified plaque in the mid RCA, both under 25%: CAD-RADS 1, minimal non-obstructive disease.', 'Any plaque means atherosclerosis is present. The calcium score sets the plaque burden (CAC 1–100 = P1), and even minimal plaque is a reason to start preventive therapy.', 'Small calcified plaques bloom: grade the lumen on the cross-section, not the size of the bright spot.'],
    },
    {
      id: 'rca-hrp', title: 'Non-obstructive high-risk plaque, RCA', pt: '45 M', hr: 63, bmi: 27, circ: 14, rhythm: 'sinus',
      hx: 'Two episodes of chest pain at rest last week, troponin negative, smoker, LDL 4.6 mmol/l.',
      lesions: [{ v: 'RCA', at: 0.22, len: 14, sten: 0.42, type: 'hrp', ecc: 0.7, ang: 200, rem: 0.45 }],
      teach: ['The proximal RCA plaque narrows the lumen only 25–49%, but it is low attenuation with positive remodelling and spotty calcium: CAD-RADS 2/HRP.', 'The HRP modifier applies at any stenosis grade. Many acute events start in plaques like this that do not limit flow.', 'High-risk plaque calls for intensive preventive therapy. On its own, a non-obstructive plaque is not a reason for invasive angiography.'],
    },
    {
      id: 'obese', title: 'High BMI, noisy images', pt: '50 F', hr: 68, bmi: 38, circ: 16, rhythm: 'sinus',
      hx: 'BMI 38, type 2 diabetes, exertional breathlessness. Plan kV and tube current for a large patient.',
      lesions: [
        { v: 'LAD', at: 0.36, len: 10, sten: 0.4, type: 'soft', ecc: 0.65, ang: 60 },
        { v: 'RCA', at: 0.3, len: 8, sten: 0.3, type: 'soft', ecc: 0.6, ang: 150 },
      ],
      teach: ['Noise rises steeply with body size. For a large patient use 120 kV and a higher tube current, or stronger iterative reconstruction, so non-calcified plaque stays visible.', 'Low kV boosts iodine contrast, but in a large patient too few photons reach the detector and the noise hides soft plaque.', 'Contrast enhancement is lower in large patients: a faster injection or more concentrated contrast helps.', 'The mid-LAD and RCA plaques are both 25–49%: CAD-RADS 2.'],
    },
    {
      id: 'lcx-mod', title: 'Moderate LCx stenosis', pt: '61 M', hr: 62, bmi: 28, circ: 15, rhythm: 'sinus',
      hx: 'Diabetes and hypertension, chest discomfort on exertion, equivocal exercise ECG.',
      lesions: [
        { v: 'LCX', at: 0.3, len: 10, sten: 0.6, type: 'mixed', ecc: 0.7, ang: 250 },
        { v: 'LAD', at: 0.42, len: 8, sten: 0.3, type: 'calc', ecc: 0.85, ang: 110 },
      ],
      teach: ['A 50–69% stenosis is CAD-RADS 3. Functional testing (stress imaging or CT-FFR) is suggested to see whether it limits flow.', 'The LCx runs in the left atrioventricular groove beside the great cardiac vein and the left atrial appendage. Follow the artery on the CPR so you do not grade the vein.', 'In partly calcified plaque, measure the lumen on the cross-section, inside the calcium, not at its outer edge.'],
    },
    {
      id: 'bifurcation', title: 'LAD–diagonal bifurcation lesion', pt: '57 M', hr: 60, bmi: 26, circ: 14, rhythm: 'sinus',
      hx: 'Exertional angina for 3 months despite medical therapy, positive exercise ECG.',
      lesions: [
        { v: 'LAD', at: 0.17, len: 8, sten: 0.74, type: 'mixed', ecc: 0.6, ang: 30 },
        { v: 'LAD', at: 0.235, len: 8, sten: 0.62, type: 'soft', ecc: 0.55, ang: 60 },
        { v: 'D1', at: 0.04, len: 6, sten: 0.55, type: 'soft', ecc: 0.5, ang: 0 },
      ],
      teach: ['Disease on both sides of the first diagonal and at its ostium is a bifurcation lesion. The Medina code scores the proximal main vessel, distal main vessel and side branch (1 = 50% or more): here 1,1,1.', 'Switch the CPR to Diagonal 1 to grade the side-branch ostium; it is easy to miss on the LAD view.', 'The worst stenosis is 70–99% in one vessel: CAD-RADS 4A. Side-branch involvement changes the PCI plan (provisional or two-stent).'],
    },
    {
      id: '3vd', title: 'Three-vessel disease', pt: '69 M', hr: 64, bmi: 29, circ: 16, rhythm: 'sinus',
      hx: 'Type 2 diabetes, ex-smoker, CCS class III angina with falling exercise tolerance.',
      lesions: [
        { v: 'LAD', at: 0.3, len: 12, sten: 0.78, type: 'mixed', ecc: 0.6, ang: 80 },
        { v: 'LCX', at: 0.42, len: 10, sten: 0.76, type: 'calc', ecc: 0.8, ang: 200 },
        { v: 'RCA', at: 0.4, len: 14, sten: 0.82, type: 'soft', ecc: 0.55, ang: 100 },
        { v: 'RCA', at: 0.72, len: 8, sten: 0.35, type: 'calc', ecc: 0.85, ang: -30 },
      ],
      teach: ['70% or more in all three vessels is CAD-RADS 4B (as is left main 50% or more). Invasive angiography is recommended.', 'With diabetes and three-vessel disease the heart team usually favours bypass surgery (FREEDOM trial); the SYNTAX score from the angiogram helps decide.', 'Grade each vessel on its own CPR and cross-section. The calcified LCx lesion blooms, so use the wide window.'],
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
    read: { wl: [800, 250], slab: 0, track: 'LAD', alpha: 0, cur: 40, vr: 'heart', yaw: -35, pitch: 18, zoomVr: 1, mpr: 'cor', recon: 75, zoom: 1, kernel: 'std', ir: 1, labels: true },
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
    const G = ['R', 'C', 'A'], P = {}, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (const g of G) {
      const list = [];
      for (const v of VLIST) if (v.mg === g) for (let i = 0; i < v.n; i += 4) list.push(v.pts[i]);
      const a = new Float64Array(list.length * 3);
      list.forEach((p, n) => { a[3 * n] = p[0]; a[3 * n + 1] = p[1]; a[3 * n + 2] = p[2]; for (let q = 0; q < 3; q++) { lo[q] = Math.min(lo[q], p[q]); hi[q] = Math.max(hi[q], p[q]); } });
      P[g] = a;
    }
    for (let k = 0; k < GZ; k++) for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
      const x = X0 + (i + 0.5) * 4, y = Y0 + (j + 0.5) * 4, z = Z0 + (k + 0.5) * 4;
      const o = (k * GY + j) * GX + i;
      // far from every artery: no motion here, and the exact distances do not matter
      const bx = Math.max(lo[0] - x, 0, x - hi[0]), by = Math.max(lo[1] - y, 0, y - hi[1]), bz = Math.max(lo[2] - z, 0, z - hi[2]);
      if (bx * bx + by * by + bz * bz > 1600) { GD.R[o] = GD.C[o] = GD.A[o] = 1e3; HW[o] = 0; continue; }
      let dmin = 1e9;
      for (const g of G) {
        const a = P[g];
        let m = 1e18;
        for (let n = 0; n < a.length; n += 3) { const dx = a[n] - x, dy = a[n + 1] - y, dz = a[n + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < m) m = d; }
        GD[g][o] = Math.sqrt(m);
        if (GD[g][o] < dmin) dmin = GD[g][o];
      }
      HW[o] = 1 - sstep(22, 40, dmin);
    }
  }
  function updateBlur(phasePct) {
    IMGV++;
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
  let IMGV = 0; // bumped when the images change (case, arteries, scan, recon phase); views cache on it
  // voxel value with contrast, including the partial-volume share of a second compartment
  function hv(o) {
    const g = GA[TAG[o] & 7], f = FR[o];
    return f ? HU[o] + g + (GA[f >> 5] - g) * (f & 31) * 0.032258 : HU[o] + g;
  }
  function tri(x, y, z) {
    let fx = (x - X0) / DX - 0.5, fy = (y - Y0) / DX - 0.5, fz = (z - Z0) / DZ - 0.5;
    if (fx < 0 || fy < 0 || fx >= NX - 1 || fy >= NY - 1) return -1024;
    if (fz < 0) fz = 0; else if (fz >= NZ - 1) fz = NZ - 1.001;
    const i = fx | 0, j = fy | 0, k = fz | 0, tx = fx - i, ty = fy - j, tz = fz - k;
    const o = (k * NY + j) * NX + i, o2 = o + NXY, na = NAMP * NW;
    const h0 = hv(o) + na * NOISE[o], h1 = hv(o + 1) + na * NOISE[o + 1];
    const h2 = hv(o + NX) + na * NOISE[o + NX], h3 = hv(o + NX + 1) + na * NOISE[o + NX + 1];
    const h4 = hv(o2) + na * NOISE[o2], h5 = hv(o2 + 1) + na * NOISE[o2 + 1];
    const h6 = hv(o2 + NX) + na * NOISE[o2 + NX], h7 = hv(o2 + NX + 1) + na * NOISE[o2 + NX + 1];
    const a = h0 + (h1 - h0) * tx, b = h2 + (h3 - h2) * tx, c = h4 + (h5 - h4) * tx, d = h6 + (h7 - h6) * tx;
    const e = a + (b - a) * ty, f = c + (d - c) * ty;
    return e + (f - e) * tz;
  }
  function triNN(x, y, z) {
    let fx = (x - X0) / DX - 0.5, fy = (y - Y0) / DX - 0.5, fz = (z - Z0) / DZ - 0.5;
    if (fx < 0 || fy < 0 || fz < 0 || fx >= NX - 1 || fy >= NY - 1 || fz >= NZ - 1) return -1000;
    const i = fx | 0, j = fy | 0, k = fz | 0, tx = fx - i, ty = fy - j, tz = fz - k;
    const o = (k * NY + j) * NX + i, o2 = o + NXY;
    const h0 = hv(o), h1 = hv(o + 1), h2 = hv(o + NX), h3 = hv(o + NX + 1);
    const h4 = hv(o2), h5 = hv(o2 + 1), h6 = hv(o2 + NX), h7 = hv(o2 + NX + 1);
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
  // Fine grain. Real CCTA noise is finer than the 0.9 mm voxels, so the images take part of their noise from a small
  // tile of lightly smoothed white noise on a 0.42 mm grid (odd periods, so the repeat does not show) and the rest from
  // the noise volume. Only the displayed images get it: the calcium score and the bolus ROI read the volume alone.
  let NW = 1;
  const GT = [53, 59, 47], GTS = 0.42;
  let GRAIN = null;
  function genGrain() {
    const n = GT[0] * GT[1] * GT[2], f = new Float32Array(n), g = new Float32Array(n);
    let s = 12345;
    const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let o = 0; o < n; o++) f[o] = r() + r() + r() - 1.5;
    const at = (i, j, k) => f[((((k + GT[2]) % GT[2]) * GT[1] + (j + GT[1]) % GT[1]) * GT[0]) + (i + GT[0]) % GT[0]];
    let s2 = 0;
    for (let k = 0; k < GT[2]; k++) for (let j = 0; j < GT[1]; j++) for (let i = 0; i < GT[0]; i++) {
      const v = 4 * at(i, j, k) + 2 * (at(i - 1, j, k) + at(i + 1, j, k) + at(i, j - 1, k) + at(i, j + 1, k)) + at(i, j, k - 1) + at(i, j, k + 1);
      g[(k * GT[1] + j) * GT[0] + i] = v; s2 += v * v;
    }
    const sd = Math.sqrt(s2 / n);
    for (let o = 0; o < n; o++) g[o] /= sd;
    GRAIN = g;
  }
  function grainAt(x, y, z) {
    if (!GRAIN) genGrain();
    let fx = (x / GTS) % GT[0], fy = (y / GTS) % GT[1], fz = (z / GTS) % GT[2];
    if (fx < 0) fx += GT[0]; if (fy < 0) fy += GT[1]; if (fz < 0) fz += GT[2];
    const i = fx | 0, j = fy | 0, k = fz | 0, tx = fx - i, ty = fy - j, tz = fz - k;
    const i1 = i + 1 === GT[0] ? 0 : i + 1, j1 = j + 1 === GT[1] ? 0 : j + 1, k1 = k + 1 === GT[2] ? 0 : k + 1;
    const G = GRAIN, X = GT[0], XY = GT[0] * GT[1];
    const a0 = k * XY + j * X, a1 = k * XY + j1 * X, b0 = k1 * XY + j * X, b1 = k1 * XY + j1 * X;
    const a = G[a0 + i] + (G[a0 + i1] - G[a0 + i]) * tx, b = G[a1 + i] + (G[a1 + i1] - G[a1 + i]) * tx;
    const c = G[b0 + i] + (G[b0 + i1] - G[b0 + i]) * tx, d = G[b1 + i] + (G[b1 + i1] - G[b1 + i]) * tx;
    const e = a + (b - a) * ty, f = c + (d - c) * ty;
    return e + (f - e) * tz;
  }
  let USE_MOTION = false, USE_RANGE = true;
  function sampleScan(x, y, z) {
    if (USE_RANGE && (z < S.range[0] || z > S.range[1])) return NODATA;
    NW = 0.7;
    const h = (USE_ART ? sampleMoving(x, y, z) + artAt(x, y, z) : sampleMoving(x, y, z)) + NAMP * 32 * grainAt(x, y, z);
    NW = 1;
    return h;
  }
  function sampleMoving(x, y, z) {
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
    // undiluted contrast in the SVC: a saline chaser flushes it, without one it lingers
    const eS = 3.4 * P * sstep(2, 4, t) * (1 - (b.chaser ? 0.95 : 0.3) * sstep(Ti, Ti + 6, t));
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

  // ───────────────────────── artefacts ─────────────────────────
  // Dense contrast, calcium and stent metal make streaks: thin bright and dark rays through the dense object.
  // Between two dense objects the beam hardens and leaves a dark band. Built per axial slice, on demand,
  // on a 1.25 mm grid for the current scan, then interpolated.
  const AG = 160, AGS = FOV / AG;
  const ARTV = new Float32Array(AG * AG * NZ), ARTK = new Uint8Array(NZ);
  let USE_ART = false, ART_AMP = 1, artScan = null;
  const STREAK = new Map();
  function streakTable(id) {
    let t = STREAK.get(id);
    if (t) return t;
    let s = 1000 + id * 7919;
    const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    t = new Float32Array(256); // angle 0..π: each ray runs through the source in both directions
    for (let n = 0; n < 11; n++) {
      const c = r() * 256, w = 0.9 + r() * 2.2, a = (r() < 0.62 ? -1 : 1) * (0.35 + r() * 0.65);
      for (let i = 0; i < 256; i++) { let d = Math.abs(i - c); d = Math.min(d, 256 - d); t[i] += a * Math.exp(-(d * d) / (2 * w * w)); }
    }
    STREAK.set(id, t);
    return t;
  }
  function resetArtefacts() { ARTK.fill(0); ART_AMP = { 80: 1.6, 100: 1.25, 120: 1 }[S.kv] || 1; }
  function buildArtSlice(k) {
    ARTK[k] = 1;
    const base = k * NXY, out = k * AG * AG;
    ARTV.fill(0, out, out + AG * AG);
    // dense sources on a 7 mm grid (8 × 8 voxels), excluding bone (handled by the scanner's bone correction)
    const BN = NX >> 3, bs = new Float32Array(BN * BN), bx = new Float32Array(BN * BN), by = new Float32Array(BN * BN);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const o = base + j * NX + i, t = TAG[o];
      if (t >> 3 === L_BONE) continue;
      const h = HU[o] + GA[t & 7];
      if (h < 520) continue;
      const e = (h - 520) * DX * DX, b = (j >> 3) * BN + (i >> 3);
      bs[b] += e; bx[b] += e * i; by[b] += e * j;
    }
    let src = [];
    for (let b = 0; b < BN * BN; b++) if (bs[b] > 500) src.push([X0 + (bx[b] / bs[b] + 0.5) * DX, Y0 + (by[b] / bs[b] + 0.5) * DX, bs[b], b]);
    if (!src.length) return;
    src.sort((p, q) => q[2] - p[2]);
    src = src.slice(0, 9);
    const tabs = src.map((s) => streakTable(s[3]));
    const pairs = [];
    for (let a = 0; a < Math.min(6, src.length); a++) for (let b = a + 1; b < Math.min(6, src.length); b++) {
      const A = src[a], Bq = src[b], dx = Bq[0] - A[0], dy = Bq[1] - A[1], L = hyp(dx, dy);
      if (L < 16 || L > 95) continue;
      pairs.push([A[0], A[1], dx / L, dy / L, L, Math.min(90, 0.012 * Math.sqrt(A[2] * Bq[2]))]);
    }
    const K = 0.16 * ART_AMP;
    for (let gj = 0; gj < AG; gj++) {
      const y = Y0 + (gj + 0.5) * AGS;
      for (let gi = 0; gi < AG; gi++) {
        const x = X0 + (gi + 0.5) * AGS;
        if ((x / 160) ** 2 + ((y - 5) / 112) ** 2 > 1) continue;
        let v = 0;
        for (let n = 0; n < src.length; n++) {
          const s = src[n], dx = x - s[0], dy = y - s[1], r = hyp(dx, dy);
          if (r > 115) continue;
          let th = fatan2(dy, dx); if (th < 0) th += Math.PI;
          v += (K * s[2] * tabs[n][((th * 81.487) | 0) & 255] * (1 - r / 115)) / (r + 8);
        }
        for (let n = 0; n < pairs.length; n++) {
          const p = pairs[n], qx = x - p[0], qy = y - p[1], t = qx * p[2] + qy * p[3];
          if (t < 0 || t > p[4]) continue;
          const d = qx * p[3] - qy * p[2];
          v -= p[5] * ART_AMP * Math.exp(-(d * d) / 24) * Math.sqrt(Math.sin((Math.PI * t) / p[4]));
        }
        ARTV[out + gj * AG + gi] = clamp(v, -350, 350);
      }
    }
  }
  function artAt(x, y, z) {
    const k = clamp(Math.round((z - Z0) / DZ - 0.5), 0, NZ - 1);
    if (!ARTK[k]) buildArtSlice(k);
    let fx = (x - X0) / AGS - 0.5, fy = (y - Y0) / AGS - 0.5;
    fx = clamp(fx, 0, AG - 1.001); fy = clamp(fy, 0, AG - 1.001);
    const i = fx | 0, j = fy | 0, tx = fx - i, ty = fy - j, o = k * AG * AG + j * AG + i;
    const a = ARTV[o] + (ARTV[o + 1] - ARTV[o]) * tx, b = ARTV[o + AG] + (ARTV[o + AG + 1] - ARTV[o + AG]) * tx;
    return a + (b - a) * ty;
  }

  // ───────────────────────── reconstruction: kernel and iterative recon ─────────────────────────
  // Applied to each rendered image (HU buffer with pixel spacing in mm). Iterative recon behaves like an
  // edge-preserving filter (lower noise, smoother "plastic" texture); the sharp kernel adds edge overshoot and noise.
  // Medium is a blend of the filtered and the plain (FBP) image, as vendors do at 40–60 %, so it keeps a natural grain.
  // (factors measured on the rendered images)
  const KER_NOISE = { smooth: 0.82, std: 1, sharp: 1.5 }, IR_NOISE = [1, 0.72, 0.55];
  const effSigma = () => (S.scan ? S.scan.sigma * KER_NOISE[S.read.kernel] * IR_NOISE[S.read.ir] : 0);
  function gblur(src, c, r, sx, sy) {
    let a = src;
    for (const [sg, horiz] of [[sx, true], [sy, false]]) {
      if (sg < 0.2) continue;
      const R = Math.ceil(sg * 2.5), w = [];
      let ws = 0;
      for (let q = -R; q <= R; q++) { const v = Math.exp(-(q * q) / (2 * sg * sg)); w.push(v); ws += v; }
      for (let q = 0; q < w.length; q++) w[q] /= ws;
      const b = new Float32Array(a.length);
      if (horiz) {
        for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) { let s = 0; for (let q = -R; q <= R; q++) s += a[y * c + clamp(x + q, 0, c - 1)] * w[q + R]; b[y * c + x] = s; }
      } else {
        for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) { let s = 0; for (let q = -R; q <= R; q++) s += a[clamp(y + q, 0, r - 1) * c + x] * w[q + R]; b[y * c + x] = s; }
      }
      a = b;
    }
    return a === src ? src.slice() : a;
  }
  // edge-preserving smoothing, run as a horizontal then a vertical pass (a fast approximation of a 2D bilateral filter)
  function bilateral(src, c, r, spx, spy, ss) {
    const sig = Math.max(8, (S.scan ? S.scan.sigma : 25) * 2.6);
    const lut = new Float32Array(512);
    for (let i = 0; i < 512; i++) lut[i] = Math.exp(-((i * 2) ** 2) / (2 * sig * sig));
    let a = src;
    for (const horiz of [true, false]) {
      const sp = horiz ? spx : spy, R = clamp(Math.round((ss * 2.2) / sp), 1, 7), step = horiz ? 1 : c, n = horiz ? c : r, w = [];
      for (let q = -R; q <= R; q++) w.push(Math.exp(-((q * sp) ** 2) / (2 * ss * ss)));
      const out = new Float32Array(a.length);
      for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) {
        const o = y * c + x, h = a[o], pos = horiz ? x : y;
        let acc = 0, wsum = 0;
        for (let q = -R; q <= R; q++) {
          const pp = pos + q;
          if (pp < 0 || pp >= n) continue;
          const hv = a[o + q * step], li = (Math.abs(hv - h) * 0.5) | 0;
          if (li >= 512) continue;
          const wt = w[q + R] * lut[li];
          acc += hv * wt; wsum += wt;
        }
        out[o] = acc / wsum;
      }
      a = out;
    }
    return a;
  }
  function reconPost(buf, c, r, spx, spy) {
    const mask = [];
    for (let o = 0; o < buf.length; o++) if (buf[o] === NODATA) { mask.push(o); buf[o] = -1000; }
    let b = buf;
    if (S.read.ir > 0) {
      const f = bilateral(b, c, r, spx, spy, 1.3);
      if (S.read.ir === 1) for (let o = 0; o < f.length; o++) f[o] = 0.5 * (f[o] + b[o]);
      b = f;
    }
    if (S.read.kernel === 'smooth') b = gblur(b, c, r, 0.5 / spx, 0.5 / spy);
    else if (S.read.kernel === 'sharp') { const lo = gblur(b, c, r, 0.6 / spx, 0.6 / spy); for (let o = 0; o < b.length; o++) b[o] += 1.9 * (b[o] - lo[o]); }
    for (const o of mask) b[o] = NODATA;
    return b;
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
  // HU buffer → greyscale RGBA (outside the scan range is dark blue)
  function paint(d, buf, W, L) {
    for (let o = 0; o < buf.length; o++) {
      const h = buf[o], k = o * 4;
      if (h === NODATA) { d[k] = 0; d[k + 1] = 0; d[k + 2] = 0; } else { const g = gray(h, W, L); d[k] = d[k + 1] = d[k + 2] = g; }
      d[k + 3] = 255;
    }
  }

  // sample spacing so the image is about one sample per screen pixel
  function gridFor(vp, wmm, hmm, maxPx = 560, minMM = 0.28, f = 1) {
    const s = Math.min(vp.W / wmm, vp.H / hmm);
    const sp = Math.max(minMM, 1 / s, Math.max(wmm, hmm) / maxPx) * f;
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
    const gF = gridFor(vp, pl.w, pl.h, opts.maxPx || 560);
    const [W, L] = opts.wl || S.read.wl;
    const slab = opts.slab ?? S.read.slab, nn = NORMAL[orient];
    const key = [orient, vp.W, vp.H, gF.c, gF.r, pl.u0, pl.v0, pl.w, pl.h, S.cp[orient === 'ax' ? 2 : orient === 'cor' ? 1 : 0], W, L, slab, opts.recon ? S.read.kernel + S.read.ir : '-',
      IMGV, NAMP, +USE_MOTION, +USE_ART, +USE_RANGE, S.range[0], S.range[1], GA.join(',')].join('|');
    if ((key === vp.mprKey || (LOD && key + '|lod' === vp.mprKey)) && vp.mprG && vp.off.width === vp.mprG.c && vp.off.height === vp.mprG.r) { vp.blit(pl.w, pl.h); vp.plane = { orient, ...pl }; return pl; }
    const g = LOD && opts.recon ? gridFor(vp, pl.w, pl.h, opts.maxPx || 560, 0.28, LOD_F) : gF;
    const id = vp.img(g.c, g.r), d = id.data;
    vp.mprKey = g === gF ? key : key + '|lod'; vp.mprG = g;
    const ns = slab > 0 ? Math.max(2, Math.round(slab / 0.8)) : 1;
    let buf = new Float32Array(g.c * g.r);
    for (let r = 0; r < g.r; r++) {
      const v = pl.v0 + (r + 0.5) * (pl.h / g.r);
      for (let c = 0; c < g.c; c++) {
        const u = pl.u0 + (c + 0.5) * (pl.w / g.c);
        const px = orient === 'sag' ? S.cp[0] : X0 + u, py = orient === 'ax' ? Y0 + v : orient === 'cor' ? S.cp[1] : Y0 + u, pz = orient === 'ax' ? S.cp[2] : ZTOP - v;
        let h;
        if (ns === 1) h = sampleScan(px, py, pz);
        else {
          h = -1e9;
          for (let s = 0; s < ns; s++) { const o = (s / (ns - 1) - 0.5) * slab; const q = sampleScan(px + nn[0] * o, py + nn[1] * o, pz + nn[2] * o); if (q > h) h = q; }
        }
        buf[r * g.c + c] = h;
      }
    }
    if (opts.recon) buf = reconPost(buf, g.c, g.r, pl.w / g.c, pl.h / g.r);
    paint(d, buf, W, L);
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

  // scale bar on the right edge of an image (1 cm ticks), as reading workstations show
  function drawRuler(vp) {
    const pl = vp.plane, f = vp.fit, c = vp.ctx, k = vp.dpr;
    if (!pl) return;
    // below the L / P orientation letter and above the corner text
    const y0 = vp.H / 2 + 16 * k, room = vp.H - 46 * k - y0;
    const len = 50 * f.s < room ? 50 : 20 * f.s < room ? 20 : 10;
    const x = Math.min(vp.W - 12 * k, f.x + pl.w * f.s - 12 * k);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.strokeStyle = 'rgba(220,226,238,.75)'; c.lineWidth = 1 * k; c.beginPath();
    c.moveTo(x, y0); c.lineTo(x, y0 + len * f.s);
    for (let m = 0; m <= len; m += 5) { const y = y0 + m * f.s, w = m % 10 ? 3 : 6; c.moveTo(x - w * k, y); c.lineTo(x, y); }
    c.stroke();
    c.font = `${9.5 * k}px "IBM Plex Mono", monospace`; c.fillStyle = 'rgba(220,226,238,.8)'; c.textAlign = 'right';
    c.fillText(len >= 10 ? `${len / 10} cm` : `${len} mm`, x - 2 * k, y0 + len * f.s + 12 * k);
    c.restore();
  }

  // ───────────────────────── anatomy labels ─────────────────────────
  // Which structure a point belongs to, worked out from the same analytic anatomy the volume was built from.
  const ANAT = ['Ao root', 'Asc Ao', 'Desc Ao', 'SVC', 'IVC', 'PV', 'LV', 'MPA', 'LPA', 'RPA', 'RV', 'LA', 'LAA', 'RA', 'Oes', 'Trachea', 'L bronchus', 'R bronchus', 'Sternum', 'Vertebra', 'R lung', 'L lung', 'Liver', 'Stomach', 'Spleen'];
  const AN = Object.fromEntries(ANAT.map((n, i) => [n, i]));
  function structAt(x, y, z) {
    if (rootD(x, y, z) < 0) return AN['Ao root'];
    if (tubeD(T_ASC, x, y, z) < 0) return AN['Asc Ao'];
    if (tubeD(T_LVOT, x, y, z) < 0) return AN.LV;
    if (tubeD(T_DESC, x, y, z) < 0) return AN['Desc Ao'];
    if (tubeD(T_SVC, x, y, z) < 0) return AN.SVC;
    if (tubeD(T_IVC, x, y, z) < 0) return AN.IVC;
    for (let i = 0; i < 4; i++) if (tubeD(T_PVS[i], x, y, z) < 0) return AN.PV;
    const h = toH([x, y, z]), a = h[0], rho = hyp(h[1], h[2]);
    if (a >= -2 && a <= HL && rho < Repi(Math.max(0, a))) return AN.LV;
    if (tubeD(T_PA, x, y, z) < 0) return AN.MPA;
    if (tubeD(T_LPA, x, y, z) < 0) return AN.LPA;
    if (tubeD(T_RPA, x, y, z) < 0) return AN.RPA;
    if (a > -16 && a < 72 && rvQ(a, h[1], h[2], 0) < 1 && (a >= 0 ? rho >= Repi(a) : h[1] > 6)) return AN.RV;
    if (ellD(E_LA, x, y, z) < 2) return AN.LA;
    if (ellD(E_LAA, x, y, z) < 1.6) return AN.LAA;
    if (ellD(E_RA, x, y, z) < 2) return AN.RA;
    if (tubeD(T_ESO, x, y, z) < 0) return AN.Oes;
    if (tubeD(T_AIR[0], x, y, z) < 0) return AN.Trachea;
    if (tubeD(T_AIR[1], x, y, z) < 0) return AN['L bronchus'];
    if (tubeD(T_AIR[2], x, y, z) < 0) return AN['R bronchus'];
    { const sw = 15 + 7 * sstep(30, 48, z), u = x / sw, v = (y + 87) / 6.5; if (u * u + v * v < 1) return AN.Sternum; }
    { const u = x - VB[0], v = y - VB[1]; if ((u / 16) ** 2 + (v / (v < 0 ? 13 : 12)) ** 2 < 1 && v < 10 + 2.4 * (u / 11) ** 2) return AN.Vertebra; }
    if ((x / 135) ** 2 + ((y - 8) / 88) ** 2 >= 1) return -1;
    if (z < diaphragmZ(x, y)) {
      { const u = (x - 50) / 29, v = (y - 2) / 36, w = (z + 66) / 28; if (u * u + v * v + w * w < 1) return AN.Stomach; }
      { const u = (x - 80) / 20, v = (y - 50) / 30, w = (z + 70) / 32; if (u * u + v * v + w * w < 1) return AN.Spleen; }
      return x < 30 - 0.28 * y - 0.0025 * (y + 10) ** 2 ? AN.Liver : -1;
    }
    const i = Math.floor((x - X0) / DX), j = Math.floor((y - Y0) / DX), k = Math.floor((z - Z0) / DZ);
    if (i < 0 || j < 0 || k < 0 || i >= NX || j >= NY || k >= NZ) return -1;
    return TAG[(k * NY + j) * NX + i] >> 3 === L_LUNG ? (x < 0 ? AN['R lung'] : AN['L lung']) : -1;
  }
  // For each labelled region on a coarse grid, the sample deepest inside it (most same-label neighbours, then nearest
  // the centroid), so the label sits well inside the structure even when it is curved.
  function regionAnchors(ids, nc, nr, minN) {
    const n = new Int32Array(ANAT.length), sc = new Float64Array(ANAT.length), sr = new Float64Array(ANAT.length);
    for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) { const id = ids[r * nc + c]; if (id >= 0) { n[id]++; sc[id] += c; sr[id] += r; } }
    const best = new Int32Array(ANAT.length).fill(-1), bs = new Float64Array(ANAT.length).fill(-1);
    for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
      const id = ids[r * nc + c];
      if (id < 0 || n[id] < minN) continue;
      let m = 0;
      for (let dr = -3; dr <= 3; dr++) { const rr = r + dr; if (rr < 0 || rr >= nr) continue; for (let dc = -3; dc <= 3; dc++) { const cc = c + dc; if (cc >= 0 && cc < nc && ids[rr * nc + cc] === id) m++; } }
      const s = m - 0.001 * ((c - sc[id] / n[id]) ** 2 + (r - sr[id] / n[id]) ** 2);
      if (s > bs[id]) { bs[id] = s; best[id] = r * nc + c; }
    }
    const out = [];
    for (let id = 0; id < ANAT.length; id++) if (best[id] >= 0 && bs[id] >= minN) out.push({ id, c: best[id] % nc, r: (best[id] / nc) | 0 });
    return out;
  }
  const LBL_VES = ['LM', 'LAD', 'LCX', 'RCA', 'D1', 'D2', 'OM1', 'OM2', 'PDA', 'PLB', 'AM', 'S1', 'CB', 'RVB'];
  const VES_SHORT = { LM: 'LM', LAD: 'LAD', LCX: 'LCx', RCA: 'RCA', D1: 'D1', D2: 'D2', OM1: 'OM1', OM2: 'OM2', PDA: 'PDA', PLB: 'PLB', AM: 'AM', S1: 'S1', S2: 'S2', CB: 'Conus', RVB: 'RVB' };
  const vesColor = (v) => `rgb(${ART_COL[v.group].join(',')})`;
  // SCCT segment of a point on an artery: number (0 if it has none) and short name
  const SEG_NO = { LM: 5, D1: 9, D2: 10, OM1: 12, OM2: 14, PDA: 4, PLB: 16 };
  function segOf(v, i) {
    if (v.id === 'LAD') {
      const p = Math.min(VES.D1 ? VES.D1.bi : v.n * 0.25, VES.S1 ? VES.S1.bi : v.n), mid = p + (v.n - 1 - p) / 2;
      return i < p ? [6, 'pLAD'] : i < mid ? [7, 'mLAD'] : [8, 'dLAD'];
    }
    if (v.id === 'LCX') return i < (VES.OM1 ? VES.OM1.bi : v.n * 0.4) ? [11, 'pLCx'] : [13, 'dLCx'];
    if (v.id === 'RCA') { const am = VES.AM ? VES.AM.bi : v.n * 0.6; return i < am / 2 ? [1, 'pRCA'] : i < am ? [2, 'mRCA'] : [3, 'dRCA']; }
    return [SEG_NO[v.id] || 0, VES_SHORT[v.id] || v.id];
  }
  const segText = (v, i) => { const s = segOf(v, i); return s[0] ? `${s[1]} (${s[0]})` : s[1]; };

  // Draw labels without overlaps. Pins (arteries) get a ring and a name on whichever side is free; region labels are
  // centred on their structure. Anything that cannot be placed is left out.
  function drawLabels(vp, items) {
    const c = vp.ctx, k = vp.dpr, boxes = [], hT = 13 * k;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.font = `700 ${10.5 * k}px Manrope, system-ui, sans-serif`; c.textBaseline = 'middle'; c.lineJoin = 'round';
    const free = (b) => b.x0 >= 2 && b.y0 >= 2 && b.x1 <= vp.W - 2 && b.y1 <= vp.H - 2 && !boxes.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
    const text = (t, x, y, col) => { c.lineWidth = 3 * k; c.strokeStyle = 'rgba(0,0,0,.85)'; c.strokeText(t, x, y); c.fillStyle = col; c.fillText(t, x, y); };
    // keep clear of the corner text and buttons laid over the image
    const er = vp.cv.getBoundingClientRect();
    for (const e of vp.el.querySelectorAll('.lbl,.lbtr,.lbr,.lbl2,.tools')) {
      if (!e.offsetParent || !e.textContent.trim()) continue;
      const r = e.getBoundingClientRect();
      boxes.push({ x0: (r.left - er.left - 2) * k, x1: (r.right - er.left + 2) * k, y0: (r.top - er.top - 2) * k, y1: (r.bottom - er.top + 2) * k });
    }
    for (const it of items) if (it.pin) boxes.push({ x0: it.x - it.r, x1: it.x + it.r, y0: it.y - it.r, y1: it.y + it.r });
    for (const it of items) {
      if (!it.pin) continue;
      const w = c.measureText(it.text).width, g = (it.r + 7 * k) * 0.7071;
      for (const [sx, sy] of [[1, -1], [-1, -1], [1, 1], [-1, 1]]) {
        const tx = it.x + sx * g, ty = it.y + sy * g;
        const b = { x0: sx > 0 ? tx : tx - w - 3 * k, x1: sx > 0 ? tx + w + 3 * k : tx, y0: ty - hT / 2, y1: ty + hT / 2 };
        if (!free(b)) continue;
        boxes.push(b);
        c.strokeStyle = it.color; c.lineWidth = 1.4 * k;
        c.beginPath(); c.arc(it.x, it.y, it.r, 0, Math.PI * 2); c.moveTo(it.x + sx * it.r * 0.7071, it.y + sy * it.r * 0.7071); c.lineTo(tx, ty); c.stroke();
        c.textAlign = sx > 0 ? 'left' : 'right';
        text(it.text, tx + sx * 2 * k, ty, it.color);
        break;
      }
    }
    c.textAlign = 'center';
    for (const it of items) {
      if (it.pin) continue;
      const w = c.measureText(it.text).width;
      for (const dy of [0, -hT, hT, -2 * hT, 2 * hT]) {
        const b = { x0: it.x - w / 2 - 2 * k, x1: it.x + w / 2 + 2 * k, y0: it.y + dy - hT / 2, y1: it.y + dy + hT / 2 };
        if (!free(b)) continue;
        boxes.push(b); text(it.text, it.x, it.y + dy, it.color || '#ffe7a3'); break;
      }
    }
    c.restore();
  }
  // labels for an axial / coronal / sagittal image: arteries where they cross the plane, then the structures
  function planeLabels(vp) {
    const pl = vp.plane;
    if (!pl || !S.read.labels) return;
    const lk = vp.mprKey.replace(/\|lod$/, '') + '|' + S.read.slab;
    if (vp.lblKey === lk) return drawLabels(vp, vp.lblItems);
    const o = pl.orient, sp = Math.max(pl.w, pl.h) / 64;
    const nc = Math.max(4, Math.round(pl.w / sp)), nr = Math.max(4, Math.round(pl.h / sp));
    const ids = new Int8Array(nc * nr).fill(-1);
    for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
      const p = planePt(o, pl.u0 + ((c + 0.5) * pl.w) / nc, pl.v0 + ((r + 0.5) * pl.h) / nr);
      if (p[2] >= S.range[0] && p[2] <= S.range[1]) ids[r * nc + c] = structAt(p[0], p[1], p[2]);
    }
    const items = [], ax = o === 'ax' ? 2 : o === 'cor' ? 1 : 0, slab = S.read.slab || 0;
    for (const id of LBL_VES) {
      const v = VES[id];
      if (!v) continue;
      let best = -1, bs = -1e9;
      for (let i = 0; i < v.n; i += 2) {
        const p = v.pts[i];
        if (p[2] < S.range[0] || p[2] > S.range[1]) continue;
        const d = Math.abs(p[ax] - S.cp[ax]);
        if (d > v.rad[i] + 0.5 + slab / 2) continue;
        const q = worldToView(vp, p);
        if (q[0] < 0 || q[1] < 0 || q[0] > vp.W || q[1] > vp.H) continue;
        const s = v.rad[i] - d * 0.5;
        if (s > bs) { bs = s; best = i; }
      }
      if (best < 0) continue;
      const q = worldToView(vp, v.pts[best]);
      items.push({ x: q[0], y: q[1], text: VES_SHORT[id], color: vesColor(v), pin: true, r: Math.max(5 * vp.dpr, v.rad[best] * vp.fit.s + 3 * vp.dpr) });
    }
    for (const a of regionAnchors(ids, nc, nr, 4)) {
      const q = vp.fromMM(((a.c + 0.5) * pl.w) / nc, ((a.r + 0.5) * pl.h) / nr);
      items.push({ x: q[0], y: q[1], text: ANAT[a.id] });
    }
    vp.lblKey = lk; vp.lblItems = items;
    drawLabels(vp, items);
  }
  // labels for the 3D view, from what each pixel's ray hit: an artery is named where its own surface is visible,
  // the chambers and great vessels at the middle of their visible surface
  const VR_ANAT = new Set(['Asc Ao', 'MPA', 'LPA', 'RPA', 'PV', 'LV', 'RV', 'LA', 'LAA', 'RA'].map((n) => AN[n]));
  function vrLabels(cam, ex, ey, cols, rows, hitT, hitV, mode) {
    const out = [], { dir, right, up } = cam;
    VLIST.forEach((v, vi) => {
      if (!LBL_VES.includes(v.id) || v.id === 'S1') return; // septal branches run inside the septum
      for (const f of [0.35, 0.5, 0.22, 0.65, 0.8, 0.12, 0.42, 0.58, 0.28, 0.72, 0.9, 0.06]) {
        const i = Math.round(f * (v.n - 1)), P = v.pts[i];
        if (P[2] < S.range[0] || P[2] > S.range[1]) continue;
        const q = sub(P, VR_CENTER), pc = ((dot(q, right) + ex) / (2 * ex)) * cols, pr = ((ey - dot(q, up)) / (2 * ey)) * rows;
        if (pc < 1 || pr < 1 || pc >= cols - 1 || pr >= rows - 1) continue;
        let ok = mode === 'mip';
        for (let dr = -1; dr <= 1 && !ok; dr++) for (let dc = -1; dc <= 1 && !ok; dc++) if (hitV[((pr | 0) + dr) * cols + (pc | 0) + dc] === vi) ok = true;
        if (!ok) continue;
        out.push({ x: pc / cols, y: pr / rows, text: VES_SHORT[v.id], color: vesColor(v), pin: true, rr: v.rad[i] });
        break;
      }
    });
    if (mode === 'mip') return out;
    const st = 3, nc = Math.floor(cols / st), nr = Math.floor(rows / st), ids = new Int8Array(nc * nr).fill(-1);
    for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
      const pc = c * st + 1, pr = r * st + 1, q = pr * cols + pc, h = hitV[q];
      if (h === -2) { ids[r * nc + c] = AN['Asc Ao']; continue; }
      if (h !== -3) continue;
      // a little way under the surface, so the point is inside the wall of the structure it belongs to
      const u = ((pc + 0.5) / cols) * 2 * ex - ex, w = ey - ((pr + 0.5) / rows) * 2 * ey, t = hitT[q] + 2.5 - 150;
      let id = structAt(VR_CENTER[0] + u * right[0] + w * up[0] + t * dir[0], VR_CENTER[1] + u * right[1] + w * up[1] + t * dir[1], VR_CENTER[2] + u * right[2] + w * up[2] + t * dir[2]);
      if (id === AN['Ao root']) id = AN['Asc Ao'];
      if (VR_ANAT.has(id)) ids[r * nc + c] = id;
    }
    for (const a of regionAnchors(ids, nc, nr, 6)) out.push({ x: (a.c * st + 1.5) / cols, y: (a.r * st + 1.5) / rows, text: a.id === AN['Asc Ao'] ? 'Ao' : ANAT[a.id] });
    return out;
  }

  // ── corner text, as a scanner prints it on every image ──
  const KER_NAME = { smooth: 'smooth', std: 'std', sharp: 'sharp' }, IR_NAME = ['FBP', 'IR3', 'IR5'];
  function dcScan() {
    const sc = S.scan, when = sc && sc.when ? sc.when : new Date();
    const date = when.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), time = when.toTimeString().slice(0, 5);
    return {
      pt: `SIM-${String(S.caseIdx + 1).padStart(4, '0')} · ${esc(S.cs.pt)}`,
      study: `CTA · ${SCANNERS[S.scanner].name}`,
      date: `${date} ${time}`,
      kv: `${S.kv} kV · ${S.mas} mAs${sc ? `<br>CTDIvol ${sc.dose.ctdi.toFixed(1)} mGy` : ''}`,
      recon: `${S.read.slab ? 'MIP ' + S.read.slab.toFixed(1) : '0.9'} mm · ${KER_NAME[S.read.kernel]} · ${IR_NAME[S.read.ir]}`,
      ecg: `${{ pro: 'Prosp', retro: 'Retro', flash: 'Flash' }[S.gating]} ${S.read.recon}% · HR ${Math.round(hrNow())}`,
      wl: `W ${S.read.wl[0]} L ${S.read.wl[1]}`,
    };
  }
  function vrAngle() {
    const yw = ((S.read.yaw % 360) + 540) % 360 - 180, p = S.read.pitch;
    return `${yw <= 0 ? 'LAO' : 'RAO'} ${Math.abs(Math.round(yw))}° · ${p >= 0 ? 'CRA' : 'CAU'} ${Math.abs(Math.round(p))}°`;
  }

  // ───────────────────────── 3D rendering ─────────────────────────
  const VRBOX = [-72, 98, -88, 66, -80, 64];
  const VR_CENTER = [10, -20, -2];
  function camera() {
    const y = S.read.yaw * DEG, p = S.read.pitch * DEG;
    const dir = [Math.sin(y) * Math.cos(p), Math.cos(y) * Math.cos(p), -Math.sin(p)];
    const right = [Math.cos(y), -Math.sin(y), 0];
    const up = cross(right, dir);
    return { dir, right, up, ext: 74 / S.read.zoomVr };
  }
  let vrCache = null;

  // ── 3D coronary tree, drawn from the analytic artery model instead of voxels ──
  // Small arteries are only 2–3 voxels wide, so a voxel surface breaks into beads and gaps. Here each artery is a chain
  // of capsules (1 mm long) sized to its contrast-filled lumen: stenoses narrow it, occlusions leave a gap, faint
  // (late or collateral) filling thins or drops segments, calcium shows as white, stents as metal.
  const TG_CELL = 4;
  let treeGeo = null;
  const treeCache = {};
  function treeKey(outer) { return `${outer ? 'o' : 'l'}|${S.cs && S.cs.id}|${GA[C_LEFT] | 0}|${GA[C_COLL] | 0}|${S.range[0] | 0}|${S.range[1] | 0}|${VLIST.length}|${outer && heartField ? heartField.key : ''}`; }
  // outer = false: contrast-filled lumen at a high threshold (tree view: stenoses narrow, occlusions leave gaps).
  // outer = true: whole vessel with its wall and plaque, as a low-threshold heart VRT shows it.
  function useTreeGeo(outer) {
    const key = treeKey(outer);
    if (!treeCache[outer] || treeCache[outer].key !== key) { buildTreeGeo(190, outer); treeCache[outer] = treeGeo; }
    treeGeo = treeCache[outer];
  }
  // Heart view only: the small side branches a real VRT shows, too small to grade. They are laid along the heart
  // surface and drawn in 3D only, so the slices, calcium score and report are unchanged.
  function addTwigs(segs) {
    let sd = 1;
    const rnd = () => { sd = (sd + 0x6D2B79F5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const inside = (p) => hfAt(p[0], p[1], p[2]) > HF_THR;
    // where the line through q along n meets the heart surface, searching from 6 mm out to 12 mm in
    const onSurf = (q, n) => {
      if (inside(add(q, mul(n, 6)))) return null;
      let a = 6, b = null;
      for (let t = 5.5; t >= -12; t -= 0.5) { if (inside(add(q, mul(n, t)))) { b = t; break; } a = t; }
      if (b === null) return null;
      for (let it = 0; it < 5; it++) { const m = (a + b) / 2; if (inside(add(q, mul(n, m)))) b = m; else a = m; }
      return add(q, mul(n, b));
    };
    const normal = (s) => {
      const e = 1.2;
      const g = [hfAt(s[0] - e, s[1], s[2]) - hfAt(s[0] + e, s[1], s[2]), hfAt(s[0], s[1] - e, s[2]) - hfAt(s[0], s[1] + e, s[2]), hfAt(s[0], s[1], s[2] - e) - hfAt(s[0], s[1], s[2] + e)];
      const l = hyp(g[0], g[1], g[2]);
      return l > 1e-6 ? [g[0] / l, g[1] / l, g[2] / l] : null;
    };
    // twigs stay on the heart: stop where the surface below belongs to the aorta or anything else
    const onHeart = (s, n) => {
      const i = Math.floor((s[0] - n[0] * 1.5 - X0) / DX), j = Math.floor((s[1] - n[1] * 1.5 - Y0) / DX), k = Math.floor((s[2] - n[2] * 1.5 - Z0) / DZ);
      return i >= 0 && j >= 0 && k >= 0 && i < NX && j < NY && k < NZ && (TAG[(k * NY + j) * NX + i] >> 3) === L_HEART;
    };
    const lo = S.range[0], hi = S.range[1];
    for (let vi = 0; vi < VLIST.length; vi++) {
      const v = VLIST[vi];
      if (v.id === 'LM' || v.id === 'S1' || v.id === 'S2') continue;
      sd = 7; for (const ch of v.id) sd = Math.imul(sd ^ ch.charCodeAt(0), 16777619);
      let side = rnd() < 0.5 ? 1 : -1;
      for (let mm = 5 + rnd() * 4; mm < v.len - 7; mm += 6 + rnd() * 7) {
        const i = Math.round(mm / 0.5), p = v.pts[i];
        if (p[2] < lo || p[2] > hi) continue;
        const tg = nrm(sub(v.pts[Math.min(v.n - 1, i + 2)], v.pts[Math.max(0, i - 2)]));
        const h = toH(p);
        let n = nrm(sub(p, H2W(clamp(h[0], 0, HL * 0.55), 0, 0)));
        const s = onSurf(p, n); if (!s) continue;
        n = normal(s); if (!n) continue;
        const r0 = clamp(v.rad[i] * 0.42, 0.32, 0.75), L = (7 + rnd() * 13) * clamp(v.rad[i] / 1.3, 0.55, 1.15);
        side = rnd() < 0.7 ? -side : side;
        const th = (45 + rnd() * 35) * DEG;
        const t = nrm(sub(tg, mul(n, dot(tg, n)))), bn = nrm(cross(n, t));
        let d = nrm(add(mul(t, Math.cos(th)), mul(bn, side * Math.sin(th))));
        const curl = (rnd() - 0.5) * 0.12, steps = Math.max(3, Math.round(L / 1.2));
        let prev = p, prevR = r0 + 0.35, cur = s;
        for (let k = 1; k <= steps; k++) {
          const r = r0 * (1 - 0.7 * k / steps) + 0.3 * (1 - 0.6 * k / steps);
          const s2 = onSurf(add(cur, mul(d, 1.2)), n); if (!s2 || s2[2] < lo || s2[2] > hi) break;
          const n2 = normal(s2); if (!n2 || !onHeart(s2, n2)) break;
          const c = add(s2, mul(n2, r * 0.75)), dd = sub(c, prev);
          segs.push([prev[0], prev[1], prev[2], dd[0], dd[1], dd[2], dot(dd, dd) || 1e-6, prevR, r, 0, vi]);
          prev = c; prevR = r; cur = s2; n = n2;
          // follow the surface, bending gently back toward the parent's course with a little wander
          d = sub(d, mul(n, dot(d, n)));
          d = nrm(add(add(d, mul(t, 0.05)), mul(cross(n, d), curl + (rnd() - 0.5) * 0.25)));
        }
      }
    }
  }
  function buildTreeGeo(thr, outer) {
    const segs = []; // [ax, ay, az, dx, dy, dz, len², r0, r1, kind, artery]  kind: 0 lumen, 1 calcium, 2 stent
    for (let vi = 0; vi < VLIST.length; vi++) {
      const v = VLIST[vi];
      let prev = null;
      for (let i = 0; i < v.n; i += 2) {
        const p = v.pts[i];
        const lumHU = 43 + GA[v.lcomp[i]];
        let r = 0, kind = 0;
        if (v.stent[i]) { r = v.rad[i] + 0.1; kind = 2; }
        else if (v.typ[i] === TYP.calc && v.bmp[i] > 0.25) { r = v.rad[i] * 0.95; kind = 1; }
        // heart view: the outer wall, a little wider as a VRT shows it, tapering over the last centimetre
        else if (outer) r = (v.rad[i] * (1 + 0.25 * v.bmp[i] * (v.rem[i] + 0.3)) + 0.7) * (0.4 + 0.6 * sstep(0, 10, (v.n - 1 - i) * 0.5));
        else if (lumHU > thr + 15) r = lumenAt(v, i).lum / 2 * clamp(0.55 + (lumHU - thr) / 350, 0.55, 1);
        if (p[2] < S.range[0] || p[2] > S.range[1]) r = 0;
        const cur = r > 0.15 ? { p, r, kind } : null;
        if (prev && cur) {
          const d = sub(cur.p, prev.p);
          segs.push([prev.p[0], prev.p[1], prev.p[2], d[0], d[1], d[2], dot(d, d) || 1e-6, prev.r, cur.r, Math.max(prev.kind, cur.kind), vi]);
        }
        prev = cur;
      }
    }
    if (outer && heartField) addTwigs(segs);
    // uniform grid over the 3D box; each cell lists the capsules that reach into it
    const gx = Math.ceil((VRBOX[1] - VRBOX[0]) / TG_CELL), gy = Math.ceil((VRBOX[3] - VRBOX[2]) / TG_CELL), gz = Math.ceil((VRBOX[5] - VRBOX[4]) / TG_CELL);
    const cells = new Array(gx * gy * gz);
    segs.forEach((s, n) => {
      const R = Math.max(s[7], s[8]) + 0.1;
      const lo = [Math.min(s[0], s[0] + s[3]) - R, Math.min(s[1], s[1] + s[4]) - R, Math.min(s[2], s[2] + s[5]) - R];
      const hi = [Math.max(s[0], s[0] + s[3]) + R, Math.max(s[1], s[1] + s[4]) + R, Math.max(s[2], s[2] + s[5]) + R];
      const c0 = [0, 1, 2].map((k) => clamp(Math.floor((lo[k] - VRBOX[2 * k]) / TG_CELL), 0, [gx, gy, gz][k] - 1));
      const c1 = [0, 1, 2].map((k) => clamp(Math.floor((hi[k] - VRBOX[2 * k]) / TG_CELL), 0, [gx, gy, gz][k] - 1));
      for (let k = c0[2]; k <= c1[2]; k++) for (let j = c0[1]; j <= c1[1]; j++) for (let i = c0[0]; i <= c1[0]; i++) {
        const c = (k * gy + j) * gx + i;
        (cells[c] || (cells[c] = [])).push(n);
      }
    });
    // tight box around everything drawn, so rays that miss it cost nothing
    const bb = [ROOT[0] - 23, ROOT[0] + 23, ROOT[1] - 23, ROOT[1] + 23, ROOT[2] - 23, ROOT[2] + 23];
    const grow = (k, lo, hi) => { bb[2 * k] = Math.min(bb[2 * k], lo); bb[2 * k + 1] = Math.max(bb[2 * k + 1], hi); };
    for (let k = 0; k < 3; k++) grow(k, T_ASC.bb[2 * k], T_ASC.bb[2 * k + 1]);
    for (const s of segs) { const R = Math.max(s[7], s[8]) + 0.5; for (let k = 0; k < 3; k++) grow(k, Math.min(s[k], s[k] + s[k + 3]) - R, Math.max(s[k], s[k] + s[k + 3]) + R); }
    treeGeo = { key: treeKey(outer), segs, cells, gx, gy, gz, bb };
  }
  // ── heart surface field: a lightly smoothed copy of the heart and aorta (everything else set to fat) ──
  // Thresholding raw voxels leaves wood-grain terraces; a ~1-voxel blur gives a smooth surface and clean normals.
  const HF_OUT = -100, HF_THR = -20;
  let heartField = null;
  function heartKey() { return `${S.cs && S.cs.id}|${Array.from(GA, (g) => g | 0).join(',')}|${S.range[0] | 0}|${S.range[1] | 0}`; }
  function buildHeartField() {
    let i0 = clamp(Math.floor((VRBOX[0] - X0) / DX), 0, NX - 1), i1 = clamp(Math.ceil((VRBOX[1] - X0) / DX), 0, NX - 1);
    let j0 = clamp(Math.floor((VRBOX[2] - Y0) / DX), 0, NY - 1), j1 = clamp(Math.ceil((VRBOX[3] - Y0) / DX), 0, NY - 1);
    let k0 = clamp(Math.floor((VRBOX[4] - Z0) / DZ), 0, NZ - 1), k1 = clamp(Math.ceil((VRBOX[5] - Z0) / DZ), 0, NZ - 1);
    // shrink to the heart and aorta inside the scan range (plus room for the blur)
    {
      let a0 = 1e9, a1 = -1, b0 = 1e9, b1 = -1, c0 = 1e9, c1 = -1;
      for (let k = k0; k <= k1; k++) {
        const z = Z0 + (k + 0.5) * DZ;
        if (z < S.range[0] || z > S.range[1]) continue;
        for (let j = j0; j <= j1; j++) {
          let o = (k * NY + j) * NX + i0;
          for (let i = i0; i <= i1; i++, o++) {
            const lab = TAG[o] >> 3;
            if (lab !== L_HEART && lab !== L_AORTA) continue;
            if (i < a0) a0 = i; if (i > a1) a1 = i; if (j < b0) b0 = j; if (j > b1) b1 = j; if (k < c0) c0 = k; if (k > c1) c1 = k;
          }
        }
      }
      if (a1 >= 0) {
        const p = 6;
        i0 = Math.max(i0, a0 - p); i1 = Math.min(i1, a1 + p); j0 = Math.max(j0, b0 - p); j1 = Math.min(j1, b1 + p); k0 = Math.max(k0, c0 - p); k1 = Math.min(k1, c1 + p);
      }
    }
    const nx = i1 - i0 + 1, ny = j1 - j0 + 1, nz = k1 - k0 + 1, n = nx * ny * nz;
    let a = new Float32Array(n), b = new Float32Array(n);
    // heart isolation, as a cardiac VRT preset does it: the pulmonary arteries and veins are cut off a little way from
    // the heart (a capsule around the long axis); the aorta is kept
    const HC = { r: 60, a0: -30, a1: 92 }, P0 = add(B, mul(e1, HC.a0)), AX = mul(e1, HC.a1 - HC.a0), AL = dot(AX, AX);
    for (let k = 0; k < nz; k++) {
      const z = Z0 + (k + k0 + 0.5) * DZ, inR = z >= S.range[0] && z <= S.range[1];
      for (let j = 0; j < ny; j++) {
        const y = Y0 + (j + j0 + 0.5) * DX;
        let o = ((k + k0) * NY + j + j0) * NX + i0, q = (k * ny + j) * nx;
        for (let i = 0; i < nx; i++, o++, q++) {
          const lab = TAG[o] >> 3;
          if (!inR || (lab !== L_HEART && lab !== L_AORTA)) { a[q] = HF_OUT; continue; }
          const h = Math.min(900, hv(o));
          if (lab === L_AORTA) { a[q] = h; continue; }
          const x = X0 + (i + i0 + 0.5) * DX, px = x - P0[0], py = y - P0[1], pz = z - P0[2];
          const s = clamp((px * AX[0] + py * AX[1] + pz * AX[2]) / AL, 0, 1);
          const dd = hyp(px - AX[0] * s, py - AX[1] * s, pz - AX[2] * s);
          a[q] = lerp(HF_OUT, h, clamp((HC.r - dd) / 3 + 0.5, 0, 1));
        }
      }
    }
    // shallow grooves: the epicardial fat round each artery is see-through in a VRT, so the arteries lie in channels
    const GD = 1.2;
    for (const v of VLIST) {
      if (v.id === 'LM' || v.id === 'S1' || v.id === 'S2') continue;
      for (let n0 = v.parent ? 0 : 8; n0 < v.n; n0 += 2) {
        const p = v.pts[n0], rc = v.rad[n0] + GD + 0.8, R = rc + 1;
        if (p[2] < S.range[0] - R || p[2] > S.range[1] + R) continue;
        const ia = Math.max(0, Math.floor((p[0] - R - X0) / DX) - i0), ib = Math.min(nx - 1, Math.ceil((p[0] + R - X0) / DX) - i0);
        const ja = Math.max(0, Math.floor((p[1] - R - Y0) / DX) - j0), jb = Math.min(ny - 1, Math.ceil((p[1] + R - Y0) / DX) - j0);
        const ka = Math.max(0, Math.floor((p[2] - R - Z0) / DZ) - k0), kb = Math.min(nz - 1, Math.ceil((p[2] + R - Z0) / DZ) - k0);
        for (let k = ka; k <= kb; k++) {
          const dz = Z0 + (k + k0 + 0.5) * DZ - p[2];
          for (let j = ja; j <= jb; j++) {
            const dy = Y0 + (j + j0 + 0.5) * DX - p[1];
            for (let i = ia; i <= ib; i++) {
              const q = (k * ny + j) * nx + i;
              if (a[q] === HF_OUT || (TAG[((k + k0) * NY + j + j0) * NX + i + i0] >> 3) !== L_HEART) continue;
              const dx = X0 + (i + i0 + 0.5) * DX - p[0], dd = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (dd < R) a[q] = lerp(HF_OUT, a[q], sstep(rc - 1, R, dd));
            }
          }
        }
      }
    }
    // separable [1 4 6 4 1] / 16 along x, y and z, twice (about 1.4 voxels)
    // rows (fixed j, k) that hold anything other than HF_OUT
    let busy = new Uint8Array(ny * nz), busy2 = new Uint8Array(ny * nz);
    for (let r = 0; r < ny * nz; r++) { for (let q = r * nx, e = q + nx; q < e; q++) if (a[q] !== HF_OUT) { busy[r] = 1; break; } }
    for (let pass = 0; pass < 6; pass++) {
      const ax = pass % 3, st = ax === 0 ? 1 : ax === 1 ? nx : nx * ny, len = ax === 0 ? nx : ax === 1 ? ny : nz, s2 = 2 * st;
      for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) {
        const base = (k * ny + j) * nx, pr = ax === 1 ? j : k, row = k * ny + j;
        let any = busy[row];
        if (!any && ax !== 0) {
          const rs = ax === 1 ? 1 : ny;
          for (let d = -2; d <= 2 && !any; d++) { const p2 = pr + d; if (p2 >= 0 && p2 < len) any = busy[row + d * rs]; }
        }
        busy2[row] = any;
        if (!any) { b.fill(HF_OUT, base, base + nx); continue; }
        if (ax !== 0 && pr > 1 && pr < len - 2) {
          for (let q = base, e = base + nx; q < e; q++) b[q] = (a[q - s2] + 4 * a[q - st] + 6 * a[q] + 4 * a[q + st] + a[q + s2]) / 16;
          continue;
        }
        for (let i = 0; i < nx; i++) {
          const q = base + i, p = ax === 0 ? i : pr;
          const m2 = p > 1 ? a[q - s2] : a[q], m1 = p > 0 ? a[q - st] : a[q], p1 = p < len - 1 ? a[q + st] : a[q], p2 = p < len - 2 ? a[q + s2] : a[q];
          b[q] = (m2 + 4 * m1 + 6 * a[q] + 4 * p1 + p2) / 16;
        }
      }
      const t = a; a = b; b = t;
      const u = busy; busy = busy2; busy2 = u;
    }
    // coarse occupancy in 4-voxel cells, grown by one cell: a ray can jump straight through cells the surface is not in
    const OC = 4, ocx = Math.ceil(nx / OC), ocy = Math.ceil(ny / OC), ocz = Math.ceil(nz / OC), occ = new Uint8Array(ocx * ocy * ocz), occ2 = new Uint8Array(occ.length);
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) {
      let q = (k * ny + j) * nx;
      const row = (((k / OC) | 0) * ocy + ((j / OC) | 0)) * ocx;
      for (let i = 0; i < nx; i++, q++) if (a[q] > HF_THR - 30) occ[row + ((i / OC) | 0)] = 1;
    }
    for (let k = 0; k < ocz; k++) for (let j = 0; j < ocy; j++) for (let i = 0; i < ocx; i++) {
      if (!occ[(k * ocy + j) * ocx + i]) continue;
      for (let dk = -1; dk <= 1; dk++) for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const kk = k + dk, jj = j + dj, ii = i + di;
        if (kk >= 0 && jj >= 0 && ii >= 0 && kk < ocz && jj < ocy && ii < ocx) occ2[(kk * ocy + jj) * ocx + ii] = 1;
      }
    }
    const bb = [X0 + (i0 + 0.5) * DX, X0 + (i1 + 0.5) * DX, Y0 + (j0 + 0.5) * DX, Y0 + (j1 + 0.5) * DX, Z0 + (k0 + 0.5) * DZ, Z0 + (k1 + 0.5) * DZ];
    heartField = { key: heartKey(), data: a, i0, j0, k0, nx, ny, nz, OC, ocx, ocy, occ: occ2, bb };
  }
  // if (x, y, z) is in a cell the heart surface cannot be in, the distance (mm) along dir to leave that cell; else 0
  function hfSkip(x, y, z, dir) {
    const F = heartField, fx = (x - X0) / DX - 0.5 - F.i0, fy = (y - Y0) / DX - 0.5 - F.j0, fz = (z - Z0) / DZ - 0.5 - F.k0;
    if (fx < 0 || fy < 0 || fz < 0 || fx >= F.nx - 1 || fy >= F.ny - 1 || fz >= F.nz - 1) return 0;
    const OC = F.OC, ci = (fx / OC) | 0, cj = (fy / OC) | 0, ck = (fz / OC) | 0;
    if (F.occ[(ck * F.ocy + cj) * F.ocx + ci]) return 0;
    let te = 1e9;
    const f = [fx, fy, fz], c = [ci, cj, ck], s = [DX, DX, DZ];
    for (let q = 0; q < 3; q++) {
      const dv = dir[q] / s[q];
      if (dv > 1e-9) te = Math.min(te, ((c[q] + 1) * OC - f[q]) / dv);
      else if (dv < -1e-9) te = Math.min(te, (c[q] * OC - f[q]) / dv);
    }
    return te + 0.02;
  }
  // trilinear sample of the heart field
  function hfAt(x, y, z) {
    const F = heartField;
    let fx = (x - X0) / DX - 0.5 - F.i0, fy = (y - Y0) / DX - 0.5 - F.j0, fz = (z - Z0) / DZ - 0.5 - F.k0;
    if (fx < 0 || fy < 0 || fz < 0 || fx >= F.nx - 1 || fy >= F.ny - 1 || fz >= F.nz - 1) return HF_OUT;
    const i = fx | 0, j = fy | 0, k = fz | 0, tx = fx - i, ty = fy - j, tz = fz - k, D = F.data, sy = F.nx, sz = F.nx * F.ny;
    const o = (k * F.ny + j) * F.nx + i;
    const a = D[o] + (D[o + 1] - D[o]) * tx, b = D[o + sy] + (D[o + sy + 1] - D[o + sy]) * tx;
    const c = D[o + sz] + (D[o + sz + 1] - D[o + sz]) * tx, d = D[o + sz + sy] + (D[o + sz + sy + 1] - D[o + sz + sy]) * tx;
    const e = a + (b - a) * ty, f = c + (d - c) * ty;
    return e + (f - e) * tz;
  }

  // aortic root (three sinuses) and ascending aorta, cut flat at the top of the scan
  let TREE_AORTA = true; // the heart view takes the aorta from the volume instead
  function aortaSD(x, y, z) {
    if (!TREE_AORTA) return 1e9;
    // smooth union, so the sinuses blend into the tubular aorta without a crease
    const a = rootD(x, y, z), b = tubeD(T_ASC, x, y, z), k = 5, hh = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
    const d = b > 1e8 ? a : b + (a - b) * hh - k * hh * (1 - hh);
    return Math.max(d, z - Math.min(S.range[1], VRBOX[5]), S.range[0] - z);
  }
  // signed distance to the nearest capsule in the cell holding (x, y, z), or to the aorta;
  // TREE_HIT gets the closest centreline point and kind (0 lumen, 1 calcium, 2 stent, 3 aorta)
  const TREE_HIT = { qx: 0, qy: 0, qz: 0, kind: 0, vi: -2 };
  function treeSD(x, y, z) {
    const g = treeGeo;
    let best = aortaSD(x, y, z);
    TREE_HIT.kind = 3; TREE_HIT.vi = -2; TREE_HIT.empty = true;
    const i = Math.floor((x - VRBOX[0]) / TG_CELL), j = Math.floor((y - VRBOX[2]) / TG_CELL), k = Math.floor((z - VRBOX[4]) / TG_CELL);
    if (i < 0 || j < 0 || k < 0 || i >= g.gx || j >= g.gy || k >= g.gz) return best;
    const list = g.cells[(k * g.gy + j) * g.gx + i];
    if (!list) return best;
    TREE_HIT.empty = false;
    for (let n = 0; n < list.length; n++) {
      const s = g.segs[list[n]], px = x - s[0], py = y - s[1], pz = z - s[2];
      let h = (px * s[3] + py * s[4] + pz * s[5]) / s[6];
      h = h < 0 ? 0 : h > 1 ? 1 : h;
      const qx = s[0] + s[3] * h, qy = s[1] + s[4] * h, qz = s[2] + s[5] * h;
      const d = hyp(x - qx, y - qy, z - qz) - (s[7] + (s[8] - s[7]) * h);
      if (d < best) { best = d; TREE_HIT.qx = qx; TREE_HIT.qy = qy; TREE_HIT.qz = qz; TREE_HIT.kind = s[9]; TREE_HIT.vi = s[10]; TREE_HIT.r = s[7] + (s[8] - s[7]) * h; }
    }
    return best;
  }
  // march a ray through the tree; returns the hit distance or -1
  function treeRay(o0, dir, t0, t1) {
    const bb = treeGeo.bb;
    for (let k = 0; k < 3; k++) {
      if (Math.abs(dir[k]) < 1e-6) { if (o0[k] < bb[2 * k] || o0[k] > bb[2 * k + 1]) return -1; continue; }
      let ta = (bb[2 * k] - o0[k]) / dir[k], tb = (bb[2 * k + 1] - o0[k]) / dir[k];
      if (ta > tb) { const tt = ta; ta = tb; tb = tt; }
      if (ta > t0) t0 = ta; if (tb < t1) t1 = tb;
    }
    if (t1 <= t0) return -1;
    let t = t0;
    while (t < t1) {
      const x = o0[0] + dir[0] * t, y = o0[1] + dir[1] * t, z = o0[2] + dir[2] * t;
      const d = treeSD(x, y, z);
      if (d < 0.02) return t;
      if (TREE_HIT.empty && d > 1.2) {
        // no artery in this cell and the aorta is not close: jump to where the ray leaves the cell
        let te = Math.min(d, 6);
        for (let k = 0; k < 3; k++) {
          if (Math.abs(dir[k]) < 1e-6) continue;
          const p = k === 0 ? x : k === 1 ? y : z, c0 = VRBOX[2 * k] + Math.floor((p - VRBOX[2 * k]) / TG_CELL) * TG_CELL;
          const te2 = ((dir[k] > 0 ? c0 + TG_CELL : c0) - p) / dir[k];
          if (te2 < te) te = te2;
        }
        t += Math.max(te + 0.01, 0.3);
      } else t += clamp(d, 0.08, 1.2);
    }
    return -1;
  }
  // trilinear sample of the detector noise volume (NOISE units, SD about 30)
  function noiseRaw(x, y, z) {
    const fx = (x - X0) / DX - 0.5, fy = (y - Y0) / DX - 0.5, fz = (z - Z0) / DZ - 0.5;
    if (fx < 0 || fy < 0 || fz < 0 || fx >= NX - 1 || fy >= NY - 1 || fz >= NZ - 1) return 0;
    const i = fx | 0, j = fy | 0, k = fz | 0, tx = fx - i, ty = fy - j, tz = fz - k, o = (k * NY + j) * NX + i, o2 = o + NXY;
    const a = NOISE[o] + (NOISE[o + 1] - NOISE[o]) * tx, b = NOISE[o + NX] + (NOISE[o + NX + 1] - NOISE[o + NX]) * tx;
    const c = NOISE[o2] + (NOISE[o2 + 1] - NOISE[o2]) * tx, d = NOISE[o2 + NX] + (NOISE[o2 + NX + 1] - NOISE[o2 + NX]) * tx;
    const e = a + (b - a) * ty, f = c + (d - c) * ty;
    return e + (f - e) * tz;
  }
  const VR_FR0 = { heart: 150, tree: 200, mip: 150 }, VR_FR = { ...VR_FR0 };
  function renderVR(vp, fast) {
    const cam = camera(), mode = S.read.vr;
    const asp = vp.W / vp.H;
    // the analytic tree is cheap enough to draw finer, which keeps thin branches from stair-stepping
    const res = fast ? VR_FR[mode] : mode === 'tree' ? 440 : 300;
    const cols = asp >= 1 ? Math.round(res * asp) : res, rows = asp >= 1 ? res : Math.round(res / asp);
    const id = vp.img(cols, rows), d = id.data;
    const ex = cam.ext * (asp >= 1 ? asp : 1), ey = cam.ext * (asp >= 1 ? 1 : 1 / asp);
    const mask = new Uint8Array(8);
    mask[L_HEART] = 1; mask[L_COR] = 1; mask[L_AORTA] = 1;
    // Heart: smoothed heart field plus analytic coronaries. Tree: analytic coronaries and aortic root only.
    if (mode === 'heart' && (!heartField || heartField.key !== heartKey())) buildHeartField();
    useTreeGeo(mode === 'heart');
    TREE_AORTA = mode === 'tree';
    const step = fast ? 1.1 : 0.7;
    const { dir, right, up } = cam;
    const light = nrm(add(mul(dir, -1), mul(up, 0.45)));
    const lightR = nrm(add(mul(dir, -0.6), add(mul(right, -0.6), mul(up, 0.3))));
    const half = nrm(add(light, mul(dir, -1)));
    const rangeLo = S.range[0], rangeHi = S.range[1];
    // how solid the space at a point is (0..1), for ambient occlusion: the heart surface and the arteries
    const solid = (x, y, z) => {
      let s = clamp(0.5 - treeSD(x, y, z) / 0.8, 0, 1);
      if (mode === 'heart') s = Math.max(s, clamp((hfAt(x, y, z) - HF_THR + 50) / 110, 0, 1));
      return s;
    };
    // ambient occlusion: probe outward along the normal; grooves, branch points and vessels lying on muscle darken
    const AO_D = mode === 'heart' ? [1.3, 2.8, 5, 8] : [0.8, 1.8, 3.3, 5.5], AO_W = [0.34, 0.27, 0.21, 0.18], nAO = fast ? 2 : 4;
    const ao = (x, y, z, nx, ny, nz) => {
      let occ = 0, wsum = 0;
      for (let q = 0; q < nAO; q++) { const dd = AO_D[q]; occ += AO_W[q] * solid(x + nx * dd, y + ny * dd, z + nz * dd); wsum += AO_W[q]; }
      return 1 - 0.85 * (occ / wsum);
    };
    let R = 0, G = 0, Bc = 0, AMB = 0.2;
    const rimK = mode === 'heart' ? 0.07 : 0.22;
    const shade = (base, nx, ny, nz, occl, depth, sp, sk) => {
      const lam = Math.max(0, nx * light[0] + ny * light[1] + nz * light[2]);
      const lam2 = Math.max(0, nx * lightR[0] + ny * lightR[1] + nz * lightR[2]);
      const spec = Math.pow(Math.max(0, nx * half[0] + ny * half[1] + nz * half[2]), sp) * sk * (0.4 + 0.6 * occl);
      const rim = Math.pow(1 - Math.abs(nx * dir[0] + ny * dir[1] + nz * dir[2]), 3) * rimK;
      const sh = ((AMB + 0.62 * lam + 0.2 * lam2) * (0.3 + 0.7 * occl) + rim) * depth;
      R = clamp(base[0] * sh + 160 * spec, 0, 255); G = clamp(base[1] * sh + 140 * spec, 0, 255); Bc = clamp(base[2] * sh + 130 * spec, 0, 255);
    };
    // cardiac VRT preset: muted brown-red muscle, contrast-filled structures pink to white
    const C_MUSCLE = [138, 68, 56], C_BLOOD = [196, 112, 96], C_BRIGHT = [244, 214, 200];
    // arteries: thick, dense contrast renders cream-white; thin distal branches (partial volume) go red
    const C_ART = [252, 230, 196], C_ART_THIN = [206, 78, 64];
    // surface grain: a real VRT takes its normals from noisy data, so the surface is finely rough, more so in noisy scans
    const rough = mode === 'heart' ? clamp(NAMP * 0.004, 0.003, 0.02) : 0;
    let BX = 0, BY = 0, BZ = 0;
    const bump = (x, y, z, nx, ny, nz, k) => {
      if (k <= 0) { BX = nx; BY = ny; BZ = nz; return; }
      const e = 0.6, f = 3.2, F = 6, W = 0.25;
      let gx = W * (noiseRaw(x + e, y, z) - noiseRaw(x - e, y, z)), gy = W * (noiseRaw(x, y + e, z) - noiseRaw(x, y - e, z)), gz = W * (noiseRaw(x, y, z + e) - noiseRaw(x, y, z - e));
      // plus a finer grain than the 0.9 mm voxels can carry
      gx += F * (vnoise((x + 0.3) * f, y * f, z * f) - vnoise((x - 0.3) * f, y * f, z * f));
      gy += F * (vnoise(x * f, (y + 0.3) * f, z * f) - vnoise(x * f, (y - 0.3) * f, z * f));
      gz += F * (vnoise(x * f, y * f, (z + 0.3) * f) - vnoise(x * f, y * f, (z - 0.3) * f));
      const gn = gx * nx + gy * ny + gz * nz;
      gx -= gn * nx; gy -= gn * ny; gz -= gn * nz;
      BX = nx - k * gx; BY = ny - k * gy; BZ = nz - k * gz;
      const l = hyp(BX, BY, BZ) || 1; BX /= l; BY /= l; BZ /= l;
    };
    // what each pixel shows: artery index, -2 aorta (tree view), -3 heart surface, -1 nothing; and the hit distance
    const hitV = new Int16Array(cols * rows).fill(-1), hitT = new Float32Array(cols * rows);
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
        R = 0; G = 0; Bc = 0;
        if (t1 > t0) {
          let mx = -1e9, hit = -1;
          if (mode === 'mip') {
            for (let t = t0; t < t1; t += step) {
              const x = o0[0] + dir[0] * t, y = o0[1] + dir[1] * t, z = o0[2] + dir[2] * t;
              if (z < rangeLo || z > rangeHi) continue;
              const i = ((x - X0) / DX) | 0, j = ((y - Y0) / DX) | 0, k = ((z - Z0) / DZ) | 0;
              if (i < 0 || j < 0 || k < 0 || i >= NX || j >= NY || k >= NZ) continue;
              const o = (k * NY + j) * NX + i, tgv = TAG[o];
              if (!mask[tgv >> 3]) continue;
              // with detector noise, as a real MIP has (the maximum also picks up the noise peaks)
              const h = HU[o] + GA[tgv & 7] + NAMP * NOISE[o];
              if (h > mx) mx = h;
            }
            if (mx > -1e8) { const g = gray(mx, 800, 330); R = G = Bc = g; }
          } else {
            // heart surface: march the smoothed field, then bisect to the threshold
            let hb = -1;
            if (mode === 'heart') {
              // only inside the field's box, jumping over empty cells
              let ha = t0, hz = t1;
              for (let q = 0; q < 3; q++) {
                const lo = heartField.bb[2 * q], hi = heartField.bb[2 * q + 1];
                if (Math.abs(dir[q]) < 1e-6) { if (o0[q] < lo || o0[q] > hi) hz = -1; continue; }
                let ta = (lo - o0[q]) / dir[q], tb = (hi - o0[q]) / dir[q];
                if (ta > tb) { const tt = ta; ta = tb; tb = tt; }
                if (ta > ha) ha = ta; if (tb < hz) hz = tb;
              }
              for (let t = ha; t < hz;) {
                const x = o0[0] + dir[0] * t, y = o0[1] + dir[1] * t, z = o0[2] + dir[2] * t;
                const sk = hfSkip(x, y, z, dir);
                if (sk > 0) { t += sk; continue; }
                if (hfAt(x, y, z) > HF_THR) { hit = t; break; }
                t += step;
              }
              if (hit >= 0) {
                let a = Math.max(t0, hit - step), b = hit;
                for (let it = 0; it < 6; it++) { const m = (a + b) / 2; if (hfAt(o0[0] + dir[0] * m, o0[1] + dir[1] * m, o0[2] + dir[2] * m) > HF_THR) b = m; else a = m; }
                hb = b;
              }
            }
            // arteries (and, in the tree view, the aortic root) in front of the heart surface
            const th = treeRay(o0, dir, t0, hb >= 0 ? hb + 0.5 : t1);
            if (th >= 0) {
              // smooth tube surface: the normal points from the centreline to the hit point
              const x = o0[0] + dir[0] * th, y = o0[1] + dir[1] * th, z = o0[2] + dir[2] * th;
              treeSD(x, y, z);
              const kind = TREE_HIT.kind;
              hitV[r * cols + c] = TREE_HIT.vi; hitT[r * cols + c] = th;
              let nx, ny, nz;
              if (kind === 3) { const e = 0.4; nx = treeSD(x + e, y, z) - treeSD(x - e, y, z); ny = treeSD(x, y + e, z) - treeSD(x, y - e, z); nz = treeSD(x, y, z + e) - treeSD(x, y, z - e); }
              else { nx = x - TREE_HIT.qx; ny = y - TREE_HIT.qy; nz = z - TREE_HIT.qz; }
              const nl = hyp(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
              // arteries lying in their grooves would go too dark with full occlusion, so soften it for them
              const occl = mode === 'heart' && kind !== 3 ? 0.68 + 0.32 * ao(x, y, z, nx, ny, nz) : ao(x, y, z, nx, ny, nz);
              let base;
              if (mode === 'heart' && kind === 0) {
                const wv = sstep(1.4, 2.4, TREE_HIT.r);
                base = [0, 1, 2].map((q) => lerp(C_ART_THIN[q], C_ART[q], wv));
              } else base = kind === 3 ? [214, 92, 78] : kind === 2 ? [196, 202, 214] : kind === 1 ? (mode === 'heart' ? [252, 252, 250] : [240, 234, 218]) : [236, 118, 94];
              bump(x, y, z, nx, ny, nz, rough * 0.45);
              // contrast-filled arteries glow a little in a VRT: lift their ambient light
              if (mode === 'heart' && kind < 2) AMB = 0.8;
              shade(base, BX, BY, BZ, occl, 1 - clamp((th - t0) / 170, 0, 0.55), kind === 2 ? 60 : 28, kind === 2 ? 1.6 : kind === 1 ? 0.6 : mode === 'heart' ? 0.8 : 1);
              AMB = 0.2;
            } else if (hb >= 0) {
              hitV[r * cols + c] = -3; hitT[r * cols + c] = hb;
              const x = o0[0] + dir[0] * hb, y = o0[1] + dir[1] * hb, z = o0[2] + dir[2] * hb, e = 1.4;
              let nx = hfAt(x - e, y, z) - hfAt(x + e, y, z), ny = hfAt(x, y - e, z) - hfAt(x, y + e, z), nz = hfAt(x, y, z - e) - hfAt(x, y, z + e);
              const nl = hyp(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
              // colour by what lies just under the surface: muscle is darker, contrast-filled chambers and vessels brighter
              // (two depths, so a thin wall over a bright lumen, like the aorta, takes the lumen colour)
              const inner = Math.max(hfAt(x - nx * 2.2, y - ny * 2.2, z - nz * 2.2), hfAt(x - nx * 3.5, y - ny * 3.5, z - nz * 3.5));
              const t1c = sstep(150, 260, inner), t2c = sstep(260, 440, inner);
              // slight blotchy variation in the muscle colour, as the fat and muscle under the surface vary
              const mot = 1 + 0.07 * vnoise(x * 0.11, y * 0.11, z * 0.11) + 0.035 * vnoise(x * 0.45, y * 0.45, z * 0.45);
              const base = [0, 1, 2].map((q) => lerp(lerp(C_MUSCLE[q], C_BLOOD[q], t1c), C_BRIGHT[q], t2c) * mot);
              const occl = ao(x, y, z, nx, ny, nz);
              bump(x, y, z, nx, ny, nz, rough);
              shade(base, BX, BY, BZ, occl, 1 - clamp((hb - t0) / 170, 0, 0.55), 12, 0.38 + 0.4 * t2c);
            }
          }
        }
        d[kk] = R; d[kk + 1] = G; d[kk + 2] = Bc; d[kk + 3] = 255;
      }
    }
    vp.octx.putImageData(id, 0, 0);
    const ctx = vp.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, vp.W, vp.H);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(vp.off, 0, 0, vp.W, vp.H);
    vrCache = { W: vp.W, H: vp.H, cam, ex, ey, labels: S.read.labels ? vrLabels(cam, ex, ey, cols, rows, hitT, hitV, mode) : [] };
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
    const pxmm = vp.W / (2 * ex);
    drawLabels(vp, vrCache.labels.map((l) => ({ ...l, x: l.x * vp.W, y: l.y * vp.H, r: l.pin ? Math.max(5 * vp.dpr, l.rr * pxmm + 3 * vp.dpr) : 0 })));
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
    for (const [v, i0, i1] of parts) {
      let prev = '';
      for (let i = i0; i <= i1; i++) { const sg = segOf(v, i); if (sg[1] !== prev) { marks.push({ s: (acc + i - i0) * 0.5, name: sg[0] ? `${sg[0]} ${sg[1]}` : sg[1] }); prev = sg[1]; } }
      acc += i1 - i0 + 1;
    }
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
    if (USE_ART) h += XS.wo * artAt(pt[0], pt[1], pt[2]); // streaks cross the vessel too
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
    const colsF = clamp(Math.round(Math.min(vp.W, lenmm / 0.12)), 64, 900);
    const rowsF = clamp(Math.round((2 * half) / (lenmm / colsF)), 16, 400);
    const [W, L] = S.read.wl;
    const key = [tr.key, colsF, rowsF, half, S.read.alpha, W, L, S.read.kernel, S.read.ir, IMGV, NAMP, +USE_MOTION, +USE_ART, GA.join(',')].join('|');
    const hit = (key === vp.cprKey || (LOD && key + '|lod' === vp.cprKey)) && vp.cprG && vp.off.width === vp.cprG[0] && vp.off.height === vp.cprG[1];
    const cols = hit || !LOD ? colsF : Math.max(48, Math.round(colsF / LOD_F)), sp = lenmm / cols;
    const rows = hit || !LOD ? rowsF : clamp(Math.round((2 * half) / sp), 12, 400);
    if (!hit) {
    vp.cprKey = cols === colsF ? key : key + '|lod'; vp.cprG = [cols, rows];
    const id = vp.img(cols, rows), d = id.data;
    const alpha = S.read.alpha * DEG;
    const col = new Float32Array(rows);
    let buf = new Float32Array(cols * rows);
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
      for (let r = 0; r < rows; r++) buf[r * cols + c] = col[r];
    }
    buf = reconPost(buf, cols, rows, sp, (2 * half) / rows);
    paint(d, buf, W, L);
    vp.octx.putImageData(id, 0, 0);
    }
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
    // SCCT segment labels
    ctx.fillStyle = '#f5b301'; ctx.lineJoin = 'round';
    let lastX = -1e9, lastW = 0, lift = 0;
    for (const m of tr.marks) {
      const x = sx(m.s), w = ctx.measureText(m.name).width;
      lift = x - lastX < lastW + 8 * vp.dpr && !lift ? 12 * vp.dpr : 0; // step up when two names would touch
      ctx.fillRect(x, g.oy + g.dh - 5 * vp.dpr - lift, 1 * vp.dpr, 5 * vp.dpr + lift);
      ctx.lineWidth = 3 * vp.dpr; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(m.name, x + 3 * vp.dpr, g.oy + g.dh - 6 * vp.dpr - lift);
      ctx.fillText(m.name, x + 3 * vp.dpr, g.oy + g.dh - 6 * vp.dpr - lift);
      lastX = x; lastW = w;
    }
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
    ctx.fillText(`lumen ${L[k].toFixed(1)} mm / ref ${R[k].toFixed(1)} mm  ·  ${Math.round(sten * 100)}% diameter stenosis  ·  ${segText(TRACK.tv[k], TRACK.ti[k])} · ${(TRACK.ti[k] * 0.5).toFixed(0)} mm from origin`, 8 * vp.dpr, vp.H - 2 * vp.dpr);
    ctx.fillStyle = '#9aa6cc'; ctx.textAlign = 'right';
    ctx.fillText('— lumen   - - reference', vp.W - 8 * vp.dpr, g.imgH + 12 * vp.dpr); ctx.textAlign = 'left';
  }
  function renderXS(vp) {
    const tr = TRACK; if (!tr) return;
    const k = S.read.cur, v = tr.tv[k], i = tr.ti[k];
    const size = clamp(v.rad[i] * 7, 9, 16);
    const g = gridFor(vp, size, size, 240, 0.05, LOD ? LOD_F : 1);
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
    paint(d, reconPost(buf, g.c, g.r, size / g.c, size / g.r), W, L);
    vp.blit(size, size);
    const ctx = vp.ctx, f = vp.fit;
    // scale bar 2 mm
    ctx.fillStyle = '#cfd6ee'; ctx.fillRect(f.x + 8 * vp.dpr, f.y + size * f.s - 10 * vp.dpr, 2 * f.s, 2 * vp.dpr);
    ctx.font = `${10 * vp.dpr}px "IBM Plex Mono", monospace`; ctx.fillText('2 mm', f.x + 8 * vp.dpr, f.y + size * f.s - 14 * vp.dpr);
    const lm = lumenAt(v, i);
    const area = v.typ[i] === TYP.slit ? Math.PI * v.rad[i] * v.rad[i] * (1 - v.D[i]) : Math.PI * (lm.lum / 2) ** 2;
    $('#xsLbl').textContent = `${segText(v, i)} · MLD ${lm.lum.toFixed(1)} mm · area ${area.toFixed(1)} mm²`;
  }

  // ───────────────────────── Agatston calcium score ─────────────────────────
  const CAC_G = 320, CAC_SP = FOV / CAC_G, CAC_T = 3;
  const CAC_CROP = [22, 12, 150]; // u0, v0, size (mm) of the calcium view
  const ART_COL = { LM: [245, 179, 1], LAD: [255, 107, 107], LCX: [79, 209, 161], RCA: [90, 169, 255] };
  function buildCAC() {
    const nS = Math.floor((S.range[1] - S.range[0]) / CAC_T);
    const img = new Int16Array(CAC_G * CAC_G * nS).fill(-1000), map = new Int16Array(CAC_G * CAC_G * nS);
    const g0 = GA.slice(), n0 = NAMP;
    // automatic exposure control: above BMI 28 the tube current rises to hold the noise
    GA.fill(0); NAMP = noiseSigma(120, 80 * Math.max(1, (S.cs.bmi / 28) ** 2.8)) / 30 * 0.6 / 1.25;
    const c0 = Math.floor(CAC_CROP[0] / CAC_SP) - 2, c1 = Math.ceil((CAC_CROP[0] + CAC_CROP[2]) / CAC_SP) + 2;
    const r0 = Math.floor(CAC_CROP[1] / CAC_SP) - 2, r1 = Math.ceil((CAC_CROP[1] + CAC_CROP[2]) / CAC_SP) + 2;
    for (let s = 0; s < nS; s++) {
      const zc = S.range[1] - (s + 0.5) * CAC_T;
      for (let r = Math.max(0, r0); r < Math.min(CAC_G, r1); r++) {
        const y = Y0 + (r + 0.5) * CAC_SP;
        for (let c = Math.max(0, c0); c < Math.min(CAC_G, c1); c++) {
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
        let ref = null, bd = 1e9, bi = 0;
        for (const v of VLIST) for (let i = 0; i < v.n; i += 2) {
          const q = v.pts[i], dd = (q[0] - cx) ** 2 + (q[1] - cy) ** 2 + (q[2] - cz) ** 2;
          if (dd < bd) { bd = dd; ref = v; bi = i; }
        }
        // stent metal is not calcium and is left out of the Agatston score
        const refG = ref && Math.sqrt(bd) < 4.5 && !ref.stent[bi] ? ref.group : null;
        comps.push({ id, s, n, area, mx, wgt, score: area >= 1 ? area * wgt : 0, ok: area >= 1, cx, cy, cz, ref: refG });
      }
    }
    const tot = { LM: 0, LAD: 0, LCX: 0, RCA: 0 };
    for (const c of comps) if (c.ok && c.ref) tot[c.ref] += c.score;
    S.cac = { nS, img, map, comps, ref: tot, refTotal: tot.LM + tot.LAD + tot.LCX + tot.RCA };
    GA.set(g0); NAMP = n0;
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
  let vrFast = false, vrT = 0;
  function vrQuick(delay = 160) {
    vrFast = true; mark('vr');
    clearTimeout(vrT); vrT = setTimeout(() => { vrFast = false; mark('vr'); }, delay);
  }
  // While the user drags or scrolls, the slice views are drawn on a coarser grid (the volume voxels are 0.9 mm,
  // so little is lost) and redrawn sharp once they pause.
  const LOD_F = 1.6;
  let LOD = false, lodT = 0;
  const lodKeys = new Set();
  function interact(...k) {
    LOD = true; k.forEach((x) => lodKeys.add(x)); mark(...k);
    clearTimeout(lodT);
    lodT = setTimeout(() => { LOD = false; const ks = [...lodKeys]; lodKeys.clear(); mark(...ks); }, 160);
  }
  function flush() {
    raf = 0;
    const list = [...dirty]; dirty.clear();
    for (const k of list) {
      try { RENDER[k] && RENDER[k](); } catch (e) { console.error(k, e); }
    }
  }
  function withNonContrast(fn) {
    const g = GA.slice(), n = NAMP, m = USE_MOTION, a = USE_ART;
    GA.fill(0); NAMP = 0.35; USE_MOTION = false; USE_ART = false;
    try { fn(); } finally { GA.set(g); NAMP = n; USE_MOTION = m; USE_ART = a; }
  }
  function applyReadGains() {
    const sc = S.scan;
    if (!sc) return;
    setGains(sc.e, KVC[S.kv]);
    NAMP = (sc.sigma / 30) * 1.25;
    USE_MOTION = true;
    USE_ART = true;
    if (artScan !== sc) { artScan = sc; resetArtefacts(); }
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
      const v = vp.vpAx; v.resize(); const pl = renderMPR(v, 'ax', { recon: true }); drawCross(v); orientLabels(v, 'ax'); drawRuler(v); planeLabels(v);
      const D = dcScan(), inc = 0.45, nIm = Math.round((S.range[1] - S.range[0]) / inc) + 1, im = clamp(Math.round((S.range[1] - S.cp[2]) / inc) + 1, 1, nIm);
      $('#axLbl').textContent = `z ${S.cp[2].toFixed(1)} mm · Im ${im}/${nIm}`;
      $('#axTr').innerHTML = `${D.pt}<br>${D.study}<br>${D.date}`;
      $('#axWl').innerHTML = `${D.wl}<br>DFOV ${(pl.w / 10).toFixed(1)} cm · ${S.read.zoom.toFixed(1)}×`;
      $('#axBl').innerHTML = `${D.kv}<br>${D.recon}<br>${D.ecg}`;
    },
    mpr() {
      const v = vp.vpMpr; v.resize(); const pl = renderMPR(v, S.read.mpr, { recon: true }); drawCross(v); orientLabels(v, S.read.mpr); drawRuler(v); planeLabels(v);
      const D = dcScan();
      $('#mprBr').innerHTML = `${D.wl}<br>DFOV ${(pl.w / 10).toFixed(1)} cm`;
      $('#mprBl').textContent = D.recon;
      $('#mprName').textContent = S.read.mpr === 'cor' ? 'CORONAL' : 'SAGITTAL';
      $('#mprLbl').textContent = S.read.mpr === 'cor' ? `y ${S.cp[1].toFixed(1)} mm` : `x ${S.cp[0].toFixed(1)} mm`;
    },
    vr() {
      const v = vp.vpVr; v.resize();
      if (S.read.vr === 'heart' && (!heartField || heartField.key !== heartKey())) buildHeartField();
      const t = performance.now(), m = S.read.vr;
      renderVR(v, vrFast);
      if (vrFast) VR_FR[m] = clamp(Math.round(VR_FR[m] * (0.5 + 0.5 * Math.sqrt(45 / Math.max(5, performance.now() - t)))), 90, VR_FR0[m]);
      $('#vrLbl').textContent = { heart: 'volume rendering', tree: 'coronary tree', mip: 'MIP' }[S.read.vr];
      $('#vrBl').textContent = { heart: 'VRT · cardiac preset', tree: 'VRT · coronary lumen', mip: 'MIP · W 800 L 330' }[S.read.vr];
      $('#vrBr').textContent = vrAngle();
    },
    vrOverlay() {
      const v = vp.vpVr;
      if (!vrCache || vrCache.W !== v.W || vrCache.H !== v.H) return mark('vr');
      const c = v.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, v.W, v.H);
      c.imageSmoothingEnabled = true; c.drawImage(v.off, 0, 0, v.W, v.H);
      drawVROverlay(v);
    },
    cpr() { const v = vp.vpCpr; v.resize(); renderCPR(v); $('#cprTr').textContent = `${dcScan().wl} · ${KER_NAME[S.read.kernel]}`; $('#cprLbl').textContent = `${TRACKS[S.read.track].name} · straightened · ${S.read.alpha}° · click to move the cursor`; },
    xs() { const v = vp.vpXs; v.resize(); renderXS(v); $('#xsBr').textContent = dcScan().wl; },
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
    const g = GA.slice(), n = NAMP, m = USE_MOTION, r0 = USE_RANGE, a0 = USE_ART;
    setGains(e, KVC[100]); NAMP = 1.9; USE_MOTION = false; USE_RANGE = false; USE_ART = false;
    const cp = S.cp.slice(); S.cp[2] = b.z;
    try { renderMPR(v, 'ax', { zoom: 1.35, wl: [600, 150], slab: 0, maxPx: 300 }); } finally { S.cp = cp; GA.set(g); NAMP = n; USE_MOTION = m; USE_RANGE = r0; USE_ART = a0; }
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
    const sg = effSigma();
    const rows = [
      ['Aorta / LV', `${Math.round(lv)} HU`], ['Right heart', `${Math.round(rv)} HU`], ['Noise (SD)', `${sg.toFixed(0)} HU`],
      ['SNR · CNR', `${(lv / sg).toFixed(1)} · ${((lv - myo) / sg).toFixed(1)}`],
      ['Recon', `${{ smooth: 'smooth', std: 'standard', sharp: 'sharp' }[S.read.kernel]} kernel · ${['FBP', 'iterative medium', 'iterative strong'][S.read.ir]}`],
      ['Motion RCA', motionGrade(b.R)], ['Motion LCx', motionGrade(b.C)], ['Motion LAD', motionGrade(b.A)],
      ['Dose', `${sc.dose.dlp.toFixed(0)} mGy·cm · ${sc.dose.msv.toFixed(1)} mSv`],
      ['CPR cursor', TRACK ? segText(TRACK.tv[S.read.cur], TRACK.ti[S.read.cur]) : '–'],
      ['Crosshair', `${S.cp.map((x) => x.toFixed(0)).join(', ')}`],
    ];
    $('#readKv').innerHTML = rows.map(([a, c]) => `<dt>${a}</dt><dd>${c}</dd>`).join('');
    const notes = [];
    if (b.R >= 2.5 || b.C >= 2.5) notes.push(['warn', 'Severe motion at this phase. Try another reconstruction phase (if your acquisition window allows it).']);
    else if (b.R >= 1.2) notes.push(['gold', 'Moderate RCA motion. A different phase may sharpen the mid RCA.']);
    if (lv < 250) notes.push(['warn', 'Coronary enhancement is below 250 HU: the study is suboptimal and small plaques can be missed.']);
    if (MIS) notes.push(['warn', 'Step artefacts: an ectopic beat shifted the heart between acquisition steps.']);
    const svc = 44 + GA[C_SVC];
    if (svc > 700) notes.push(['gold', `Dense contrast in the SVC (${Math.round(svc)} HU) throws streaks across the right coronary artery and aortic root. A saline chaser washes it out.`]);
    if (lv > 560) notes.push(['gold', 'Very dense LV and aorta cause beam hardening: look for a dark band in the basal inferolateral wall, and do not call it a perfusion defect.']);
    if ((S.cs.stents || []).length && S.read.kernel !== 'sharp') notes.push(['gold', 'Stent: switch to the sharp kernel and the wide window to see the lumen inside the struts.']);
    if (S.read.ir === 0 && sg > 30) notes.push(['gold', 'Filtered back projection is noisy at this dose. Iterative reconstruction lowers the noise.']);
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
    if (bi >= 0) { S.read.cur = bi; interact('cpr', 'xs'); }
  }
  function mprHandlers(key, getOrient) {
    const v = vp[key];
    onDrag(v.cv, {
      down(e, b) { if (b === 0) { S.cp = viewToWorld(v, e); syncCursorToCP(); interact('ax', 'mpr', 'vrOverlay', 'readKv'); } },
      move(e, b, dx, dy) {
        if (b === 2) { S.read.wl = [clamp(S.read.wl[0] + dx * 4, 50, 4000), clamp(S.read.wl[1] - dy * 2, -1000, 1500)]; interact('ax', 'mpr', 'cpr', 'xs'); }
        else { S.cp = viewToWorld(v, e); syncCursorToCP(); interact('ax', 'mpr', 'vrOverlay', 'readKv'); }
      },
      up() { mark('vrOverlay'); },
      wheel(e) {
        const o = getOrient(), n = NORMAL[o], st = (e.deltaY > 0 ? -1 : 1) * (o === 'ax' ? DZ : DX) * (e.shiftKey ? 4 : 1);
        if (e.ctrlKey) { S.read.zoom = clamp(S.read.zoom * (e.deltaY > 0 ? 0.85 : 1.18), 1, 4); }
        else { S.cp = [clamp(S.cp[0] + n[0] * st, X0 + 1, X0 + FOV - 1), clamp(S.cp[1] + n[1] * st, Y0 + 1, Y0 + FOV - 1), clamp(S.cp[2] + n[2] * st, Z0 + 1, ZTOP - 1)]; }
        interact('ax', 'mpr', 'vrOverlay', 'readKv');
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
    move(e, b, dx, dy) { S.read.yaw -= dx * 0.5; S.read.pitch = clamp(S.read.pitch + dy * 0.4, -85, 85); vrQuick(300); },
    up() { clearTimeout(vrT); vrFast = false; mark('vr'); },
    wheel(e) { S.read.zoomVr = clamp(S.read.zoomVr * (e.deltaY > 0 ? 0.9 : 1.1), 0.7, 3); vrQuick(); },
  });
  $$('#vpVr .tools button').forEach((b) => b.addEventListener('click', () => {
    const p = { ant: [0, 0], lao: [-45, 20], rao: [35, 15], inf: [-10, -65] }[b.dataset.p];
    S.read.yaw = p[0]; S.read.pitch = p[1]; vrQuick(30);
  }));
  $$('#vpMpr .tools button').forEach((b) => b.addEventListener('click', () => {
    S.read.mpr = b.dataset.o; $$('#vpMpr .tools button').forEach((x) => x.classList.toggle('on', x === b)); mark('mpr');
  }));
  onDrag(vp.vpCpr.cv, {
    down(e, b) { if (b === 0) cprPick(e, true); },
    move(e, b, dx) { if (b === 2) { S.read.alpha = ((S.read.alpha + Math.round(dx)) % 360 + 360) % 360; $('#rotR').value = S.read.alpha; $('#rotO').textContent = S.read.alpha + '°'; interact('cpr', 'xs'); } else cprPick(e, true); },
    wheel(e) { S.read.cur = clamp(S.read.cur + (e.deltaY > 0 ? 2 : -2), 0, TRACK.n - 1); cursorToCP(true); },
  });
  function cprPick(e, live) {
    const g = cprGeo; if (!g) return;
    const r = vp.vpCpr.cv.getBoundingClientRect(), x = (e.clientX - r.left) * vp.vpCpr.dpr;
    const s = (x - g.ox) / g.sc - 2;
    S.read.cur = clamp(Math.round(s / 0.5), 0, TRACK.n - 1);
    cursorToCP(live);
  }
  function cursorToCP(live) { S.cp = TRACK.p[S.read.cur].slice(); (live ? interact : mark)('cpr', 'xs', 'ax', 'mpr', 'vrOverlay', 'readKv'); }

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
    if (st === 'read' || st === 'report') { applyReadGains(); updateBlur(S.read.recon); mark('ax', 'mpr', 'cpr', 'xs', 'readKv'); vrQuick(30); }
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
    S.caseIdx = idx; S.cs = CASES[idx]; S.meto = 0; IMGV++;
    HU.set(baseHU); TAG.set(baseTag); FR.set(baseFR);
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
    IMGV++;
    HU.set(baseHU); TAG.set(baseTag); FR.set(baseFR);
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
  seg('vrSeg', (v) => { S.read.vr = v; vrQuick(30); });
  seg('lblSeg', (v) => { S.read.labels = v === '1'; mark('ax', 'mpr', 'vr'); });
  seg('kerSeg', (v) => { S.read.kernel = v; mark('ax', 'mpr', 'cpr', 'xs', 'readKv'); });
  seg('irSeg', (v) => { S.read.ir = +v; mark('ax', 'mpr', 'cpr', 'xs', 'readKv'); });
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
    S.scan = { e, sigma, dose, cut: coverageProblem(), when: new Date() };
    IMGV++;
    S.scanDone = true;
    // reconstruction phase limits
    const r = $('#reconR');
    if (S.gating === 'pro') { r.min = Math.max(0, S.phase - S.pad); r.max = Math.min(95, S.phase + S.pad); r.value = S.phase; S.read.recon = S.phase; }
    else if (S.gating === 'flash') { r.min = 65; r.max = 65; r.value = 65; S.read.recon = 65; }
    else { r.min = 0; r.max = 95; S.read.recon = bestPhase(); r.value = S.read.recon; }
    $('#reconO').textContent = S.read.recon + '%';
    $('#reconRow').querySelector('label').textContent = S.gating === 'retro' ? 'Recon phase (any)' : S.gating === 'pro' ? 'Recon phase (window)' : 'Recon phase (fixed)';
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
  trackSel.addEventListener('change', () => { S.read.track = trackSel.value; buildTrack(S.read.track); S.read.cur = Math.round(TRACK.n * 0.15); cursorToCP(); vrQuick(30); });
  range('rotR', 'rotO', (v) => { S.read.alpha = v; interact('cpr', 'xs'); }, (v) => v + '°');
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
    if (!S.cac && S.scan) buildCAC();
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
    cursorToCP(); vrQuick(30);
  }
  $('#btnCheck').addEventListener('click', () => checkReport(false));
  $('#btnAnswer').addEventListener('click', () => checkReport(true));
  $('#btnNewCase').addEventListener('click', () => { const n = (S.caseIdx + 1) % CASES.length; caseSel.value = n; loadCase(n); });

  // resize
  const VP_OF = { topo: 'vpTopo', planAx: 'vpPlanAx', ecg: 'vpEcg', cac: 'vpCac', mon: 'vpMon', tac: 'vpTac', ax: 'vpAx', mpr: 'vpMpr', vr: 'vpVr', cpr: 'vpCpr', xs: 'vpXs' };
  const ro = new ResizeObserver(() => {
    if (!ready) return;
    const st = S.step;
    const keys = st === 'plan' ? ['topo', 'planAx', 'ecg'] : st === 'cac' ? ['cac'] : st === 'bolus' ? ['mon', 'tac'] : ['ax', 'mpr', 'vr', 'cpr', 'xs'];
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const stale = keys.filter((k) => {
      const v = vp[VP_OF[k]], r = v.el.getBoundingClientRect();
      return Math.max(2, Math.round(r.width * dpr)) !== v.cv.width || Math.max(2, Math.round(r.height * dpr)) !== v.cv.height;
    });
    if (stale.length) mark(...stale);
    if (stale.includes('vr')) vrQuick(250);
  });
  ro.observe($('#stage'));

  // ───────────────────────── saved volume ─────────────────────────
  // The finished base volume is kept in this browser (IndexedDB), so later visits skip the build.
  // It is keyed by a hash of this script: any change to the code builds and saves it again.
  const VDB = 'ct-lab-volume', VSTORE = 'base';
  const vdb = () => new Promise((res, rej) => {
    const rq = indexedDB.open(VDB, 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore(VSTORE);
    rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); rq.onblocked = () => rej(new Error('blocked'));
  });
  async function volumeKey() {
    if (!SELF_SRC || typeof indexedDB === 'undefined') return null;
    const src = await (await fetch(SELF_SRC, { cache: 'force-cache' })).text();
    let h = 2166136261;
    for (let i = 0; i < src.length; i++) { h ^= src.charCodeAt(i); h = Math.imul(h, 16777619); }
    return `${(h >>> 0).toString(36)}.${src.length}.${NX}x${NY}x${NZ}`;
  }
  async function loadSavedVolume(key) {
    const db = await vdb();
    try {
      const get = (k) => new Promise((res, rej) => { const rq = db.transaction(VSTORE).objectStore(VSTORE).get(k); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); });
      if ((await get('key')) !== key) return false;
      const rec = await get('v');
      if (!rec || rec.hu.length !== NV || rec.tag.length !== NV || rec.fr.length !== NV || rec.noise.length !== NV) return false;
      baseHU.set(rec.hu); baseTag.set(rec.tag); baseFR.set(rec.fr); NOISE.set(rec.noise);
      return true;
    } finally { db.close(); }
  }
  async function saveVolume(key) {
    const db = await vdb();
    try {
      await new Promise((res, rej) => {
        const tx = db.transaction(VSTORE, 'readwrite');
        tx.objectStore(VSTORE).put({ hu: baseHU, tag: baseTag, fr: baseFR, noise: NOISE }, 'v');
        tx.objectStore(VSTORE).put(key, 'key');
        tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
      });
    } finally { db.close(); }
  }

  // ───────────────────────── boot ─────────────────────────
  async function boot() {
    const bar = $('#loadBar'), txt = $('#loadTxt');
    txt.textContent = 'Chest, heart and great vessels';
    const key = await volumeKey().catch(() => null);
    const saved = key ? await loadSavedVolume(key).catch(() => false) : false;
    if (!saved) {
      const vol = buildVolume((f) => { bar.style.width = `${f * 80}%`; });
      await frame();
      // detector noise is made here while the workers build the anatomy
      genNoise();
      await vol;
      txt.textContent = 'Cardiac veins, lung vessels and bronchi'; bar.style.width = '84%'; await frame();
      stampVeins();
      stampLungVessels();
      // save once the first case is on screen
      if (key) setTimeout(() => saveVolume(key).catch((e) => console.warn('CT lab: volume not saved', e)), 2500);
    }
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
