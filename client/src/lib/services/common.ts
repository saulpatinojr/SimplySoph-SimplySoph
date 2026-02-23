import { getFirebaseFirestore } from "../firebase";
import { type QueryDocumentSnapshot } from "firebase/firestore";

export function db() {
  return getFirebaseFirestore();
}

export function withId<T>(doc: QueryDocumentSnapshot): T {
  return { id: doc.id, ...doc.data() } as T;
}

export function mapDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  // If it's a Firestore Timestamp, it has toDate()
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }
  // If it's already a Date
  if (timestamp instanceof Date) return timestamp;
  // Fallback for strings/numbers if necessary
  return new Date(timestamp);
}
