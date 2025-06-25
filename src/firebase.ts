// src/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

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
    // In a real app, you might want a more user-friendly error display or a way to prevent app crash
    throw new Error("Firebase API Key is missing. App cannot initialize.");
}
if (!firebaseConfig.projectId) {
    console.error("Firebase Project ID is missing. Check your .env.local file and VITE_FIREBASE_PROJECT_ID variable.");
    throw new Error("Firebase Project ID is missing. App cannot initialize.");
}


let app: FirebaseApp;

// Check if Firebase has already been initialized.
if (!getApps().length) {
  // Initialize Firebase if it hasn't been initialized yet.
  app = initializeApp(firebaseConfig);
} else {
  // Get the default Firebase app if it has already been initialized.
  app = getApp();
}

// Get Firestore instance
const db: Firestore = getFirestore(app);

export { app, db };