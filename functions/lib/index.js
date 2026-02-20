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
exports.onPhotoAlbumWrite = exports.onVideoWrite = exports.onBlogPostWrite = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const algoliasearch_1 = __importDefault(require("algoliasearch"));
// Initialize Firebase Admin
admin.initializeApp();
// Initialize Algolia Client
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME || "dev_content";
if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
    console.warn("Algolia credentials not set. Indexing will not work.");
}
const client = (0, algoliasearch_1.default)(ALGOLIA_APP_ID || "", ALGOLIA_ADMIN_KEY || "");
const index = client.initIndex(ALGOLIA_INDEX_NAME);
/**
 * Syncs Firestore document changes to Algolia
 */
async function syncToAlgolia(change, type) {
    var _a;
    if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY)
        return;
    const objectID = change.after.id || change.before.id;
    // Document deleted
    if (!change.after.exists) {
        try {
            await index.deleteObject(objectID);
            console.log(`Deleted object ${objectID} from Algolia`);
        }
        catch (error) {
            console.error(`Error deleting object ${objectID} from Algolia`, error);
        }
        return;
    }
    const data = change.after.data();
    if (!data)
        return;
    try {
        // Resolve category name if only ID is present
        let categoryName = data.category;
        if (!categoryName && data.categoryId) {
            const categorySnap = await admin.firestore().collection('categories').doc(data.categoryId).get();
            if (categorySnap.exists) {
                categoryName = (_a = categorySnap.data()) === null || _a === void 0 ? void 0 : _a.name;
            }
        }
        // determine url
        let url = '';
        if (type === 'blog') {
            url = `/blog/${data.slug || objectID}`;
        }
        else if (type === 'video') {
            url = `/videos#${objectID}`;
        }
        else if (type === 'photo') {
            url = `/photos/${objectID}`;
        }
        // determine publishedAt
        let publishedAtMillis = Date.now();
        if (type === 'photo') {
            // Albums rely on createdAt
            if (data.createdAt && typeof data.createdAt.toMillis === 'function') {
                publishedAtMillis = data.createdAt.toMillis();
            }
        }
        else {
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
    }
    catch (error) {
        console.error(`Error syncing ${type} ${objectID} to Algolia`, error);
    }
}
exports.onBlogPostWrite = functions.firestore
    .document("blogPosts/{docId}")
    .onWrite((change) => syncToAlgolia(change, "blog"));
exports.onVideoWrite = functions.firestore
    .document("videos/{docId}")
    .onWrite((change) => syncToAlgolia(change, "video"));
exports.onPhotoAlbumWrite = functions.firestore
    .document("photoAlbums/{docId}")
    .onWrite((change) => syncToAlgolia(change, "photo"));
//# sourceMappingURL=index.js.map