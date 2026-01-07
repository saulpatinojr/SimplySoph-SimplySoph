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
  score?: number;
}

/**
 * Tokenize text for search (simple implementation)
 * Splits text into lowercase words for array-contains-any queries
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter((token) => token.length > 2); // Ignore very short words
}

/**
 * Calculate relevance score for a search result
 * - Title match: 10 points
 * - Category match: 8 points
 * - Description match: 5 points
 * - Matches multiple tokens: Additive score
 */
function calculateScore(item: SearchResult, queryTokens: string[]): number {
  let score = 0;
  const titleTokens = tokenize(item.title || '');
  const descTokens = tokenize(item.description || '');
  const categoryTokens = tokenize(item.category || '');

  for (const token of queryTokens) {
    if (titleTokens.includes(token)) score += 10;
    if (categoryTokens.includes(token)) score += 8;
    if (descTokens.includes(token)) score += 5;
  }

  return score;
}

/**
 * Search across blog posts, videos, and photo albums
 * Uses Firestore array-contains-any for basic full-text search
 */
export async function searchContent(
  searchQuery: string,
  contentType?: 'blog' | 'video' | 'photo'
): Promise<SearchResult[]> {
  const tokens = tokenize(searchQuery);
  if (tokens.length === 0) return [];

  const results: SearchResult[] = [];

  // Firestore limitation: array-contains-any supports max 10 values
  const searchTokens = tokens.slice(0, 10);

  // Search blog posts
  if (!contentType || contentType === 'blog') {
    const blogQuery = query(
      collection(db(), 'blogs'),
      where('searchTokens', 'array-contains-any', searchTokens),
      limit(20)
    );
    const blogSnapshot = await getDocs(blogQuery);
    blogSnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        type: 'blog',
        title: data.title,
        description: data.description || data.content?.substring(0, 150),
        category: data.category,
        url: `/blog/${data.slug}`,
        publishedAt: data.publishedAt?.toDate() || new Date(),
      });
    });
  }

  // Search videos
  if (!contentType || contentType === 'video') {
    const videoQuery = query(
      collection(db(), 'videos'),
      where('searchTokens', 'array-contains-any', searchTokens),
      limit(20)
    );
    const videoSnapshot = await getDocs(videoQuery);
    videoSnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        type: 'video',
        title: data.title,
        description: data.description,
        category: data.category,
        url: `/videos#${doc.id}`,
        publishedAt: data.publishedAt?.toDate() || new Date(),
      });
    });
  }

  // Search photo albums
  if (!contentType || contentType === 'photo') {
    const albumQuery = query(
      collection(db(), 'albums'),
      where('searchTokens', 'array-contains-any', searchTokens),
      limit(20)
    );
    const albumSnapshot = await getDocs(albumQuery);
    albumSnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        type: 'photo',
        title: data.title,
        description: data.description,
        category: data.category,
        url: `/photos/${doc.id}`,
        publishedAt: data.publishedAt?.toDate() || new Date(),
      });
    });
  }

  // Calculate scores once
  const scoredResults = results.map(item => ({
    ...item,
    score: calculateScore(item, tokens)
  }));

  // Sort by relevance (score) descending, then by publishedAt descending
  return scoredResults.sort((a, b) => {
    if (a.score !== b.score) {
      return (b.score || 0) - (a.score || 0);
    }
    return b.publishedAt.getTime() - a.publishedAt.getTime();
  });
}

/**
 * Helper to generate search tokens for a document
 * Call this when creating or updating content
 */
export function generateSearchTokens(title: string, description?: string, tags?: string[]): string[] {
  const text = [title, description, ...(tags || [])].filter(Boolean).join(' ');
  const tokens = tokenize(text);
  // Remove duplicates
  return Array.from(new Set(tokens));
}
