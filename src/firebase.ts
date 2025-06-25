// src/firebase.ts
import * as firebaseAppModule from 'firebase/app'; // Use namespace import
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
let app: firebaseAppModule.FirebaseApp; // Use the FirebaseApp type from the namespace
if (!firebaseAppModule.getApps().length) { // Use getApps from the namespace
  app = firebaseAppModule.initializeApp(firebaseConfig); // Use initializeApp from the namespace
} else {
  app = firebaseAppModule.getApp(); // Use getApp from the namespace
}

const db: Firestore = getFirestore(app);

export { app, db };