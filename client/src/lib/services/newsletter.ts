import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "./common";

export interface NewsletterSubscription {
  email: string;
  subscribedAt: Date;
  source?: string;
}

/**
 * Subscribe an email to the newsletter.
 * Returns true if new subscription, false if already subscribed.
 */
export async function subscribeToNewsletter(
  email: string,
  source: string = "website"
): Promise<boolean> {
  const col = collection(db(), "newsletterSubscribers");

  // Check if already subscribed
  const existing = await getDocs(
    query(col, where("email", "==", email.toLowerCase().trim()))
  );
  if (!existing.empty) return false;

  await addDoc(col, {
    email: email.toLowerCase().trim(),
    subscribedAt: serverTimestamp(),
    source,
    active: true,
  });
  return true;
}

export async function unsubscribeFromNewsletter(email: string): Promise<void> {
  const col = collection(db(), "newsletterSubscribers");
  const existing = await getDocs(
    query(col, where("email", "==", email.toLowerCase().trim()))
  );

  await Promise.all(
    existing.docs.map(docSnap =>
      updateDoc(docSnap.ref, {
        active: false,
        unsubscribedAt: serverTimestamp(),
      })
    )
  );
}
