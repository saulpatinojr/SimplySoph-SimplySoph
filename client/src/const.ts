export const APP_TITLE =
  import.meta.env.VITE_APP_TITLE?.trim() || "SimplySoph";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "https://placehold.co/128x128/E1E7EF/1F2937?text=SS";

export const LOGIN_PATH = "/login";

export const OWNER_FIREBASE_UID =
  import.meta.env.VITE_OWNER_FIREBASE_UID?.trim() || "";

export const ENABLE_REALTIME_FEED =
  (import.meta.env.VITE_ENABLE_REALTIME_FEED ?? "true").toLowerCase() ===
  "true";

export const FEATURED_TAGLINES = [
  "bold stories. vivid style. everyday magic.",
  "sartorial adventures & analog dreams.",
  "creative energy, curated for your feed.",
];

// Optional app store links for footer badges
export const APPLE_APP_URL =
  import.meta.env.VITE_APPLE_APP_URL?.trim() || "";
export const ANDROID_APP_URL =
  import.meta.env.VITE_ANDROID_APP_URL?.trim() || "";

// ── Social + AI Integration ──────────────────────────────────────────────────

/** TikTok video ID used by TikTokCommentFeed on the homepage */
export const TIKTOK_VIDEO_ID =
  import.meta.env.VITE_TIKTOK_VIDEO_ID?.trim() || "";

/** Full TikTok profile URL for external links */
export const TIKTOK_PROFILE_URL = "https://www.tiktok.com/@smply.soph";

/** YouTube live video ID — update whenever Soph goes live; empty string = offline */
export const YOUTUBE_LIVE_VIDEO_ID =
  import.meta.env.VITE_YOUTUBE_LIVE_VIDEO_ID?.trim() || "";

/**
 * Site domain used as the embed_domain param in the YouTube live_chat iframe.
 * Must match an allowed referrer in Google API Console credentials.
 */
export const YOUTUBE_SITE_DOMAIN =
  import.meta.env.VITE_YOUTUBE_SITE_DOMAIN?.trim() || "simplysoph.com";

/** Firebase Function base path for social/AI API routes */
export const API_BASE = "/api";
