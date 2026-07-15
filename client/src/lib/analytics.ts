import { getAnalytics, logEvent as firebaseLogEvent } from "firebase/analytics";
import { getFirebaseAnalytics } from "@/lib/firebase";

export async function logShareEvent(channel: string, params: Record<string, any>) {
  const a = await getFirebaseAnalytics();
  if (!a) return;
  firebaseLogEvent(a, "share", { method: channel, ...params });
}

export async function logCommentEvent(action: "create" | "reply" | "delete" | "moderate", params?: Record<string, any>) {
  const a = await getFirebaseAnalytics();
  if (!a) return;
  firebaseLogEvent(a, "comment_" + action, params ?? {});
}

export async function logNewsletterEvent(action: "open" | "submit" | "dismiss", params?: Record<string, any>) {
  const a = await getFirebaseAnalytics();
  if (!a) return;
  firebaseLogEvent(a, "newsletter_" + action, params ?? {});
}

export async function logSearchEvent(action: "query" | "result_click" | "no_results", params?: Record<string, any>) {
  const a = await getFirebaseAnalytics();
  if (!a) return;
  firebaseLogEvent(a, "search_" + action, params ?? {});
}

export async function logModerationEvent(action: "approve" | "flag" | "delete", params?: Record<string, any>) {
  const a = await getFirebaseAnalytics();
  if (!a) return;
  firebaseLogEvent(a, "moderation_" + action, params ?? {});
}
