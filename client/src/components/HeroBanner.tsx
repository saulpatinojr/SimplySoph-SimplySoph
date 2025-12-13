import React from 'react';

const HeroBanner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-[oklch(0.98_0.008_60)] min-h-[60vh]">
      {/* Icons Row - a set of matching-style icons */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center shadow-md">
          {/* Hanger (reference artwork) */}
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 11c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#D95E6F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.5 11.5h13s-2.5 4-6.5 4-6.5-4-6.5-4z" stroke="#D95E6F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center shadow-md">
          {/* Perfume Bottle */}
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="7" y="6" width="10" height="9" rx="2" stroke="#D95E6F" strokeWidth="1.6" />
            <path d="M10 4h4v2h-4z" fill="#D95E6F" opacity="0.12" />
            <circle cx="12" cy="10.5" r="0.8" fill="#D95E6F" />
          </svg>
        </div>

        <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center shadow-md">
          {/* Shirt icon */}
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 7l3 1 1-2h6l1.5 2 3-1v8s-3 2-7 2-7-2-7-2V7z" stroke="#D95E6F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center shadow-md">
          {/* Camera icon */}
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="6" width="18" height="12" rx="2" stroke="#D95E6F" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="3" stroke="#D95E6F" strokeWidth="1.6" />
            <path d="M7 6l1.5-2h7L17 6" stroke="#D95E6F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Main Title */}
      <h1
        className="text-6xl md:text-8xl font-bold mb-2 font-happy-monkey"
        style={{
          background: 'linear-gradient(135deg, oklch(0.55 0.15 25) 0%, oklch(0.75 0.08 80) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 2px 4px rgba(0,0,0,0.08)'
        }}
      >
        SimplySoph
      </h1>

      {/* Tagline - add margin-top to avoid running over title */}
      <p
        className="text-base md:text-lg font-open-sans uppercase tracking-[0.45em] text-[oklch(0.20_0.01_280)] mt-6 z-10"
        style={{ letterSpacing: '0.45em' }}
      >
        FASHION & STYLE CREATOR
      </p>

      {/* Decorative Swoosh */}
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