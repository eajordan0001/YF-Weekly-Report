const CACHE_NAME = 'yuo-er-v2'; // 強制升級版本號，破除轉圈圈舊快取
const ASSETS = [
  'index.html',
  'manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => { return cache.addAll(ASSETS); })
    .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => { if (key !== CACHE_NAME) return caches.delete(key); }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const rc = response.clone();
        caches.open(CACHE_NAME).then((cache) => { cache.put(e.request, rc); });
        return response;
      })
      .catch(() => { return caches.match(e.request); })
  );
});
