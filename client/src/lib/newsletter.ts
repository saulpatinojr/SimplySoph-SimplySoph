import { getFirebaseFirestore } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';

const db = () => getFirebaseFirestore();

export interface NewsletterSubscriber {
  id?: string;
  email: string;
  name?: string;
  subscribedAt: Date;
  status: 'active' | 'unsubscribed';
  source?: string;
}

/**
 * Add a new newsletter subscriber to Firestore
 */
export async function subscribeToNewsletter(
  email: string,
  name?: string
): Promise<void> {
  // Check if already subscribed
  const existing = await getDocs(
    query(collection(db(), 'newsletterSubscribers'), where('email', '==', email.toLowerCase()))
  );

  if (!existing.empty) {
    const sub = existing.docs[0].data();
    if (sub.status === 'active') {
      throw new Error('Already subscribed');
    }
    // Reactivate if previously unsubscribed
    const docRef = existing.docs[0].ref;
    await updateDoc(docRef, {
      status: 'active',
      subscribedAt: serverTimestamp(),
    });
    return;
  }

  await addDoc(collection(db(), 'newsletterSubscribers'), {
    email: email.toLowerCase(),
    name: name || '',
    subscribedAt: serverTimestamp(),
    status: 'active',
    source: window.location.pathname,
  });
}

/**
 * Unsubscribe from newsletter
 */
export async function unsubscribeFromNewsletter(email: string): Promise<void> {
  const existing = await getDocs(
    query(collection(db(), 'newsletterSubscribers'), where('email', '==', email.toLowerCase()))
  );

  if (!existing.empty) {
    const docRef = existing.docs[0].ref;
    await updateDoc(docRef, {
      status: 'unsubscribed',
    });
  }
}

/**
 * Fetch all active subscribers (admin only)
 */
export async function fetchAllSubscribers(): Promise<NewsletterSubscriber[]> {
  const snapshot = await getDocs(
    query(collection(db(), 'newsletterSubscribers'), where('status', '==', 'active'))
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    email: doc.data().email,
    name: doc.data().name,
    subscribedAt: doc.data().subscribedAt?.toDate(),
    status: doc.data().status,
    source: doc.data().source,
  }));
}
