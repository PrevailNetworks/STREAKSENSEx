// src/firebase.ts
import * as firebaseAppModule from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey) {
    console.error("Firebase API Key is missing. Check your .env.local file and VITE_FIREBASE_API_KEY variable.");
    throw new Error("Firebase API Key is missing. App cannot initialize.");
}

// Initialize Firebase
let app: firebaseAppModule.FirebaseApp; // Use the imported module's type for FirebaseApp
if (!firebaseAppModule.getApps().length) { // Use the imported module's getApps function
  app = firebaseAppModule.initializeApp(firebaseConfig); // Use the imported module's initializeApp function
} else {
  app = firebaseAppModule.getApp(); // Use the imported module's getApp function
}

const db: Firestore = getFirestore(app);

export { app, db };