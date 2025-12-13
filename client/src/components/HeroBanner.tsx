import React, { useEffect, useRef } from 'react';
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
  return (
    <div className="flex flex-col items-center justify-center py-24 bg-[oklch(0.98_0.008_60)] min-h-[65vh]">
      {/* Icons Row - Replaced Material Symbols with Lucide icons to avoid font issues */}
      {/* Icons around the title (surrounding, not overlapping) */}
      <div className="relative w-full max-w-4xl mb-12">
        {/* Title moved below; removing this duplicate to avoid overlap */}

        {/* Positioned icon orbs (pointer-events none to avoid hover overlap) */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-10 pointer-events-none z-0" ref={rowRef}>
          <div className="relative w-[720px] h-[0px]">
            {/* Hanger - top left */}
            <div className="absolute -top-24 -left-64 w-16 h-16 rounded-full shadow-lg flex items-center justify-center overflow-hidden"
              style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.7))', animation: 'orb-float 6s ease-in-out infinite, micro-shimmer 10s ease-in-out infinite' }}>
              <span className="material-symbols-outlined material-fill-1 material-weight-700 text-[oklch(0.62_0.12_50)]" style={{ fontSize: 30 }}>checkroom</span>
            </div>
            {/* Perfume - top right */}
            <div className="absolute -top-28 -right-64 w-16 h-16 rounded-full shadow-lg flex items-center justify-center overflow-hidden"
              style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.7))', animation: 'orb-float 7s ease-in-out infinite, micro-shimmer 11s ease-in-out infinite' }}>
              <span className="material-symbols-outlined text-[oklch(0.7_0.12_70)]" style={{ fontSize: 30 }}>fragrance</span>
            </div>
            {/* Shirt - mid left */}
            <div className="absolute top-4 -left-44 w-14 h-14 rounded-full shadow-md flex items-center justify-center overflow-hidden"
              style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.7))', animation: 'orb-float 5.5s ease-in-out infinite, micro-shimmer 9s ease-in-out infinite' }}>
              <span className="material-symbols-outlined material-fill-1 material-weight-700 text-[oklch(0.58_0.10_40)]" style={{ fontSize: 26 }}>apparel</span>
            </div>
            {/* Camera - mid right */}
            <div className="absolute top-8 -right-44 w-14 h-14 rounded-full shadow-md flex items-center justify-center overflow-hidden"
              style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.7))', animation: 'orb-float 6.5s ease-in-out infinite, micro-shimmer 12s ease-in-out infinite' }}>
              <span className="material-symbols-outlined text-[oklch(0.62_0.12_50)]" style={{ fontSize: 26 }}>photo_camera</span>
            </div>
            {/* Airplane - bottom center */}
            <div className="absolute top-40 left-[68%] -translate-x-1/2 w-18 h-18 rounded-full shadow-lg flex items-center justify-center overflow-hidden"
              style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.7))', animation: 'orb-float 7.5s ease-in-out infinite, micro-shimmer 13s ease-in-out infinite' }}>
              <span className="material-symbols-outlined material-fill-1 material-weight-700 text-[oklch(0.62_0.12_60)]" style={{ fontSize: 32 }}>travel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Title (single render, forced to front) */}
      <h1
        className="text-6xl md:text-8xl font-bold mb-2 font-happy-monkey text-center mx-auto relative z-50"
        style={{
          background: 'linear-gradient(90deg, oklch(0.55 0.15 25) 0%, oklch(0.72 0.09 80) 50%, oklch(0.55 0.15 25) 100%)',
          backgroundSize: '200% 200%',
          animation: 'title-shimmer 6s linear infinite',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          display: 'inline-block',
          textShadow: '0 6px 18px rgba(0,0,0,0.08)'
        }}
      >
        SimplySoph
      </h1>

      {/* Tagline (closer spacing under title) */}
      <p
        className="text-base md:text-lg font-open-sans uppercase tracking-[0.45em] text-[oklch(0.20_0.01_280)] mt-12"
        style={{ letterSpacing: '0.45em' }}
      >
        FASHION & STYLE CREATOR
      </p>

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