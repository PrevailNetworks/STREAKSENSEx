// src/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Added
import type { Auth } from 'firebase/auth'; // Added

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // Optional
};

if (!firebaseConfig.apiKey) {
    console.error("Firebase API Key is missing. Check your .env.local file and VITE_FIREBASE_API_KEY variable.");
    throw new Error("Firebase API Key is missing. App cannot initialize.");
}
if (!firebaseConfig.projectId) {
    console.error("Firebase Project ID is missing. Check your .env.local file and VITE_FIREBASE_PROJECT_ID variable.");
    throw new Error("Firebase Project ID is missing. App cannot initialize.");
}


let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app); // Added

export { app, db, auth }; // Added auth to exports
