/* 月圆之夜 · 手机版 Service Worker
 * 策略：
 *  - 页面(navigation/html)：**先用缓存秒开**，同时后台拉最新（下次打开生效）→ 打开不再等 3MB 下载，也不会打断正在玩的人
 *  - 其他资源(图片/图标)：缓存优先（图片 URL 带 ?h=<指纹>，改了才会重新下）
 *  - 离线：回退缓存
 */
const C = 'yueyuan-v5';

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isDoc(req){
  return req.mode === 'navigate' || ((req.headers.get('accept') || '').indexOf('text/html') >= 0);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // 只接管同源

  if (isDoc(req)){
    // 页面：缓存优先 + 后台静默更新
    e.respondWith((async () => {
      const cache = await caches.open(C);
      const hit = await cache.match(req);
      const net = fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()).catch(() => {}); return r; }).catch(() => null);
      if (hit) return hit;
      const r = await net;
      return r || (await cache.match('./')) || Response.error();
    })());
    return;
  }

  // 静态资源：缓存优先（?h= 指纹保证图变了才重下）
  e.respondWith((async () => {
    const cache = await caches.open(C);
    const hit = await cache.match(req);
    if (hit) return hit;
    try {
      const r = await fetch(req);
      if (r && r.ok) cache.put(req, r.clone()).catch(() => {});
      return r;
    } catch (_) {
      return (await cache.match(req, { ignoreSearch: true })) || Response.error();
    }
  })());
});
