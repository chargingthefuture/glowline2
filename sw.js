// Glowline 2 service worker — precache every file the game loads so it runs fully
// offline and installs as an app. Bump CACHE whenever any listed file changes, so
// already-installed copies fetch the new version instead of an out-of-date cached one.
const CACHE = 'glowline2-v1';

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

// Cache-first: instant loads and full offline play. Falls back to the network, and
// for page navigations falls back to the cached shell.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          if (res.ok && new URL(request.url).origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => {
          if (request.mode === 'navigate') return caches.match('./index.html');
        });
    })
  );
});
