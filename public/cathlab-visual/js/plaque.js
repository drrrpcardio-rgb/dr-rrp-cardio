/* CathLab Visual — types of plaque.
   Left: a side view of the artery with the selected plaque; blood cells slow down as the opening narrows.
   Right: a slice through the narrowest point, drawn as tissue or as a schematic IVUS (ultrasound) image.
   CV.plaque(section) builds the scene and wires up the tabs and the Tissue / IVUS toggle. */
(function () {
  "use strict";
  var CV = window.CV;

  // Side view
  var X0 = -10, X1 = 500, CY = 225, R = 56, W = 26, CX = 250;
  var TOP = CY - R, BOT = CY + R;
  // Cross-section (K maps side-view sizes onto it)
  var XC = 660, YC = 236, RI = 80, RO = 100, K = RI / R;
  // Thrombotic plaque: where the cap cracked, and the clot that grows just downstream
  var RUP = CX + 12, CLOT = { cx: CX + 30, s: 52 };

  var TYPES = {
    fibrous:    { aTop: 46, aBot: 22, s: 70, flow: 0.8, clot: 0 },
    lipid:      { aTop: 50, aBot: 8,  s: 78, flow: 0.9, clot: 0 },
    calcific:   { aTop: 48, aBot: 30, s: 66, flow: 0.6, clot: 0 },
    thrombotic: { aTop: 44, aBot: 10, s: 74, flow: 0.1, clot: 1 },
  };
  var ORDER = ["fibrous", "lipid", "calcific", "thrombotic"];

  // Labels on the side view: [i18n key, English, label x, target x, target y, optional id]
  var LABELS = {
    fibrous: [["plq.l.fib", "Tough, scar-like tissue", 170, 215, 190]],
    lipid: [["plq.l.cap", "Thin cap", 150, 205, 204], ["plq.l.core", "Soft fatty core", 345, 275, 192]],
    calcific: [["plq.l.ca", "Calcium, hard as bone", 170, 222, 190]],
    thrombotic: [["plq.l.crack", "Cracked cap", 150, RUP - 1, 211], ["plq.l.clot", "Blood clot", 372, 300, 236, "plq-clot-lbl"]],
  };

  /* ---------- geometry helpers ---------- */
  function bump(x, c, s) {
    var d = (x - c) / s;
    if (d > 0) d *= 0.85;
    return Math.exp(-d * d * d * d * 0.6 - d * d * 0.6);
  }
  function n1(v) { return String(Math.round(v * 10) / 10); }
  function pt(p) { return n1(p[0]) + " " + n1(p[1]); }
  function poly(pts) { return "M" + pts.map(pt).join(" L"); }
  function circ(cx, cy, r, attrs) { return '<circle cx="' + n1(cx) + '" cy="' + n1(cy) + '" r="' + n1(r) + '" ' + (attrs || "") + "/>"; }

  /** y inside the plaque at x: f = 0 is the artery wall, f = 1 the surface facing the blood. */
  function py(t, isTop, f, x) {
    var b = bump(x, CX, t.s);
    return isTop ? TOP + t.aTop * f * b : BOT - t.aBot * f * b;
  }
  function profile(t, isTop, f, from, to, n) {
    var pts = [], step = (to - from) / n;
    for (var i = 0; i <= n; i++) { var x = from + i * step; pts.push([x, py(t, isTop, f, x)]); }
    return pts;
  }
  function span(t) { return [CX - t.s * 2.4, CX + t.s * 2.8]; }
  /** Where the plaque is thick enough to show its bright edge (beyond this it lies flat on the wall). */
  function capSpan(t) { return [CX - t.s * 1.5, CX + t.s * 1.8]; }

  function body(t, isTop, fill) {
    var s = span(t), wy = isTop ? TOP : BOT;
    return '<path d="' + poly(profile(t, isTop, 1, s[0], s[1], 48)) + " L" + n1(s[1]) + " " + wy + " L" + n1(s[0]) + " " + wy + ' Z" fill="' + fill + '"/>';
  }
  function cap(t, isTop, from, to, color, w) {
    var cs = capSpan(t);
    from = Math.max(from, cs[0]); to = Math.min(to, cs[1]);
    return '<path d="' + poly(profile(t, isTop, 1, from, to, 40)) + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  /** Lens-shaped fatty core under a cap. capF: where the cap starts; depth: how far the core reaches toward the wall. */
  function coreEdges(t, capF, depth, x) {
    var b = bump(x, CX, t.s), nb = bump(x, CX - 4, t.s * 0.72);
    return [TOP + t.aTop * capF * b, TOP + t.aTop * Math.max(capF * b * 0.15, capF * b - depth * nb)];
  }
  function core(t, capF, depth) {
    var from = CX - t.s * 1.7, to = CX + t.s * 1.8, n = 36, step = (to - from) / n, inner = [], outer = [];
    for (var i = 0; i <= n; i++) {
      var x = from + i * step, e = coreEdges(t, capF, depth, x);
      inner.push([x, e[0]]); outer.push([x, e[1]]);
    }
    return '<path d="' + poly(inner) + " L" + outer.reverse().map(pt).join(" L") + ' Z" fill="url(#plq-core)"/>';
  }
  function crystals(t, capF, depth) {
    var m = '<g stroke="#fffdf5" stroke-width="1.5" stroke-linecap="round" opacity=".9">';
    [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75].forEach(function (rx, i) {
      var x = CX + rx * t.s, e = coreEdges(t, capF, depth, x), y = (e[0] + e[1]) / 2, sg = i % 2 ? 1 : -1;
      m += '<line x1="' + n1(x - 6) + '" y1="' + n1(y - 2.5 * sg) + '" x2="' + n1(x + 6) + '" y2="' + n1(y + 2.5 * sg) + '"/>';
    });
    return m + "</g>";
  }
  function foam(pts) {
    return pts.map(function (p) {
      return circ(p[0], p[1], 4.2, 'fill="#fef9c3" stroke="#d97706" stroke-width="1"') + circ(p[0], p[1], 1.4, 'fill="#b45309"');
    }).join("");
  }
  /** An angular calcium plate between plaque depths fa and fb. */
  function plate(t, isTop, xa, xb, fa, fb, j) {
    var xm = (xa + xb) / 2 + j * 4, k = isTop ? 1 : -1;
    var pts = [[xa, py(t, isTop, fa, xa)], [xm, py(t, isTop, fa, xm) - k * 2], [xb, py(t, isTop, fa, xb)],
      [xb - 3, py(t, isTop, fb, xb)], [xm - j * 3, py(t, isTop, fb, xm) + k * 2.5], [xa + 3, py(t, isTop, fb, xa)]];
    return '<path d="' + poly(pts) + ' Z" fill="url(#plq-ca)" stroke="#94a3b8" stroke-width="1" stroke-linejoin="round"/>';
  }
  /** The red clot: from the cracked cap down into the channel. k = 0 (none) to 1 (fully grown). */
  function clotD(k) {
    var t = TYPES.thrombotic, from = CLOT.cx - CLOT.s * 1.9, to = CLOT.cx + CLOT.s * 2.3, n = 48, step = (to - from) / n, up = [], dn = [];
    for (var i = 0; i <= n; i++) {
      var x = from + i * step, top = py(t, true, 1, x);
      up.push([x, top - 1.5]);
      dn.push([x, top + clotThick(x, k, top, py(t, false, 1, x))]);
    }
    return poly(up) + " L" + dn.reverse().map(pt).join(" L") + " Z";
  }
  /** How much of the open channel the clot fills at x (flat-topped, tapering at both ends). */
  function clotW(x) {
    var d = (x - CLOT.cx) / CLOT.s;
    if (d > 0) d *= 0.8;
    return Math.exp(-d * d * d * d * 1.1 - d * d * 0.25);
  }
  /** Clot thickness at x when the channel runs from top to bot: fills it down to a thin, lumpy gap. */
  function clotThick(x, k, top, bot) {
    return k * clotW(x) * Math.max(0, bot - top - (8 + 3 * Math.sin(x * 0.31)));
  }

  /* ---------- side view, one group per type ---------- */
  function sideMarkup(type) {
    var t = TYPES[type], s = span(t), m = "";
    if (type === "fibrous") {
      m += body(t, true, "url(#plq-fib)") + body(t, false, "url(#plq-fib)");
      m += '<g fill="none" stroke="#c4ab7c" stroke-width="1.3" opacity=".65">';
      [0.3, 0.55, 0.8].forEach(function (f) { m += '<path d="' + poly(profile(t, true, f, s[0] + 18, s[1] - 22, 40)) + '"/>'; });
      m += '<path d="' + poly(profile(t, false, 0.5, s[0] + 30, s[1] - 34, 30)) + '"/></g>';
      m += cap(t, true, s[0], s[1], "#fffbeb", 2.2) + cap(t, false, s[0], s[1], "#fffbeb", 1.8);
    } else if (type === "lipid") {
      m += body(t, true, "url(#plq-lip)") + body(t, false, "url(#plq-fib)");
      m += core(t, 0.8, 0.62) + crystals(t, 0.8, 0.62);
      m += foam([[CX - 1.0 * t.s, py(t, true, 0.5, CX - 1.0 * t.s)], [CX - 0.86 * t.s, py(t, true, 0.38, CX - 0.86 * t.s)],
        [CX + 1.05 * t.s, py(t, true, 0.5, CX + 1.05 * t.s)], [CX + 0.9 * t.s, py(t, true, 0.38, CX + 0.9 * t.s)]]);
      m += cap(t, true, s[0], s[1], "#fff7d6", 1.6) + cap(t, false, s[0], s[1], "#fffbeb", 1.6);
    } else if (type === "calcific") {
      m += body(t, true, "url(#plq-fib)") + body(t, false, "url(#plq-fib)");
      [[-1.35, -0.78, 0.24, 0.7], [-0.7, -0.05, 0.2, 0.78], [0.05, 0.78, 0.2, 0.76], [0.88, 1.55, 0.24, 0.7]].forEach(function (g, i) {
        m += plate(t, true, CX + g[0] * t.s, CX + g[1] * t.s, g[2], g[3], i % 2 ? 1 : -1);
      });
      [[-1.0, -0.2], [-0.1, 0.8]].forEach(function (g, i) {
        m += plate(t, false, CX + g[0] * t.s, CX + g[1] * t.s, 0.22, 0.72, i % 2 ? -1 : 1);
      });
      m += '<g fill="#fff">' + [[-1.2, 0.5], [-1.08, 0.3], [1.3, 0.45], [1.45, 0.5], [0.42, 0.88], [-0.4, 0.9]].map(function (p) {
        var x = CX + p[0] * t.s; return circ(x, py(t, true, p[1], x), 1.8);
      }).join("") + "</g>";
      m += cap(t, true, s[0], s[1], "#fffbeb", 2) + cap(t, false, s[0], s[1], "#fffbeb", 1.8);
    } else {
      var ry = py(t, true, 1, RUP);
      m += body(t, true, "url(#plq-lip)") + body(t, false, "url(#plq-fib)");
      m += core(t, 0.82, 0.6);
      m += '<ellipse cx="' + RUP + '" cy="' + n1(ry - 1) + '" rx="7" ry="4" fill="#facc15"/>'; // core spilling out of the crack
      m += cap(t, true, s[0], RUP - 7, "#fff7d6", 1.8) + cap(t, true, RUP + 7, s[1], "#fff7d6", 1.8) + cap(t, false, s[0], s[1], "#fffbeb", 1.6);
      m += '<path id="plq-clot" d="" fill="url(#plq-clot-pat)" stroke="#6b1414" stroke-width="1.2" stroke-linejoin="round"/>';
      m += '<g id="plq-white" opacity="0"><ellipse cx="' + (RUP + 3) + '" cy="' + n1(ry + 5) + '" rx="14" ry="6.5" fill="#f1f5f9"/>' +
        '<g fill="#cbd5e1">' + circ(RUP - 4, ry + 4, 1.6) + circ(RUP + 4, ry + 7, 1.6) + circ(RUP + 10, ry + 4, 1.4) + "</g></g>";
    }
    return m;
  }

  function labelMarkup(list) {
    return list.map(function (l) {
      return "<g" + (l[5] ? ' id="' + l[5] + '"' : "") + ">" +
        '<line x1="' + l[2] + '" y1="106" x2="' + n1(l[3]) + '" y2="' + n1(l[4]) + '" stroke="#f8fafc" stroke-opacity=".8" stroke-width="1.5"/>' +
        circ(l[3], l[4], 3, 'fill="#f8fafc"') +
        '<text class="svg-lbl" x="' + l[2] + '" y="98" text-anchor="middle" data-i18n="' + l[0] + '">' + l[1] + "</text></g>";
    }).join("");
  }

  /* ---------- cross-section helpers ---------- */
  function ap(r, a, cx, cy) {
    var t = (a * Math.PI) / 180;
    return [(cx == null ? XC : cx) + r * Math.cos(t), (cy == null ? YC : cy) + r * Math.sin(t)];
  }
  /** Ring segment between radii r1 and r2, from angle a1 to a2 (degrees, clockwise, -90 = top). */
  function sector(r1, r2, a1, a2) {
    var big = a2 - a1 > 180 ? 1 : 0;
    return "M" + pt(ap(r2, a1)) + " A" + r2 + " " + r2 + " 0 " + big + " 1 " + pt(ap(r2, a2)) +
      " L" + pt(ap(r1, a2)) + " A" + r1 + " " + r1 + " 0 " + big + " 0 " + pt(ap(r1, a1)) + " Z";
  }
  function arcPath(r, a1, a2, cx, cy) {
    return "M" + pt(ap(r, a1, cx, cy)) + " A" + n1(r) + " " + n1(r) + " 0 " + (a2 - a1 > 180 ? 1 : 0) + " 1 " + pt(ap(r, a2, cx, cy));
  }
  /** Angular calcium plate along an arc. */
  function caArc(r1, r2, a1, a2) {
    var pts = [], n = 4, i;
    for (i = 0; i <= n; i++) pts.push(ap(r2 + (i % 2 ? 3 : -1.5), a1 + ((a2 - a1) * i) / n));
    for (i = n; i >= 0; i--) pts.push(ap(r1 + (i % 2 ? -2 : 1.2), a1 + ((a2 - a1) * i) / n));
    return '<path d="' + poly(pts) + ' Z" fill="url(#plq-ca)" stroke="#94a3b8" stroke-width="1" stroke-linejoin="round"/>';
  }
  /** Part of a circle above a horizontal chord with a lumpy lower edge (a clot filling the channel). */
  function clotCut(cx, cy, r, chordY) {
    var dy = chordY - cy, dx = Math.sqrt(Math.max(0, r * r - dy * dy));
    return "M" + pt([cx - dx, chordY]) + " A" + n1(r) + " " + n1(r) + " 0 " + (chordY > cy ? 1 : 0) + " 1 " + pt([cx + dx, chordY]) +
      " Q" + pt([cx + dx * 0.5, chordY + 5]) + " " + pt([cx, chordY - 1]) + " T" + pt([cx - dx, chordY]) + " Z";
  }
  function lumenOf(t) { return { r: ((2 * R - t.aTop - t.aBot) / 2) * K, y: YC + ((t.aTop - t.aBot) / 2) * K }; }
  function rbc(x, y, rot, sc) {
    return '<use href="#rbc" width="16" height="12" x="-8" y="-6" transform="translate(' + n1(x) + " " + n1(y) + ") rotate(" + rot + ") scale(" + sc + ')"/>';
  }

  function xTissue(type) {
    var t = TYPES[type], L = lumenOf(t), m = "";
    m += circ(XC, YC, RO, 'fill="url(#plq-xwall)"') + circ(XC, YC, RI + 6, 'fill="#c0524e"');
    m += circ(XC, YC, RI, 'fill="' + (type === "lipid" || type === "thrombotic" ? "url(#plq-lip)" : "url(#plq-fib)") + '"');
    if (type === "fibrous") {
      m += '<g fill="none" stroke="#c4ab7c" stroke-width="1.3" opacity=".6">' + circ(XC, YC, 54) + circ(XC, YC, 64) + circ(XC, YC, 73) + "</g>";
    }
    if (type === "lipid" || type === "thrombotic") {
      // Lens-shaped core with pointed ends
      m += '<path d="M' + pt(ap(68, -154)) + " A68 68 0 0 1 " + pt(ap(68, -26)) + " Q" + pt(ap(2, -90)) + " " + pt(ap(68, -154)) + ' Z" fill="url(#plq-core)"/>';
      m += '<g stroke="#fffdf5" stroke-width="1.5" stroke-linecap="round" opacity=".9">';
      [[-128, 50], [-108, 40], [-88, 56], [-68, 44], [-50, 54]].forEach(function (c) {
        m += '<line x1="' + n1(ap(c[1], c[0])[0]) + '" y1="' + n1(ap(c[1], c[0])[1]) + '" x2="' + n1(ap(c[1] + 9, c[0] + 7)[0]) + '" y2="' + n1(ap(c[1] + 9, c[0] + 7)[1]) + '"/>';
      });
      m += "</g>";
    }
    if (type === "lipid") m += foam([ap(52, -158), ap(44, -164), ap(52, -22), ap(44, -16)]);
    if (type === "calcific") {
      m += caArc(48, 68, -205, -152) + caArc(48, 69, -145, -90) + caArc(47, 68, -83, -30) + caArc(49, 67, -23, 25);
    }
    if (type === "thrombotic") {
      // Cap around the channel with a crack at the top
      m += '<path d="' + arcPath(L.r + 3, -80, 260, XC, L.y) + '" fill="none" stroke="#fdf3d0" stroke-width="6"/>';
    } else if (type !== "fibrous") {
      m += circ(XC, L.y, L.r + (type === "lipid" ? 5 : 7), 'fill="#fbf1d6"');
    }
    m += circ(XC, L.y, L.r, 'fill="url(#plq-xlum)"');
    if (type === "thrombotic") {
      var top = ap(L.r, -90, XC, L.y);
      m += '<g class="xclot" style="opacity:0"><path d="' + clotCut(XC, L.y, L.r - 0.5, L.y + L.r - 10) + '" fill="url(#plq-clot-pat)" stroke="#6b1414" stroke-width="1.2"/>' +
        '<ellipse cx="' + n1(top[0]) + '" cy="' + n1(top[1] + 6) + '" rx="11" ry="5.5" fill="#f1f5f9"/></g>' +
        '<ellipse cx="' + n1(top[0]) + '" cy="' + n1(top[1] - 1) + '" rx="6" ry="3.5" fill="#facc15"/>';
    } else {
      var rs = L.r > 30 ? [[-12, -8, 30, 0.9], [10, 6, -20, 0.9], [-4, 14, 70, 0.8]] : [[-6, -3, 25, 0.75], [7, 5, -30, 0.75]];
      rs.forEach(function (c) { m += rbc(XC + c[0], L.y + c[1], c[2], c[3]); });
    }
    m += circ(XC, YC, RO, 'fill="none" stroke="#ffd2cc" stroke-opacity=".3" stroke-width="1.5"');
    return m;
  }

  /** The lens-shaped core region (same shape as the fatty core in the tissue view). */
  function lensD(r) {
    return "M" + pt(ap(r, -154)) + " A" + r + " " + r + " 0 0 1 " + pt(ap(r, -26)) + " Q" + pt(ap(2, -90)) + " " + pt(ap(r, -154)) + " Z";
  }
  var IVUS_PLQ = { fibrous: "url(#ivus-fib)", lipid: "#8a8a8a", calcific: "#a3a3a3", thrombotic: "#8a8a8a" };

  /* IVUS: grey-scale ultrasound from a tiny probe in the middle of the artery.
     Bright = echo-dense (fibrous tissue, calcium); dark = echo-poor (fatty core, the muscle layer).
     Calcium reflects nearly all the sound, so it casts a black shadow with faint echoes (reverberations). */
  function xIvus(type) {
    var t = TYPES[type], L = lumenOf(t), m = "", cath = [XC, L.y];
    m += circ(XC, YC, 104, 'fill="#000"') + circ(XC, YC, 98, 'fill="url(#ivus-adv)"');  // outer layer: bright, fading with depth
    m += circ(XC, YC, 84, 'fill="none" stroke="#141414" stroke-width="6"');              // media: the dark band
    m += circ(XC, YC, 81, 'fill="' + IVUS_PLQ[type] + '"');
    if (type === "lipid" || type === "thrombotic") m += '<path d="' + lensD(70) + '" fill="#2e2e2e" filter="url(#ivus-soft)"/>'; // echo-poor soft core
    m += circ(XC, YC, 98, 'fill="url(#ivus-speck)" opacity=".55"');                       // ultrasound speckle
    if (type === "lipid") m += '<path d="' + sector(62, 110, -150, -30) + '" fill="#000" opacity=".75" filter="url(#ivus-blur)"/>'; // sound fades behind the core
    if (type === "calcific") {
      m += '<path d="' + sector(52, 112, -205, 25) + '" fill="#000"/>';                   // acoustic shadow
      m += '<g fill="none" stroke="#d4d4d4" stroke-linecap="round"><path d="' + arcPath(64, -200, 20) + '" stroke-width="1.6" opacity=".35"/>' +
        '<path d="' + arcPath(76, -196, 16) + '" stroke-width="1.3" opacity=".18"/></g>';
      m += '<path d="' + sector(46, 52, -205, 25) + '" fill="#fafafa" filter="url(#ivus-edge)"/>'; // the bright calcium surface
    }
    // Blood in the channel: dark with a faint speckle
    m += circ(XC, L.y, L.r, 'fill="#060606"') + circ(XC, L.y, L.r, 'fill="url(#ivus-speck)" opacity=".18"');
    m += circ(XC, L.y, L.r + 0.8, 'fill="none" stroke="#e5e5e5" stroke-opacity=".5" stroke-width="1.6"'); // bright blood-wall border
    if (type === "thrombotic") {
      var top = ap(L.r + 4, -90, XC, L.y), cd = clotCut(XC, L.y, L.r - 1, L.y + 4);
      m += '<ellipse cx="' + n1(top[0]) + '" cy="' + n1(top[1]) + '" rx="12" ry="6" fill="#0e0e0e" filter="url(#ivus-soft)"/>'; // the cracked cap: an echo-free gap
      m += '<g class="xclot" style="opacity:0"><path d="' + cd + '" fill="#434343"/><path d="' + cd + '" fill="url(#ivus-speck)" opacity=".8"/></g>';
      cath = [XC, L.y + L.r * 0.58];
    }
    // Guidewire: a bright dot with a thin shadow behind it
    var wx = cath[0] + 13, wy = cath[1] + 8, th = Math.atan2(wy - cath[1], wx - cath[0]);
    m += '<path d="M' + pt([wx, wy]) + " L" + pt([cath[0] + 150 * Math.cos(th - 0.06), cath[1] + 150 * Math.sin(th - 0.06)]) +
      " L" + pt([cath[0] + 150 * Math.cos(th + 0.06), cath[1] + 150 * Math.sin(th + 0.06)]) + ' Z" fill="#000" opacity=".9"/>';
    m += circ(wx, wy, 2.6, 'fill="#fff"');
    // IVUS catheter: black core with the bright "ring-down" halo around it
    m += circ(cath[0], cath[1], 12.5, 'fill="none" stroke="#bdbdbd" stroke-opacity=".35" stroke-width="2"') +
      circ(cath[0], cath[1], 9.5, 'fill="none" stroke="#f5f5f5" stroke-width="2.4" opacity=".85"') +
      circ(cath[0], cath[1], 7, 'fill="#000"');
    return '<g clip-path="url(#ivus-clip)">' + m + "</g>" + circ(XC, YC, 104, 'fill="none" stroke="#475569" stroke-width="2"');
  }

  var DEFS = "<defs>" +
    '<linearGradient id="plq-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6b0aa"/><stop offset=".18" stop-color="#d9706b"/><stop offset=".5" stop-color="#b9504c"/><stop offset=".82" stop-color="#d9706b"/><stop offset="1" stop-color="#9e3b38"/></linearGradient>' +
    '<linearGradient id="plq-lumen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c0b12"/><stop offset=".5" stop-color="#8a1c24"/><stop offset="1" stop-color="#3f0910"/></linearGradient>' +
    '<linearGradient id="plq-fib" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ece0c2"/><stop offset=".5" stop-color="#f8f0dc"/><stop offset="1" stop-color="#e0cfa8"/></linearGradient>' +
    '<linearGradient id="plq-lip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efd99a"/><stop offset=".5" stop-color="#f8e9bf"/><stop offset="1" stop-color="#e8cd86"/></linearGradient>' +
    '<radialGradient id="plq-core" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fde047"/><stop offset=".6" stop-color="#facc15"/><stop offset="1" stop-color="#d4a106"/></radialGradient>' +
    '<linearGradient id="plq-ca" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e5e7eb"/><stop offset="1" stop-color="#b6bfcc"/></linearGradient>' +
    '<pattern id="plq-clot-pat" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#8f1d1d"/>' +
      '<path d="M0 9 L14 4 M-2 2 L6 0 M5 14 L14 10" stroke="#fca5a5" stroke-opacity=".45" stroke-width="1"/>' +
      '<circle cx="3.5" cy="4.5" r="2.6" fill="#dc2626"/><circle cx="10" cy="9" r="2.8" fill="#b91c1c"/><circle cx="6" cy="12" r="1.8" fill="#ef4444"/></pattern>' +
    '<radialGradient id="plq-xwall" cx=".5" cy=".5" r=".5"><stop offset=".78" stop-color="#d9706b"/><stop offset=".9" stop-color="#c45a55"/><stop offset="1" stop-color="#9e3b38"/></radialGradient>' +
    '<radialGradient id="plq-xlum" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#8a1c24"/><stop offset="1" stop-color="#4c0b12"/></radialGradient>' +
    '<radialGradient id="ivus-adv" cx=".5" cy=".5" r=".5"><stop offset=".8" stop-color="#a8a8a8"/><stop offset=".9" stop-color="#7c7c7c"/><stop offset="1" stop-color="#0c0c0c"/></radialGradient>' +
    '<radialGradient id="ivus-fib" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#d4d4d4"/><stop offset="1" stop-color="#b3b3b3"/></radialGradient>' +
    '<pattern id="ivus-speck" width="17" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(23)">' +
      '<ellipse cx="2" cy="2.5" rx="1.6" ry=".8" fill="#fff" opacity=".55"/><ellipse cx="9" cy="1.5" rx="1" ry=".6" fill="#000"/>' +
      '<ellipse cx="13.5" cy="5" rx="1.8" ry=".9" fill="#000" opacity=".8"/><ellipse cx="5" cy="8" rx="1.3" ry=".7" fill="#fff" opacity=".45"/>' +
      '<ellipse cx="11" cy="10.5" rx="1.5" ry=".8" fill="#fff" opacity=".35"/><ellipse cx="15.5" cy="11" rx=".9" ry=".6" fill="#000"/>' +
      '<ellipse cx="1.5" cy="11.5" rx="1" ry=".7" fill="#000" opacity=".7"/></pattern>' +
    '<filter id="ivus-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.5"/></filter>' +
    '<filter id="ivus-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>' +
    '<filter id="ivus-edge" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".8"/></filter>' +
    '<clipPath id="ivus-clip"><circle cx="' + XC + '" cy="' + YC + '" r="104"/></clipPath>' +
    '<clipPath id="plq-lumen-clip"><rect x="' + X0 + '" y="' + TOP + '" width="' + (X1 - X0) + '" height="' + 2 * R + '"/></clipPath>' +
    "</defs>";

  CV.plaque = function (section) {
    var svg = section.querySelector("#plaque-svg"), canvas = section.querySelector("#plaque-canvas");
    if (!svg || !canvas) return null;
    CV.tissue(svg, 800, 450);
    CV.html(svg, DEFS);

    // Artery shell
    var side = CV.el("g", { "aria-hidden": "true" }, svg);
    CV.html(side,
      '<rect x="' + X0 + '" y="' + (TOP - W) + '" width="' + (X1 - X0) + '" height="' + 2 * (R + W) + '" fill="url(#plq-wall)"/>' +
      '<rect x="' + X0 + '" y="' + TOP + '" width="' + (X1 - X0) + '" height="' + 2 * R + '" fill="url(#plq-lumen)"/>');
    var cells = CV.el("g", { "clip-path": "url(#plq-lumen-clip)" }, side);

    var groups = {};
    ORDER.forEach(function (k) {
      var g = CV.el("g", { class: "ptype", "data-type": k }, side);
      CV.html(g, sideMarkup(k));
      groups[k] = [g];
    });
    // Front highlights, the cut end of the artery, and the slice marker joining it to the cross-section
    var ah = [CX, BOT + W + 8], ae = [584, 318], dir = [ae[0] - 520, ae[1] - 392], dl = Math.hypot(dir[0], dir[1]);
    dir = [dir[0] / dl, dir[1] / dl];
    CV.html(side,
      '<line x1="' + X0 + '" y1="' + TOP + '" x2="' + X1 + '" y2="' + TOP + '" stroke="#ffd2cc" stroke-opacity=".35" stroke-width="1.5"/>' +
      '<line x1="' + X0 + '" y1="' + BOT + '" x2="' + X1 + '" y2="' + BOT + '" stroke="#ffd2cc" stroke-opacity=".2" stroke-width="1.5"/>' +
      '<rect x="' + X0 + '" y="' + (TOP - W + 4) + '" width="' + (X1 - X0) + '" height="' + W * 0.32 + '" fill="#fff" opacity=".12"/>' +
      '<ellipse cx="' + X1 + '" cy="' + CY + '" rx="13" ry="' + (R + W) + '" fill="#c45a55" stroke="#9e3b38" stroke-width="1.5"/>' +
      '<ellipse cx="' + X1 + '" cy="' + CY + '" rx="9" ry="' + R + '" fill="#5b0f17"/>' +
      '<g fill="none" stroke="#f5c542" stroke-width="2" stroke-dasharray="5 5">' +
        '<ellipse cx="' + CX + '" cy="' + CY + '" rx="9" ry="' + (R + W + 5) + '"/>' +
        '<path d="M' + pt(ah) + " C" + CX + " 380 520 392 " + pt(ae) + '"/></g>' +
      '<path d="M' + pt(ae) + " L" + pt([ae[0] - dir[0] * 11 - dir[1] * 6, ae[1] - dir[1] * 11 + dir[0] * 6]) +
        " L" + pt([ae[0] - dir[0] * 11 + dir[1] * 6, ae[1] - dir[1] * 11 - dir[0] * 6]) + ' Z" fill="#f5c542"/>');

    var lbls = CV.el("g", { class: "plq-lbls", "aria-hidden": "true" }, svg);
    var xs = CV.el("g", { "aria-hidden": "true" }, svg);
    ORDER.forEach(function (k) {
      var lg = CV.el("g", {}, lbls);
      CV.html(lg, labelMarkup(LABELS[k]));
      var xg = CV.el("g", {}, xs);
      CV.html(xg, '<g class="x-tissue">' + xTissue(k) + '</g><g class="x-ivus">' + xIvus(k) + "</g>");
      groups[k].push(lg, xg);
    });
    CV.html(xs,
      '<text class="svg-lbl x-cap x-tissue" x="' + XC + '" y="' + (YC + RO + 34) + '" text-anchor="middle" data-i18n="plq.xsec">Cross-section</text>' +
      '<text class="svg-lbl x-cap x-ivus" x="' + XC + '" y="' + (YC + RO + 34) + '" text-anchor="middle" data-i18n="plq.ivuscap">IVUS image (schematic)</text>');

    var clotEl = svg.querySelector("#plq-clot");
    var linked = [svg.querySelector("#plq-white"), svg.querySelector("#plq-clot-lbl")].concat([].slice.call(svg.querySelectorAll(".xclot")));

    // Live geometry, tweened between types; the blood cells follow it
    var P = { aTop: TYPES.fibrous.aTop, aBot: TYPES.fibrous.aBot, s: TYPES.fibrous.s, camp: 0 };
    function edges(x) {
      var b = bump(x, CX, P.s), top = TOP + P.aTop * b, bot = BOT - P.aBot * b;
      return [top + clotThick(x, P.camp, top, bot), bot];
    }
    var meter = CV.meterUpdater("plq-flow-bar", "plq-flow-val");
    var field = new CV.FlowField(cells, {
      x0: X0, x1: X1, edges: edges, count: 30, speed: 150, refW: 112, maxBoost: 2.4, flow: TYPES.fibrous.flow,
      onFrame: function (f) { meter(f.flow); },
    });
    CV.watch(canvas, field);

    function refresh() { meter(field.flow); if (CV.reduced || !field.visible) field.render(); }
    function drawClot() {
      var k = CV.clamp(P.camp * 1.25, 0, 1);
      clotEl.setAttribute("d", clotD(P.camp));
      clotEl.style.opacity = P.camp > 0.01 ? 1 : 0;
      linked.forEach(function (el) { if (el) el.style.opacity = k; });
      refresh();
    }

    var current = null;
    function select(type, instant) {
      if (!TYPES[type] || type === current) return;
      current = type;
      var t = TYPES[type], now = instant || CV.reduced;
      gsap.killTweensOf(P);
      gsap.killTweensOf(field);
      ORDER.forEach(function (k) {
        if (now) gsap.set(groups[k], { opacity: k === type ? 1 : 0 });
        else gsap.to(groups[k], { opacity: k === type ? 1 : 0, duration: 0.5, overwrite: true });
      });
      if (now) {
        P.aTop = t.aTop; P.aBot = t.aBot; P.s = t.s; P.camp = t.clot; field.flow = t.flow;
        drawClot();
        return;
      }
      gsap.to(P, { aTop: t.aTop, aBot: t.aBot, s: t.s, duration: 0.8, ease: "power2.inOut", onUpdate: refresh });
      // A clot builds up on the cracked plaque and almost closes the artery
      gsap.to(P, { camp: t.clot, duration: t.clot ? 1.6 : 0.6, delay: t.clot ? 0.35 : 0, ease: t.clot ? "power1.inOut" : "power2.out", onUpdate: drawClot });
      gsap.to(field, { flow: t.flow, duration: t.clot ? 1.9 : 0.8, ease: "power1.inOut", onUpdate: refresh });
    }
    function setView(v) { svg.classList.toggle("view-ivus", v === "ivus"); }

    // Tabs: click or arrow keys (automatic activation, roving tabindex)
    var tabs = [].slice.call(section.querySelectorAll('[role="tab"]'));
    function activate(tab, focus) {
      tabs.forEach(function (b) {
        var on = b === tab;
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
        var p = document.getElementById(b.getAttribute("aria-controls"));
        if (p) p.hidden = !on;
      });
      if (focus) tab.focus();
      select(tab.getAttribute("data-plaque"));
    }
    tabs.forEach(function (b, i) {
      b.addEventListener("click", function () { activate(b); });
      b.addEventListener("keydown", function (e) {
        var j = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 :
          e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : null;
        if (j == null) return;
        e.preventDefault();
        activate(tabs[(j + tabs.length) % tabs.length], true);
      });
    });
    [].slice.call(section.querySelectorAll("[data-view]")).forEach(function (b, i, all) {
      b.addEventListener("click", function () {
        all.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        setView(b.getAttribute("data-view"));
      });
    });

    select("fibrous", true);
    return { select: select, setView: setView };
  };
})();
