import { getFirebaseFirestore } from './firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

const db = () => getFirebaseFirestore();

export interface SearchResult {
  id: string;
  type: 'blog' | 'video' | 'photo';
  title: string;
  description?: string;
  category?: string;
  url: string;
  publishedAt: Date;
}

/**
 * Tokenize text for search.
 * Returns an empty array for blank / whitespace-only input so callers
 * can short-circuit before hitting Firestore.
 */
function tokenize(text: string): string[] {
  if (!text || !text.trim()) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

/**
 * Search across blog posts, videos, and photo albums.
 * Uses Firestore array-contains-any for basic full-text search.
 *
 * Fixes applied:
 * - Empty / whitespace query guard (returns [] without touching Firestore)
 * - Per-collection try/catch so one failing collection doesn't kill the rest
 * - Network-error re-throw with a typed message so SearchBar can surface it
 */
export async function searchContent(
  searchQuery: string,
  contentType?: 'blog' | 'video' | 'photo'
): Promise<SearchResult[]> {
  // Guard: don't hit Firestore for empty queries
  if (!searchQuery || !searchQuery.trim()) return [];

  const tokens = tokenize(searchQuery);
  if (tokens.length === 0) return [];

  // Firestore array-contains-any supports max 10 values
  const searchTokens = tokens.slice(0, 10);
  const results: SearchResult[] = [];

  // Helper: run one collection query and push results
  async function runQuery(
    collectionName: string,
    type: SearchResult['type'],
    buildResult: (id: string, data: Record<string, any>) => SearchResult
  ) {
    try {
      const q = query(
        collection(db(), collectionName),
        where('searchTokens', 'array-contains-any', searchTokens),
        limit(20)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => results.push(buildResult(doc.id, doc.data())));
    } catch (err: any) {
      // Log but don't crash the whole search if one collection fails
      console.error(`[search] Failed to query ${collectionName}:`, err?.message ?? err);
    }
  }

  if (!contentType || contentType === 'blog') {
    await runQuery('blogs', 'blog', (id, data) => ({
      id,
      type: 'blog',
      title: data.title,
      description: data.description || data.content?.substring(0, 150),
      category: data.category,
      url: `/blog/${data.slug}`,
      publishedAt: data.publishedAt?.toDate() ?? new Date(),
    }));
  }

  if (!contentType || contentType === 'video') {
    await runQuery('videos', 'video', (id, data) => ({
      id,
      type: 'video',
      title: data.title,
      description: data.description,
      category: data.category,
      url: `/videos#${id}`,
      publishedAt: data.publishedAt?.toDate() ?? new Date(),
    }));
  }

  if (!contentType || contentType === 'photo') {
    await runQuery('albums', 'photo', (id, data) => ({
      id,
      type: 'photo',
      title: data.title,
      description: data.description,
      category: data.category,
      url: `/photos/${id}`,
      publishedAt: data.publishedAt?.toDate() ?? new Date(),
    }));
  }

  // Sort by most-recent first
  return results.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

/**
 * Generate search tokens for a Firestore document.
 * Call this when creating or updating content.
 */
export function generateSearchTokens(
  title: string,
  description?: string,
  tags?: string[]
): string[] {
  const text = [title, description, ...(tags ?? [])].filter(Boolean).join(' ');
  return Array.from(new Set(tokenize(text)));
}
