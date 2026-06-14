/**
 * algolia.ts — Algolia index sync helpers
 *
 * Writes content records to Algolia after Firestore saves.
 * Completely no-op if VITE_ALGOLIA_* env vars are not set, so the
 * app works identically whether or not Algolia is configured.
 *
 * Usage:
 *   import { syncBlogPostToAlgolia, deleteFromAlgolia } from './algolia';
 *   // Call after saveBlogPost() or savePhotoAlbum()
 *
 * Requires:
 *   VITE_ALGOLIA_APP_ID      — Algolia Application ID
 *   VITE_ALGOLIA_WRITE_KEY   — Algolia Admin API key (NOT the Search-only key)
 *   VITE_ALGOLIA_INDEX_NAME  — Index name (e.g. "simplysoph")
 *
 * NOTE: Never expose the Admin API key publicly. These writes are
 * client-side for simplicity; move to a Cloud Function when you need
 * stricter security.
 */

const APP_ID     = import.meta.env.VITE_ALGOLIA_APP_ID    as string | undefined;
const WRITE_KEY  = import.meta.env.VITE_ALGOLIA_WRITE_KEY  as string | undefined;
const INDEX_NAME = import.meta.env.VITE_ALGOLIA_INDEX_NAME as string | undefined;

function isConfigured(): boolean {
  return Boolean(APP_ID && WRITE_KEY && INDEX_NAME);
}

/** Base URL for the Algolia REST API */
function baseUrl(path: string): string {
  return `https://${APP_ID}-dsn.algolia.net/1/indexes/${INDEX_NAME}${path}`;
}

/** Common headers for every Algolia request */
function headers(): HeadersInit {
  return {
    'X-Algolia-Application-Id': APP_ID!,
    'X-Algolia-API-Key': WRITE_KEY!,
    'Content-Type': 'application/json',
  };
}

/** Save or update a single record in the index. objectID must be the Firestore doc ID. */
async function saveRecord(record: Record<string, unknown>): Promise<void> {
  if (!isConfigured()) return;
  const res = await fetch(baseUrl(`/${record.objectID}`), {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn('[algolia] saveRecord failed:', res.status, text);
  }
}

/** Delete a record from the index by its objectID (Firestore doc ID). */
export async function deleteFromAlgolia(id: string): Promise<void> {
  if (!isConfigured()) return;
  const res = await fetch(baseUrl(`/${id}`), {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn('[algolia] deleteRecord failed:', res.status, text);
  }
}

// ── Blog posts ────────────────────────────────────────────────────────────────

export interface AlgoliaBlogRecord {
  objectID: string;
  type: 'blog';
  title: string;
  excerpt?: string | null;
  tags?: string[] | null;
  categoryId?: string | null;
  slug: string;
  coverImage?: string | null;
  status: string;
  publishedAt?: number | null; // Unix timestamp for Algolia range filters
  readingTime?: number;
  views?: number;
  likes?: number;
}

/**
 * Sync a blog post to Algolia. Safe to call after every saveBlogPost().
 * Only published posts are indexed; drafts are removed.
 */
export async function syncBlogPostToAlgolia(
  postId: string,
  data: {
    title: string;
    excerpt?: string | null;
    tags?: string[] | null;
    categoryId?: string | null;
    slug: string;
    coverImage?: string | null;
    status: string;
    publishedAt?: Date | null;
    readingTime?: number;
    views?: number;
    likes?: number;
  }
): Promise<void> {
  if (!isConfigured()) return;

  // Remove drafts from the index
  if (data.status !== 'published') {
    await deleteFromAlgolia(postId);
    return;
  }

  const record: AlgoliaBlogRecord = {
    objectID:    postId,
    type:        'blog',
    title:       data.title,
    excerpt:     data.excerpt ?? null,
    tags:        data.tags ?? null,
    categoryId:  data.categoryId ?? null,
    slug:        data.slug,
    coverImage:  data.coverImage ?? null,
    status:      data.status,
    publishedAt: data.publishedAt ? data.publishedAt.getTime() : null,
    readingTime: data.readingTime,
    views:       data.views ?? 0,
    likes:       data.likes ?? 0,
  };

  await saveRecord(record as unknown as Record<string, unknown>);
}

// ── Photo albums ──────────────────────────────────────────────────────────────

export interface AlgoliaAlbumRecord {
  objectID: string;
  type: 'album';
  title: string;
  description?: string | null;
  categoryId?: string | null;
  coverImage?: string | null;
  status: string;
  publishedAt?: number | null;
}

/**
 * Sync a photo album to Algolia. Safe to call after every savePhotoAlbum().
 * Only published albums are indexed.
 */
export async function syncPhotoAlbumToAlgolia(
  albumId: string,
  data: {
    title: string;
    description?: string | null;
    categoryId?: string | null;
    coverImage?: string | null;
    status: string;
    publishedAt?: Date | null;
  }
): Promise<void> {
  if (!isConfigured()) return;

  if (data.status !== 'published') {
    await deleteFromAlgolia(albumId);
    return;
  }

  const record: AlgoliaAlbumRecord = {
    objectID:    albumId,
    type:        'album',
    title:       data.title,
    description: data.description ?? null,
    categoryId:  data.categoryId ?? null,
    coverImage:  data.coverImage ?? null,
    status:      data.status,
    publishedAt: data.publishedAt ? data.publishedAt.getTime() : null,
  };

  await saveRecord(record as unknown as Record<string, unknown>);
}
