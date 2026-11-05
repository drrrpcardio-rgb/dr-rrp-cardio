/* CathLab Visual — core helpers shared by every scene.
   - CV.el / CV.html: build SVG nodes
   - CV.ticker: one requestAnimationFrame loop for all blood-flow fields (only runs while one is on screen)
   - CV.FlowField: red blood cells moving along a lumen; speed depends on the global flow and the local width
   - CV.buildArtery: a side view of a coronary artery with an eccentric plaque that can be compressed */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var CV = (window.CV = window.CV || {});

  var rm = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  CV.reduced = rm.matches;
  if (rm.addEventListener) rm.addEventListener("change", function (e) { CV.reduced = e.matches; });

  CV.el = function (tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  /** Append SVG markup to an SVG element and return the element. */
  CV.html = function (parent, markup) {
    parent.insertAdjacentHTML("beforeend", markup);
    return parent;
  };
  CV.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  CV.lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ---------- Shared ticker ---------- */
  var items = [];
  var raf = 0, last = 0;
  function frame(t) {
    var dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    var any = false;
    for (var i = 0; i < items.length; i++) {
      if (items[i].visible && !CV.reduced) { items[i].tick(dt); any = true; }
    }
    raf = any ? requestAnimationFrame(frame) : 0;
  }
  CV.ticker = {
    add: function (item) { items.push(item); },
    wake: function () { if (!raf && !CV.reduced) { last = performance.now(); raf = requestAnimationFrame(frame); } },
  };

  /* Track which scenes are on screen so offscreen ones cost nothing ("lazy" animation). */
  var io = "IntersectionObserver" in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          (en.target.__cvItems || []).forEach(function (it) { it.visible = en.isIntersecting; });
        });
        CV.ticker.wake();
      }, { rootMargin: "80px" })
    : null;
  CV.watch = function (target, item) {
    item.visible = !io;
    if (!io) return;
    (target.__cvItems = target.__cvItems || []).push(item);
    io.observe(target);
  };

  /* ---------- Blood flow ----------
     opts: x0, x1   lumen extent
           edges(x) -> [topY, bottomY] of the open lumen at x
           count, speed (px/s at full flow), refW (normal lumen width), flow (0..1)
           onFrame(field) optional hook after each render */
  function FlowField(group, opts) {
    this.g = group;
    this.x0 = opts.x0; this.x1 = opts.x1;
    this.edges = opts.edges;
    this.speed = opts.speed || 140;
    this.refW = opts.refW || 100;
    this.flow = opts.flow == null ? 1 : opts.flow;
    this.maxBoost = opts.maxBoost || 2.2;
    this.onFrame = opts.onFrame || null;
    this.cells = [];
    var n = opts.count || 30;
    for (var i = 0; i < n; i++) {
      var use = CV.el("use", { href: "#rbc", width: 16, height: 12, x: -8, y: -6 }, group);
      this.cells.push({
        el: use,
        x: this.x0 + ((i + Math.random() * 0.8) / n) * (this.x1 - this.x0),
        lane: Math.random(),
        s: 0.8 + Math.random() * 0.4,
        r: Math.random() * 360,
        spin: (Math.random() - 0.5) * 120,
      });
    }
    CV.ticker.add(this);
    this.render();
  }
  FlowField.prototype.tick = function (dt) {
    var f = this.flow;
    for (var i = 0; i < this.cells.length; i++) {
      var c = this.cells[i];
      var e = this.edges(c.x);
      var w = Math.max(1, e[1] - e[0]);
      // Narrower lumen -> faster locally (continuity), capped; centre lanes run faster (parabolic profile)
      var boost = CV.clamp(this.refW / w, 1, this.maxBoost);
      var lanePos = 2 * c.lane - 1;
      var profile = 0.55 + 0.45 * (1 - lanePos * lanePos);
      c.x += this.speed * f * boost * profile * dt;
      c.r += c.spin * f * dt;
      if (c.x > this.x1 + 14) {
        c.x = this.x0 - 14 - Math.random() * 40;
        c.lane = Math.random();
      }
    }
    this.render();
  };
  FlowField.prototype.render = function () {
    for (var i = 0; i < this.cells.length; i++) {
      var c = this.cells[i];
      var e = this.edges(c.x);
      var w = Math.max(0, e[1] - e[0]);
      var sc = Math.min(c.s, Math.max(0.3, w / 15));
      var m = 6 * sc;
      var y = e[0] + m + c.lane * Math.max(0, w - 2 * m);
      c.el.setAttribute("transform", "translate(" + c.x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + (c.r % 360).toFixed(0) + ") scale(" + sc.toFixed(2) + ")");
    }
    if (this.onFrame) this.onFrame(this);
  };
  CV.FlowField = FlowField;

  /* ---------- Artery (side view) ----------
     o: id, x0, x1, cy, R (lumen radius), wall, cx (plaque centre), spread, aTop, aBot (plaque height at full size)
     Layers, bottom to top: wall, lumen, cells, devicesBack, plaque, devicesFront, front highlights. */
  CV.buildArtery = function (svg, o) {
    var id = o.id;
    var x0 = o.x0, x1 = o.x1, cy = o.cy, R = o.R, W = o.wall;
    var top = cy - R, bot = cy + R;
    CV.html(svg,
      '<defs>' +
        '<linearGradient id="' + id + '-wall" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#f6b0aa"/><stop offset=".18" stop-color="#d9706b"/><stop offset=".5" stop-color="#b9504c"/>' +
          '<stop offset=".82" stop-color="#d9706b"/><stop offset="1" stop-color="#9e3b38"/></linearGradient>' +
        '<linearGradient id="' + id + '-lumen" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#4c0b12"/><stop offset=".5" stop-color="#8a1c24"/><stop offset="1" stop-color="#3f0910"/></linearGradient>' +
        '<linearGradient id="' + id + '-plq" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#fde68a"/><stop offset=".6" stop-color="#eab308"/><stop offset="1" stop-color="#ca8a04"/></linearGradient>' +
      '</defs>');

    var g = CV.el("g", { class: "artery" }, svg);
    CV.el("rect", { x: x0, y: top - W, width: x1 - x0, height: 2 * (R + W), fill: "url(#" + id + "-wall)" }, g);
    CV.el("rect", { x: x0, y: top, width: x1 - x0, height: 2 * R, fill: "url(#" + id + "-lumen)" }, g);
    var cells = CV.el("g", { class: "cells" }, g);
    var devBack = CV.el("g", { class: "dev-back" }, g);

    // Plaque profile: a smooth bump, slightly skewed so it looks natural
    function bump(x) {
      var d = (x - o.cx) / o.spread;
      if (d > 0) d *= 0.85;
      return Math.exp(-d * d * d * d * 0.6 - d * d * 0.6);
    }
    /** Returns [filled shape, open cap line] so only the lumen-facing edge gets the bright outline. */
    function plaquePath(isTop) {
      var a = isTop ? o.aTop : o.aBot, wy = isTop ? top : bot, sgn = isTop ? 1 : -1;
      var from = o.cx - o.spread * 2.4, to = o.cx + o.spread * 2.8, step = (to - from) / 48;
      var cap = "";
      for (var x = from; x <= to + 0.01; x += step) cap += (cap ? " L" : "M") + x.toFixed(1) + " " + (wy + sgn * a * bump(x)).toFixed(1);
      return [cap + " L" + to.toFixed(1) + " " + wy + " L" + from.toFixed(1) + " " + wy + " Z", cap];
    }
    function plaqueMarkup(isTop) {
      var p = plaquePath(isTop);
      return '<path d="' + p[0] + '" fill="url(#' + id + '-plq)"/>' + corePath(isTop) +
        '<path d="' + p[1] + '" fill="none" stroke="#fef3c7" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
    }
    function corePath(isTop) {
      var a = isTop ? o.aTop : o.aBot, wy = isTop ? top : bot, sgn = isTop ? 1 : -1;
      var rx = o.spread * 0.9, ry = a * 0.32;
      return '<ellipse cx="' + (o.cx - o.spread * 0.1) + '" cy="' + (wy + sgn * a * 0.42) + '" rx="' + rx + '" ry="' + ry + '" fill="#f59e0b" opacity=".55"/>';
    }
    var plq = CV.el("g", { class: "plaque" }, g);
    var pTop = CV.el("g", {}, plq), pBot = CV.el("g", {}, plq);
    CV.html(pTop, plaqueMarkup(true));
    CV.html(pBot, plaqueMarkup(false));

    var devFront = CV.el("g", { class: "dev-front" }, g);
    // Front: thin bright line at the inner lining + a soft shine on the outer wall
    CV.html(g,
      '<line x1="' + x0 + '" y1="' + top + '" x2="' + x1 + '" y2="' + top + '" stroke="#ffd2cc" stroke-opacity=".35" stroke-width="1.5"/>' +
      '<line x1="' + x0 + '" y1="' + bot + '" x2="' + x1 + '" y2="' + bot + '" stroke="#ffd2cc" stroke-opacity=".2" stroke-width="1.5"/>' +
      '<rect x="' + x0 + '" y="' + (top - W + 4) + '" width="' + (x1 - x0) + '" height="' + (W * 0.32) + '" fill="#fff" opacity=".12"/>');

    var art = {
      g: g, cells: cells, devBack: devBack, devFront: devFront, plaque: plq,
      k: { top: 1, bot: 1 }, // plaque size (1 = full, 0 = gone)
      top: top, bot: bot, cy: cy, R: R,
      edges: function (x) {
        var b = bump(x);
        return [top + o.aTop * art.k.top * b, bot - o.aBot * art.k.bot * b];
      },
      /** Narrowest opening as a fraction of the normal diameter. */
      openFraction: function () {
        var e = art.edges(o.cx);
        return CV.clamp((e[1] - e[0]) / (2 * R), 0, 1);
      },
      apply: function () {
        pTop.setAttribute("transform", "translate(0 " + top + ") scale(1 " + art.k.top.toFixed(3) + ") translate(0 " + -top + ")");
        pBot.setAttribute("transform", "translate(0 " + bot + ") scale(1 " + art.k.bot.toFixed(3) + ") translate(0 " + -bot + ")");
      },
    };
    return art;
  };
})();
