/* Service worker do Grupo Velluto: funciona offline (páginas já vistas) e recebe notificações push. */
const VERSION = 'v1';
const CACHE = 'velluto-' + VERSION;
const OFFLINE = '/offline.html';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([OFFLINE, '/css/style.css', '/assets/icon-192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('velluto-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

/* rede primeiro (sempre a versão mais nova); se estiver sem internet, usa o que já foi visto. Nunca guarda /api. */
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r).then(hit => hit || (r.mode === 'navigate' ? caches.match(OFFLINE) : Response.error())))
  );
});

/* ---------- notificações push ---------- */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  const title = d.title || 'Grupo Velluto';
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || '',
    icon: '/assets/icon-192.png',
    badge: '/assets/favicon.png',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url: d.url || '/my/' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/my/', location.origin).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url === url && 'focus' in c) return c.focus(); }
    for (const c of list) { if ('navigate' in c && 'focus' in c) return c.navigate(url).then(x => x && x.focus()); }
    return clients.openWindow(url);
  }));
});

/* se o navegador trocar a assinatura, avisa as páginas abertas para registrarem de novo */
self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil(clients.matchAll({ includeUncontrolled: true }).then(list => list.forEach(c => c.postMessage({ type: 'resubscribe' }))));
});
