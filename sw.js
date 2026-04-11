const CACHE_NAME = 'tazkarti-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // الأنماط والخطوط الأساسية
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap',
  // مكتبات Firebase (ضرورية للعمل دون اتصال جزئي)
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js',
  // صورة خلفية افتراضية للباصات
  'https://images.pexels.com/photos/2790386/pexels-photo-2790386.jpeg?auto=compress&cs=tinysrgb&w=600'
];

// تثبيت الـ Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// استراتيجية Cache First مع الرجوع للشبكة
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا وجد في الكاش، أرجع منه
        if (response) {
          return response;
        }
        // وإلا اجلب من الشبكة وخزنه للاستخدام المستقبلي
        return fetch(event.request).then(
          networkResponse => {
            // لا تخزن طلبات POST أو API
            if (event.request.method === 'GET') {
              return caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
            }
            return networkResponse;
          }
        );
      })
      .catch(() => {
        // في حالة الفشل (مثلاً عدم وجود اتصال) يمكن إرجاع صفحة offline بديلة
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return new Response('لا يوجد اتصال بالإنترنت', { status: 503 });
      })
  );
});

// تفعيل الـ Service Worker وحذف الكاش القديم
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
