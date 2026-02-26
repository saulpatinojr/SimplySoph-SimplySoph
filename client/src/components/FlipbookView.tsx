import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Photo } from '@/lib/content';

type FlipbookViewProps = {
  photos: Photo[];
  photosPerSide?: number;
};

export default function FlipbookView({ photos, photosPerSide = 3 }: FlipbookViewProps) {
  const photosPerSpread = photosPerSide * 2;
  const totalSpreads = Math.max(1, Math.ceil(photos.length / photosPerSpread));
  const [spreadIndex, setSpreadIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentSpread = useMemo(() => {
    const start = spreadIndex * photosPerSpread;
    return photos.slice(start, start + photosPerSpread);
  }, [photos, spreadIndex, photosPerSpread]);

  const leftPhotos = currentSpread.slice(0, photosPerSide);
  const rightPhotos = currentSpread.slice(photosPerSide, photosPerSide * 2);

  const canNext = spreadIndex < totalSpreads - 1;
  const canPrev = spreadIndex > 0;

  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const goNext = () => {
    if (!canNext) return;
    setFlipDirection('next');
    setSpreadIndex((s) => Math.min(totalSpreads - 1, s + 1));
  };
  const goPrev = () => {
    if (!canPrev) return;
    setFlipDirection('prev');
    setSpreadIndex((s) => Math.max(0, s - 1));
  };

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [totalSpreads]);

  // Swipe navigation for touch devices
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startX = 0;
    let dx = 0;
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };
    const onTouchMove = (e: TouchEvent) => {
      dx = e.touches[0].clientX - startX;
    };
    const onTouchEnd = () => {
      if (dx < -40) goNext();
      if (dx > 40) goPrev();
      dx = 0;
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [containerRef.current]);

  const variants = {
    enter: (dir: 'next' | 'prev') => ({
      x: dir === 'next' ? 48 : -48,
      rotateY: dir === 'next' ? 6 : -6,
      opacity: 0,
      scale: 0.995,
    }),
    center: { x: 0, rotateY: 0, opacity: 1, scale: 1, transition: { duration: 0.36 } },
    exit: (dir: 'next' | 'prev') => ({
      x: dir === 'next' ? -48 : 48,
      rotateY: dir === 'next' ? -6 : 6,
      opacity: 0,
      scale: 0.995,
      transition: { duration: 0.36 },
    }),
  };

  return (
    <div ref={containerRef} className="flipbook max-w-5xl mx-auto">
      <AnimatePresence mode="wait" custom={flipDirection} initial={false}>
        <motion.div
          key={spreadIndex}
          custom={flipDirection}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <div className="flex gap-6 items-start justify-center">
            <div className="page left-page relative w-1/2 bg-white/90 rounded-lg shadow-2xl overflow-hidden border border-white/20">
              <div className="p-4 grid grid-cols-1 gap-3">
                {leftPhotos.map((p) => (
                  <div key={p.id} className="h-36 overflow-hidden rounded image-wrap">
                    <img src={p.imageUrls?.large || p.imageUrl} alt={p.caption || ''} className="w-full h-full object-cover image-content" loading="lazy" />
                  </div>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.06, rotate: -4 }}
                whileTap={{ scale: 0.98, rotate: -2 }}
                aria-label="Previous page"
                onClick={goPrev}
                disabled={!canPrev}
                className="fold-corner left-corner absolute left-2 bottom-2 w-14 h-14 flex items-center justify-center rounded-lg bg-white/95 text-primary shadow-lg transition-transform disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/60"
                style={{ touchAction: 'manipulation' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <defs>
                    <linearGradient id="foldGradL" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(0,0,0,0.06)" />
                      <stop offset="100%" stopColor="rgba(0,0,0,0.02)" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="24" height="24" rx="6" fill="url(#foldGradL)" opacity="0.04" />
                  <path d="M14 12L8 6M14 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            </div>

            <div className="page right-page relative w-1/2 bg-white/90 rounded-lg shadow-2xl overflow-hidden border border-white/20">
              <div className="p-4 grid grid-cols-1 gap-3">
                {rightPhotos.map((p) => (
                  <div key={p.id} className="h-36 overflow-hidden rounded image-wrap">
                    <img src={p.imageUrls?.large || p.imageUrl} alt={p.caption || ''} className="w-full h-full object-cover image-content" loading="lazy" />
                  </div>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.06, rotate: 4 }}
                whileTap={{ scale: 0.98, rotate: 2 }}
                aria-label="Next page"
                onClick={goNext}
                disabled={!canNext}
                className="fold-corner right-corner absolute right-2 bottom-2 w-14 h-14 flex items-center justify-center rounded-lg bg-white/95 text-primary shadow-lg transition-transform disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/60"
                style={{ touchAction: 'manipulation' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <defs>
                    <linearGradient id="foldGradR" x1="1" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(0,0,0,0.06)" />
                      <stop offset="100%" stopColor="rgba(0,0,0,0.02)" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width="24" height="24" rx="6" fill="url(#foldGradR)" opacity="0.04" />
                  <path d="M10 12L16 6M10 12L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Page {spreadIndex + 1} of {totalSpreads}
          </div>
        </motion.div>
      </AnimatePresence>

      <style>{`
        .fold-corner { box-shadow: 0 8px 22px rgba(0,0,0,0.10); backdrop-filter: blur(6px); z-index:60; }
        .page { will-change: transform, opacity; position: relative; }
        .image-wrap { position: relative; z-index: 0; }
        .image-content { position: relative; z-index: 0; display: block; }
        .left-page:focus-within .fold-corner, .right-page:focus-within .fold-corner { transform: translateY(-2px); }
      `}</style>
    </div>
  );
}
