import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import algoliasearch from "algoliasearch";
import { handleTikTokComments } from "./tiktok";
import { handlePersonaReplies, handleAiGenerate } from "./ai";

// Initialize Firebase Admin
admin.initializeApp();

// Configuration
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME || "dev_content";
const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT || "hello@simplysoph.com";
const NEWSLETTER_FROM = process.env.NEWSLETTER_FROM || "SimplySoph <hello@simplysoph.com>";

// Lazy initialization of Algolia client
let algoliaIndex: any;

function getAlgoliaIndex() {
  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
    console.warn("Algolia credentials not set. Indexing disabled.");
    return null;
  }
  if (!algoliaIndex) {
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
    algoliaIndex = client.initIndex(ALGOLIA_INDEX_NAME);
  }
  return algoliaIndex;
}

/**
 * Interface for the standardized record sent to Algolia
 */
interface AlgoliaRecord {
  objectID: string;
  type: "blog" | "video" | "photo";
  title: string;
  description: string;
  category?: string;
  tags: string[];
  url: string;
  publishedAt: number;
  updatedAt: number;
  [key: string]: any; // Allow extra fields
}

/**
 * Helper to fetch category name
 */
async function resolveCategoryName(data: any): Promise<string | undefined> {
  if (data.category) return data.category;
  if (data.categoryId) {
    try {
      const snap = await admin
        .firestore()
        .collection("categories")
        .doc(data.categoryId)
        .get();
      return snap.exists ? snap.data()?.name : undefined;
    } catch (e) {
      console.warn(`Failed to resolve category for ${data.categoryId}`, e);
    }
  }
  return undefined;
}

/**
 * Transformer factory for different content types
 */
const Transformers = {
  blog: async (id: string, data: any): Promise<AlgoliaRecord> => {
    const category = await resolveCategoryName(data);
    return {
      objectID: id,
      type: "blog",
      title: data.title,
      description:
        data.excerpt || (data.content ? data.content.substring(0, 200) : ""),
      category,
      tags: data.tags || [],
      url: `/blog/${data.slug || id}`,
      publishedAt: data.publishedAt ? data.publishedAt.toMillis() : Date.now(),
      updatedAt: Date.now(),
      image: data.coverImage,
    };
  },
  video: async (id: string, data: any): Promise<AlgoliaRecord> => {
    const category = await resolveCategoryName(data);
    return {
      objectID: id,
      type: "video",
      title: data.title,
      description: data.description || "",
      category,
      tags: data.tags || [],
      url: `/videos#${id}`,
      publishedAt: data.publishedAt ? data.publishedAt.toMillis() : Date.now(),
      updatedAt: Date.now(),
      image: data.thumbnailUrl,
    };
  },
  photo: async (id: string, data: any): Promise<AlgoliaRecord> => {
    const category = await resolveCategoryName(data);
    return {
      objectID: id,
      type: "photo",
      title: data.title,
      description: data.description || "",
      category,
      tags: data.tags || [],
      url: `/photos/${id}`,
      publishedAt: data.createdAt ? data.createdAt.toMillis() : Date.now(), // Albums use createdAt
      updatedAt: Date.now(),
      image: data.coverImage,
    };
  },
};

/**
 * Higher-order function to create a sync handler
 */
function createSyncHandler(
  type: "blog" | "video" | "photo",
  transform: (id: string, data: any) => Promise<AlgoliaRecord>
) {
  return functions.firestore
    .document(
      `${type === "blog" ? "blogPosts" : type === "video" ? "videos" : "photoAlbums"}/{docId}`
    )
    .onWrite(async (change, context) => {
      const index = getAlgoliaIndex();
      if (!index) return;

      const objectID = change.after.id || change.before.id;

      // DELETE
      if (!change.after.exists) {
        try {
          await index.deleteObject(objectID);
          console.log(`[Algolia] Deleted ${type} ${objectID}`);
        } catch (error) {
          console.error(`[Algolia] Error deleting ${type} ${objectID}`, error);
        }
        return;
      }

      // CREATE / UPDATE
      const data = change.after.data();
      if (!data) return;

      // Skip drafts for blog posts (optional, based on requirement, but usually good practice)
      if (type === "blog" && data.status !== "published") {
        // If it was published and is now draft, delete it from index
        if (
          change.before.exists &&
          change.before.data()?.status === "published"
        ) {
          try {
            await index.deleteObject(objectID);
            console.log(`[Algolia] Un-published ${type} ${objectID}`);
          } catch (error) {
            console.error(
              `[Algolia] Error un-publishing ${type} ${objectID}`,
              error
            );
          }
        }
        return;
      }

      try {
        const record = await transform(objectID, data);
        await index.saveObject(record);
        console.log(`[Algolia] Synced ${type} ${objectID}`);
      } catch (error) {
        console.error(`[Algolia] Error syncing ${type} ${objectID}`, error);
      }
    });
}

// Exports — Algolia sync triggers
export const onBlogPostWrite = createSyncHandler("blog", Transformers.blog);
export const onVideoWrite = createSyncHandler("video", Transformers.video);
export const onPhotoAlbumWrite = createSyncHandler("photo", Transformers.photo);

export const onContactMessageCreate = functions.firestore
  .document("contact_messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    await admin
      .firestore()
      .collection("mail")
      .add({
        to: CONTACT_RECIPIENT,
        from: NEWSLETTER_FROM,
        replyTo: data.email,
        message: {
          subject: data.subject || `New SimplySoph contact from ${data.name}`,
          text: [
            `Name: ${data.name}`,
            `Email: ${data.email}`,
            "",
            data.message,
            "",
            `Message ID: ${context.params.messageId}`,
          ].join("\n"),
          html: `<p><strong>Name:</strong> ${data.name}</p><p><strong>Email:</strong> ${data.email}</p><p>${String(data.message).replace(/\n/g, "<br>")}</p>`,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  });

export const onNewsletterSubscriberCreate = functions.firestore
  .document("newsletterSubscribers/{subscriberId}")
  .onCreate(async snapshot => {
    const data = snapshot.data();
    if (!data.active || !data.email) return;

    await admin
      .firestore()
      .collection("mail")
      .add({
        to: data.email,
        from: NEWSLETTER_FROM,
        message: {
          subject: "Welcome to SimplySoph",
          text: "You're on the SimplySoph list. Watch for style drops, creative updates, and behind-the-scenes notes.",
          html: "<p>You're on the SimplySoph list.</p><p>Watch for style drops, creative updates, and behind-the-scenes notes.</p>",
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  });

// Admin role management — callable Cloud Function
// Previously missing from exports; Firebase only deploys what is exported here.
export { setAdminClaim } from "./setAdminClaim";

// ── Social + AI API ──────────────────────────────────────────────────────────
/**
 * `api` — single HTTPS function that handles all /api/* routes.
 * Firebase Hosting rewrites /api/** to this function.
 *
 * Routes:
 *   GET  /api/tiktok/comments?videoId=<id>&max=<n>
 *   POST /api/ai/persona-replies
 */
const ALLOWED_ORIGINS = [
  "https://simplysoph.com",
  "https://www.simplysoph.com",
  "https://simplysoph-66c78.web.app",
  "https://simplysoph-66c78.firebaseapp.com",
  "http://localhost:5173",
  "http://localhost:4173",
];

const MAX_AI_REQUEST_BYTES = 16 * 1024;
const AI_IP_WINDOW_MS = 10 * 60 * 1000;
const AI_USER_WINDOW_MS = 10 * 60 * 1000;
const AI_IP_MAX_REQUESTS = 30;
const AI_USER_MAX_REQUESTS = 40;

const aiIpBuckets = new Map<string, number[]>();
const aiUserBuckets = new Map<string, number[]>();

function getClientIp(req: functions.https.Request): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    return xff.split(",")[0].trim();
  }
  return req.ip || "unknown";
}

function parseBearerToken(headerValue: string | undefined): string | null {
  if (!headerValue) return null;
  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function getRequestBodyBytes(req: functions.https.Request): number {
  const contentLength = req.headers["content-length"];
  if (typeof contentLength === "string") {
    const parsed = Number.parseInt(contentLength, 10);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }

  if (typeof req.body === "string") {
    return Buffer.byteLength(req.body, "utf8");
  }

  if (!req.body) return 0;
  return Buffer.byteLength(JSON.stringify(req.body), "utf8");
}

function isAllowedInRateWindow(
  bucket: Map<string, number[]>,
  key: string,
  now: number,
  windowMs: number,
  maxRequests: number
): boolean {
  const windowStart = now - windowMs;
  const existing = bucket.get(key) ?? [];
  const pruned = existing.filter(ts => ts > windowStart);

  if (pruned.length >= maxRequests) {
    bucket.set(key, pruned);
    return false;
  }

  pruned.push(now);
  bucket.set(key, pruned);
  return true;
}

async function enforceAiAccess(
  req: functions.https.Request,
  res: functions.Response
): Promise<{ uid: string } | null> {
  const requestBytes = getRequestBodyBytes(req);
  if (requestBytes > MAX_AI_REQUEST_BYTES) {
    res.status(413).json({ error: "Request body is too large" });
    return null;
  }

  const idToken = parseBearerToken(req.headers.authorization as string | undefined);
  if (!idToken) {
    res.status(401).json({ error: "Missing Firebase ID token" });
    return null;
  }

  let decoded: admin.auth.DecodedIdToken;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch {
    res.status(401).json({ error: "Invalid Firebase ID token" });
    return null;
  }

  if (decoded.role !== "admin") {
    res.status(403).json({ error: "Admin role required" });
    return null;
  }

  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
  if (!isEmulator) {
    const appCheckToken = req.headers["x-firebase-appcheck"];
    if (typeof appCheckToken !== "string" || appCheckToken.length === 0) {
      res.status(401).json({ error: "Missing App Check token" });
      return null;
    }

    try {
      await admin.appCheck().verifyToken(appCheckToken);
    } catch {
      res.status(401).json({ error: "Invalid App Check token" });
      return null;
    }
  }

  const now = Date.now();
  const ip = getClientIp(req);
  if (!isAllowedInRateWindow(aiIpBuckets, ip, now, AI_IP_WINDOW_MS, AI_IP_MAX_REQUESTS)) {
    res.status(429).json({ error: "Too many AI requests from this IP" });
    return null;
  }

  if (!isAllowedInRateWindow(aiUserBuckets, decoded.uid, now, AI_USER_WINDOW_MS, AI_USER_MAX_REQUESTS)) {
    res.status(429).json({ error: "Too many AI requests for this user" });
    return null;
  }

  return { uid: decoded.uid };
}

export const api = functions.https.onRequest(async (req, res) => {
  // CORS — allow requests only from known origins
  const origin = req.headers.origin || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.set("Access-Control-Allow-Origin", allowedOrigin);
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Firebase-AppCheck");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Strip /api prefix so handlers see /tiktok/comments etc.
  const path = req.path.replace(/^\/api/, "") || "/";

  if (req.method === "GET" && path === "/tiktok/comments") {
    await handleTikTokComments(req, res);
    return;
  }

  if (req.method === "POST" && path === "/ai/persona-replies") {
    const access = await enforceAiAccess(req, res);
    if (!access) return;
    await handlePersonaReplies(req, res);
    return;
  }

  if (req.method === "POST" && path === "/ai/generate") {
    const access = await enforceAiAccess(req, res);
    if (!access) return;
    await handleAiGenerate(req, res);
    return;
  }

  res.status(404).json({ error: `Route not found: ${req.method} ${path}` });
});
