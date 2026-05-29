const CACHE = 'bookpresent-v2';
const STATIC = [
  '/',
  '/static/js/bundle.js',
  '/pdf.worker.min.mjs',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  // Skip non-http requests
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      try {
        // Try network first
        const networkResponse = await fetch(e.request);

        // Only cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          // Clone before caching — original goes to browser
          cache.put(e.request, networkResponse.clone());
        }

        return networkResponse;
      } catch (err) {
        // Network failed — try cache
        const cached = await cache.match(e.request);
        if (cached) return cached;

        // Nothing available
        return new Response('Offline - content not available', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })
  );
});