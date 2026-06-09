const CACHE_NAME = 'GAME_tatra-banka-tavern-v9';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/css/style.css',
  './src/js/main.js',
  './src/js/data/levels.json',
  './src/js/iconMap.js',
  './src/assets/background/tatra-tavern-bg.png',
  './src/assets/brand/tatra-banka-logo-blue.svg',
  './src/assets/brand/tatra-banka-logo-white.svg',
  './src/assets/brand/tatra-fridge.svg',
  './src/assets/brand/tatra-tray.svg',
  './src/assets/equipment/cobbler-shaker.png',
  './src/assets/equipment/single-beer-tower.png',
  './src/assets/visitors/knight.png',
  './src/assets/visitors/witch.png',
  './src/assets/visitors/mage.png',
  './src/assets/visitors/dwarf.png',
  './src/assets/icons/trash.png',
  './src/assets/background-music.mp3'
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
    ).then(() => {
     
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  

  if (request.method === 'GET' && (
    request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.json')
  )) {
    const networkRequest = request.mode === 'navigate'
      ? new Request(request, { cache: 'no-store' })
      : request;

    event.respondWith(
      fetch(networkRequest)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
       
          return caches.match(request);
        })
    );
  } else {
   
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) {
          return cached;
        }
        return fetch(request).then(response => {
          
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});
