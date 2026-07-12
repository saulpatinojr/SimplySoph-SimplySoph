import { API_BASE } from "@/const";

export interface NewsletterSubscription {
  email: string;
  subscribedAt: Date;
  source?: string;
}

export interface NewsletterSignupOptions {
  name?: string;
  source?: string;
  interests?: string[];
  leadMagnet?: string;
}

/**
 * Subscribe an email to the newsletter.
 * Returns true if new subscription, false if already subscribed.
 */
export async function subscribeToNewsletter(
  email: string,
  options?: NewsletterSignupOptions
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      name: options?.name,
      source: options?.source ?? "website",
      interests: options?.interests ?? [],
      leadMagnet: options?.leadMagnet,
    }),
  });

  if (!res.ok) {
    throw new Error("Subscription failed");
  }

  const data = (await res.json()) as { alreadySubscribed?: boolean };
  return !data.alreadySubscribed;
}

export async function unsubscribeFromNewsletter(email: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/newsletter/unsubscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, token }),
  });

  if (!res.ok) {
    throw new Error("Unsubscribe failed");
  }
}
