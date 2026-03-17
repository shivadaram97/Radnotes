const CACHE = 'radnotes-v3';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap'
    ])).catch(() => {})
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
  const url = new URL(e.request.url);

  // Fonts — cache first (never change)
  if(url.hostname.includes('fonts.g') || url.hostname.includes('fonts.gstatic')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }))
    );
    return;
  }

  // HTML — network first, cache only as offline fallback
  if(e.request.mode === 'navigate' ||
     url.pathname.endsWith('.html') ||
     url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Everything else — network, no caching
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
