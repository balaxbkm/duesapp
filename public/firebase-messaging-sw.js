importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyB9lWKBPYZZvm2cCmN_kRcpvCh_o1IFnIo",
    authDomain: "duesapp-30141.firebaseapp.com",
    projectId: "duesapp-30141",
    storageBucket: "duesapp-30141.firebasestorage.app",
    messagingSenderId: "640100436332",
    appId: "1:640100436332:web:793e1636b126cfaa7e4b49",
    measurementId: "G-DSZ03SRJT3"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon.png' // Ensure this path is correct
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
