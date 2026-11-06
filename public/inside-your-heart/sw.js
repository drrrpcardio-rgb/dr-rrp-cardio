/* Inside Your Heart — offline support, so the installed app works without internet.
   - Every file of the guide is saved on the first visit (FILES below).
   - Online or not, the guide opens from the saved copy straight away; a fresh copy is
     fetched in the background and used the next time it opens. So after an update goes
     live, visitors see it on their second visit.
   - On localhost the order flips (fresh copy first, saved copy only when offline), so
     edits show up on the next reload while you work on the guide.
   - Change VERSION to throw every saved copy away at once.
   Only caches whose names start with "iyh-" belong to this guide; the other apps on the
   site keep their own caches. */
var VERSION = "iyh-v1";
var FONT_CACHE = "iyh-fonts-v1";
var FILES = [
  "./",
  "css/app.css",
  "vendor/gsap.min.js",
  "vendor/ScrollTrigger.min.js",
  "js/core.js",
  "js/player.js",
  "js/angiogram.js",
  "js/angioplasty.js",
  "js/plaque.js",
  "js/aspiration.js",
  "js/app.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];
var DEV = self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1";
var SCOPE = new URL("./", self.location.href);
var PAGE = SCOPE.href; // every visit to the guide's page uses this one saved copy

function saveAll(cache) {
  return Promise.all(FILES.map(function (f) {
    var url = new URL(f, SCOPE).href;
    return fetch(new Request(url, { cache: "reload" })).then(function (res) {
      if (res.ok && !res.redirected) return cache.put(url, res);
    });
  }));
}

// Fill in anything missing, e.g. after the browser cleared part of the storage
function topUp() {
  return caches.open(VERSION).then(function (cache) {
    return Promise.all(FILES.map(function (f) {
      var url = new URL(f, SCOPE).href;
      return cache.match(url).then(function (hit) {
        if (!hit) return fetch(url).then(function (res) { if (res.ok && !res.redirected) return cache.put(url, res); });
      });
    }));
  }).catch(function () {});
}

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(saveAll).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) {
      return k.indexOf("iyh-") === 0 && k !== VERSION && k !== FONT_CACHE;
    }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function fromGuide(e, key) {
  return caches.open(VERSION).then(function (cache) {
    return cache.match(key, { ignoreSearch: true }).then(function (hit) {
      var fresh = fetch(e.request).then(function (res) {
        if (res.ok && !res.redirected) cache.put(key, res.clone());
        return res;
      });
      if (DEV) return fresh.catch(function () { return hit || Response.error(); });
      if (hit) { e.waitUntil(fresh.catch(function () {})); return hit; }
      return fresh;
    });
  });
}

// Google Fonts: the files never change at a given address, so a saved copy is always good
function fromFonts(req) {
  return caches.open(FONT_CACHE).then(function (cache) {
    return cache.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res.ok || res.type === "opaque") cache.put(req, res.clone());
        return res;
      });
    });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.indexOf(SCOPE.pathname) !== 0) return; // links back to the main site
    var nav = req.mode === "navigate";
    if (nav) e.waitUntil(topUp());
    e.respondWith(fromGuide(e, nav ? PAGE : url.origin + url.pathname));
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(fromFonts(req));
  }
});
