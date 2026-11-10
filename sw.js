// Siou · شغل من غير إنترنت: بنخزّن ملفات التطبيق أول مرة، وبعدها بنفتح من التخزين ونحدّث في الخلفية
const CACHE = 'siou-v10';
const FILES = ["./", "index.html", "app.js", "engine.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "img/virgin-tapestry.jpg", "img/mena.jpg", "img/codex-cross.jpg", "img/saint-ostracon.jpg", "img/three-saints.jpg", "img/lamp.jpg"];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });// الصفحة وملفات الكود: من النت الأول عشان التحديثات توصل على طول، ولو مفيش نت من المحفوظ.
// الصور: من المحفوظ الأول لأنها مابتتغيرش.
const FRESH = /\/(index\.html|app\.js|engine\.js|manifest\.webmanifest)?$/;
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (e.request.mode === 'navigate' || FRESH.test(url.pathname)) {
    e.respondWith(fetch(e.request).then((res) => {
      if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.open(CACHE).then((c) => c.match(e.request).then((hit) => {
    const net = fetch(e.request).then((res) => { if (res.ok) c.put(e.request, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
