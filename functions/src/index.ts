import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import algoliasearch from "algoliasearch";
import { handleTikTokComments } from "./tiktok";
import { handlePersonaReplies } from "./ai";

// Initialize Firebase Admin
admin.initializeApp();

// Configuration
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME || "dev_content";

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

// ── Social + AI API ──────────────────────────────────────────────────────────
/**
 * `api` — single HTTPS function that handles all /api/* routes.
 * Firebase Hosting rewrites /api/** to this function.
 *
 * Routes:
 *   GET  /api/tiktok/comments?videoId=<id>&max=<n>
 *   POST /api/ai/persona-replies
 */
export const api = functions.https.onRequest(async (req, res) => {
  // CORS — allow requests from the hosted site and local dev
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

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
    await handlePersonaReplies(req, res);
    return;
  }

  res.status(404).json({ error: `Route not found: ${req.method} ${path}` });
});
