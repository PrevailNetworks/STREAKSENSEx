
// src/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'; // Changed to named imports
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

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


let app: FirebaseApp; // Use FirebaseApp type

if (!getApps().length) { // Use named import directly
  app = initializeApp(firebaseConfig); // Use named import directly
} else {
  app = getApp(); // Use named import directly
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export { app, db, auth };
