export const ENV = {
  isProduction: process.env.NODE_ENV === "production",
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY ?? "",
    databaseUrl: process.env.FIREBASE_DATABASE_URL ?? "",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? "",
  },
  ownerFirebaseUid: process.env.OWNER_FIREBASE_UID ?? "",
  analyticsEndpoint: process.env.VITE_ANALYTICS_ENDPOINT ?? "",
  analyticsWebsiteId: process.env.VITE_ANALYTICS_WEBSITE_ID ?? "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
