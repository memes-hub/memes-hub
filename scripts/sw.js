const CACHE_NAME = 'pwa-v2'; // Bumped version to update the cache
const ASSETS = [
  '/',
  '/index.html',
  '/manifest/manifest.json'
];

// 1. Install Event: Pre-cache the "Must-Haves"
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Pre-caching core assets...');
      return cache.addAll(ASSETS);
    })
  );
  // Force the new service worker to take over immediately
  self.skipWaiting();
});

// 2. Activate Event: Clean up old versions of your app
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      );
    })
  );
});

// 3. Fetch Event: Serve from cache, then fetch & cache for offline reading
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Return the cached version immediately if we have it
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If not in cache, go to the network
      return fetch(event.request).then(networkResponse => {
        // Don't cache bad responses or 3rd party stuff you don't want
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        // DYNAMIC CACHING: Save a copy of this new page for offline reading
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      }).catch(() => {
        // Optional: If network fails and it's not in cache, show a custom offline page
        // return caches.match('/offline.html');
      });
    })
  );
});