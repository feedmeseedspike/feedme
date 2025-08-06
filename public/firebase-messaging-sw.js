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
  console.log("Received background message:", payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/Footerlogo.png',
  });
});
