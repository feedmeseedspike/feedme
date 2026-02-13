importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyBvadGeONJmiampfSYhWQF-nmxMGYuQjxU",
  authDomain: "feedme-dd81d.firebaseapp.com",
  projectId: "feedme-dd81d",
  storageBucket: "feedme-dd81d.firebasestorage.app",
  messagingSenderId: "599508151611",
  appId: "1:599508151611:web:04c62aece935b6ffcc5b1e",
  measurementId: "G-08ZNLZ26EE",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png',
    data: {
      link: payload.data?.link || payload.fcmOptions?.link || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Get the link from the notification data
  const link = event.notification.data?.link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window for this site is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url === link && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});
