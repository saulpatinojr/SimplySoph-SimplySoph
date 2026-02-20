import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchContent, SearchService } from './search';
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
    where: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(),
    orderBy: vi.fn(),
  };
});

describe('searchContent with Fuse.js', () => {
  // Mock data
  const mockCategories = [
    {
      id: 'cat1',
      data: () => ({ name: 'Sustainability' })
    },
    {
      id: 'cat2',
      data: () => ({ name: 'Lifestyle' })
    }
  ];

  const mockBlogs = [
    {
      id: 'blog1',
      data: () => ({
        title: 'Recycling Guide',
        categoryId: 'cat1',
        description: 'How to recycle properly',
        tags: ['eco', 'green'],
        publishedAt: { toDate: () => new Date('2023-01-01') },
        slug: 'recycling-guide'
      })
    },
    {
      id: 'blog2',
      data: () => ({
        title: 'Gardening Tips',
        categoryId: 'cat2',
        description: 'Planting flowers and recycling soil',
        tags: ['plants', 'nature'],
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
        categoryId: 'cat1',
        description: 'Watch us recycle',
        tags: ['video', 'eco'],
        publishedAt: { toDate: () => new Date('2023-03-01') }
      })
    },
  ];

  const mockAlbums = [
    {
      id: 'album1',
      data: () => ({
        title: 'Nature Photos',
        categoryId: 'cat2',
        description: 'Beautiful trees',
        publishedAt: { toDate: () => new Date('2023-04-01') }
      })
    },
  ];

  beforeEach(() => {
    SearchService.reset();
    vi.clearAllMocks();

    const mockSnapshot = (docs: any[]) => ({
      docs,
      forEach: (cb: any) => docs.forEach(cb),
      empty: docs.length === 0,
      size: docs.length
    });

    vi.mocked(firestore.getDocs)
      .mockResolvedValueOnce(mockSnapshot(mockCategories) as any)
      .mockResolvedValueOnce(mockSnapshot(mockBlogs) as any)
      .mockResolvedValueOnce(mockSnapshot(mockVideos) as any)
      .mockResolvedValueOnce(mockSnapshot(mockAlbums) as any);
  });

  it('performs fuzzy search (typo tolerance)', async () => {
    const results = await searchContent('recycing');
    const titles = results.map(r => r.title);
    expect(titles).toContain('Recycling Guide');
    expect(titles).toContain('Recycling Video');
  });

  it('prioritizes title match over description match', async () => {
    const results = await searchContent('recycling');

    // We expect items with title match to appear before description match
    const firstResultTitle = results[0].title;
    expect(['Recycling Guide', 'Recycling Video']).toContain(firstResultTitle);

    // Find index of description-only match
    const gardeningIndex = results.findIndex(r => r.title === 'Gardening Tips');
    const recyclingGuideIndex = results.findIndex(r => r.title === 'Recycling Guide');

    if (gardeningIndex !== -1 && recyclingGuideIndex !== -1) {
        expect(recyclingGuideIndex).toBeLessThan(gardeningIndex);
    }
  });

  it('prioritizes tags match', async () => {
    const results = await searchContent('eco');
    const titles = results.map(r => r.title);
    expect(titles).toContain('Recycling Guide');
    expect(titles).toContain('Recycling Video');
    expect(titles).not.toContain('Nature Photos');
  });

  it('boosts newer content for similar relevance', async () => {
    const duplicateBlogs = [
      {
        id: 'old',
        data: () => ({
          title: 'Duplicate Content',
          description: 'Same text',
          publishedAt: { toDate: () => new Date('2020-01-01') },
          slug: 'old'
        })
      },
      {
        id: 'new',
        data: () => ({
          title: 'Duplicate Content',
          description: 'Same text',
          publishedAt: { toDate: () => new Date('2023-01-01') },
          slug: 'new'
        })
      }
    ];

    vi.mocked(firestore.getDocs).mockReset();
    vi.mocked(firestore.getDocs)
      .mockResolvedValueOnce({ docs: [], forEach: () => {} } as any) // Categories
      .mockResolvedValueOnce({ docs: duplicateBlogs, forEach: (cb: any) => duplicateBlogs.forEach(cb) } as any) // Blogs
      .mockResolvedValueOnce({ docs: [], forEach: () => {} } as any) // Videos
      .mockResolvedValueOnce({ docs: [], forEach: () => {} } as any); // Albums

    const results = await searchContent('Duplicate Content');
    expect(results.length).toBe(2);
    expect(results[0].id).toBe('new');
    expect(results[1].id).toBe('old');
  });
});
