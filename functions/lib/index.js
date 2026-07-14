"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.setAdminClaim = exports.onNewsletterSubscriberCreate = exports.onContactMessageCreate = exports.onPhotoAlbumWrite = exports.onVideoWrite = exports.onBlogPostWrite = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const algoliasearch_1 = __importDefault(require("algoliasearch"));
const crypto_1 = __importDefault(require("crypto"));
const tiktok_1 = require("./tiktok");
const ai_1 = require("./ai");
const telemetry_1 = require("./telemetry");
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
const NEWSLETTER_CONFIRM_TOKEN_SECRET = process.env.NEWSLETTER_CONFIRM_TOKEN_SECRET || UNSUBSCRIBE_TOKEN_SECRET;
// Lazy initialization of Algolia client
let algoliaIndex;
function getAlgoliaIndex() {
    if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
        (0, telemetry_1.logWarn)("algolia.credentials_missing", {
            appIdConfigured: Boolean(ALGOLIA_APP_ID),
            keyConfigured: Boolean(ALGOLIA_ADMIN_KEY),
        });
        return null;
    }
    if (!algoliaIndex) {
        const client = (0, algoliasearch_1.default)(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
        algoliaIndex = client.initIndex(ALGOLIA_INDEX_NAME);
    }
    return algoliaIndex;
}
/**
 * Helper to fetch category name
 */
async function resolveCategoryName(data) {
    var _a;
    if (data.category)
        return data.category;
    if (data.categoryId) {
        try {
            const snap = await admin
                .firestore()
                .collection("categories")
                .doc(data.categoryId)
                .get();
            return snap.exists ? (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.name : undefined;
        }
        catch (e) {
            (0, telemetry_1.logWarn)("algolia.category_resolve_failed", {
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
    blog: async (id, data) => {
        const category = await resolveCategoryName(data);
        return {
            objectID: id,
            type: "blog",
            title: data.title,
            description: data.excerpt || (data.content ? data.content.substring(0, 200) : ""),
            category,
            tags: data.tags || [],
            url: `/blog/${data.slug || id}`,
            publishedAt: data.publishedAt ? data.publishedAt.toMillis() : Date.now(),
            updatedAt: Date.now(),
            image: data.coverImage,
        };
    },
    video: async (id, data) => {
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
    photo: async (id, data) => {
        const category = await resolveCategoryName(data);
        return {
            objectID: id,
            type: "photo",
            title: data.title,
            description: data.description || "",
            category,
            tags: data.tags || [],
            url: `/photos/${id}`,
            publishedAt: data.createdAt ? data.createdAt.toMillis() : Date.now(),
            updatedAt: Date.now(),
            image: data.coverImage,
        };
    },
};
/**
 * Higher-order function to create a sync handler
 */
function createSyncHandler(type, transform) {
    return functions.firestore
        .document(`${type === "blog" ? "blogPosts" : type === "video" ? "videos" : "photoAlbums"}/{docId}`)
        .onWrite(async (change, context) => {
        var _a;
        const index = getAlgoliaIndex();
        if (!index)
            return;
        const objectID = change.after.id || change.before.id;
        // DELETE
        if (!change.after.exists) {
            try {
                await index.deleteObject(objectID);
                (0, telemetry_1.logInfo)("algolia.object_deleted", { type, objectID });
            }
            catch (error) {
                (0, telemetry_1.logError)("algolia.delete_failed", { type, objectID, error });
            }
            return;
        }
        // CREATE / UPDATE
        const data = change.after.data();
        if (!data)
            return;
        // Skip drafts for blog posts (optional, based on requirement, but usually good practice)
        if (type === "blog" && data.status !== "published") {
            // If it was published and is now draft, delete it from index
            if (change.before.exists &&
                ((_a = change.before.data()) === null || _a === void 0 ? void 0 : _a.status) === "published") {
                try {
                    await index.deleteObject(objectID);
                    (0, telemetry_1.logInfo)("algolia.object_unpublished", { type, objectID });
                }
                catch (error) {
                    (0, telemetry_1.logError)("algolia.unpublish_failed", { type, objectID, error });
                }
            }
            return;
        }
        try {
            const record = await transform(objectID, data);
            await index.saveObject(record);
            (0, telemetry_1.logInfo)("algolia.object_synced", { type, objectID });
        }
        catch (error) {
            (0, telemetry_1.logError)("algolia.sync_failed", { type, objectID, error });
        }
    });
}
// Exports — Algolia sync triggers
exports.onBlogPostWrite = createSyncHandler("blog", Transformers.blog);
exports.onVideoWrite = createSyncHandler("video", Transformers.video);
exports.onPhotoAlbumWrite = createSyncHandler("photo", Transformers.photo);
exports.onContactMessageCreate = functions.firestore
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
exports.onNewsletterSubscriberCreate = functions.firestore
    .document("newsletterSubscribers/{subscriberId}")
    .onCreate(async (snapshot) => {
    const data = snapshot.data();
    if (!data.active || !data.email)
        return;
    const email = String(data.email).toLowerCase().trim();
    await sendNewsletterWelcomeEmail(email, data.leadMagnet ? String(data.leadMagnet) : undefined);
    await snapshot.ref.set({
        welcomeEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        lifecycleStage: data.leadMagnet
            ? "welcome-with-lead-magnet-sent"
            : "welcome-sent",
        lastLifecycleEvent: "welcome_email_sent",
    }, { merge: true });
});
// Admin role management — callable Cloud Function
// Previously missing from exports; Firebase only deploys what is exported here.
var setAdminClaim_1 = require("./setAdminClaim");
Object.defineProperty(exports, "setAdminClaim", { enumerable: true, get: function () { return setAdminClaim_1.setAdminClaim; } });
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
const aiIpBuckets = new Map();
const aiUserBuckets = new Map();
const publicWriteBuckets = new Map();
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function normalizeEmail(email) {
    return email.toLowerCase().trim();
}
function sanitizeText(value, maxLength) {
    if (typeof value !== "string")
        return "";
    return value.trim().slice(0, maxLength);
}
function sanitizeOptionalText(value, maxLength) {
    const sanitized = sanitizeText(value, maxLength);
    return sanitized.length ? sanitized : undefined;
}
function sanitizeStringArray(value, maxLength, maxItems) {
    if (!Array.isArray(value))
        return [];
    return value
        .filter((item) => typeof item === "string")
        .map(item => sanitizeText(item, maxLength))
        .filter(Boolean)
        .slice(0, maxItems);
}
function sanitizeRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return {};
    return Object.fromEntries(Object.entries(value)
        .filter(([, entry]) => typeof entry === "string")
        .map(([key, entry]) => [key, sanitizeText(entry, 160)])
        .filter(([, entry]) => entry.length > 0));
}
function createUnsubscribeToken(email) {
    if (!UNSUBSCRIBE_TOKEN_SECRET)
        return "";
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 180;
    const normalizedEmail = normalizeEmail(email);
    const payload = `${normalizedEmail}.${expiresAt}`;
    const signature = crypto_1.default
        .createHmac("sha256", UNSUBSCRIBE_TOKEN_SECRET)
        .update(payload)
        .digest("hex");
    return `${expiresAt}.${signature}`;
}
function verifyUnsubscribeToken(email, token) {
    if (!UNSUBSCRIBE_TOKEN_SECRET)
        return false;
    const [expiresAtRaw, signatureRaw] = token.split(".");
    const expiresAt = Number.parseInt(expiresAtRaw, 10);
    if (!Number.isFinite(expiresAt) || !signatureRaw)
        return false;
    if (expiresAt < Math.floor(Date.now() / 1000))
        return false;
    const payload = `${normalizeEmail(email)}.${expiresAt}`;
    const expected = crypto_1.default
        .createHmac("sha256", UNSUBSCRIBE_TOKEN_SECRET)
        .update(payload)
        .digest("hex");
    if (expected.length !== signatureRaw.length)
        return false;
    return crypto_1.default.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureRaw));
}
function createNewsletterConfirmToken(email) {
    if (!NEWSLETTER_CONFIRM_TOKEN_SECRET)
        return "";
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
    const normalizedEmail = normalizeEmail(email);
    const payload = `${normalizedEmail}.${expiresAt}`;
    const signature = crypto_1.default
        .createHmac("sha256", NEWSLETTER_CONFIRM_TOKEN_SECRET)
        .update(payload)
        .digest("hex");
    return `${expiresAt}.${signature}`;
}
function verifyNewsletterConfirmToken(email, token) {
    if (!NEWSLETTER_CONFIRM_TOKEN_SECRET)
        return false;
    const [expiresAtRaw, signatureRaw] = token.split(".");
    const expiresAt = Number.parseInt(expiresAtRaw, 10);
    if (!Number.isFinite(expiresAt) || !signatureRaw)
        return false;
    if (expiresAt < Math.floor(Date.now() / 1000))
        return false;
    const payload = `${normalizeEmail(email)}.${expiresAt}`;
    const expected = crypto_1.default
        .createHmac("sha256", NEWSLETTER_CONFIRM_TOKEN_SECRET)
        .update(payload)
        .digest("hex");
    if (expected.length !== signatureRaw.length)
        return false;
    return crypto_1.default.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureRaw));
}
async function sendNewsletterDoubleOptInEmail(email, leadMagnet) {
    const confirmToken = createNewsletterConfirmToken(email);
    const confirmLink = `${SITE_URL.replace(/\/$/, "")}/api/newsletter/confirm?email=${encodeURIComponent(email)}&token=${encodeURIComponent(confirmToken)}`;
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
            html: `<p>One last step: confirm your subscription to receive SimplySoph updates.</p>${leadMagnet ? `<p>Requested bonus: <strong>${leadMagnet}</strong></p>` : ""}<p><a href="${confirmLink}">Confirm subscription</a></p>`,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}
async function sendNewsletterWelcomeEmail(email, leadMagnet) {
    const unsubscribeToken = createUnsubscribeToken(email);
    const unsubscribeLink = `${SITE_URL.replace(/\/$/, "")}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(unsubscribeToken)}`;
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
            html: `<p>You're on the SimplySoph list.</p><p>Watch for style drops, creative updates, and behind-the-scenes notes.</p>${leadMagnet ? `<p>Requested bonus: <strong>${leadMagnet}</strong></p>` : ""}<p><a href="${unsubscribeLink}">Unsubscribe</a></p>`,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}
function renderUnsubscribePage(message) {
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
function getClientIp(req) {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.length > 0) {
        return xff.split(",")[0].trim();
    }
    return req.ip || "unknown";
}
function parseBearerToken(headerValue) {
    if (!headerValue)
        return null;
    const match = headerValue.match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : null;
}
function getRequestBodyBytes(req) {
    const contentLength = req.headers["content-length"];
    if (typeof contentLength === "string") {
        const parsed = Number.parseInt(contentLength, 10);
        if (Number.isFinite(parsed) && parsed >= 0)
            return parsed;
    }
    if (typeof req.body === "string") {
        return Buffer.byteLength(req.body, "utf8");
    }
    if (!req.body)
        return 0;
    return Buffer.byteLength(JSON.stringify(req.body), "utf8");
}
function isAllowedInRateWindow(bucket, key, now, windowMs, maxRequests) {
    var _a;
    const windowStart = now - windowMs;
    const existing = (_a = bucket.get(key)) !== null && _a !== void 0 ? _a : [];
    const pruned = existing.filter(ts => ts > windowStart);
    if (pruned.length >= maxRequests) {
        bucket.set(key, pruned);
        return false;
    }
    pruned.push(now);
    bucket.set(key, pruned);
    return true;
}
async function enforcePublicWriteAccess(req, res, routeKey, maxRequests) {
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
        }
        catch (_a) {
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
async function verifyOptionalUser(req) {
    const idToken = parseBearerToken(req.headers.authorization);
    if (!idToken)
        return null;
    try {
        return await admin.auth().verifyIdToken(idToken);
    }
    catch (_a) {
        return null;
    }
}
async function requireAuthenticatedUser(req, res) {
    const idToken = parseBearerToken(req.headers.authorization);
    if (!idToken) {
        res.status(401).json({ error: "Missing Firebase ID token" });
        return null;
    }
    try {
        return await admin.auth().verifyIdToken(idToken);
    }
    catch (_a) {
        res.status(401).json({ error: "Invalid Firebase ID token" });
        return null;
    }
}
async function handleNewsletterSubscribe(req, res) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    if (!(await enforcePublicWriteAccess(req, res, "newsletter-subscribe", NEWSLETTER_IP_MAX_REQUESTS))) {
        return;
    }
    const email = normalizeEmail(sanitizeText((_a = req.body) === null || _a === void 0 ? void 0 : _a.email, 320));
    const name = sanitizeOptionalText((_b = req.body) === null || _b === void 0 ? void 0 : _b.name, MAX_NAME_LENGTH);
    const source = sanitizeOptionalText((_c = req.body) === null || _c === void 0 ? void 0 : _c.source, 100) || "website";
    const interests = sanitizeStringArray((_d = req.body) === null || _d === void 0 ? void 0 : _d.interests, 40, 8);
    const leadMagnet = sanitizeOptionalText((_e = req.body) === null || _e === void 0 ? void 0 : _e.leadMagnet, 120);
    const consentAccepted = ((_g = (_f = req.body) === null || _f === void 0 ? void 0 : _f.consent) === null || _g === void 0 ? void 0 : _g.accepted) === true;
    const consentVersion = sanitizeOptionalText((_j = (_h = req.body) === null || _h === void 0 ? void 0 : _h.consent) === null || _j === void 0 ? void 0 : _j.version, 64) || "phase4-foundation";
    const attribution = sanitizeRecord((_k = req.body) === null || _k === void 0 ? void 0 : _k.attribution);
    if (!email || !isValidEmail(email)) {
        res.status(400).json({ error: "Valid email is required" });
        return;
    }
    const col = admin.firestore().collection("newsletterSubscribers");
    const existing = await col.where("email", "==", email).limit(1).get();
    if (!existing.empty) {
        const target = existing.docs[0].ref;
        const currentStatus = String(((_l = existing.docs[0].data()) === null || _l === void 0 ? void 0 : _l.status) || "");
        if (currentStatus === "active") {
            res.status(200).json({ ok: true, alreadySubscribed: true, pendingConfirmation: false });
            return;
        }
        await target.set({
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
        }, { merge: true });
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
async function applyNewsletterUnsubscribe(emailRaw, tokenRaw) {
    const email = normalizeEmail(sanitizeText(emailRaw, 320));
    const token = sanitizeText(tokenRaw, 512);
    if (!email || !isValidEmail(email))
        return false;
    if (!token || !verifyUnsubscribeToken(email, token))
        return false;
    const col = admin.firestore().collection("newsletterSubscribers");
    const existing = await col.where("email", "==", email).get();
    await Promise.all(existing.docs.map(docSnap => docSnap.ref.set({
        active: false,
        status: "unsubscribed",
        unsubscribedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })));
    return true;
}
async function handleNewsletterUnsubscribe(req, res) {
    var _a, _b;
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
    const ok = await applyNewsletterUnsubscribe((_a = req.body) === null || _a === void 0 ? void 0 : _a.email, (_b = req.body) === null || _b === void 0 ? void 0 : _b.token);
    if (!ok) {
        res.status(400).json({ error: "Invalid unsubscribe token" });
        return;
    }
    res.status(200).json({ ok: true });
}
async function applyNewsletterConfirm(emailRaw, tokenRaw) {
    const email = normalizeEmail(sanitizeText(emailRaw, 320));
    const token = sanitizeText(tokenRaw, 512);
    if (!email || !isValidEmail(email))
        return false;
    if (!token || !verifyNewsletterConfirmToken(email, token))
        return false;
    const col = admin.firestore().collection("newsletterSubscribers");
    const existing = await col.where("email", "==", email).limit(1).get();
    if (existing.empty)
        return false;
    const target = existing.docs[0].ref;
    const targetData = existing.docs[0].data();
    const alreadyActive = String(targetData.status || "") === "active";
    if (!alreadyActive) {
        await target.set({
            active: true,
            status: "active",
            confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
            lifecycleStage: targetData.leadMagnet
                ? "lead-magnet-requested"
                : "subscribed",
            lastLifecycleEvent: "confirmed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    await sendNewsletterWelcomeEmail(email, targetData.leadMagnet ? String(targetData.leadMagnet) : undefined);
    await target.set({
        welcomeEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        lifecycleStage: targetData.leadMagnet
            ? "welcome-with-lead-magnet-sent"
            : "welcome-sent",
        lastLifecycleEvent: "welcome_email_sent",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return true;
}
async function handleNewsletterConfirm(req, res) {
    var _a, _b;
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
    const ok = await applyNewsletterConfirm((_a = req.body) === null || _a === void 0 ? void 0 : _a.email, (_b = req.body) === null || _b === void 0 ? void 0 : _b.token);
    if (!ok) {
        res.status(400).json({ error: "Invalid confirmation token" });
        return;
    }
    res.status(200).json({ ok: true });
}
async function handleAttributionEvent(req, res) {
    var _a, _b, _c, _d, _e, _f;
    if (!(await enforcePublicWriteAccess(req, res, "attribution-event", ATTRIBUTION_EVENT_IP_MAX_REQUESTS))) {
        return;
    }
    const eventType = sanitizeText((_a = req.body) === null || _a === void 0 ? void 0 : _a.eventType, 64);
    const subjectType = sanitizeOptionalText((_b = req.body) === null || _b === void 0 ? void 0 : _b.subjectType, 40);
    const subjectId = sanitizeOptionalText((_c = req.body) === null || _c === void 0 ? void 0 : _c.subjectId, 160);
    const source = sanitizeOptionalText((_d = req.body) === null || _d === void 0 ? void 0 : _d.source, 120) || "website";
    const attribution = sanitizeRecord((_e = req.body) === null || _e === void 0 ? void 0 : _e.attribution);
    const metadata = sanitizeRecord((_f = req.body) === null || _f === void 0 ? void 0 : _f.metadata);
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
        userId: (decoded === null || decoded === void 0 ? void 0 : decoded.uid) || null,
        ip: getClientIp(req),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({ ok: true });
}
const MAX_SAVED_DESTINATIONS = 500;
async function handlePassportSave(req, res) {
    var _a, _b, _c;
    const decoded = await requireAuthenticatedUser(req, res);
    if (!decoded)
        return;
    const destinationId = sanitizeText((_a = req.body) === null || _a === void 0 ? void 0 : _a.destinationId, 160);
    if (!destinationId) {
        res.status(400).json({ error: "destinationId is required" });
        return;
    }
    const userRef = admin.firestore().collection("users").doc(decoded.uid);
    const userDoc = await userRef.get();
    const existing = ((_c = (_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.preferences) === null || _c === void 0 ? void 0 : _c.savedDestinationIds) || [];
    if (existing.length >= MAX_SAVED_DESTINATIONS && !existing.includes(destinationId)) {
        res.status(400).json({ error: "Saved destination limit reached" });
        return;
    }
    await userRef.set({
        preferences: {
            savedDestinationIds: admin.firestore.FieldValue.arrayUnion(destinationId),
        },
    }, { merge: true });
    res.status(200).json({ ok: true, destinationId });
}
async function handlePassportUnsave(req, res) {
    var _a;
    const decoded = await requireAuthenticatedUser(req, res);
    if (!decoded)
        return;
    const destinationId = sanitizeText((_a = req.body) === null || _a === void 0 ? void 0 : _a.destinationId, 160);
    if (!destinationId) {
        res.status(400).json({ error: "destinationId is required" });
        return;
    }
    await admin
        .firestore()
        .collection("users")
        .doc(decoded.uid)
        .set({
        preferences: {
            savedDestinationIds: admin.firestore.FieldValue.arrayRemove(destinationId),
        },
    }, { merge: true });
    res.status(200).json({ ok: true, destinationId });
}
async function handlePassportSaved(req, res) {
    var _a, _b, _c;
    const decoded = await requireAuthenticatedUser(req, res);
    if (!decoded)
        return;
    const userDoc = await admin.firestore().collection("users").doc(decoded.uid).get();
    const saved = ((_c = (_b = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.preferences) === null || _b === void 0 ? void 0 : _b.savedDestinationIds) === null || _c === void 0 ? void 0 : _c.filter((value) => typeof value === "string")) || [];
    res.status(200).json({ ok: true, destinationIds: saved });
}
async function handleContactSubmit(req, res) {
    var _a, _b, _c, _d, _e;
    if (!(await enforcePublicWriteAccess(req, res, "contact-submit", CONTACT_IP_MAX_REQUESTS))) {
        return;
    }
    const name = sanitizeText((_a = req.body) === null || _a === void 0 ? void 0 : _a.name, MAX_NAME_LENGTH);
    const email = normalizeEmail(sanitizeText((_b = req.body) === null || _b === void 0 ? void 0 : _b.email, 320));
    const subject = sanitizeOptionalText((_c = req.body) === null || _c === void 0 ? void 0 : _c.subject, MAX_SUBJECT_LENGTH) || "";
    const message = sanitizeText((_d = req.body) === null || _d === void 0 ? void 0 : _d.message, MAX_MESSAGE_LENGTH);
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
        source: sanitizeOptionalText((_e = req.body) === null || _e === void 0 ? void 0 : _e.source, 120) || "web-contact",
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({ ok: true });
}
async function handleCommentCreate(req, res) {
    var _a, _b, _c, _d, _e;
    if (!(await enforcePublicWriteAccess(req, res, "comment-create", COMMENT_IP_MAX_REQUESTS))) {
        return;
    }
    const postId = sanitizeText((_a = req.body) === null || _a === void 0 ? void 0 : _a.postId, 160);
    const postTypeRaw = sanitizeText((_b = req.body) === null || _b === void 0 ? void 0 : _b.postType, 20);
    const content = sanitizeText((_c = req.body) === null || _c === void 0 ? void 0 : _c.content, MAX_COMMENT_LENGTH);
    const parentId = sanitizeOptionalText((_d = req.body) === null || _d === void 0 ? void 0 : _d.parentId, 160);
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
    const postType = postTypeRaw;
    const decodedUser = await verifyOptionalUser(req);
    const guestName = sanitizeOptionalText((_e = req.body) === null || _e === void 0 ? void 0 : _e.guestName, MAX_NAME_LENGTH);
    if (!decodedUser && !guestName) {
        res.status(400).json({ error: "Guest name is required" });
        return;
    }
    const docRef = await admin.firestore().collection("comments").add({
        postId,
        postType,
        content,
        parentId: parentId || null,
        authorId: (decodedUser === null || decodedUser === void 0 ? void 0 : decodedUser.uid) || `guest_${Date.now()}`,
        authorName: (decodedUser === null || decodedUser === void 0 ? void 0 : decodedUser.name) || guestName || "Guest",
        authorPhotoURL: (decodedUser === null || decodedUser === void 0 ? void 0 : decodedUser.picture) || null,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({ ok: true, id: docRef.id });
}
async function enforceAiAccess(req, res) {
    const requestBytes = getRequestBodyBytes(req);
    if (requestBytes > MAX_AI_REQUEST_BYTES) {
        res.status(413).json({ error: "Request body is too large" });
        return null;
    }
    const idToken = parseBearerToken(req.headers.authorization);
    if (!idToken) {
        res.status(401).json({ error: "Missing Firebase ID token" });
        return null;
    }
    let decoded;
    try {
        decoded = await admin.auth().verifyIdToken(idToken);
    }
    catch (_a) {
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
        }
        catch (_b) {
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
exports.api = functions.https.onRequest(async (req, res) => {
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
            await (0, tiktok_1.handleTikTokComments)(req, res);
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
            if (!access)
                return;
            await (0, ai_1.handlePersonaReplies)(req, res);
            return;
        }
        if (req.method === "POST" && path === "/ai/generate") {
            const access = await enforceAiAccess(req, res);
            if (!access)
                return;
            await (0, ai_1.handleAiGenerate)(req, res);
            return;
        }
        res.status(404).json({ error: `Route not found: ${req.method} ${path}` });
    }
    catch (error) {
        (0, telemetry_1.logError)("api.unhandled_exception", {
            method: req.method,
            path: req.path,
            error,
        });
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});
//# sourceMappingURL=index.js.map