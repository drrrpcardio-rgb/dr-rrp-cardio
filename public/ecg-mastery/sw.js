// Retired service worker. The ECG simulator used to be served from /ecg-mastery/
// with its own PWA service worker; it now lives at /ecg-simulator/ and /ecg-mastery/
// is a normal site page. This file replaces the old worker so visitors who installed
// it get unregistered and their stale caches cleared.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate(c.url));
  })());
});
