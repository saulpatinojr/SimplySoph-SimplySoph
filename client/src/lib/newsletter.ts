import { API_BASE } from '@/const';
import { getFirebaseFirestore } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const db = () => getFirebaseFirestore();

export interface NewsletterSignupOptions {
  name?: string;
  source?: string;
  interests?: string[];
  leadMagnet?: string;
}

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
  options?: NewsletterSignupOptions
): Promise<void> {
  const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      name: options?.name,
      source: options?.source ?? window.location.pathname,
      interests: options?.interests ?? [],
      leadMagnet: options?.leadMagnet,
    }),
  });

  if (!res.ok) {
    throw new Error('Subscription failed');
  }

  const data = (await res.json()) as { alreadySubscribed?: boolean };
  if (data.alreadySubscribed) {
    throw new Error('Already subscribed');
  }
}

/**
 * Unsubscribe from newsletter
 */
export async function unsubscribeFromNewsletter(email: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/newsletter/unsubscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, token }),
  });

  if (!res.ok) {
    throw new Error('Unsubscribe failed');
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
