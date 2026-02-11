import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchContent } from './search';
import * as firestore from 'firebase/firestore';

// Mock Firebase modules
vi.mock('./firebase', () => ({
  getFirebaseFirestore: vi.fn(() => ({})), // Return dummy firestore instance
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    getFirestore: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(), // We might remove this in new impl, but need it for old?
    limit: vi.fn(),
    getDocs: vi.fn(),
    orderBy: vi.fn(),
  };
});

describe('searchContent with Fuse.js', () => {
  // Mock data
  const mockBlogs = [
    {
      id: 'blog1',
      data: () => ({
        title: 'Recycling Guide',
        category: 'Sustainability',
        description: 'How to recycle properly',
        publishedAt: { toDate: () => new Date('2023-01-01') },
        slug: 'recycling-guide'
      })
    },
    {
      id: 'blog2',
      data: () => ({
        title: 'Gardening Tips',
        category: 'Lifestyle',
        description: 'Planting flowers',
        publishedAt: { toDate: () => new Date('2023-02-01') },
        slug: 'gardening'
      })
    },
  ];

  const mockVideos = [
    {
      id: 'video1',
      data: () => ({
        title: 'Recycling Video',
        category: 'Sustainability',
        description: 'Watch us recycle',
        publishedAt: { toDate: () => new Date('2023-03-01') }
      })
    },
  ];

  const mockAlbums = [
    {
      id: 'album1',
      data: () => ({
        title: 'Nature Photos',
        category: 'Photography',
        description: 'Beautiful trees',
        publishedAt: { toDate: () => new Date('2023-04-01') }
      })
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock getDocs to return data sequentially for blogs, videos, albums
    // The implementation fetches from blogs, then videos, then albums.
    const mockSnapshot = (docs: any[]) => ({
      docs,
      forEach: (cb: any) => docs.forEach(cb),
      empty: docs.length === 0,
      size: docs.length
    });

    vi.mocked(firestore.getDocs)
      .mockResolvedValueOnce(mockSnapshot(mockBlogs) as any)
      .mockResolvedValueOnce(mockSnapshot(mockVideos) as any)
      .mockResolvedValueOnce(mockSnapshot(mockAlbums) as any);
  });

  it('performs fuzzy search (typo tolerance)', async () => {
    // "recycing" typo -> should find "Recycling Guide" and "Recycling Video"
    // Current implementation fails this because it uses strict token match.
    // New implementation with Fuse.js should pass.
    const results = await searchContent('recycing');

    // Check results
    // We expect at least the blog and video
    const titles = results.map(r => r.title);
    expect(titles).toContain('Recycling Guide');
    expect(titles).toContain('Recycling Video');
    // Fuse.js should filter out irrelevant results
    expect(titles).not.toContain('Gardening Tips');
  });

  it('sorts by relevance', async () => {
    // Exact match "Recycling Guide" should be first if query is "Recycling Guide"
    const results = await searchContent('Recycling Guide');
    expect(results[0].title).toBe('Recycling Guide');
  });

  it('filters by content type', async () => {
    const results = await searchContent('Recycling', 'blog');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.type === 'blog')).toBe(true);
  });
});
