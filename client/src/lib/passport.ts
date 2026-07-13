import { API_BASE } from "@/const";
import { getFirebaseAuth } from "@/lib/firebase";

export interface AttributionEventPayload {
  eventType: string;
  subjectType?: string;
  subjectId?: string;
  source?: string;
  metadata?: Record<string, string>;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const auth = getFirebaseAuth();
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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

export async function getSavedPassportDestinations(): Promise<string[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/passport/saved`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch saved destinations");
  }

  const body = (await res.json()) as { destinationIds?: string[] };
  return Array.isArray(body.destinationIds) ? body.destinationIds : [];
}

export async function savePassportDestination(destinationId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/passport/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ destinationId }),
  });

  if (!res.ok) {
    throw new Error("Failed to save destination");
  }
}

export async function unsavePassportDestination(destinationId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/passport/unsave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ destinationId }),
  });

  if (!res.ok) {
    throw new Error("Failed to remove saved destination");
  }
}

export async function trackAttributionEvent(
  payload: AttributionEventPayload
): Promise<void> {
  const headers = await getAuthHeaders();
  await fetch(`${API_BASE}/attribution/event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      ...payload,
      source: payload.source || "web",
      attribution: getAttributionPayload(),
    }),
  });
}
