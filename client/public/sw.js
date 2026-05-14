const CACHE = 'bookpresent-v1';
const STATIC = [
  '/',
  '/static/js/bundle.js',
  '/pdf.worker.min.mjs',
  '/manifest.json'
];

// Install — cache static files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', e => {
  // Cache PDF files from Supabase for offline use
  if (e.request.url.includes('supabase.co')) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const response = await fetch(e.request);
          cache.put(e.request, response.clone());
          return response;
        } catch {
          return cached || new Response('Offline', { status: 503 });
        }
      })
    );
    return;
  }

  // Network first for API, cache first for assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      return fetch(e.request).then(response => {
        if (response.ok && e.request.method === 'GET') {
          caches.open(CACHE).then(c => c.put(e.request, response.clone()));
        }
        return response;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});