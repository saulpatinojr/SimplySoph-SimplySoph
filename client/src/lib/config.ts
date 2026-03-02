/**
 * Startup configuration validation.
 *
 * Import this module in main.tsx *before* rendering <App />. It will
 * throw a clear error if any required VITE_* environment variable is
 * missing, preventing cryptic Firebase/Algolia failures at runtime.
 *
 * @see CODE_REVIEW_REPORT.md P3-07
 */

const REQUIRED_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_APP_ID",
] as const;

const OPTIONAL_VARS = [
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_MEASUREMENT_ID",
  "VITE_OWNER_FIREBASE_UID",
  "VITE_ALGOLIA_APP_ID",
  "VITE_ALGOLIA_SEARCH_KEY",
  "VITE_ALGOLIA_INDEX_NAME",
  "VITE_ENABLE_REALTIME_FEED",
  "VITE_TIKTOK_VIDEO_ID",
  "VITE_YOUTUBE_LIVE_VIDEO_ID",
  "VITE_YOUTUBE_SITE_DOMAIN",
  "VITE_FIREBASE_TENANT_ID",
] as const;

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    const value = import.meta.env[key];
    if (!value || (typeof value === "string" && value.trim() === "")) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const message = [
      "[Config] Missing required environment variables:",
      ...missing.map((k) => `  \u2022 ${k}`),
      "",
      "Create a .env file from .env.example and fill in the values above.",
    ].join("\n");

    console.error(message);

    if (import.meta.env.DEV) {
      console.warn("[Config] Continuing in dev mode with missing vars \u2014 expect errors.");
    } else {
      throw new Error(message);
    }
  }

  const missingOptional = OPTIONAL_VARS.filter((k) => !import.meta.env[k]);
  if (missingOptional.length > 0 && import.meta.env.DEV) {
    console.info(
      "[Config] Optional env vars not set:",
      missingOptional.join(", ")
    );
  }
}
