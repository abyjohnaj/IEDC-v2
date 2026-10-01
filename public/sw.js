/* ==============================================================================
   IEDC BMCE Progressive Web App Service Worker
   - Installable Offline Shell
   - Stale-While-Revalidate for Static Assets
   - Network-First with Cache Fallback for API Reads (Cached Reads)
   - Bypasses non-GET write requests
   ============================================================================== */

const SHELL_CACHE_NAME = 'iedc-shell-v1';
const RUNTIME_CACHE_NAME = 'iedc-runtime-v1';
const API_READ_CACHE_NAME = 'iedc-api-reads-v1';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/iedc_brand_logo.png',
  '/assets/iedc_hero_banner.jpg'
];

// Install: Cache critical application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old versioned caches
self.addEventListener('activate', (event) => {
  const currentCaches = [SHELL_CACHE_NAME, RUNTIME_CACHE_NAME, API_READ_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy depending on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never intercept non-GET requests (writes must proceed directly or be handled by offline queue)
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 1. Navigation requests: Network-first falling back to offline shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 2. Read API Calls (e.g. Supabase REST / RPC queries): Network-first with cache fallback
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/rpc/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(API_READ_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: serve cached read response if available
          return caches.match(request);
        })
    );
    return;
  }

  // 3. Static Assets (Scripts, CSS, Images, Fonts): Cache-first / Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(RUNTIME_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is an image, fallback gracefully
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
