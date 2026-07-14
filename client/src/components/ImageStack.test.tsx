import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ImageStack from './ImageStack';
import * as content from '@/lib/content';

// Mock the content library
vi.mock('@/lib/content', () => ({
  fetchRecentPhotos: vi.fn(),
}));

describe('ImageStack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the branded fallback card when no photos are loaded', async () => {
    (content.fetchRecentPhotos as any).mockResolvedValue([]);
    render(<ImageStack />);

    // The hero column must never be empty: a decorative placeholder card
    // (marked aria-hidden) renders until photos exist.
    await waitFor(() => {
      expect(screen.getByText('First drop coming soon')).toBeTruthy();
    });
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('fetches recent photos and renders images (single query optimization)', async () => {
    // Mock data
    const mockPhotos = [
      { id: 'p1', imageUrl: 'url1.jpg', albumId: 'album1' },
      { id: 'p2', imageUrl: 'url2.jpg', albumId: 'album1' },
      { id: 'p3', imageUrl: 'url3.jpg', albumId: 'album2' },
    ];

    (content.fetchRecentPhotos as any).mockResolvedValue(mockPhotos);

    render(<ImageStack count={6} />);

    // Check if fetchRecentPhotos was called (Optimization: Single Query)
    await waitFor(() => {
        expect(content.fetchRecentPhotos).toHaveBeenCalledWith(20);
    });

    // Verify that an image is rendered
    await waitFor(() => {
      const img = document.querySelector('img');
      expect(img).not.toBeNull();
      if (img) {
          const src = img.getAttribute('src');
          expect(['url1.jpg', 'url2.jpg', 'url3.jpg']).toContain(src);
      }
    });
  });
});
