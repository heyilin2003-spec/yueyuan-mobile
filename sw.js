const C = 'yueyuan-v4';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});
// 页面类请求：绕过 HTTP 缓存拿最新；其他资源正常网络优先；离线统一回退缓存
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isDoc = e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').indexOf('text/html') >= 0;
  const init = isDoc ? { cache: 'reload' } : {};
  e.respondWith(
    fetch(e.request, init).then(r => {
      try { const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy)).catch(()=>{}); } catch (_) {}
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./')))
  );
});
