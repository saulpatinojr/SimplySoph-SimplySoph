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
    // No photos published yet — render a branded editorial card so the
    // hero column (and the category chips positioned around it) never
    // floats around empty space.
    return (
      <div
        className={`relative w-full max-w-md mx-auto overflow-hidden rounded-lg shadow-2xl ${className}`}
        style={{
          aspectRatio: '16/10',
          background: `
            radial-gradient(ellipse 130% 100% at 10% 0%, oklch(0.58 0.21 22 / 0.9) 0%, transparent 60%),
            radial-gradient(ellipse 110% 90% at 95% 100%, oklch(0.76 0.09 78 / 0.85) 0%, transparent 55%),
            linear-gradient(150deg, oklch(0.42 0.19 22) 0%, oklch(0.30 0.14 15) 100%)
          `,
        }}
        aria-hidden="true"
      >
        {/* Diagonal texture stripes for editorial texture */}
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 14px)',
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span
            className="font-display font-semibold"
            style={{
              fontSize: 'clamp(3rem, 2.4rem + 2.4vw, 4.75rem)',
              letterSpacing: '-0.02em',
              color: 'oklch(0.76 0.09 78)',
              textShadow: '0 2px 24px oklch(0 0 0 / 0.35)',
            }}
          >
            S.
          </span>
          <span
            className="font-sans uppercase font-semibold"
            style={{ fontSize: '0.68rem', letterSpacing: '0.32em', color: 'oklch(0.98 0.01 55 / 0.90)' }}
          >
            First drop coming soon
          </span>
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 -32px 48px -24px rgba(0,0,0,0.35)' }} />
      </div>
    );
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
