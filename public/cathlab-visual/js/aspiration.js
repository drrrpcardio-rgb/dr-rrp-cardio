/* CathLab Visual — thrombus aspiration in a heart attack.
   Same magnified side view as the angioplasty scene, but the artery is blocked by a clot on a cracked plaque.
     clot      a path rebuilt from T.amp (how far it reaches into the channel) and T.eat (everything
               upstream of this x has been sucked out), so the blood cells and the drawing always agree
     catheter  an open-tipped tube on the wire; suction pulls clot pieces into its tip
     panel     bottom right: ECG with ST elevation, then the suction syringe, then the filter with the clot */
(function () {
  "use strict";
  var CV = window.CV;
  var CY = 225, LX = 420, WY = 238;           // artery centre, stent centre, wire height
  var CLOT = { cx: 455, s: 62 };               // where the clot sits and how long it is
  var TIP0 = 300, TIP1 = 560, PASS = 2.6;      // aspiration pass: catheter tip from TIP0 to TIP1 in PASS seconds

  function n1(v) { return String(Math.round(v * 10) / 10); }
  function bump(x, c, s) {
    var d = (x - c) / s;
    if (d > 0) d *= 0.85;
    return Math.exp(-d * d * d * d * 0.6 - d * d * 0.6);
  }
  /** How much of the open channel the clot fills at x: flat-topped, tapering at both ends, slightly lumpy. */
  function clotW(x) {
    var d = (x - CLOT.cx) / CLOT.s;
    if (d > 0) d *= 0.8;
    var d2 = d * d;
    return Math.min(1, Math.exp(-d2 * d2 * d2 * 0.9) * (1.04 + 0.05 * Math.sin(x * 0.29)));
  }

  CV.aspiration = function (canvas) {
    var svg = CV.el("svg", { viewBox: "0 0 800 450", id: "asp-svg", "aria-hidden": "true", focusable: "false" });
    canvas.appendChild(svg);
    canvas.insertAdjacentHTML("beforeend",
      '<div class="stage-hud" aria-hidden="true"><span class="chip flow-meter"><span data-i18n="ui.flow">Blood flow</span> <span class="bar"><i id="asp-flow-bar"></i></span> <b id="asp-flow-val">0%</b></span></div>');
    CV.tissue(svg, 800, 450);
    CV.html(svg, '<defs><pattern id="asp-clot" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#8f1d1d"/>' +
      '<path d="M0 9 L14 4 M-2 2 L6 0 M5 14 L14 10" stroke="#fca5a5" stroke-opacity=".45" stroke-width="1"/>' +
      '<circle cx="3.5" cy="4.5" r="2.6" fill="#dc2626"/><circle cx="10" cy="9" r="2.8" fill="#b91c1c"/><circle cx="6" cy="12" r="1.8" fill="#ef4444"/></pattern>' +
      '<pattern id="asp-mesh" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0 L8 8 M8 0 L0 8" stroke="#94a3b8" stroke-width=".8" opacity=".6"/></pattern></defs>');

    var art = CV.buildArtery(svg, { id: "aa", x0: -10, x1: 810, cy: CY, R: 62, wall: 28, cx: 400, spread: 60, aTop: 52, aBot: 20 });
    // k: share of the channel the clot fills (1 = completely blocked); eat: everything upstream of this x has been sucked out
    var T = { k: 1, eat: 200 };
    function clotAt(x, e) {
      e = e || art.edges(x);
      return T.k * clotW(x) * Math.max(0, e[1] - e[0]) * CV.clamp((x - T.eat) / 24, 0, 1);
    }
    function edges(x) {
      var e = art.edges(x);
      return [Math.min(e[0] + clotAt(x, e), e[1] - 1), e[1]];
    }
    var meter = CV.meterUpdater("asp-flow-bar", "asp-flow-val");
    var field = new CV.FlowField(art.cells, {
      x0: -10, x1: 810, edges: edges, count: 46, speed: 170, refW: 124, maxBoost: 2.4, flow: 0,
      onFrame: function (f) { meter(f.flow); },
    });
    CV.watch(canvas, field);

    // Behind the plaque: contrast flash and the clot (the plaque's bright cap then draws over the clot's base)
    CV.html(art.devBack,
      '<rect id="a2-dye" x="-10" y="' + art.top + '" width="820" height="' + 2 * art.R + '" fill="#e0f2fe" opacity="0"/>' +
      '<path id="a2-clot" fill="url(#asp-clot)" stroke="#6b1414" stroke-width="1.2" stroke-linejoin="round"/>');
    var capY = art.top + 52 * bump(408, 400, 60);
    // In front: the crack, clot pieces, wire, aspiration catheter, stent system, labels
    var frags = "";
    for (var i = 0; i < 8; i++) frags += '<ellipse class="a2-frag" cx="0" cy="0" rx="' + (4 + (i % 3)) + '" ry="' + (3 + (i % 2)) + '" fill="#b91c1c" stroke="#7f1d1d" stroke-width="1" opacity="0"/>';
    // The crack in the plaque cap (inside the plaque group, so it is squashed with the plaque by the stent)
    CV.html(art.plaque.firstChild, '<ellipse cx="408" cy="' + n1(capY - 1) + '" rx="7" ry="3.5" fill="#facc15"/>');
    CV.html(art.devFront,
      '<g id="a2-white"><ellipse cx="411" cy="' + n1(capY + 6) + '" rx="13" ry="6" fill="#f1f5f9"/></g>' +
      frags +
      '<path id="a2-wire" d="M-10 ' + WY + ' C200 ' + WY + " 330 " + WY + " 420 " + WY + " C520 " + WY + " 640 234 740 230 C760 229 772 236 768 246" +
        '" fill="none" stroke="#d1d5db" stroke-width="2.2" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>' +
      '<g id="a2-cath">' +
        '<rect x="-1100" y="' + (WY - 9) + '" width="1100" height="18" fill="#cbd5e1" fill-opacity=".22"/>' +
        '<rect id="a2-cath-blood" x="-1100" y="' + (WY - 6) + '" width="1094" height="12" fill="#b91c1c" opacity="0"/>' +
        '<line id="a2-cath-flow" class="asp-suck" x1="-1100" y1="' + WY + '" x2="-4" y2="' + WY + '" stroke="#fecaca" stroke-width="2" stroke-dasharray="8 10" opacity="0"/>' +
        '<path d="M-1100 ' + (WY - 9) + " L0 " + (WY - 9) + " M-1100 " + (WY + 9) + " L-12 " + (WY + 9) + '" stroke="#e2e8f0" stroke-width="2.4" fill="none"/>' +
        '<path d="M0 ' + (WY - 9) + " L-12 " + (WY + 9) + '" stroke="#e2e8f0" stroke-width="1.4" stroke-dasharray="3 2" fill="none"/>' +
        '<rect x="-34" y="' + (WY - 10) + '" width="5" height="20" fill="#1e293b"/>' +
      "</g>" +
      '<g id="a2-sys"><line x1="-900" y1="' + CY + '" x2="310" y2="' + CY + '" stroke="#94a3b8" stroke-width="5"/>' +
        '<g id="a2-bal">' + CV.capsule(318, 522, CY, 57, "rgba(165,180,252,.75)", "#e0e7ff") + "</g>" +
        '<rect x="328" y="220" width="5" height="10" fill="#1e293b"/><rect x="507" y="220" width="5" height="10" fill="#1e293b"/></g>' +
      '<g id="a2-stent"><g id="a2-mesh">' + CV.stentMarkup(322, 518, CY, 60) + "</g></g>" +
      '<g id="a2-marker" opacity="0">' +
        '<circle class="pulse-ring" cx="432" cy="' + WY + '" r="50" fill="none" stroke="#f87171" stroke-width="3"/>' +
        '<circle cx="432" cy="' + WY + '" r="50" fill="none" stroke="#f87171" stroke-width="3"/>' +
        '<line x1="432" y1="188" x2="432" y2="124" stroke="#f87171" stroke-width="2.5"/>' +
        '<rect x="302" y="84" width="260" height="40" rx="20" fill="#dc2626"/>' +
        '<text x="432" y="110" text-anchor="middle" class="svg-lbl" font-size="17" fill="#fff" stroke="none" data-i18n="asp.blocked">Blocked by a clot</text>' +
      "</g>" +
      '<g id="a2-removed" opacity="0"><rect x="' + (LX - 100) + '" y="84" width="200" height="40" rx="20" fill="#f8fafc"/>' +
        '<text x="' + LX + '" y="110" text-anchor="middle" class="svg-lbl" font-size="17" fill="#0a1233" stroke="none" data-i18n="asp.removed">Clot removed</text></g>' +
      '<g id="a2-ok" opacity="0"><rect x="' + (LX - 110) + '" y="84" width="220" height="40" rx="20" fill="#14b8a6"/>' +
        '<path d="M' + (LX - 94) + ' 104 l7 7 l13 -14" fill="none" stroke="#0a1233" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<text x="' + (LX + 12) + '" y="110" text-anchor="middle" class="svg-lbl" font-size="17" fill="#0a1233" stroke="none" data-i18n="pci.restored">Blood flow restored</text></g>');

    // Bottom-right panel: ECG, suction syringe, filter
    var beat = function (x) {
      return " L" + (x + 6) + " 380 Q" + (x + 9) + " 375 " + (x + 12) + " 380 L" + (x + 16) + " 380 L" + (x + 18) + " 384 L" + (x + 21) + " 350" +
        " L" + (x + 24) + " 372 Q" + (x + 30) + " 356 " + (x + 36) + " 358 Q" + (x + 42) + " 361 " + (x + 44) + " 380 L" + (x + 50) + " 380";
    };
    CV.html(svg,
      '<g id="a2-ecg" opacity="0"><rect x="586" y="300" width="196" height="132" rx="12" fill="#04130f" stroke="#134e4a" stroke-width="2"/>' +
        '<text x="600" y="324" class="svg-lbl" font-size="13" fill="#6ee7b7" stroke="none" data-i18n="asp.ecg">ECG: ST elevation</text>' +
        '<path class="ecg-sweep" pathLength="100" d="M596 380' + beat(604) + beat(654) + beat(704) + " L770 380" + '" fill="none" stroke="#34d399" stroke-width="2" stroke-linejoin="round"/>' +
        '<text x="600" y="420" font-size="11" font-weight="700" fill="#34d399" font-family="ui-monospace, Consolas, monospace">HR 98</text></g>' +
      '<g id="a2-syr" opacity="0"><rect x="586" y="300" width="196" height="132" rx="12" fill="#0f172a" stroke="#334155" stroke-width="2"/>' +
        '<text x="600" y="324" class="svg-lbl" font-size="13" fill="#e2e8f0" stroke="none" data-i18n="asp.syr">Suction syringe</text>' +
        '<line x1="596" y1="366" x2="616" y2="366" stroke="#94a3b8" stroke-width="3"/>' +
        '<line id="a2-tube" x1="596" y1="366" x2="616" y2="366" stroke="#b91c1c" stroke-width="3" opacity="0"/>' +
        '<rect x="616" y="361" width="12" height="10" rx="2" fill="#cbd5e1"/>' +
        '<rect id="a2-blood" x="629" y="353" width="0" height="26" fill="#b91c1c"/>' +
        '<rect x="626" y="350" width="94" height="32" rx="4" fill="#e2e8f0" fill-opacity=".14" stroke="#cbd5e1" stroke-width="1.5"/>' +
        '<g stroke="#cbd5e1" stroke-width="1" opacity=".7"><line x1="646" y1="350" x2="646" y2="357"/><line x1="666" y1="350" x2="666" y2="357"/><line x1="686" y1="350" x2="686" y2="357"/><line x1="706" y1="350" x2="706" y2="357"/></g>' +
        '<g id="a2-plunger"><rect x="629" y="352" width="7" height="28" rx="1.5" fill="#334155"/><line x1="636" y1="366" x2="726" y2="366" stroke="#94a3b8" stroke-width="4"/><rect x="724" y="348" width="6" height="36" rx="2" fill="#94a3b8"/></g>' +
        '<text id="a2-vac" x="600" y="414" class="svg-lbl" font-size="12" fill="#fca5a5" stroke="none" opacity="0" data-i18n="asp.vac">Suction on</text></g>' +
      '<g id="a2-filter" opacity="0"><rect x="586" y="300" width="196" height="132" rx="12" fill="#0f172a" stroke="#334155" stroke-width="2"/>' +
        '<text x="600" y="324" class="svg-lbl" font-size="13" fill="#e2e8f0" stroke="none" data-i18n="asp.filter">Clot caught in the filter</text>' +
        '<path d="M636 340 L732 340 L716 414 L652 414 Z" fill="url(#asp-mesh)" stroke="#cbd5e1" stroke-width="1.5"/>' +
        '<g fill="url(#asp-clot)" stroke="#6b1414" stroke-width="1">' +
          '<path d="M660 396 C664 384 680 384 686 392 C692 400 680 408 670 406 C662 405 658 402 660 396 Z"/>' +
          '<path d="M690 380 C696 372 708 376 708 386 C708 394 698 398 692 392 Z"/>' +
          '<path d="M664 370 C668 364 678 366 678 372 C678 378 668 380 664 376 Z"/>' +
          '<ellipse cx="700" cy="404" rx="7" ry="4.5"/><ellipse cx="648" cy="384" rx="5" ry="3.5"/></g>' +
        '<ellipse cx="684" cy="372" rx="5" ry="2.6" fill="#f1f5f9"/></g>');

    function $(id) { return svg.querySelector("#" + id); }
    var E = {
      dye: $("a2-dye"), clot: $("a2-clot"), white: $("a2-white"), wire: $("a2-wire"), cath: $("a2-cath"),
      cBlood: $("a2-cath-blood"), cFlow: $("a2-cath-flow"), sys: $("a2-sys"), bal: $("a2-bal"), stent: $("a2-stent"), mesh: $("a2-mesh"),
      marker: $("a2-marker"), removed: $("a2-removed"), ok: $("a2-ok"),
      ecg: $("a2-ecg"), syr: $("a2-syr"), filter: $("a2-filter"), tube: $("a2-tube"), blood: $("a2-blood"), plunger: $("a2-plunger"), vac: $("a2-vac"),
    };
    var fragEls = [].slice.call(svg.querySelectorAll(".a2-frag"));
    var origin = LX + " " + CY;

    function drawClot() {
      var from = CLOT.cx - CLOT.s * 2.2, to = CLOT.cx + CLOT.s * 2.6, n = 50, step = (to - from) / n, up = [], dn = [], mx = 0;
      for (var i = 0; i <= n; i++) {
        var x = from + i * step, e = art.edges(x), c = clotAt(x, e);
        if (c > mx) mx = c;
        up.push(n1(x) + " " + n1(e[0] - Math.min(2, c))); // base tucked just under the plaque's cap
        dn.push(n1(x) + " " + n1(Math.min(e[1] - 1, e[0] + c)));
      }
      E.clot.setAttribute("d", "M" + up.join(" L") + " L" + dn.reverse().join(" L") + " Z");
      E.clot.style.opacity = mx > 0.5 ? 1 : 0;
      E.white.style.opacity = CV.clamp(clotAt(408) / 20, 0, 1);
      if (CV.reduced || !field.visible) field.render();
    }
    function setFlow(v) { return { flow: v, onUpdate: function () { meter(field.flow); if (CV.reduced || !field.visible) field.render(); } }; }
    function plaque(top, bot, d) { return { top: top, bot: bot, duration: d, ease: "power2.inOut", onUpdate: function () { art.apply(); drawClot(); } }; }
    function clot(vars) { vars.onUpdate = drawClot; return vars; }
    function tipAt(t) { return TIP0 + ((TIP1 - TIP0) * CV.clamp(t, 0, PASS)) / PASS; }

    function reset() {
      art.k.top = 1; art.k.bot = 1; art.apply();
      T.k = 1; T.eat = 200; drawClot();
      field.flow = 0; meter(0); field.render();
      gsap.set(E.wire, { strokeDashoffset: 1 });
      gsap.set(E.cath, { x: -700 });
      gsap.set([E.cBlood, E.cFlow, E.tube, E.vac, E.dye, E.marker, E.removed, E.ok, E.ecg, E.syr, E.filter].concat(fragEls), { opacity: 0 });
      gsap.set(E.plunger, { x: 0 });
      gsap.set(E.blood, { attr: { width: 0 } });
      gsap.set([E.sys, E.stent], { x: -640, y: 13 });
      gsap.set([E.bal, E.mesh], { svgOrigin: origin, scaleY: CV.FOLDED });
      gsap.set(E.marker, { svgOrigin: "432 " + WY, scale: 0.7 });
      gsap.set([E.ecg, E.syr, E.filter], { y: 12 });
    }

    function build(tl) {
      reset();
      // 1 · A clot closes the artery; the ECG shows a heart attack
      tl.addLabel("s0")
        .to(E.ecg, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" })
        .to(E.marker, { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(2)" }, "<0.3")
        .to({}, { duration: 0.6 })
        .addLabel("e0");
      // 2 · The wire crosses the clot; a little blood trickles through
      tl.addLabel("s1")
        .to(E.marker, { opacity: 0, duration: 0.5 })
        .to(E.wire, { strokeDashoffset: 0, duration: 2.2, ease: "power1.inOut" }, "<0.2")
        .to(T, clot({ k: 0.85, duration: 0.9, ease: "power1.out" }), "-=1")
        .to(field, Object.assign(setFlow(0.15), { duration: 0.9 }), "<")
        .addLabel("e1");
      // 3 · The aspiration catheter slides up to the clot; the panel switches to the syringe
      tl.addLabel("s2")
        .to(E.ecg, { opacity: 0, y: 12, duration: 0.4 })
        .to(E.syr, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "<0.2")
        .to(E.cath, { x: TIP0, duration: 1.8, ease: "power2.inOut" }, "<")
        .addLabel("e2");
      // 4 · Suction on, the catheter moves slowly through the clot and pulls it out, then comes back with suction still on
      tl.addLabel("s3")
        .to(E.plunger, { x: 44, duration: 0.6, ease: "power2.out" })
        .to(E.vac, { opacity: 1, duration: 0.3 }, "<0.2")
        .to([E.cFlow, E.tube], { opacity: 1, duration: 0.3 }, "<")
        .to(E.cBlood, { opacity: 0.6, duration: 0.6 }, "<")
        .addLabel("pass")
        .to(E.cath, { x: TIP1, duration: PASS, ease: "none" }, "pass")
        .to(T, clot({ eat: TIP1 - 6, duration: PASS, ease: "none" }), "pass")
        .to(E.blood, { attr: { width: 46 }, duration: PASS, ease: "none" }, "pass")
        .to(field, Object.assign(setFlow(0.7), { duration: PASS, ease: "power1.in" }), "pass");
      fragEls.forEach(function (f, i) {
        var t0 = 0.2 + i * 0.28, sx = tipAt(t0) + 16 + (i % 3) * 8, sy = WY - 14 + (i % 4) * 7, tx = tipAt(t0 + 0.32) - 2;
        tl.fromTo(f, { x: sx, y: sy, opacity: 0 }, { x: tx, y: WY, opacity: 1, duration: 0.32, ease: "power2.in", immediateRender: false }, "pass+=" + t0)
          .to(f, { opacity: 0, duration: 0.08 }, "pass+=" + (t0 + 0.32));
      });
      tl.to(T, clot({ eat: 700, duration: 0.4 }), "pass+=" + PASS)
        .to(E.cath, { x: -700, duration: 1.6, ease: "power2.in" })
        .to([E.cFlow, E.tube, E.vac], { opacity: 0, duration: 0.3 })
        .to(E.plunger, { x: 46, duration: 0.3 }, "<")
        .addLabel("e3");
      // 5 · Blood flows again; the filter shows what was removed. The cracked plaque is still there.
      tl.addLabel("s4")
        .to(E.syr, { opacity: 0, y: 12, duration: 0.4 })
        .to(E.filter, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "<0.2")
        .to(E.dye, { opacity: 0.5, duration: 0.35 }, "<")
        .to(E.dye, { opacity: 0, duration: 1.3, ease: "power1.out" })
        .to(field, Object.assign(setFlow(0.75), { duration: 1 }), "<")
        .to(E.removed, { opacity: 1, duration: 0.5 }, "<0.2")
        .to({}, { duration: 0.6 })
        .addLabel("e4");
      // 6 · Stent across the cracked plaque, then everything comes out
      tl.addLabel("s5")
        .to([E.removed, E.filter], { opacity: 0, duration: 0.5 })
        .to([E.sys, E.stent], { x: 0, duration: 1.6, ease: "power2.inOut" }, "<0.2")
        .to([E.bal, E.mesh], { scaleY: 1, duration: 1.3, ease: "power2.inOut" })
        .to([E.sys, E.stent], { y: 0, duration: 1.3, ease: "power2.inOut" }, "<")
        .to(art.k, plaque(0.12, 0.14, 1.3), "<")
        .to(field, Object.assign(setFlow(0), { duration: 0.5 }), "<")
        .to(E.bal, { scaleY: CV.FOLDED, duration: 0.7, ease: "power2.inOut" })
        .to(E.sys, { y: 13, duration: 0.7, ease: "power2.inOut" }, "<")
        .to(field, Object.assign(setFlow(0.9), { duration: 0.9 }), "<")
        .to(E.sys, { x: -660, duration: 1.1, ease: "power2.in" })
        .to(E.wire, { strokeDashoffset: 1, duration: 1, ease: "power1.in" }, "-=0.3")
        .to(field, Object.assign(setFlow(1), { duration: 0.8 }), "<")
        .to(E.ok, { opacity: 1, duration: 0.6 }, "<0.3")
        .addLabel("e5");
    }

    return { build: build };
  };
})();
