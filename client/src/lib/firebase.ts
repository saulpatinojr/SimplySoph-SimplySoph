import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  setPersistence,
  browserLocalPersistence,
  OAuthProvider,
} from "firebase/auth";
import {
  getAnalytics,
  isSupported as isAnalyticsSupported,
  type Analytics,
} from "firebase/analytics";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "",
};

console.log(
  "[Firebase] Initializing with authDomain:",
  firebaseConfig.authDomain
);

let firebaseApp: FirebaseApp | null = null;
let firebaseAuthInstance: Auth | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

function ensureApp(): FirebaseApp {
  if (!firebaseApp) {
    firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return firebaseApp;
}

export function getFirebaseApp(): FirebaseApp {
  return ensureApp();
}

export function getFirebaseAuth(): Auth {
  if (!firebaseAuthInstance) {
    const app = ensureApp();
    firebaseAuthInstance = getAuth(app);
    setPersistence(firebaseAuthInstance, browserLocalPersistence).catch(
      error => {
        console.warn("[Firebase] Failed to set auth persistence:", error);
      }
    );
  }
  return firebaseAuthInstance;
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (!analyticsPromise) {
    analyticsPromise = isAnalyticsSupported()
      .then(supported => (supported ? getAnalytics(ensureApp()) : null))
      .catch(error => {
        console.warn("[Firebase] Analytics not available:", error);
        return null;
      });
  }
  return analyticsPromise;
}

export function getFirebaseFirestore(): Firestore {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(ensureApp());
  }
  return firestoreInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) {
    storageInstance = getStorage(ensureApp());
  }
  return storageInstance;
}

export const microsoftProvider = new OAuthProvider("microsoft.com");
microsoftProvider.setCustomParameters({
  prompt: "select_account",
  ...(import.meta.env.VITE_FIREBASE_TENANT_ID
    ? { tenant: import.meta.env.VITE_FIREBASE_TENANT_ID }
    : {}),
});
