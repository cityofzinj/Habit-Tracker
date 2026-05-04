const CACHE = 'habit-tracker-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Network-first for HTML so updates show up; cache-first for everything else.
  const url = new URL(req.url);
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    e.respondWith(
      fetch(req).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
        return resp;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
  } else {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(resp => {
        if (resp.ok && url.origin === self.location.origin) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return resp;
      }))
    );
  }
});
