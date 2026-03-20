const CACHE = 'quotes-v2';
const ASSETS = [
  './',
  './index.html',
  './app.html',
  './install.html',
  './manifest.json',
  './icon.svg',
  './apple-touch-icon.svg'
];

// ── INSTALL — cache all core assets ──────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE — remove old caches, claim clients ───────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH — cache first, fallback to network ──────────────────
self.addEventListener('fetch', e => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  // Don't cache backend API calls
  if (e.request.url.includes('hf.space')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => {
        // Offline fallback — return app shell
        return caches.match('./app.html');
      });
    })
  );
});

// ── MESSAGE — handle SKIP_WAITING from app ────────────────────
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
