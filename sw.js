self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('combate-royale-beta').then((cache) => cache.addAll([
      './',
      './index.html',
      './style.css',
      './style.js',
      './dados.js'
    ]))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
