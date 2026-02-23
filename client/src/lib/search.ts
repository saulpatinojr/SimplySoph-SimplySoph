import algoliasearch, { type SearchClient, type SearchIndex } from 'algoliasearch';

export interface SearchResult {
  id: string;
  type: 'blog' | 'video' | 'photo';
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  url: string;
  publishedAt: Date;
  score?: number;
}

export class SearchService {
  private static instance: SearchService;
  private client: SearchClient | null = null;
  private index: SearchIndex | null = null;
  private configured: boolean = false;

  private constructor() {
    const ALGOLIA_APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID;
    const ALGOLIA_SEARCH_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_KEY;
    const ALGOLIA_INDEX_NAME = import.meta.env.VITE_ALGOLIA_INDEX_NAME || 'dev_content';

    if (ALGOLIA_APP_ID && ALGOLIA_SEARCH_KEY) {
      try {
        this.client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
        this.index = this.client.initIndex(ALGOLIA_INDEX_NAME);
        this.configured = true;
      } catch (e) {
        console.error('Failed to initialize Algolia client', e);
      }
    } else {
      console.warn('Algolia credentials missing in environment variables');
    }
  }

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  static reset() {
    // @ts-ignore
    SearchService.instance = null;
  }

  async init() {
    // No-op for Algolia as client is initialized in constructor
    // but useful if we add async init logic later
    return Promise.resolve();
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!this.configured || !this.index) {
        console.warn('Search attempted but Algolia is not configured.');
        return [];
    }
    if (!query.trim()) return [];

    try {
      // Fetch up to 100 results to allow for some client-side filtering if needed
      const { hits } = await this.index.search<any>(query, {
        hitsPerPage: 100
      });

      return hits.map((hit) => ({
        id: hit.objectID,
        type: hit.type,
        title: hit.title,
        description: hit.description,
        category: hit.category,
        tags: hit.tags,
        url: hit.url,
        publishedAt: new Date(hit.publishedAt),
      }));
    } catch (error) {
      console.error('Algolia search error:', error);
      // Return empty array to avoid crashing UI, but log error
      return [];
    }
  }
}

/**
 * Search across blog posts, videos, and photo albums
 * Uses Algolia for relevance-based search
 */
export async function searchContent(
  searchQuery: string,
  contentType?: 'blog' | 'video' | 'photo'
): Promise<SearchResult[]> {
  const service = SearchService.getInstance();
  await service.init();

  if (!service.isConfigured()) {
      return [];
  }

  let results = await service.search(searchQuery);

  if (contentType) {
    results = results.filter((item) => item.type === contentType);
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
