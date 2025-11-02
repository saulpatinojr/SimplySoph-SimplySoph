import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { ENV } from "./env";

let firebaseApp: App | null = null;

function createFirebaseApp(): App {
  if (
    !ENV.firebase.projectId ||
    !ENV.firebase.clientEmail ||
    !ENV.firebase.privateKey
  ) {
    throw new Error(
      "[Firebase] Missing required server credentials. Please configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }

  const privateKey = ENV.firebase.privateKey.replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId: ENV.firebase.projectId,
      clientEmail: ENV.firebase.clientEmail,
      privateKey,
    }),
    databaseURL: ENV.firebase.databaseUrl || undefined,
    storageBucket: ENV.firebase.storageBucket || undefined,
  });
}

export function getFirebaseAdminApp(): App {
  if (!firebaseApp) {
    firebaseApp = getApps()[0] ?? createFirebaseApp();
  }
  return firebaseApp;
}

export const firebaseAuth = () => getAuth(getFirebaseAdminApp());
export const firebaseDb = () => getFirestore(getFirebaseAdminApp());
