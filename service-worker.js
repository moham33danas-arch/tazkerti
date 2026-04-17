const CACHE_NAME = 'Tazkerti_v1';
const urlsToCache = [
  '/script.js',
  '/manifest.json',
  '/index.html',        // أضفنا الصفحة الرئيسية لضمان العمل offline
  '/add.html'           // أضفناها لأنها موجودة في dynamicFiles
];

// Install Event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching Files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // الملفات الديناميكية اللي بتتغير باستمرار
  const dynamicFiles = [
    '',                    // الصفحة الرئيسية الفارغة
    '/index.html',
    '/add.html',
    '/manifest.json'
    // تمت إزالة الفاصلة الزائدة
  ];
  
  const isDynamicFile = dynamicFiles.some(file => 
    event.request.url.includes(file)
  );

  if (isDynamicFile) {
    // Network First Strategy للصفحات الديناميكية
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
                console.log('Service Worker: Dynamic File Updated -', event.request.url);
              });
          }
          return networkResponse;
        })
        .catch(() => {
          console.log('Service Worker: Using Cached Version -', event.request.url);
          return caches.match(event.request)
            .then((cachedResponse) => {
              return cachedResponse || new Response('Offline - No cached version available');
            });
        })
    );
  } else {
    // Cache First Strategy للملفات الثابتة
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log('Service Worker: Serving from Cache -', event.request.url);
            return response;
          }
          
          return fetch(event.request)
            .then((fetchResponse) => {
              if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                return fetchResponse;
              }
              
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                  console.log('Service Worker: New File Cached -', event.request.url);
                });
              
              return fetchResponse;
            })
            .catch(() => {
              return new Response('Offline - Please check your connection');
            });
        })
    );
  }
});

// Listen for Messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
