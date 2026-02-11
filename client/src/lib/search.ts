import { getFirebaseFirestore } from './firebase';
import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore';
import Fuse from 'fuse.js';

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

class SearchService {
  private static instance: SearchService;
  private fuse: Fuse<SearchResult> | null = null;
  private isInitialized = false;
  private isLoading = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  async init() {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.isLoading = true;
    this.initPromise = (async () => {
      try {
        const results: SearchResult[] = [];

        // Fetch blogs
        const blogQuery = query(collection(db(), 'blogs'), orderBy('publishedAt', 'desc'), limit(1000));
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

        // Fetch videos
        const videoQuery = query(collection(db(), 'videos'), orderBy('publishedAt', 'desc'), limit(1000));
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

        // Fetch albums
        const albumQuery = query(collection(db(), 'albums'), orderBy('publishedAt', 'desc'), limit(1000));
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

        // Initialize Fuse
        this.fuse = new Fuse(results, {
          keys: [
            { name: 'title', weight: 0.4 },
            { name: 'category', weight: 0.3 },
            { name: 'description', weight: 0.2 },
          ],
          includeScore: true,
          threshold: 0.4, // Match threshold (0.0 = perfect match, 1.0 = match anything)
          ignoreLocation: true, // Search entire string
        });

        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize search index:', error);
      } finally {
        this.isLoading = false;
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  search(query: string): SearchResult[] {
    if (!this.fuse) return [];

    if (!query.trim()) return [];

    const results = this.fuse.search(query);

    // Map back to SearchResult and include score
    return results.map(result => ({
      ...result.item,
      score: result.score // Fuse score: lower is better
    }));
  }
}

/**
 * Search across blog posts, videos, and photo albums
 * Uses Fuse.js for fuzzy full-text search
 */
export async function searchContent(
  searchQuery: string,
  contentType?: 'blog' | 'video' | 'photo'
): Promise<SearchResult[]> {
  const service = SearchService.getInstance();
  await service.init();

  let results = service.search(searchQuery);

  if (contentType) {
    results = results.filter(item => item.type === contentType);
  }

  // Return top 50 results
  return results.slice(0, 50);
}

/**
 * Tokenize text for search (simple implementation)
 * Splits text into lowercase words for array-contains-any queries
 * @deprecated Used only for legacy generateSearchTokens
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter((token) => token.length > 2); // Ignore very short words
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
