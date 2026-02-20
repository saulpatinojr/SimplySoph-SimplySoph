import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchContent, SearchService } from './search';

const mocks = vi.hoisted(() => {
  const mockSearch = vi.fn();
  const mockInitIndex = vi.fn(() => ({
    search: mockSearch
  }));
  const mockAlgoliasearch = vi.fn(() => ({
    initIndex: mockInitIndex
  }));
  return {
    mockSearch,
    mockInitIndex,
    mockAlgoliasearch
  };
});

vi.mock('algoliasearch', () => ({
  default: mocks.mockAlgoliasearch
}));

describe('searchContent with Algolia', () => {
  beforeEach(() => {
    SearchService.reset();
    vi.clearAllMocks();

    // Default mock implementation
    mocks.mockSearch.mockResolvedValue({ hits: [] });

    // We need to set env vars for the test
    vi.stubEnv('VITE_ALGOLIA_APP_ID', 'test-app-id');
    vi.stubEnv('VITE_ALGOLIA_SEARCH_KEY', 'test-search-key');
  });

  it('performs search and maps results', async () => {
    const mockHits = [
      {
        objectID: 'blog1',
        type: 'blog',
        title: 'Recycling Guide',
        description: 'How to recycle properly',
        category: 'Sustainability',
        tags: ['eco', 'green'],
        url: '/blog/recycling-guide',
        publishedAt: new Date('2023-01-01').getTime(),
      }
    ];

    mocks.mockSearch.mockResolvedValueOnce({ hits: mockHits });

    const results = await searchContent('recycing');

    expect(mocks.mockAlgoliasearch).toHaveBeenCalledWith('test-app-id', 'test-search-key');
    expect(mocks.mockInitIndex).toHaveBeenCalledWith('dev_content');
    expect(mocks.mockSearch).toHaveBeenCalledWith('recycing', { hitsPerPage: 100 });

    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Recycling Guide');
    expect(results[0].publishedAt).toBeInstanceOf(Date);
    expect(results[0].publishedAt.getTime()).toBe(mockHits[0].publishedAt);
  });

  it('filters by content type', async () => {
    const mockHits = [
      {
        objectID: 'blog1',
        type: 'blog',
        title: 'Blog 1',
        publishedAt: 1000
      },
      {
        objectID: 'video1',
        type: 'video',
        title: 'Video 1',
        publishedAt: 2000
      }
    ];

    mocks.mockSearch.mockResolvedValueOnce({ hits: mockHits });

    const results = await searchContent('something', 'blog');

    expect(results.length).toBe(1);
    expect(results[0].type).toBe('blog');
  });

  it('handles errors gracefully', async () => {
    mocks.mockSearch.mockRejectedValueOnce(new Error('Algolia error'));

    const results = await searchContent('error');

    expect(results).toEqual([]);
  });
});
