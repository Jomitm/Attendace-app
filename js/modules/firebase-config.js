/**
 * Firebase Configuration (Compat Version)
 * Uses the global 'firebase' object from the CDN scripts.
 */
const firebaseConfig = {
    apiKey: "AIzaSyC7a8AxukI0-egXimYTedwCa2RFnMTBu84",
    authDomain: "crwiattendance.firebaseapp.com",
    projectId: "crwiattendance",
    storageBucket: "crwiattendance.firebasestorage.app",
    messagingSenderId: "462155106938",
    appId: "1:462155106938:web:18291b04a5a3bec185c9c3",
    measurementId: "G-X6W45TV4QR"
};

// Initialize Firebase using the global object (Compat SDK)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase Initialized (Compat Mode)");
}

// Initialize & Export Firestore to Window
export const AppFirestore = (typeof firebase !== 'undefined') ? firebase.firestore() : null;
if (typeof window !== 'undefined') window.AppFirestore = AppFirestore;
