// 正確的 sw.js 內容應該長這樣：
const CACHE_NAME = 'yuo-er-v1';
const ASSETS = [
  'index.html',
  'manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
];

// 安裝 Service Worker 並寫入靜態快取
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 啟用並清理舊快取資源
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 攔截請求策略：優先使用網路，網路斷線時自動退回使用快取 (Network-first, falling back to cache)
self.addEventListener('fetch', (e) => {
  // 只快取 GET 請求，POST (提交表單) 必須走實體網路
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // 如果網路正常，複製一份存入快取
        const rc = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, rc);
        });
        return response;
      })
      .catch(() => {
        // 斷網或網路極慢時，改從本地快取撈網頁檔案
        return caches.match(e.request);
      })
  );
});
