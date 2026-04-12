
// ================== M-STORE Service Worker ==================
// الإصدار: ديناميكي - لا حاجة لتغيير هذا الملف يدويًا أبدًا
// =============================================================

const CACHE_NAME = 'mstore-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html'
];

// ========== تثبيت وتفعيل فوري ==========
self.addEventListener('install', event => {
  console.log('[SW] تثبيت...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] تفعيل...');
  event.waitUntil(
    clients.claim().then(() => {
      return caches.keys().then(keys => 
        Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
      );
    })
  );
});

// ========== آلية التحقق من التغيير في الصفحة الرئيسية ==========
async function checkForMainPageUpdate() {
  try {
    // 1. جلب رأس الملف فقط (HEAD) لمعرفة Last-Modified
    const response = await fetch('/index.html', { method: 'HEAD', cache: 'no-cache' });
    const newLastModified = response.headers.get('Last-Modified');
    
    if (!newLastModified) return false; // السيرفر لا يرسل Last-Modified

    // 2. مقارنة مع القيمة المخزنة
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match('/index.html');
    
    if (!cachedResponse) return true; // لا يوجد نسخة مخزنة مسبقاً
    
    const cachedLastModified = cachedResponse.headers.get('Last-Modified');
    
    return newLastModified !== cachedLastModified;
  } catch (err) {
    console.error('[SW] فشل التحقق من التحديث:', err);
    return false;
  }
}

// ========== استراتيجية الجلب مع فحص التحديث للصفحة الرئيسية ==========
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // نتعامل مع الصفحة الرئيسية فقط
  if (event.request.mode === 'navigate' && url.pathname === '/') {
    event.respondWith(
      (async () => {
        // 1. نعطي المستخدم النسخة المخزنة فوراً (سريعة)
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match('/index.html');
        
        // 2. في الخلفية نتحقق من وجود تحديث
        (async () => {
          const hasUpdate = await checkForMainPageUpdate();
          if (hasUpdate) {
            console.log('[SW] تم اكتشاف تحديث في الصفحة الرئيسية!');
            // نجلب النسخة الجديدة ونخزنها
            const networkResponse = await fetch('/index.html', { cache: 'no-cache' });
            if (networkResponse.ok) {
              await cache.put('/index.html', networkResponse.clone());
              // نرسل إشعار لكل العملاء بأن هناك تحديثاً
              const allClients = await clients.matchAll();
              allClients.forEach(client => {
                client.postMessage({ type: 'MAIN_PAGE_UPDATED' });
              });
            }
          }
        })();
        
        // 3. نرجع النسخة المخزنة حالياً
        return cachedResponse || fetch(event.request);
      })()
    );
    return;
  }
  
  // باقي الطلبات: استراتيجية عادية (شبكة أولاً)
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
