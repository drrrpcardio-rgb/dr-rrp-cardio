/* Inside Your Heart — boot. Wires up the page: theme, nav, the CAD demo, the procedure
   players, the before/after slider, FAQ accordion, print summary and installing as an app. */
(function () {
  "use strict";
  var CV = window.CV;
  var doc = document, root = doc.documentElement;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- Theme ---------- */
  $("#theme-btn").addEventListener("click", function () {
    var t = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", t);
    store("cv-theme", t);
  });

  /* ---------- Links back to rrpcardio.com ---------- */
  // They are root-relative ("/simulators/") because this folder is served from the main site.
  // Opened on its own (as a file, or from another host), point them at rrpcardio.com instead.
  if (!/(^|\.)rrpcardio\.com$|^localhost$|^127\.0\.0\.1$/.test(location.hostname)) {
    $$("a[data-site]").forEach(function (a) { a.href = "https://rrpcardio.com" + a.getAttribute("href"); });
  }
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- ECG trace in the hero and footer (same trace as the site's HeartbeatLine) ---------- */
  var BEAT = "c4 -14 24 -14 28 0 L62 100 L66 107 L76 18 L86 132 L92 100 L112 100 c10 -28 44 -28 54 0 L200 100";
  $$(".heartbeat").forEach(function (svg) {
    var n = +svg.getAttribute("data-beats") || 6, d = "M0 100 L20 100 ";
    for (var i = 0; i < n; i++) {
      d += BEAT.replace(/L(\d+) /g, function (m, x) { return "L" + (+x + i * 200) + " "; });
      if (i < n - 1) d += " L" + (220 + i * 200) + " 100 ";
    }
    var line = ' d="' + d + '" pathLength="1" fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"';
    svg.setAttribute("viewBox", "0 0 " + n * 200 + " 200");
    svg.innerHTML = '<path' + line + ' stroke="#f5b301" stroke-width="2.5"/><path' + line + ' stroke="#fff" stroke-width="3"/>';
  });

  /* ---------- Nav: mobile menu + current section ---------- */
  var nav = $(".nav"), menuBtn = $("#menu-btn"), links = $("#nav-links");
  // Light-on-dark while it sits over the hero, frosted once the page scrolls or the menu opens (as on the main site).
  function navState() { nav.classList.toggle("at-top", window.scrollY < 40 && !links.classList.contains("open")); }
  function closeMenu() { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); navState(); }
  window.addEventListener("scroll", navState, { passive: true });
  navState();

  /* ---------- Back to top: shows after the hero; the gold ring fills as you read ---------- */
  var toTop = $("#to-top"), arc = $("#to-top-arc");
  function topState() {
    var max = doc.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.scrollY / max) : 0, show = p > 0.06;
    arc.style.strokeDashoffset = String(100 - p * 100);
    if (show !== toTop.classList.contains("show")) {
      toTop.classList.toggle("show", show);
      toTop.tabIndex = show ? 0 : -1;
    }
  }
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: CV.reduced ? "auto" : "smooth" });
    $(".app-name").focus({ preventScroll: true });
  });
  window.addEventListener("scroll", topState, { passive: true });
  window.addEventListener("resize", topState);
  topState();
  menuBtn.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    navState();
  });
  links.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeMenu();
  });
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && links.classList.contains("open")) { closeMenu(); menuBtn.focus(); }
  });
  var navFor = { home: "home", cad: "home", plaque: "home", angiogram: "angiogram", angioplasty: "angioplasty", aspiration: "angioplasty", "compare-table": "angioplasty", recovery: "recovery", faq: "faq" };
  if ("IntersectionObserver" in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = navFor[en.target.id];
        $$("a", links).forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("href") === "#" + id ? "true" : "false"); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(navFor).forEach(function (id) { var s = doc.getElementById(id); if (s) navIO.observe(s); });
  }

  /* ---------- FAQ accordion ---------- */
  $$(".faq-q").forEach(function (b) {
    var item = b.closest(".faq-item"), panel = $(".faq-a", item);
    var id = "faq-a-" + Math.random().toString(36).slice(2, 8);
    panel.id = id;
    panel.setAttribute("role", "region");
    b.setAttribute("aria-controls", id);
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", open ? "true" : "false");
      item.classList.toggle("open", open);
    });
  });

  /* ---------- CAD demo: plaque slider drives the side view, the cross-section and the flow ---------- */
  function initCAD() {
    var svg = $("#cad-svg");
    var art = CV.buildArtery(svg, { id: "cad", x0: -10, x1: 520, cy: 225, R: 56, wall: 26, cx: 270, spread: 62, aTop: 62, aBot: 36 });
    art.k.top = art.k.bot = 0; art.apply();
    var CX = 665, CY = 225, RI = 68;
    CV.html(svg,
      '<ellipse cx="520" cy="225" rx="12" ry="82" fill="#9e3b38"/><ellipse cx="520" cy="225" rx="8" ry="56" fill="#4c0b12"/>' +
      '<line x1="270" y1="120" x2="270" y2="330" stroke="#f5c542" stroke-width="2" stroke-dasharray="6 6"/>' +
      '<path d="M270 120 C330 70 520 60 600 120" fill="none" stroke="#f5c542" stroke-width="2" stroke-dasharray="6 6" marker-end="url(#cad-arrow)"/>' +
      '<defs><marker id="cad-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#f5c542"/></marker>' +
      '<radialGradient id="cad-xs-plq" cx="50%" cy="35%" r="60%"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#d4a017"/></radialGradient></defs>' +
      '<circle cx="' + CX + '" cy="' + CY + '" r="94" fill="#b9504c"/>' +
      '<circle cx="' + CX + '" cy="' + CY + '" r="94" fill="none" stroke="#f6b0aa" stroke-opacity=".5" stroke-width="3"/>' +
      '<circle cx="' + CX + '" cy="' + CY + '" r="78" fill="#d9706b"/>' +
      '<circle cx="' + CX + '" cy="' + CY + '" r="' + RI + '" fill="url(#cad-xs-plq)"/>' +
      '<circle id="cad-lumen" cx="' + CX + '" cy="' + CY + '" r="' + RI + '" fill="#7f1d1d" stroke="#fef3c7" stroke-width="2"/>' +
      '<g id="cad-xs-cells" fill="#e3342f"><ellipse cx="0" cy="0" rx="7" ry="5"/><ellipse cx="-20" cy="14" rx="7" ry="5"/><ellipse cx="18" cy="-16" rx="7" ry="5"/><ellipse cx="22" cy="18" rx="7" ry="5"/><ellipse cx="-24" cy="-12" rx="7" ry="5"/></g>' +
      '<text x="' + CX + '" y="356" text-anchor="middle" font-size="17" font-weight="700" fill="#e6eef7" font-family="Manrope, sans-serif"><tspan>Opening</tspan>: <tspan id="cad-open">100%</tspan></text>' +
      '<text x="270" y="356" text-anchor="middle" font-size="15" font-weight="600" fill="#a3b5ca" font-family="Manrope, sans-serif">Side view</text>' +
      '<text x="' + CX + '" y="104" text-anchor="middle" font-size="15" font-weight="600" fill="#a3b5ca" font-family="Manrope, sans-serif">Cross-section</text>');
    var lumen = $("#cad-lumen"), cellsXS = $("#cad-xs-cells"), openTxt = $("#cad-open");
    var bar = $("#cad-flow-bar"), val = $("#cad-flow-val");
    var field = new CV.FlowField(art.cells, { x0: -10, x1: 520, edges: art.edges, count: 32, speed: 160, refW: 112, maxBoost: 2.4 });
    CV.watch(svg, field);

    var range = $("#cad-range"), btns = $$("[data-cad]");
    var state = { sev: 0 };
    function render() {
      var s = state.sev;
      art.k.top = art.k.bot = s; art.apply();
      var open = art.openFraction(), ds = 1 - open;
      var flow = ds <= 0.5 ? 1 - 0.2 * ds : Math.max(0.2, 0.9 - 1.6 * (ds - 0.5));
      field.flow = flow;
      if (CV.reduced || !field.visible) field.render();
      var rl = Math.max(6, RI * open), cyl = CY + (RI - rl) * 0.55;
      lumen.setAttribute("r", rl.toFixed(1));
      lumen.setAttribute("cy", cyl.toFixed(1));
      var cs = Math.max(0.25, rl / RI);
      cellsXS.setAttribute("transform", "translate(" + CX + " " + cyl.toFixed(1) + ") scale(" + cs.toFixed(2) + ")");
      openTxt.textContent = Math.round(open * 100) + "%";
      bar.style.transform = "scaleX(" + flow.toFixed(3) + ")";
      val.textContent = Math.round(flow * 100) + "%";
      range.value = Math.round(s * 100);
      range.setAttribute("aria-valuetext", Math.round(s * 100) + "%");
      var near = 0;
      btns.forEach(function (b, i) { if (s >= parseFloat(b.getAttribute("data-cad")) - 0.02) near = i; });
      btns.forEach(function (b, i) { b.setAttribute("aria-pressed", i === near ? "true" : "false"); });
    }
    var demo = null;
    function to(v, d) {
      if (demo) { demo.kill(); demo = null; }
      if (!window.gsap || CV.reduced) { state.sev = v; render(); return; }
      gsap.to(state, { sev: v, duration: d || 1, ease: "power2.inOut", onUpdate: render, overwrite: true });
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { to(parseFloat(b.getAttribute("data-cad"))); }); });
    range.addEventListener("input", function () {
      if (demo) { demo.kill(); demo = null; }
      if (window.gsap) gsap.killTweensOf(state);
      state.sev = range.value / 100; render();
    });
    render();
    // Play the build-up once, the first time the demo scrolls into view
    if (window.gsap && !CV.reduced && "IntersectionObserver" in window) {
      var once = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        once.disconnect();
        demo = gsap.timeline({ delay: 0.4 })
          .to(state, { sev: 0.38, duration: 1.6, ease: "power1.inOut", onUpdate: render })
          .to(state, { sev: 0.7, duration: 1.6, ease: "power1.inOut", onUpdate: render }, "+=0.8")
          .to(state, { sev: 1, duration: 1.6, ease: "power1.inOut", onUpdate: render }, "+=0.8");
      }, { threshold: 0.5 });
      once.observe(svg);
    }
  }

  /* ---------- Procedures ---------- */
  var players = {};
  function initPlayers() {
    if (!window.gsap) {
      // Without GSAP the step text still works; hide the controls that need animation.
      $$(".player").forEach(function (p) { p.hidden = true; });
      return;
    }
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    var angioSec = $('[data-procedure="angio"]'), angioCanvas = $("#angio-canvas");
    var angio = CV.angiogram(angioCanvas);
    players.angiogram = CV.createPlayer({ section: angioSec, canvas: angioCanvas, build: angio.build });
    $$("[data-access]", angioSec).forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.getAttribute("data-access");
        $$("[data-access]", angioSec).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        angio.setAccess(a);
        players.angiogram.rebuild();
      });
    });

    var pciSec = $('[data-procedure="pci"]'), pciCanvas = $("#pci-canvas");
    var pci = CV.angioplasty(pciCanvas);
    players.angioplasty = CV.createPlayer({ section: pciSec, canvas: pciCanvas, build: pci.build });

    var aspSec = $('[data-procedure="asp"]'), aspCanvas = $("#asp-canvas");
    if (aspSec && CV.aspiration) players.aspiration = CV.createPlayer({ section: aspSec, canvas: aspCanvas, build: CV.aspiration(aspCanvas).build });

    $$("[data-watch]").forEach(function (b) {
      b.addEventListener("click", function () { players[b.getAttribute("data-watch")].watch(); });
    });
  }

  /* ---------- Print summary: filled from the page, so it always matches what is on screen ---------- */
  function fillPrint() {
    function list(target, items) {
      var el = $(target);
      el.innerHTML = "";
      items.forEach(function (html) { var li = doc.createElement("li"); li.innerHTML = html; el.appendChild(li); });
    }
    function esc(s) { return s.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
    function steps(sel) {
      return $$(sel + " .step-card").map(function (c) {
        return "<strong>" + esc($("h3", c).textContent) + "</strong>: " + esc($("p", c).textContent);
      });
    }
    list("#ps-angio", steps('[data-procedure="angio"]'));
    list("#ps-pci", steps('[data-procedure="pci"]'));
    list("#ps-rec", $$(".tl-item").map(function (it) {
      return "<strong>" + esc($(".tl-mark", it).textContent) + " · " + esc($("h3", it).textContent) + "</strong>: " +
        $$("li", it).map(function (li) { return esc(li.textContent); }).join("; ");
    }));
    list("#ps-warn", $$(".warn-grid .warn").map(function (w) {
      return "<strong>" + esc($("h3", w).textContent) + "</strong>: " + esc($("p", w).textContent);
    }));
  }
  window.addEventListener("beforeprint", fillPrint);
  $("#print-btn").addEventListener("click", function () { fillPrint(); window.print(); });

  /* ---------- Install as an app (works offline) ---------- */
  // sw.js saves the guide for offline use. Chrome, Edge and Android have their own install
  // prompt, which the Install buttons open; Safari has none, so they show the steps instead.
  if ("serviceWorker" in navigator && (location.protocol === "https:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
  var ua = navigator.userAgent, installPrompt = null;
  var asApp = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  var ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var macSafari = !ios && /Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua);
  var STEPS = {
    ios: '<li>Tap the Share button <svg class="step-icon" role="img" aria-label="(square with an arrow)"><use href="#i-share"/></svg> in the browser bar.</li>' +
      "<li>Scroll down and tap <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>.</li>",
    mac: "<li>In the menu bar at the top of the screen, click <strong>File</strong>.</li><li>Choose <strong>Add to Dock</strong>, then click <strong>Add</strong>.</li>",
    other: "<li>Open your browser\u2019s menu (<strong>\u22ee</strong> or <strong>\u2630</strong>).</li>" +
      "<li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Not there? Open this page in Chrome, Edge or Safari.</li>",
  };
  var installDlg = $("#install-dialog");
  function showInstall(on) { $("#install-btn").hidden = !on; $("#app-cta").hidden = !on; }
  if (!asApp && (ios || macSafari)) showInstall(true);
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    installPrompt = e;
    if (!asApp) showInstall(true);
  });
  window.addEventListener("appinstalled", function () { installPrompt = null; showInstall(false); });
  $$("[data-install]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (installPrompt) {
        installPrompt.prompt();
        installPrompt = null; // a prompt can be shown once; after "Cancel" the buttons show the steps
        return;
      }
      $("#install-steps").innerHTML = STEPS[ios ? "ios" : macSafari ? "mac" : "other"];
      if (installDlg.showModal) installDlg.showModal(); else installDlg.setAttribute("open", "");
    });
  });
  installDlg.addEventListener("click", function (e) { if (e.target === installDlg) installDlg.close(); });

  /* ---------- Boot ---------- */
  initCAD();
  if (window.gsap && CV.plaque) CV.plaque($("#plaque"));
  initPlayers();
  CV.beforeAfter($("#compare"));

  // Card heights change once the web font arrives; re-measure the scroll triggers.
  if (window.ScrollTrigger && doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
