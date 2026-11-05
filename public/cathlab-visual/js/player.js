/* CathLab Visual — step player.
   Each procedure is one paused GSAP timeline with labels "s0".."s6" (start of each step) and
   "e0".."e6" (end of each step). The player animates the timeline between those labels.

   Three ways to change step, all ending in goTo(i):
     1. the control bar (Play / Pause / Next / Previous / Replay, step dots, speed)
     2. scrolling: each step card is a ScrollTrigger; when it crosses the reading line it becomes the step
     3. keyboard on the focused stage: ← → change step, Space plays/pauses, Home/End jump

   When the player changes step it scrolls the matching card into view, so text and picture stay in sync. */
(function () {
  "use strict";
  var CV = window.CV;
  var HOLD = 1.8; // seconds to pause between steps when auto-playing (scaled by speed)

  function isMobile() { return window.matchMedia("(max-width: 900px)").matches; }
  /** Reading line as a fraction of the viewport height. On phones the stage sits on top, so the line is lower. */
  function readLine() { return isMobile() ? 0.74 : 0.55; }

  CV.createPlayer = function (opts) {
    var root = opts.section;                       // .scrolly element
    var canvas = opts.canvas;                      // focusable stage canvas
    var bar = root.querySelector(".player");
    var cards = Array.prototype.slice.call(root.querySelectorAll(".step"));
    var n = cards.length;
    var build = opts.build;

    var master = gsap.timeline({ paused: true });
    build(master);

    var current = -1, playing = false, speed = 1;
    var tween = null, hold = null;
    var suppressScrollUntil = 0;

    var playBtn = bar.querySelector('[data-act="play"]');
    var caption = bar.querySelector(".player-caption");
    var live = bar.querySelector("[data-live]");
    var fill = bar.querySelector(".fill");
    var dotsWrap = bar.querySelector(".dots");

    // Step dots
    var dots = cards.map(function (card, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "dot";
      b.addEventListener("click", function () { setPlaying(false); goTo(i); });
      dotsWrap.appendChild(b);
      return b;
    });

    function title(i) { var h = cards[i].querySelector("h3"); return h ? h.textContent.trim() : ""; }
    function stepWord() { return (CV.t && CV.t("ui.step")) || "Step"; }
    function ofWord() { return (CV.t && CV.t("ui.of")) || "of"; }

    function update() {
      var shown = Math.max(0, current);
      caption.querySelector(".count").textContent = shown + 1 + " / " + n;
      caption.querySelector(".title").textContent = title(shown);
      cards.forEach(function (c, i) { c.classList.toggle("is-active", i === current); });
      dots.forEach(function (d, i) {
        d.classList.toggle("done", i < current);
        if (i === shown) d.setAttribute("aria-current", "step"); else d.removeAttribute("aria-current");
        d.setAttribute("aria-label", stepWord() + " " + (i + 1) + ": " + title(i));
      });
      fill.style.width = "calc(" + (shown / (n - 1)).toFixed(4) + " * (100% - 18px))";
      if (current >= 0) live.textContent = stepWord() + " " + (current + 1) + " " + ofWord() + " " + n + ": " + title(current);
      if (opts.onStep) opts.onStep(current);
    }

    function setPlaying(p) {
      playing = p;
      playBtn.setAttribute("aria-pressed", p ? "true" : "false");
      playBtn.setAttribute("aria-label", p ? (CV.t ? CV.t("ui.pause") : "Pause") : (CV.t ? CV.t("ui.play") : "Play"));
      if (!p && hold) { hold.kill(); hold = null; }
    }

    function killActive() {
      if (tween) { tween.kill(); tween = null; }
      if (hold) { hold.kill(); hold = null; }
    }

    function afterStep(i) {
      if (!playing) return;
      if (i < n - 1) {
        hold = gsap.delayedCall(HOLD, function () { hold = null; goTo(i + 1, { auto: true }); });
        hold.timeScale(speed);
      } else {
        setPlaying(false);
      }
    }

    function goTo(i, o) {
      o = o || {};
      if (i < 0 || i >= n) return;
      killActive();
      current = i;
      if (CV.reduced || o.instant) {
        master.seek("e" + i, false);
        update();
        afterStep(i);
      } else {
        var s = master.labels["s" + i];
        if (Math.abs(master.time() - s) > 0.001) master.seek(s, false);
        update();
        tween = master.tweenTo("e" + i, { onComplete: function () { tween = null; afterStep(i); } });
        tween.timeScale(speed);
      }
      if (!o.fromScroll) scrollToCard(i);
    }

    function play() {
      setPlaying(true);
      if (tween && tween.paused()) { tween.resume(); return; }
      if (tween) return; // already animating this step; afterStep will continue
      if (current < 0 || current >= n - 1) goTo(0);
      else goTo(current + 1);
    }
    function pause() {
      if (tween) tween.pause();
      setPlaying(false);
    }
    function restart() { setPlaying(true); goTo(0); }

    /* Scroll the active card to just above the reading line (only when the section is on screen,
       or when forced, e.g. by the hero "Watch" buttons). */
    function scrollToCard(i, force) {
      var r = root.getBoundingClientRect();
      var vh = window.innerHeight;
      if (!force && (r.bottom < 0 || r.top > vh)) return;
      var cardTop = cards[i].getBoundingClientRect().top;
      var target = window.scrollY + cardTop - (readLine() - 0.07) * vh;
      if (Math.abs(target - window.scrollY) < 30) return;
      suppressScrollUntil = Date.now() + 1400;
      window.scrollTo({ top: target, behavior: CV.reduced ? "auto" : "smooth" });
    }

    // Scroll-driven steps
    if (window.ScrollTrigger) {
      cards.forEach(function (card, i) {
        ScrollTrigger.create({
          trigger: card,
          start: function () { return "top " + readLine() * 100 + "%"; },
          end: function () { return "bottom " + readLine() * 100 + "%"; },
          invalidateOnRefresh: true,
          onToggle: function (self) {
            if (!self.isActive || i === current || Date.now() < suppressScrollUntil) return;
            setPlaying(false); // the reader took over
            goTo(i, { fromScroll: true });
          },
        });
      });
      // Opening a "Clinical detail" box changes card heights
      root.querySelectorAll("details").forEach(function (d) {
        d.addEventListener("toggle", function () { ScrollTrigger.refresh(); });
      });
    }

    // Control bar
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b || b.tagName === "SELECT") return;
      var act = b.getAttribute("data-act");
      if (act === "play") { playing ? pause() : play(); }
      else if (act === "next") { setPlaying(false); goTo(Math.min(n - 1, current + 1)); }
      else if (act === "prev") { setPlaying(false); goTo(Math.max(0, current - 1)); }
      else if (act === "replay") restart();
    });
    var speedSel = bar.querySelector('[data-act="speed"]');
    speedSel.addEventListener("change", function () {
      speed = parseFloat(speedSel.value) || 1;
      if (tween) tween.timeScale(speed);
      if (hold) hold.timeScale(speed);
    });

    // Keyboard on the stage
    canvas.addEventListener("keydown", function (e) {
      if (e.target !== canvas) return;
      var k = e.key;
      if (k === "ArrowRight") { setPlaying(false); goTo(Math.min(n - 1, current + 1)); }
      else if (k === "ArrowLeft") { setPlaying(false); goTo(Math.max(0, current - 1)); }
      else if (k === " " || k === "Spacebar" || k === "k") { playing ? pause() : play(); }
      else if (k === "Home") { setPlaying(false); goTo(0); }
      else if (k === "End") { setPlaying(false); goTo(n - 1); }
      else return;
      e.preventDefault();
    });

    update();

    return {
      goTo: goTo, play: play, pause: pause, restart: restart, refreshText: update,
      get current() { return current; },
      /** Scroll to the first step and play the whole procedure (hero buttons). */
      watch: function () {
        setPlaying(false);
        killActive();
        scrollToCard(0, true);
        setTimeout(restart, CV.reduced ? 0 : 650);
      },
      /** Rebuild the timeline (e.g. after switching wrist/groin) and return to the same step. */
      rebuild: function () {
        var i = current;
        killActive();
        master.seek(0, false);
        master.kill();
        master = gsap.timeline({ paused: true });
        build(master);
        if (i >= 0) { current = -1; goTo(i, { fromScroll: true }); }
      },
    };
  };
})();
