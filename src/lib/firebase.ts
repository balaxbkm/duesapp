import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getMessaging } from "firebase/messaging";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyB9lWKBPYZZvm2cCmN_kRcpvCh_o1IFnIo",
    authDomain: "duesapp-30141.firebaseapp.com",
    projectId: "duesapp-30141",
    storageBucket: "duesapp-30141.firebasestorage.app",
    messagingSenderId: "640100436332",
    appId: "1:640100436332:web:793e1636b126cfaa7e4b49",
    measurementId: "G-DSZ03SRJT3"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// Messaging is only supported in window environment
let messaging: any = null;
if (typeof window !== "undefined") {
    try {
        messaging = getMessaging(app);
    } catch (e) {
        console.log("Firebase Messaging not supported in this browser or context.");
    }
}

export { app, auth, db, functions, messaging, storage };
