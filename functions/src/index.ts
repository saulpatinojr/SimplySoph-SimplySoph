import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import algoliasearch from "algoliasearch";
import crypto from "crypto";
import { handleTikTokComments } from "./tiktok";
import { handlePersonaReplies, handleAiGenerate } from "./ai";
import { logError, logInfo, logWarn } from "./telemetry";

// Initialize Firebase Admin
admin.initializeApp();

// Configuration
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME || "dev_content";
const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT || "hello@simplysoph.com";
const NEWSLETTER_FROM = process.env.NEWSLETTER_FROM || "SimplySoph <hello@simplysoph.com>";
const SITE_URL = process.env.SITE_URL || "https://simplysoph.com";
const UNSUBSCRIBE_TOKEN_SECRET = process.env.UNSUBSCRIBE_TOKEN_SECRET || "";
const NEWSLETTER_CONFIRM_TOKEN_SECRET =
  process.env.NEWSLETTER_CONFIRM_TOKEN_SECRET || UNSUBSCRIBE_TOKEN_SECRET;

// Lazy initialization of Algolia client
let algoliaIndex: any;

function getAlgoliaIndex() {
  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
    logWarn("algolia.credentials_missing", {
      appIdConfigured: Boolean(ALGOLIA_APP_ID),
      keyConfigured: Boolean(ALGOLIA_ADMIN_KEY),
    });
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
      logWarn("algolia.category_resolve_failed", {
        categoryId: data.categoryId,
        error: e,
      });
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
          logInfo("algolia.object_deleted", { type, objectID });
        } catch (error) {
          logError("algolia.delete_failed", { type, objectID, error });
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
            logInfo("algolia.object_unpublished", { type, objectID });
          } catch (error) {
            logError("algolia.unpublish_failed", { type, objectID, error });
          }
        }
        return;
      }

      try {
        const record = await transform(objectID, data);
        await index.saveObject(record);
        logInfo("algolia.object_synced", { type, objectID });
      } catch (error) {
        logError("algolia.sync_failed", { type, objectID, error });
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

    const email = String(data.email).toLowerCase().trim();
    await sendNewsletterWelcomeEmail(
      email,
      data.leadMagnet ? String(data.leadMagnet) : undefined
    );

    await snapshot.ref.set(
      {
        welcomeEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        lifecycleStage: data.leadMagnet
          ? "welcome-with-lead-magnet-sent"
          : "welcome-sent",
        lastLifecycleEvent: "welcome_email_sent",
      },
      { merge: true }
    );
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
const MAX_PUBLIC_WRITE_BYTES = 12 * 1024;
const AI_IP_WINDOW_MS = 10 * 60 * 1000;
const AI_USER_WINDOW_MS = 10 * 60 * 1000;
const AI_IP_MAX_REQUESTS = 30;
const AI_USER_MAX_REQUESTS = 40;
const PUBLIC_WRITE_WINDOW_MS = 10 * 60 * 1000;
const NEWSLETTER_IP_MAX_REQUESTS = 20;
const CONTACT_IP_MAX_REQUESTS = 8;
const COMMENT_IP_MAX_REQUESTS = 12;
const ATTRIBUTION_EVENT_IP_MAX_REQUESTS = 80;
const ENFORCE_PUBLIC_APPCHECK = (process.env.ENFORCE_PUBLIC_APPCHECK || "false") === "true";
const MAX_NAME_LENGTH = 120;
const MAX_SUBJECT_LENGTH = 180;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_COMMENT_LENGTH = 1200;

const aiIpBuckets = new Map<string, number[]>();
const aiUserBuckets = new Map<string, number[]>();
const publicWriteBuckets = new Map<string, number[]>();

type CommentPostType = "blog" | "video" | "photo";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function sanitizeOptionalText(value: unknown, maxLength: number): string | undefined {
  const sanitized = sanitizeText(value, maxLength);
  return sanitized.length ? sanitized : undefined;
}

function sanitizeStringArray(value: unknown, maxLength: number, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map(item => sanitizeText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function sanitizeRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => typeof entry === "string")
      .map(([key, entry]) => [key, sanitizeText(entry, 160)])
      .filter(([, entry]) => entry.length > 0)
  );
}

function createUnsubscribeToken(email: string): string {
  if (!UNSUBSCRIBE_TOKEN_SECRET) return "";
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 180;
  const normalizedEmail = normalizeEmail(email);
  const payload = `${normalizedEmail}.${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", UNSUBSCRIBE_TOKEN_SECRET)
    .update(payload)
    .digest("hex");
  return `${expiresAt}.${signature}`;
}

function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!UNSUBSCRIBE_TOKEN_SECRET) return false;
  const [expiresAtRaw, signatureRaw] = token.split(".");
  const expiresAt = Number.parseInt(expiresAtRaw, 10);
  if (!Number.isFinite(expiresAt) || !signatureRaw) return false;
  if (expiresAt < Math.floor(Date.now() / 1000)) return false;

  const payload = `${normalizeEmail(email)}.${expiresAt}`;
  const expected = crypto
    .createHmac("sha256", UNSUBSCRIBE_TOKEN_SECRET)
    .update(payload)
    .digest("hex");

  if (expected.length !== signatureRaw.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureRaw));
}

function createNewsletterConfirmToken(email: string): string {
  if (!NEWSLETTER_CONFIRM_TOKEN_SECRET) return "";
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const normalizedEmail = normalizeEmail(email);
  const payload = `${normalizedEmail}.${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", NEWSLETTER_CONFIRM_TOKEN_SECRET)
    .update(payload)
    .digest("hex");
  return `${expiresAt}.${signature}`;
}

function verifyNewsletterConfirmToken(email: string, token: string): boolean {
  if (!NEWSLETTER_CONFIRM_TOKEN_SECRET) return false;
  const [expiresAtRaw, signatureRaw] = token.split(".");
  const expiresAt = Number.parseInt(expiresAtRaw, 10);
  if (!Number.isFinite(expiresAt) || !signatureRaw) return false;
  if (expiresAt < Math.floor(Date.now() / 1000)) return false;

  const payload = `${normalizeEmail(email)}.${expiresAt}`;
  const expected = crypto
    .createHmac("sha256", NEWSLETTER_CONFIRM_TOKEN_SECRET)
    .update(payload)
    .digest("hex");

  if (expected.length !== signatureRaw.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureRaw));
}

async function sendNewsletterDoubleOptInEmail(
  email: string,
  leadMagnet?: string
): Promise<void> {
  const confirmToken = createNewsletterConfirmToken(email);
  const confirmLink = `${SITE_URL.replace(/\/$/, "")}/api/newsletter/confirm?email=${encodeURIComponent(
    email
  )}&token=${encodeURIComponent(confirmToken)}`;

  await admin.firestore().collection("mail").add({
    to: email,
    from: NEWSLETTER_FROM,
    message: {
      subject: "Confirm your SimplySoph subscription",
      text: [
        "One last step: confirm your subscription to receive SimplySoph updates.",
        leadMagnet ? `Requested bonus: ${leadMagnet}` : "",
        "",
        `Confirm here: ${confirmLink}`,
      ]
        .filter(Boolean)
        .join("\n"),
      html: `<p>One last step: confirm your subscription to receive SimplySoph updates.</p>${
        leadMagnet ? `<p>Requested bonus: <strong>${leadMagnet}</strong></p>` : ""
      }<p><a href="${confirmLink}">Confirm subscription</a></p>`,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function sendNewsletterWelcomeEmail(
  email: string,
  leadMagnet?: string
): Promise<void> {
  const unsubscribeToken = createUnsubscribeToken(email);
  const unsubscribeLink = `${SITE_URL.replace(/\/$/, "")}/api/newsletter/unsubscribe?email=${encodeURIComponent(
    email
  )}&token=${encodeURIComponent(unsubscribeToken)}`;

  await admin.firestore().collection("mail").add({
    to: email,
    from: NEWSLETTER_FROM,
    message: {
      subject: "Welcome to SimplySoph",
      text: [
        "You're on the SimplySoph list. Watch for style drops, creative updates, and behind-the-scenes notes.",
        leadMagnet ? `Requested bonus: ${leadMagnet}` : "",
        "",
        `Unsubscribe anytime: ${unsubscribeLink}`,
      ]
        .filter(Boolean)
        .join("\n"),
      html: `<p>You're on the SimplySoph list.</p><p>Watch for style drops, creative updates, and behind-the-scenes notes.</p>${
        leadMagnet ? `<p>Requested bonus: <strong>${leadMagnet}</strong></p>` : ""
      }<p><a href="${unsubscribeLink}">Unsubscribe</a></p>`,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

function renderUnsubscribePage(message: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>SimplySoph Newsletter</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; margin: 0; background: #faf7f2; color: #1f2937; }
      main { max-width: 640px; margin: 4rem auto; background: white; border-radius: 16px; padding: 2rem; box-shadow: 0 8px 30px rgba(0,0,0,.06); }
      h1 { margin-top: 0; }
      a { color: #9b4d1f; }
    </style>
  </head>
  <body>
    <main>
      <h1>SimplySoph Newsletter</h1>
      <p>${message}</p>
      <p><a href="${SITE_URL}">Return to SimplySoph</a></p>
    </main>
  </body>
</html>`;
}

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

async function enforcePublicWriteAccess(
  req: functions.https.Request,
  res: functions.Response,
  routeKey: string,
  maxRequests: number
): Promise<boolean> {
  const requestBytes = getRequestBodyBytes(req);
  if (requestBytes > MAX_PUBLIC_WRITE_BYTES) {
    res.status(413).json({ error: "Request body is too large" });
    return false;
  }

  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
  if (!isEmulator && ENFORCE_PUBLIC_APPCHECK) {
    const appCheckToken = req.headers["x-firebase-appcheck"];
    if (typeof appCheckToken !== "string" || appCheckToken.length === 0) {
      res.status(401).json({ error: "Missing App Check token" });
      return false;
    }

    try {
      await admin.appCheck().verifyToken(appCheckToken);
    } catch {
      res.status(401).json({ error: "Invalid App Check token" });
      return false;
    }
  }

  const now = Date.now();
  const ip = getClientIp(req);
  const rateKey = `${routeKey}:${ip}`;
  if (!isAllowedInRateWindow(publicWriteBuckets, rateKey, now, PUBLIC_WRITE_WINDOW_MS, maxRequests)) {
    res.status(429).json({ error: "Too many requests" });
    return false;
  }

  return true;
}

async function verifyOptionalUser(
  req: functions.https.Request
): Promise<admin.auth.DecodedIdToken | null> {
  const idToken = parseBearerToken(req.headers.authorization as string | undefined);
  if (!idToken) return null;
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch {
    return null;
  }
}

async function requireAuthenticatedUser(
  req: functions.https.Request,
  res: functions.Response
): Promise<admin.auth.DecodedIdToken | null> {
  const idToken = parseBearerToken(req.headers.authorization as string | undefined);
  if (!idToken) {
    res.status(401).json({ error: "Missing Firebase ID token" });
    return null;
  }

  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch {
    res.status(401).json({ error: "Invalid Firebase ID token" });
    return null;
  }
}

async function handleNewsletterSubscribe(req: functions.https.Request, res: functions.Response): Promise<void> {
  if (!(await enforcePublicWriteAccess(req, res, "newsletter-subscribe", NEWSLETTER_IP_MAX_REQUESTS))) {
    return;
  }

  const email = normalizeEmail(sanitizeText(req.body?.email, 320));
  const name = sanitizeOptionalText(req.body?.name, MAX_NAME_LENGTH);
  const source = sanitizeOptionalText(req.body?.source, 100) || "website";
  const interests = sanitizeStringArray(req.body?.interests, 40, 8);
  const leadMagnet = sanitizeOptionalText(req.body?.leadMagnet, 120);
  const consentAccepted = req.body?.consent?.accepted === true;
  const consentVersion = sanitizeOptionalText(req.body?.consent?.version, 64) || "phase4-foundation";
  const attribution = sanitizeRecord(req.body?.attribution);

  if (!email || !isValidEmail(email)) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }

  const col = admin.firestore().collection("newsletterSubscribers");
  const existing = await col.where("email", "==", email).limit(1).get();

  if (!existing.empty) {
    const target = existing.docs[0].ref;
    const currentStatus = String(existing.docs[0].data()?.status || "");
    if (currentStatus === "active") {
      res.status(200).json({ ok: true, alreadySubscribed: true, pendingConfirmation: false });
      return;
    }

    await target.set(
      {
        email,
        name: name || admin.firestore.FieldValue.delete(),
        source,
        interests,
        leadMagnet: leadMagnet || admin.firestore.FieldValue.delete(),
        consentAt: consentAccepted
          ? admin.firestore.FieldValue.serverTimestamp()
          : admin.firestore.FieldValue.delete(),
        consentVersion,
        attribution,
        lifecycleStage: "confirmation-pending",
        lastLifecycleEvent: "resubscribe_pending_confirm",
        active: false,
        status: "pending_confirm",
        resubscribedAt: admin.firestore.FieldValue.serverTimestamp(),
        confirmationRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await sendNewsletterDoubleOptInEmail(email, leadMagnet || undefined);
    res.status(200).json({ ok: true, alreadySubscribed: false, pendingConfirmation: true });
    return;
  }

  await col.add({
    email,
    name: name || "",
    source,
    interests,
    leadMagnet: leadMagnet || null,
    consentAt: consentAccepted ? admin.firestore.FieldValue.serverTimestamp() : null,
    consentVersion,
    attribution,
    lifecycleStage: "confirmation-pending",
    lastLifecycleEvent: "subscribe_pending_confirm",
    active: false,
    status: "pending_confirm",
    confirmationRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
    subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await sendNewsletterDoubleOptInEmail(email, leadMagnet || undefined);
  res.status(200).json({ ok: true, alreadySubscribed: false, pendingConfirmation: true });
}

async function applyNewsletterUnsubscribe(emailRaw: unknown, tokenRaw: unknown): Promise<boolean> {
  const email = normalizeEmail(sanitizeText(emailRaw, 320));
  const token = sanitizeText(tokenRaw, 512);
  if (!email || !isValidEmail(email)) return false;
  if (!token || !verifyUnsubscribeToken(email, token)) return false;

  const col = admin.firestore().collection("newsletterSubscribers");
  const existing = await col.where("email", "==", email).get();
  await Promise.all(
    existing.docs.map(docSnap =>
      docSnap.ref.set(
        {
          active: false,
          status: "unsubscribed",
          unsubscribedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    )
  );

  return true;
}

async function handleNewsletterUnsubscribe(req: functions.https.Request, res: functions.Response): Promise<void> {
  if (req.method === "GET") {
    const ok = await applyNewsletterUnsubscribe(req.query.email, req.query.token);
    if (!ok) {
      res.status(400).send(renderUnsubscribePage("This unsubscribe link is invalid or expired."));
      return;
    }
    res.status(200).send(renderUnsubscribePage("You have been unsubscribed successfully."));
    return;
  }

  if (!(await enforcePublicWriteAccess(req, res, "newsletter-unsubscribe", NEWSLETTER_IP_MAX_REQUESTS))) {
    return;
  }

  const ok = await applyNewsletterUnsubscribe(req.body?.email, req.body?.token);
  if (!ok) {
    res.status(400).json({ error: "Invalid unsubscribe token" });
    return;
  }

  res.status(200).json({ ok: true });
}

async function applyNewsletterConfirm(emailRaw: unknown, tokenRaw: unknown): Promise<boolean> {
  const email = normalizeEmail(sanitizeText(emailRaw, 320));
  const token = sanitizeText(tokenRaw, 512);
  if (!email || !isValidEmail(email)) return false;
  if (!token || !verifyNewsletterConfirmToken(email, token)) return false;

  const col = admin.firestore().collection("newsletterSubscribers");
  const existing = await col.where("email", "==", email).limit(1).get();
  if (existing.empty) return false;

  const target = existing.docs[0].ref;
  const targetData = existing.docs[0].data();
  const alreadyActive = String(targetData.status || "") === "active";

  if (!alreadyActive) {
    await target.set(
      {
        active: true,
        status: "active",
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        lifecycleStage: targetData.leadMagnet
          ? "lead-magnet-requested"
          : "subscribed",
        lastLifecycleEvent: "confirmed",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  await sendNewsletterWelcomeEmail(
    email,
    targetData.leadMagnet ? String(targetData.leadMagnet) : undefined
  );

  await target.set(
    {
      welcomeEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
      lifecycleStage: targetData.leadMagnet
        ? "welcome-with-lead-magnet-sent"
        : "welcome-sent",
      lastLifecycleEvent: "welcome_email_sent",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return true;
}

async function handleNewsletterConfirm(req: functions.https.Request, res: functions.Response): Promise<void> {
  if (req.method === "GET") {
    const ok = await applyNewsletterConfirm(req.query.email, req.query.token);
    if (!ok) {
      res.status(400).send(renderUnsubscribePage("This confirmation link is invalid or expired."));
      return;
    }
    res.status(200).send(renderUnsubscribePage("Thanks, your subscription is now confirmed."));
    return;
  }

  if (!(await enforcePublicWriteAccess(req, res, "newsletter-confirm", NEWSLETTER_IP_MAX_REQUESTS))) {
    return;
  }

  const ok = await applyNewsletterConfirm(req.body?.email, req.body?.token);
  if (!ok) {
    res.status(400).json({ error: "Invalid confirmation token" });
    return;
  }

  res.status(200).json({ ok: true });
}

async function handleAttributionEvent(req: functions.https.Request, res: functions.Response): Promise<void> {
  if (!(await enforcePublicWriteAccess(req, res, "attribution-event", ATTRIBUTION_EVENT_IP_MAX_REQUESTS))) {
    return;
  }

  const eventType = sanitizeText(req.body?.eventType, 64);
  const subjectType = sanitizeOptionalText(req.body?.subjectType, 40);
  const subjectId = sanitizeOptionalText(req.body?.subjectId, 160);
  const source = sanitizeOptionalText(req.body?.source, 120) || "website";
  const attribution = sanitizeRecord(req.body?.attribution);
  const metadata = sanitizeRecord(req.body?.metadata);

  if (!eventType) {
    res.status(400).json({ error: "eventType is required" });
    return;
  }

  const decoded = await verifyOptionalUser(req);
  await admin.firestore().collection("attributionEvents").add({
    eventType,
    subjectType: subjectType || null,
    subjectId: subjectId || null,
    source,
    attribution,
    metadata,
    userId: decoded?.uid || null,
    ip: getClientIp(req),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.status(200).json({ ok: true });
}

const MAX_SAVED_DESTINATIONS = 500;

async function handlePassportSave(req: functions.https.Request, res: functions.Response): Promise<void> {
  const decoded = await requireAuthenticatedUser(req, res);
  if (!decoded) return;

  const destinationId = sanitizeText(req.body?.destinationId, 160);
  if (!destinationId) {
    res.status(400).json({ error: "destinationId is required" });
    return;
  }

  const userRef = admin.firestore().collection("users").doc(decoded.uid);
  const userDoc = await userRef.get();
  const existing = (userDoc.data()?.preferences?.savedDestinationIds as unknown[] | undefined) || [];
  if (existing.length >= MAX_SAVED_DESTINATIONS && !existing.includes(destinationId)) {
    res.status(400).json({ error: "Saved destination limit reached" });
    return;
  }

  await userRef.set(
    {
      preferences: {
        savedDestinationIds: admin.firestore.FieldValue.arrayUnion(destinationId),
      },
    },
    { merge: true }
  );

  res.status(200).json({ ok: true, destinationId });
}

async function handlePassportUnsave(req: functions.https.Request, res: functions.Response): Promise<void> {
  const decoded = await requireAuthenticatedUser(req, res);
  if (!decoded) return;

  const destinationId = sanitizeText(req.body?.destinationId, 160);
  if (!destinationId) {
    res.status(400).json({ error: "destinationId is required" });
    return;
  }

  await admin
    .firestore()
    .collection("users")
    .doc(decoded.uid)
    .set(
      {
        preferences: {
          savedDestinationIds: admin.firestore.FieldValue.arrayRemove(destinationId),
        },
      },
      { merge: true }
    );

  res.status(200).json({ ok: true, destinationId });
}

async function handlePassportSaved(req: functions.https.Request, res: functions.Response): Promise<void> {
  const decoded = await requireAuthenticatedUser(req, res);
  if (!decoded) return;

  const userDoc = await admin.firestore().collection("users").doc(decoded.uid).get();
  const saved =
    (userDoc.data()?.preferences?.savedDestinationIds as unknown[] | undefined)
      ?.filter((value): value is string => typeof value === "string") || [];

  res.status(200).json({ ok: true, destinationIds: saved });
}

async function handleContactSubmit(req: functions.https.Request, res: functions.Response): Promise<void> {
  if (!(await enforcePublicWriteAccess(req, res, "contact-submit", CONTACT_IP_MAX_REQUESTS))) {
    return;
  }

  const name = sanitizeText(req.body?.name, MAX_NAME_LENGTH);
  const email = normalizeEmail(sanitizeText(req.body?.email, 320));
  const subject = sanitizeOptionalText(req.body?.subject, MAX_SUBJECT_LENGTH) || "";
  const message = sanitizeText(req.body?.message, MAX_MESSAGE_LENGTH);

  if (!name || !message) {
    res.status(400).json({ error: "Name and message are required" });
    return;
  }

  if (!email || !isValidEmail(email)) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }

  await admin.firestore().collection("contact_messages").add({
    name,
    email,
    subject,
    message,
    status: "unread",
    source: sanitizeOptionalText(req.body?.source, 120) || "web-contact",
    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.status(200).json({ ok: true });
}

async function handleCommentCreate(req: functions.https.Request, res: functions.Response): Promise<void> {
  if (!(await enforcePublicWriteAccess(req, res, "comment-create", COMMENT_IP_MAX_REQUESTS))) {
    return;
  }

  const postId = sanitizeText(req.body?.postId, 160);
  const postTypeRaw = sanitizeText(req.body?.postType, 20);
  const content = sanitizeText(req.body?.content, MAX_COMMENT_LENGTH);
  const parentId = sanitizeOptionalText(req.body?.parentId, 160);

  if (!postId || !content) {
    res.status(400).json({ error: "postId and content are required" });
    return;
  }

  if (!/[a-zA-Z0-9_-]{2,}/.test(postId)) {
    res.status(400).json({ error: "Invalid postId" });
    return;
  }

  if (content.length < 2) {
    res.status(400).json({ error: "Comment is too short" });
    return;
  }

  if (postTypeRaw !== "blog" && postTypeRaw !== "video" && postTypeRaw !== "photo") {
    res.status(400).json({ error: "Invalid postType" });
    return;
  }

  const postType = postTypeRaw as CommentPostType;
  const decodedUser = await verifyOptionalUser(req);
  const guestName = sanitizeOptionalText(req.body?.guestName, MAX_NAME_LENGTH);

  if (!decodedUser && !guestName) {
    res.status(400).json({ error: "Guest name is required" });
    return;
  }

  const docRef = await admin.firestore().collection("comments").add({
    postId,
    postType,
    content,
    parentId: parentId || null,
    authorId: decodedUser?.uid || `guest_${Date.now()}`,
    authorName: decodedUser?.name || guestName || "Guest",
    authorPhotoURL: decodedUser?.picture || null,
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.status(200).json({ ok: true, id: docRef.id });
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

  try {
    // Strip /api prefix so handlers see /tiktok/comments etc.
    const path = req.path.replace(/^\/api/, "") || "/";

    if (req.method === "GET" && path === "/tiktok/comments") {
      await handleTikTokComments(req, res);
      return;
    }

    if ((req.method === "POST" || req.method === "GET") && path === "/newsletter/unsubscribe") {
      await handleNewsletterUnsubscribe(req, res);
      return;
    }

    if ((req.method === "POST" || req.method === "GET") && path === "/newsletter/confirm") {
      await handleNewsletterConfirm(req, res);
      return;
    }

    if (req.method === "POST" && path === "/newsletter/subscribe") {
      await handleNewsletterSubscribe(req, res);
      return;
    }

    if (req.method === "POST" && path === "/attribution/event") {
      await handleAttributionEvent(req, res);
      return;
    }

    if (req.method === "POST" && path === "/passport/save") {
      await handlePassportSave(req, res);
      return;
    }

    if (req.method === "POST" && path === "/passport/unsave") {
      await handlePassportUnsave(req, res);
      return;
    }

    if (req.method === "GET" && path === "/passport/saved") {
      await handlePassportSaved(req, res);
      return;
    }

    if (req.method === "POST" && path === "/contact/submit") {
      await handleContactSubmit(req, res);
      return;
    }

    if (req.method === "POST" && path === "/comments/create") {
      await handleCommentCreate(req, res);
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
  } catch (error) {
    logError("api.unhandled_exception", {
      method: req.method,
      path: req.path,
      error,
    });

    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});
