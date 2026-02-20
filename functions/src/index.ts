import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import algoliasearch from "algoliasearch";

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Algolia Client
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME || "dev_content";

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
  console.warn("Algolia credentials not set. Indexing will not work.");
}

const client = algoliasearch(ALGOLIA_APP_ID || "", ALGOLIA_ADMIN_KEY || "");
const index = client.initIndex(ALGOLIA_INDEX_NAME);

/**
 * Syncs Firestore document changes to Algolia
 */
async function syncToAlgolia(
  change: functions.Change<functions.firestore.DocumentSnapshot>,
  type: 'blog' | 'video' | 'photo'
) {
  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) return;

  const objectID = change.after.id || change.before.id;

  // Document deleted
  if (!change.after.exists) {
    try {
      await index.deleteObject(objectID);
      console.log(`Deleted object ${objectID} from Algolia`);
    } catch (error) {
      console.error(`Error deleting object ${objectID} from Algolia`, error);
    }
    return;
  }

  const data = change.after.data();
  if (!data) return;

  try {
    // Resolve category name if only ID is present
    let categoryName = data.category;
    if (!categoryName && data.categoryId) {
      const categorySnap = await admin.firestore().collection('categories').doc(data.categoryId).get();
      if (categorySnap.exists) {
        categoryName = categorySnap.data()?.name;
      }
    }

    // determine url
    let url = '';
    if (type === 'blog') {
      url = `/blog/${data.slug || objectID}`;
    } else if (type === 'video') {
      url = `/videos#${objectID}`;
    } else if (type === 'photo') {
      url = `/photos/${objectID}`;
    }

    // determine publishedAt
    let publishedAtMillis = Date.now();
    if (type === 'photo') {
       // Albums rely on createdAt
       if (data.createdAt && typeof data.createdAt.toMillis === 'function') {
         publishedAtMillis = data.createdAt.toMillis();
       }
    } else {
       if (data.publishedAt && typeof data.publishedAt.toMillis === 'function') {
         publishedAtMillis = data.publishedAt.toMillis();
       }
    }

    const record = {
      objectID,
      type,
      title: data.title,
      description: data.description || (data.content ? data.content.substring(0, 150) : ''),
      category: categoryName,
      tags: data.tags || [],
      url,
      publishedAt: publishedAtMillis,
      updatedAt: Date.now(), // Useful for debugging
    };

    await index.saveObject(record);
    console.log(`Synced ${type} ${objectID} to Algolia`);
  } catch (error) {
    console.error(`Error syncing ${type} ${objectID} to Algolia`, error);
  }
}

export const onBlogPostWrite = functions.firestore
  .document("blogPosts/{docId}")
  .onWrite((change) => syncToAlgolia(change, "blog"));

export const onVideoWrite = functions.firestore
  .document("videos/{docId}")
  .onWrite((change) => syncToAlgolia(change, "video"));

export const onPhotoAlbumWrite = functions.firestore
  .document("photoAlbums/{docId}")
  .onWrite((change) => syncToAlgolia(change, "photo"));
