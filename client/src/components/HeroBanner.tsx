import React, { useEffect, useRef } from 'react';
import ImageStack from '@/components/ImageStack';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useLocation } from 'wouter';
// Using Material Symbols (loaded in client/index.html)

const HeroBanner: React.FC = () => {
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      const y = window.scrollY || 0;
      // subtle parallax: translate row by a small fraction of scroll
      el.style.transform = `translateY(${Math.min(8, y * 0.05)}px)`;
    };
    const loop = () => {
      onScroll();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const [, navigate] = useLocation();

  // Continuous random-wander for icon orbs — no resets, increased speed by ~15%
  useEffect(() => {
    const root = rowRef.current;
    if (!root) return;
    const orbEls = Array.from(root.querySelectorAll<HTMLElement>('.orb-btn'));
    if (!orbEls.length) return;

    // Get title boundaries for constraining icon movement
    const titleEl = document.querySelector('h1');
    const titleRect = titleEl ? titleEl.getBoundingClientRect() : { left: 0, right: 400, width: 400, top: 0, bottom: 50, height: 50 };
    const parentRect = root.getBoundingClientRect();
    const titleLeftEdge = titleRect.left - parentRect.left - parentRect.width / 2;
    const titleRightEdge = titleRect.right - parentRect.left - parentRect.width / 2;
    const leftZoneCenter = titleLeftEdge - 15;
    const rightZoneCenter = titleRightEdge + 15;
    
    // Vertical bounds: 3px above and below title
    const titleTopEdge = titleRect.top - parentRect.top - parentRect.height / 2;
    const titleBottomEdge = titleRect.bottom - parentRect.top - parentRect.height / 2;
    const topBound = titleTopEdge - 3;
    const bottomBound = titleBottomEdge + 3;
    const verticalCenter = (topBound + bottomBound) / 2;
    const verticalHeight = bottomBound - topBound;
    
    console.log('Title boundaries:', {
      titleLeftEdge,
      titleRightEdge,
      leftZoneCenter,
      rightZoneCenter,
      titleWidth: titleRect.width,
      topBound,
      bottomBound,
      verticalCenter,
      verticalHeight
    });

    // Create per-orb motion parameters for unscripted, natural movement
    const nowBase = performance.now();
    const orbsState = orbEls.map((el) => {
      const rect = el.getBoundingClientRect();
      const baseX = rect.left + rect.width / 2 - (parentRect.left + parentRect.width / 2);
      const baseY = rect.top + rect.height / 2 - (parentRect.top + parentRect.height / 2);
      
      // All icons roam across the full area from leftZoneCenter to rightZoneCenter
      const fullWidth = rightZoneCenter - leftZoneCenter;
      const centerX = (leftZoneCenter + rightZoneCenter) / 2;
      
      return {
        el,
        baseX: centerX,
        baseY: verticalCenter,
        ampX: fullWidth / 2, // roam across the full width
        ampY: verticalHeight / 2, // roam from 3px above to 3px below title
        freqX: (0.0009 + Math.random() * 0.0016) * 0.8 * 0.7, // 20% + 30% slower = 44% slower total
        freqY: (0.0008 + Math.random() * 0.0014) * 0.8 * 0.7, // 20% + 30% slower = 44% slower total
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        jitter: 1.2 + Math.random() * 2.2, // jitter intensity larger
      };
    });

    let raf = 0;
    const tick = () => {
      const t = performance.now() - nowBase;
      for (const s of orbsState) {
        // combine smooth sine motion with tiny random noise for organic feeling
        const x = s.baseX + Math.sin(t * s.freqX + s.phaseX) * s.ampX + (Math.random() - 0.5) * s.jitter;
        const y = s.baseY + Math.sin(t * s.freqY + s.phaseY) * s.ampY + (Math.random() - 0.5) * s.jitter * 0.7;

        // apply transform (preserve 3d for subtle parallax)
        s.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-24 bg-[oklch(0.98_0.008_60)] min-h-[65vh]">
      {/* Icons Row - Replaced Material Symbols with Lucide icons to avoid font issues */}
      {/* Icons around the title (surrounding, not overlapping) */}
      <div className="relative w-full max-w-4xl mb-12">
        {/* Title moved below; removing this duplicate to avoid overlap */}

        {/* Positioned icon orbs (pointer-events none to avoid hover overlap) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none z-0" ref={rowRef}>
            <div className="relative w-96 h-32 overflow-visible">
            {/* Hanger - top left */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => navigate('/photos')} aria-label="Hanger" className="orb-btn absolute top-0 -left-23 w-14 h-14 rounded-full shadow-lg flex items-center justify-center overflow-visible z-10 bg-transparent focus:outline-none" style={{ pointerEvents: 'auto' }}>
                  <div className="orb w-full h-full rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.7))', opacity: 0.45 }}>
                    <span className="material-symbols-outlined material-fill-1 material-weight-700 text-[oklch(0.62_0.12_50)]" style={{ fontSize: 20 }}>checkroom</span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>Gallery</TooltipContent>
            </Tooltip>
            {/* Perfume - top right */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => navigate('/contact')} aria-label="Perfume" className="orb-btn absolute -top-4 -right-23 w-14 h-14 rounded-full shadow-lg flex items-center justify-center overflow-visible z-10 bg-transparent focus:outline-none" style={{ pointerEvents: 'auto' }}>
                  <div className="orb w-full h-full rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.7))', opacity: 0.45 }}>
                    <span className="material-symbols-outlined text-[oklch(0.7_0.12_70)]" style={{ fontSize: 20 }}>fragrance</span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>Contact / Shop</TooltipContent>
            </Tooltip>
            {/* Shirt - mid left */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => navigate('/photos?tag=apparel')} aria-label="Shirt" className="orb-btn absolute top-13 -left-27 w-12 h-12 rounded-full shadow-md flex items-center justify-center overflow-visible z-10 bg-transparent focus:outline-none" style={{ pointerEvents: 'auto' }}>
                  <div className="orb w-full h-full rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.7))', opacity: 0.45 }}>
                    <span className="material-symbols-outlined material-fill-1 material-weight-700 text-[oklch(0.58_0.10_40)]" style={{ fontSize: 18 }}>apparel</span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>Apparel</TooltipContent>
            </Tooltip>
            {/* Camera - mid right */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => navigate('/photos')} aria-label="Camera" className="orb-btn absolute top-10 -right-26 w-12 h-12 rounded-full shadow-md flex items-center justify-center overflow-visible z-10 bg-transparent focus:outline-none" style={{ pointerEvents: 'auto' }}>
                  <div className="orb w-full h-full rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.7))', opacity: 0.45 }}>
                    <span className="material-symbols-outlined text-[oklch(0.62_0.12_50)]" style={{ fontSize: 18 }}>photo_camera</span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>Photos</TooltipContent>
            </Tooltip>
            {/* Airplane - bottom right */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => navigate('/about')} aria-label="Travel" className="orb-btn absolute top-24 -right-19 w-14 h-14 rounded-full shadow-lg flex items-center justify-center overflow-visible z-10 bg-transparent focus:outline-none" style={{ pointerEvents: 'auto' }}>
                  <div className="orb w-full h-full rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.7))', opacity: 0.45 }}>
                    <span className="material-symbols-outlined material-fill-1 material-weight-700 text-[oklch(0.62_0.12_60)]" style={{ fontSize: 19 }}>travel</span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>About</TooltipContent>
            </Tooltip>
            {/* Heart - center */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => navigate('/blog')} aria-label="Heart" className="orb-btn absolute top-16 left-0 w-13 h-13 rounded-full shadow-lg flex items-center justify-center overflow-visible z-10 bg-transparent focus:outline-none" style={{ pointerEvents: 'auto' }}>
                  <div className="orb w-full h-full rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.7))', opacity: 0.45 }}>
                    <span className="material-symbols-outlined material-fill-1 material-weight-700 text-[oklch(0.65_0.14_10)]" style={{ fontSize: 19 }}>favorite</span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>Blog</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Title + Tagline wrapper to reserve descender space and ensure top stacking */}
      <div className="relative z-60 pb-3"> 
        <h1
          className="text-6xl md:text-8xl font-bold mb-2 font-happy-monkey text-center mx-auto relative z-50 block"
          style={{
            background: 'linear-gradient(90deg, oklch(0.55 0.15 25) 0%, oklch(0.72 0.09 80) 50%, oklch(0.55 0.15 25) 100%)',
            backgroundSize: '200% 200%',
            animation: 'title-shimmer 6s linear infinite',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 6px 18px rgba(0,0,0,0.08)',
            lineHeight: 1.4
          }}
        >
          SimplySoph
        </h1>

        {/* Tagline (closer spacing under title) */}
        <p
          className="text-base md:text-lg font-open-sans uppercase tracking-[0.45em] text-[oklch(0.20_0.01_280)] mt-6 block relative z-40 text-center"
          style={{ letterSpacing: '0.45em' }}
        >
          FASHION & STYLE CREATOR
        </p>
      </div>

      {/* Center image stack (random images from albums).
          This block is the ImageStack component: it shows an animated stack of random images from the photo albums.
          The pale rounded rectangle you circled is the ImageStack viewport / placeholder where images appear. */}
      <div className="mt-8 w-full flex justify-center">
        <div className="relative">
          <ImageStack count={6} intervalMs={3500} />
        </div>
      </div>

      {/* Decorative Swoosh with slight shimmer (restored) */}
      <div className="mt-6">
        <svg
          width="300"
          height="20"
          viewBox="0 0 300 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 10 Q75 5 150 10 Q225 15 290 10"
            stroke="#D95E6F"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
};

export default HeroBanner;