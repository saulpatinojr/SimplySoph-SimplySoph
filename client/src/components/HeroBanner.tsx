import React from 'react';

const HeroBanner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-[oklch(0.98_0.008_60)] min-h-[60vh]">
      {/* Icons Row - Material Icons */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined">checkroom</span>
        </div>

        <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined">fragrance</span>
        </div>

        <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined">apparel</span>
        </div>

        <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined">photo_camera</span>
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