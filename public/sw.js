self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// REMOVED fetch listener to avoid caching issues during development/testing
// self.addEventListener('fetch', event => { ... });

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || data.notification?.title || 'FeedMe Africa';
  const body = data.body || data.notification?.body || data.message || 'You have a new update.';
  const link = data.link || data.data?.link || '/';

  const options = {
    body,
    icon: '/icon.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    tag: 'feedme-notification',
    renotify: true,
    data: { link }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus if already open
      for (const client of clientList) {
        if (new URL(client.url).pathname === new URL(link, self.location.origin).pathname && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});