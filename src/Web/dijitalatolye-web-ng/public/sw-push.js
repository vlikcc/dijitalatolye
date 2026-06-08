/* DijitalAtölye web-push service worker.
 * Yalnızca push bildirimlerini ele alır (offline cache yok). public/ kökünden /sw-push.js olarak servis edilir. */

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = {}; }
  const title = data.title || 'DijitalAtölye';
  const options = {
    body: data.body || '',
    data: { link: data.link || '/' },
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.type || 'dijitalatolye',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) { w.navigate(link); return w.focus(); }
      }
      return self.clients.openWindow(link);
    })
  );
});
