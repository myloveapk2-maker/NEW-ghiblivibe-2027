importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBOzlliLJlCpmjKh94fcedjT6dLf_Z7ii8",
  authDomain: "gen-lang-client-0042257723.firebaseapp.com",
  projectId: "gen-lang-client-0042257723",
  storageBucket: "gen-lang-client-0042257723.firebasestorage.app",
  messagingSenderId: "416012233428",
  appId: "1:416012233428:web:92df51b857936b7f126941"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
