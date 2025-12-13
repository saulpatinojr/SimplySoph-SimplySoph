import { getAnalytics, logEvent as firebaseLogEvent } from "firebase/analytics";
import { getFirebaseApp } from "@/lib/firebase";

function analytics() {
  try {
    return getAnalytics(getFirebaseApp());
  } catch {
    return undefined;
  }
}

export function logShareEvent(channel: string, params: Record<string, any>) {
  const a = analytics();
  if (!a) return;
  firebaseLogEvent(a, "share", { method: channel, ...params });
}

export function logCommentEvent(action: "create" | "reply" | "delete" | "moderate", params?: Record<string, any>) {
  const a = analytics();
  if (!a) return;
  firebaseLogEvent(a, "comment_" + action, params ?? {});
}

export function logNewsletterEvent(action: "open" | "submit" | "dismiss", params?: Record<string, any>) {
  const a = analytics();
  if (!a) return;
  firebaseLogEvent(a, "newsletter_" + action, params ?? {});
}

export function logSearchEvent(action: "query" | "result_click" | "no_results", params?: Record<string, any>) {
  const a = analytics();
  if (!a) return;
  firebaseLogEvent(a, "search_" + action, params ?? {});
}

export function logModerationEvent(action: "approve" | "flag" | "delete", params?: Record<string, any>) {
  const a = analytics();
  if (!a) return;
  firebaseLogEvent(a, "moderation_" + action, params ?? {});
}
