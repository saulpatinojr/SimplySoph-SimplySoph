// ── AI / Caption Generation ──────────────────────────────────────────────
//
// Primary path  : calls a Firebase Callable Function (chatCompletion) that
//                 holds the OpenAI key server-side — keys never exposed.
// Fallback path : local template generation so the UI never crashes even
//                 when the cloud function is unavailable or unconfigured.
//
// To enable the cloud function path deploy `functions/src/chatCompletion.ts`
// and set VITE_FIREBASE_FUNCTIONS_REGION in your .env (defaults to us-central1).

import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp } from './firebase';

export type CaptionPlatform =
  | 'youtube_shorts'
  | 'instagram_post'
  | 'instagram_reel'
  | 'tiktok';

interface CaptionRequest {
  platform:            CaptionPlatform;
  originalDescription: string;
  keywords?:           string[];
}

interface CaptionResponse {
  text: string;
}

// ── Availability guard ───────────────────────────────────────────────────
// Returns true when the Firebase app has been initialised (i.e. env vars
// are set). AIChatBox uses this to decide whether to render or show a
// graceful "unavailable" state instead of crashing.
export function isAIAvailable(): boolean {
  try {
    getFirebaseApp(); // throws if not initialised
    return true;
  } catch {
    return false;
  }
}

// ── Platform templates (local fallback) ─────────────────────────────────
function buildLocalCaption(
  platform: CaptionPlatform,
  description: string,
  keywords: string[]
): string {
  const hashtags = keywords
    .filter(Boolean)
    .map(k => `#${k.replace(/\s+/g, '')}`) .join(' ');
  const base = description.trim() || 'Check out this new look!';

  switch (platform) {
    case 'youtube_shorts':
      return `${base}\n\nSubscribe for more fashion tips! ✨\n\n#fashion #shorts #ootd ${hashtags}`.trim();
    case 'instagram_post':
      return `${base}\n.\n.\n.\nfollow for more style inspo 💖\n\n#fashionblogger #style #ootd ${hashtags}`.trim();
    case 'instagram_reel':
      return `${base}\n\n💕 Save this for inspo!\n\n#reels #fashionreel #grwm ${hashtags}`.trim();
    case 'tiktok':
      return `${base}\n\n#fyp #fashion #viral #ootd ${hashtags}`.trim();
    default:
      return `${base}\n\n${hashtags}`.trim();
  }
}

// ── Main export ──────────────────────────────────────────────────────────
/**
 * Generate a social-media caption for the given platform.
 *
 * Tries the Firebase Cloud Function first; falls back to local templates
 * so the UI never shows an unhandled error.
 */
export async function generateCaption(
  platform: CaptionPlatform,
  originalDescription: string,
  keywords: string[] = []
): Promise<string> {
  // Try cloud function if Firebase is initialised
  if (isAIAvailable()) {
    try {
      const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION ?? 'us-central1';
      const functions = getFunctions(getFirebaseApp(), region);
      const callable  = httpsCallable<CaptionRequest, CaptionResponse>(
        functions,
        'generateCaption'
      );
      const result = await callable({ platform, originalDescription, keywords });
      if (result.data?.text) return result.data.text;
    } catch (err: any) {
      // Log but don't throw — fall through to local template
      console.warn('[ai] Cloud function unavailable, using local fallback:', err?.message ?? err);
    }
  }

  // Local fallback — simulate a small delay for UX consistency
  await new Promise(r => setTimeout(r, 600));
  return buildLocalCaption(platform, originalDescription, keywords);
}

// ── Chat completion (for AIChatBox) ──────────────────────────────────────
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Send a chat thread to the Firebase chatCompletion function.
 * Throws if the function is unavailable so callers can handle the error.
 */
export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  if (!isAIAvailable()) {
    throw new Error('AI_UNAVAILABLE');
  }

  const region    = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION ?? 'us-central1';
  const functions = getFunctions(getFirebaseApp(), region);
  const callable  = httpsCallable<{ messages: ChatMessage[] }, CaptionResponse>(
    functions,
    'chatCompletion'
  );

  const result = await callable({ messages });
  if (!result.data?.text) throw new Error('Empty response from AI');
  return result.data.text;
}
