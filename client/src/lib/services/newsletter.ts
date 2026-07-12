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

function getAttributionPayload() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    path: window.location.pathname,
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
    utmContent: params.get("utm_content") || undefined,
    utmTerm: params.get("utm_term") || undefined,
    referrer: document.referrer || undefined,
  };
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
      consent: {
        accepted: true,
        acceptedAt: new Date().toISOString(),
        version: "phase4-foundation",
      },
      attribution: getAttributionPayload(),
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
