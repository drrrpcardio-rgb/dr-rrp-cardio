/* CathLab Visual — angioplasty (PCI) scene and the before/after slider.
   A magnified side view of a coronary artery with an eccentric plaque (about 85% narrowing).
   Devices are plain SVG groups moved with GSAP:
     wire      stroke-dashoffset draws it across the lesion
     balloon   scaleY from folded (0.11) to inflated (1); the plaque is squashed at the same time
     stent     a zig-zag mesh that scales from crimped to expanded (scaleY, non-scaling strokes) */
(function () {
  "use strict";
  var CV = window.CV;
  var FOLDED = 0.11;

  function tissue(svg, w, h) {
    CV.html(svg,
      '<defs><linearGradient id="' + svg.id + '-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1426"/><stop offset=".5" stop-color="#1a1530"/><stop offset="1" stop-color="#2a1426"/></linearGradient></defs>' +
      '<rect width="' + w + '" height="' + h + '" fill="url(#' + svg.id + '-bg)"/>' +
      '<g stroke="#4a2236" stroke-width="2" fill="none" opacity=".55">' +
        '<path d="M-10 30 C200 10 400 50 810 20"/><path d="M-10 70 C220 50 420 90 810 60"/>' +
        '<path d="M-10 ' + (h - 60) + ' C200 ' + (h - 80) + ' 420 ' + (h - 40) + ' 810 ' + (h - 70) + '"/><path d="M-10 ' + (h - 22) + ' C220 ' + (h - 42) + ' 420 ' + (h - 2) + ' 810 ' + (h - 30) + '"/>' +
      '</g>');
  }

  /** Stent mesh: zig-zag rings joined by short links. Drawn expanded; scaleY crimps it. */
  function stentPath(x0, x1, cy, h, rings, crowns) {
    var d = "", gap = (x1 - x0) / (rings - 1), amp = gap * 0.32;
    for (var r = 0; r < rings; r++) {
      var x = x0 + r * gap;
      for (var c = 0; c <= crowns; c++) {
        var y = cy - h + (2 * h * c) / crowns;
        var xx = x + (c % 2 ? amp : -amp);
        d += (c === 0 ? "M" : "L") + xx.toFixed(1) + " " + y.toFixed(1) + " ";
      }
      if (r < rings - 1) {
        for (var k = 1; k < crowns; k += 2) {
          var yk = cy - h + (2 * h * k) / crowns;
          d += "M" + (x + amp).toFixed(1) + " " + yk.toFixed(1) + " L" + (x + gap - amp).toFixed(1) + " " + yk.toFixed(1) + " ";
        }
      }
    }
    return d;
  }
  function stentMarkup(x0, x1, cy, h) {
    var d = stentPath(x0, x1, cy, h, 9, 10);
    return '<path d="' + d + '" fill="none" stroke="#334155" stroke-width="4.2" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity=".7"/>' +
      '<path d="' + d + '" fill="none" stroke="#e5e7eb" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
  }
  function capsule(x0, x1, cy, h, fill, stroke) {
    var r = 22;
    return '<path d="M' + (x0 + r) + " " + (cy - h) + " L" + (x1 - r) + " " + (cy - h) +
      " C" + (x1 - 4) + " " + (cy - h) + " " + (x1 + 8) + " " + (cy - h * 0.4) + " " + (x1 + 10) + " " + cy +
      " C" + (x1 + 8) + " " + (cy + h * 0.4) + " " + (x1 - 4) + " " + (cy + h) + " " + (x1 - r) + " " + (cy + h) +
      " L" + (x0 + r) + " " + (cy + h) +
      " C" + (x0 + 4) + " " + (cy + h) + " " + (x0 - 8) + " " + (cy + h * 0.4) + " " + (x0 - 10) + " " + cy +
      " C" + (x0 - 8) + " " + (cy - h * 0.4) + " " + (x0 + 4) + " " + (cy - h) + " " + (x0 + r) + " " + (cy - h) +
      ' Z" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.6" vector-effect="non-scaling-stroke"/>';
  }

  function meterUpdater(barId, valId) {
    var bar = document.getElementById(barId), val = document.getElementById(valId);
    return function (flow) {
      if (bar) bar.style.transform = "scaleX(" + flow.toFixed(3) + ")";
      if (val) val.textContent = Math.round(flow * 100) + "%";
    };
  }

  // Shared with the plaque and thrombus aspiration scenes
  CV.tissue = tissue;
  CV.stentMarkup = stentMarkup;
  CV.capsule = capsule;
  CV.meterUpdater = meterUpdater;
  CV.FOLDED = FOLDED;

  CV.angioplasty = function (canvas) {
    var svg = CV.el("svg", { viewBox: "0 0 800 450", id: "pci-svg", "aria-hidden": "true", focusable: "false" });
    canvas.appendChild(svg);
    canvas.insertAdjacentHTML("beforeend",
      '<div class="stage-hud" aria-hidden="true"><span class="chip flow-meter"><span data-i18n="ui.flow">Blood flow</span> <span class="bar"><i id="pci-flow-bar"></i></span> <b id="pci-flow-val">30%</b></span></div>');
    tissue(svg, 800, 450);

    var LX = 420, CY = 225;
    var art = CV.buildArtery(svg, { id: "pa", x0: -10, x1: 810, cy: CY, R: 62, wall: 28, cx: LX, spread: 62, aTop: 66, aBot: 40 });
    var meter = meterUpdater("pci-flow-bar", "pci-flow-val");
    var field = new CV.FlowField(art.cells, {
      x0: -10, x1: 810, edges: art.edges, count: 46, speed: 170, refW: 124, maxBoost: 2.4, flow: 0.3,
      onFrame: function (f) { meter(f.flow); },
    });
    CV.watch(canvas, field);

    // Devices behind the plaque: contrast, wire, balloon, stent delivery balloon
    CV.html(art.devBack,
      '<rect id="p-dye" x="-10" y="' + art.top + '" width="820" height="' + 2 * art.R + '" fill="#e0f2fe" opacity="0"/>' +
      '<path id="p-wire" d="M-10 236 C200 236 330 238 420 238 C520 238 640 234 740 230 C760 229 772 236 768 246" fill="none" stroke="#d1d5db" stroke-width="2.2" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>' +
      '<g id="p-bal1"><line x1="-900" y1="225" x2="332" y2="225" stroke="#94a3b8" stroke-width="5"/>' +
        '<g id="p-bal1-body">' + capsule(318, 522, CY, 57, "rgba(125,211,252,.78)", "#e0f2fe") + '</g>' +
        '<rect x="328" y="220" width="5" height="10" fill="#1e293b"/><rect x="507" y="220" width="5" height="10" fill="#1e293b"/></g>' +
      '<g id="p-sys"><line x1="-900" y1="225" x2="310" y2="225" stroke="#94a3b8" stroke-width="5"/>' +
        '<g id="p-bal2-body">' + capsule(318, 522, CY, 57, "rgba(165,180,252,.75)", "#e0e7ff") + '</g>' +
        '<rect x="328" y="220" width="5" height="10" fill="#1e293b"/><rect x="507" y="220" width="5" height="10" fill="#1e293b"/></g>');
    // In front of the plaque: the stent mesh, the lesion marker, labels
    CV.html(art.devFront,
      '<g id="p-stent"><g id="p-stent-mesh">' + stentMarkup(322, 518, CY, 60) + '</g></g>' +
      '<g id="p-marker" opacity="0">' +
        '<circle class="pulse-ring" cx="' + LX + '" cy="238" r="46" fill="none" stroke="#f59e0b" stroke-width="3"/>' +
        '<circle cx="' + LX + '" cy="238" r="46" fill="none" stroke="#f59e0b" stroke-width="3"/>' +
        '<line x1="' + LX + '" y1="192" x2="' + LX + '" y2="122" stroke="#f59e0b" stroke-width="2.5"/>' +
        '<rect x="' + (LX - 120) + '" y="84" width="240" height="40" rx="20" fill="#f59e0b"/>' +
        '<text x="' + LX + '" y="110" text-anchor="middle" font-size="17" font-weight="800" fill="#0a1233" font-family="Manrope, sans-serif" data-i18n="pci.narrow">Narrowing, about 85%</text>' +
      '</g>' +
      '<g id="p-ok" opacity="0">' +
        '<rect x="' + (LX - 110) + '" y="84" width="220" height="40" rx="20" fill="#14b8a6"/>' +
        '<path d="M' + (LX - 88) + ' 104 l7 7 l13 -14" fill="none" stroke="#0a1233" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<text x="' + (LX + 10) + '" y="110" text-anchor="middle" font-size="17" font-weight="800" fill="#0a1233" font-family="Manrope, sans-serif" data-i18n="pci.restored">Blood flow restored</text>' +
      '</g>');
    // Mini angiogram thumbnail for step 1
    CV.html(svg,
      '<g id="p-mini" opacity="0">' +
        '<rect x="586" y="300" width="196" height="132" rx="12" fill="#b5b9be" stroke="#e2e8f0" stroke-width="2"/>' +
        '<g fill="none" stroke="#23272e" stroke-linecap="round">' +
          '<path d="M606 318 C630 322 650 326 664 334" stroke-width="5"/>' +
          '<path d="M664 334 C676 360 684 384 690 424" stroke-width="4.5"/>' +
          '<path d="M664 334 C700 334 730 350 748 380" stroke-width="4"/>' +
          '<path d="M676 370 C694 380 708 392 718 410" stroke-width="3"/>' +
        '</g>' +
        '<g fill="#b5b9be"><ellipse cx="678.4" cy="374" rx="2" ry="7"/><ellipse cx="683" cy="376" rx="2" ry="6"/></g>' +
        '<circle class="pulse-ring" cx="680.5" cy="375" r="11" fill="none" stroke="#f59e0b" stroke-width="2.5"/>' +
        '<circle cx="680.5" cy="375" r="11" fill="none" stroke="#f59e0b" stroke-width="2.5"/>' +
        '<text x="598" y="424" font-size="11" font-weight="700" fill="#1f2937" font-family="ui-monospace, Consolas, monospace">ANGIO</text>' +
      '</g>');

    function $(id) { return svg.querySelector("#" + id); }
    var E = {
      dye: $("p-dye"), wire: $("p-wire"), bal1: $("p-bal1"), body1: $("p-bal1-body"),
      sys: $("p-sys"), body2: $("p-bal2-body"), stent: $("p-stent"), mesh: $("p-stent-mesh"),
      marker: $("p-marker"), ok: $("p-ok"), mini: $("p-mini"),
    };
    var origin = LX + " " + CY;

    function setFlow(v) { return { flow: v, onUpdate: function () { meter(field.flow); if (CV.reduced || !field.visible) field.render(); } }; }
    function plaque(top, bot, d, ease) { return { top: top, bot: bot, duration: d, ease: ease || "power2.inOut", onUpdate: art.apply }; }

    function reset() {
      art.k.top = 1; art.k.bot = 1; art.apply();
      field.flow = 0.3; meter(0.3); field.render();
      gsap.set(E.wire, { strokeDashoffset: 1 });
      gsap.set([E.bal1, E.sys, E.stent], { x: -640, y: 13 });
      gsap.set([E.body1, E.body2, E.mesh], { svgOrigin: origin, scaleY: FOLDED });
      gsap.set([E.dye, E.marker, E.ok, E.mini], { opacity: 0 });
      gsap.set(E.marker, { svgOrigin: LX + " 238", scale: 0.7 });
      gsap.set(E.mini, { y: 12 });
    }

    function build(tl) {
      reset();
      // 1 · Blockage on the angiogram
      tl.addLabel("s0")
        .to(E.mini, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" })
        .to(E.marker, { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(2)" }, "<0.3")
        .to({}, { duration: 0.6 })
        .addLabel("e0");
      // 2 · Wire crosses the lesion
      tl.addLabel("s1")
        .to([E.marker, E.mini], { opacity: 0, duration: 0.5 })
        .to(E.wire, { strokeDashoffset: 0, duration: 2.2, ease: "power1.inOut" }, "<0.2")
        .addLabel("e1");
      // 3 · Balloon rides over the wire into the narrowing
      tl.addLabel("s2")
        .to(E.bal1, { x: 0, duration: 1.8, ease: "power2.inOut" })
        .addLabel("e2");
      // 4 · Balloon inflation squashes the plaque; flow pauses while the balloon fills the artery
      tl.addLabel("s3")
        .to(E.body1, { scaleY: 1, duration: 1.4, ease: "power2.inOut" })
        .to(E.bal1, { y: 0, duration: 1.4, ease: "power2.inOut" }, "<")
        .to(art.k, plaque(0.42, 0.45, 1.4), "<")
        .to(field, Object.assign(setFlow(0), { duration: 0.6 }), "<")
        .to({}, { duration: 0.6 })
        .addLabel("e3");
      // 5 · Swap to the stent balloon, expand the stent
      tl.addLabel("s4")
        .to(E.body1, { scaleY: FOLDED, duration: 0.7, ease: "power2.inOut" })
        .to(E.bal1, { y: 13, duration: 0.7, ease: "power2.inOut" }, "<")
        .to(art.k, plaque(0.5, 0.52, 0.7), "<")
        .to(field, Object.assign(setFlow(0.5), { duration: 0.7 }), "<")
        .to(E.bal1, { x: -640, duration: 1, ease: "power2.in" })
        .to([E.sys, E.stent], { x: 0, duration: 1.6, ease: "power2.inOut" }, "-=0.2")
        .to([E.body2, E.mesh], { scaleY: 1, duration: 1.3, ease: "power2.inOut" })
        .to([E.sys, E.stent], { y: 0, duration: 1.3, ease: "power2.inOut" }, "<")
        .to(art.k, plaque(0.12, 0.14, 1.3), "<")
        .to(field, Object.assign(setFlow(0), { duration: 0.5 }), "<")
        .addLabel("e4");
      // 6 · Deflate and withdraw the balloon; the stent stays
      tl.addLabel("s5")
        .to(E.body2, { scaleY: FOLDED, duration: 0.7, ease: "power2.inOut" })
        .to(E.sys, { y: 13, duration: 0.7, ease: "power2.inOut" }, "<")
        .to(field, Object.assign(setFlow(0.85), { duration: 0.9 }), "<")
        .to(E.sys, { x: -660, duration: 1.1, ease: "power2.in" })
        .addLabel("e5");
      // 7 · Final angiogram: wire out, dye flash, brisk flow
      tl.addLabel("s6")
        .to(E.wire, { strokeDashoffset: 1, duration: 1.2, ease: "power1.in" })
        .to(E.dye, { opacity: 0.55, duration: 0.35 }, "-=0.2")
        .to(E.dye, { opacity: 0, duration: 1.4, ease: "power1.out" })
        .to(field, Object.assign(setFlow(1), { duration: 1 }), "<")
        .to(E.ok, { opacity: 1, duration: 0.6 }, "<0.4")
        .addLabel("e6");
    }

    return { build: build };
  };

  /* ---------- Before / after slider ---------- */
  CV.beforeAfter = function (wrap) {
    function scene(svg, after) {
      tissue(svg, 800, 350);
      var art = CV.buildArtery(svg, { id: svg.id + "a", x0: -10, x1: 810, cy: 175, R: 56, wall: 26, cx: 400, spread: 70, aTop: 58, aBot: 36 });
      if (after) {
        art.k.top = 0.1; art.k.bot = 0.12; art.apply();
        CV.html(art.devFront, stentMarkup(318, 482, 175, 54));
      }
      var f = new CV.FlowField(art.cells, {
        x0: -10, x1: 810, edges: art.edges, count: 40, speed: 170, refW: 112, maxBoost: 2.4, flow: after ? 1 : 0.28,
      });
      CV.watch(wrap, f);
    }
    scene(wrap.querySelector("#ba-before"), false);
    scene(wrap.querySelector("#ba-after"), true);
    var range = wrap.querySelector("#ba-range");
    function setPos() {
      wrap.style.setProperty("--pos", range.value + "%");
      range.setAttribute("aria-valuetext", range.value + "%");
    }
    range.addEventListener("input", setPos);
    setPos();
  };
})();
