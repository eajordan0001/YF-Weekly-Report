const CACHE_NAME = 'youer-weekly-report-v1';

const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
];

// ── install：快取所有必要資源 ──────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

// ── activate：清除舊版快取 ─────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── fetch：Cache First，網路失敗時回傳快取 ───────────────
self.addEventListener('fetch', event => {
  // POST 請求（上傳雲端）不走快取，直接打 API
  if (event.request.method !== 'GET') return;

  // Google Apps Script API 也不走快取
  if (event.request.url.includes('script.google.com')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // 有快取 → 先回傳快取，背景同步更新
      if (cached) {
        fetch(event.request)
          .then(response => {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, response));
            }
          })
          .catch(() => {});
        return cached;
      }

      // 沒有快取 → 從網路取得，同時存入快取
      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const toCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, toCache));
          return response;
        })
        .catch(() => {
          // 完全離線且無快取 → 回傳 index.html（讓 App 仍可開啟）
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});

// ── message：讓前端可以主動要求更新快取 ──────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
