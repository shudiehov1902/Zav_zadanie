const CACHE_NAME = 'tavern-tapper-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/css/style.css',
  './src/js/main.js',
  './src/js/data/levels.json',
  './src/js/iconMap.js',
  './src/assets/background-music.mp3',
  './instructions.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url => 
          cache.add(url).catch(err => {
            console.warn(`Failed to cache ${url}:`, err);
            return null;
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});


