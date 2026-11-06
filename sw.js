// Siou · شغل من غير إنترنت: بنخزّن ملفات التطبيق أول مرة، وبعدها بنفتح من التخزين ونحدّث في الخلفية
const CACHE = 'siou-v8';
const FILES = ["./", "index.html", "app.js", "engine.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "img/virgin-tapestry.jpg", "img/mena.jpg", "img/codex-cross.jpg", "img/saint-ostracon.jpg", "img/three-saints.jpg", "img/lamp.jpg"];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then((c) => c.match(e.request).then((hit) => {
    const net = fetch(e.request).then((res) => { if (res.ok && new URL(e.request.url).origin === location.origin) c.put(e.request, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
