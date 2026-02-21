const CACHE = 'nuittracker-v1';
const ASSETS = [
  './nuit-tracker.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@200;300;400;500&display=swap'
];

// Installation : mise en cache des fichiers essentiels
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS).catch(() => {
        // Si les Google Fonts échouent (hors-ligne), on continue quand même
        return cache.add('./nuit-tracker.html');
      });
    })
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch : cache-first pour les assets locaux, network-first pour les fonts
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Toujours servir l'app depuis le cache si disponible
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Mettre en cache les nouvelles ressources valides
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Hors-ligne : retourner l'app principale en fallback
        if (e.request.destination === 'document') {
          return caches.match('./nuit-tracker.html');
        }
      });
    })
  );
});
