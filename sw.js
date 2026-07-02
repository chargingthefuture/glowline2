// Glowline 2 service worker — precache every file the game loads so it runs fully
// offline and installs as an app. Bump CACHE whenever any listed file changes, so
// already-installed copies fetch the new version instead of an out-of-date cached one.
const CACHE = 'glowline2-v4';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/style.css',
  './src/main.js',
  './src/game.js',
  './src/render.js',
  './src/hud.js',
  './src/input.js',
  './src/level.js',
  './src/levels.js',
  './src/ship.js',
  './src/vec.js',
  './src/audio.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: serve the cached copy instantly (so the game still opens
// offline and loads fast), but always fetch a fresh copy in the background and store
// it, so the next visit picks up new code without waiting on a cache-version bump.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const sameOrigin = new URL(request.url).origin === self.location.origin;
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok && sameOrigin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => {
          if (request.mode === 'navigate') return caches.match('./index.html');
          return cached; // offline and not cached above: nothing more to try
        });
      // Cached copy first if we have one; the background fetch refreshes it.
      return cached || network;
    })
  );
});
