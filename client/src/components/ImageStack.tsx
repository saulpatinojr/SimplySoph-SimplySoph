import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchRecentPhotos, type Photo } from '@/lib/content';

type ImageStackProps = {
  count?: number; // how many photos to cycle through
  intervalMs?: number; // how long each photo stays on top
  className?: string;
};

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function ImageStack({ count = 6, intervalMs = 3000, className = '' }: ImageStackProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // Bolt Optimization: Replace N+1 query pattern (fetching albums then photos for each)
        // with a single query for recent photos
        const recentPhotos = await fetchRecentPhotos(20);
        if (!recentPhotos.length) return;

        const shuffled = shuffle(recentPhotos).slice(0, Math.min(recentPhotos.length, count));
        if (mounted) setPhotos(shuffled);
      } catch (err) {
        console.warn('[ImageStack] failed to load photos', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [count]);

  useEffect(() => {
    if (!photos.length) return;
    const t = setInterval(() => {
      setIndex(i => (i + 1) % photos.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [photos, intervalMs]);

  if (!photos.length) {
    // No photos yet — don't render a placeholder box (the page already displays an iframe/alternate source)
    return null;
  }

  return (
    <div className={`relative w-full max-w-md mx-auto ${className}`} style={{ aspectRatio: '16/10' }}>
      {photos.map((p, i) => {
        const isTop = i === index;
        const key = p.id;
        return (
          <AnimatePresence mode="wait" key={key}>
            {isTop && (
              <motion.img
                src={p.imageUrls?.large || p.imageUrl}
                alt={p.caption || ''}
                initial={{ opacity: 0, scale: 1.02, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -6 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-2xl border border-white/10"
              />
            )}
          </AnimatePresence>
        );
      })}

      {/* small decorative overlay to show stacking */}
      <div className="absolute inset-0 pointer-events-none rounded-lg" style={{ boxShadow: 'inset 0 -24px 40px -24px rgba(0,0,0,0.18)' }} />
    </div>
  );
}
