const C = 'yueyuan-v2';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
// 网络优先：在线永远拿最新；离线回退到缓存
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      try { const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy)).catch(()=>{}); } catch (_) {}
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./')))
  );
});
