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
