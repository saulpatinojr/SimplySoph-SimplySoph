import React from 'react';

const HeroBanner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-[oklch(0.98_0.008_60)] min-h-[60vh]">
      {/* Icons Row */}
      <div className="flex items-center gap-6 mb-8">
        {/* Hanger Icon */}
        <div className="glossy-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transform -rotate-12"
          >
            <path
              d="M12 2C13.1046 2 14 2.89543 14 4V6H16C17.1046 6 18 6.89543 18 8V10C18 11.1046 17.1046 12 16 12H14V20C14 21.1046 13.1046 22 12 22C10.8954 22 10 21.1046 10 20V12H8C6.89543 12 6 11.1046 6 10V8C6 6.89543 6.89543 6 8 6H10V4C10 2.89543 10.8954 2 12 2Z"
              fill="oklch(0.55 0.15 25)"
            />
          </svg>
        </div>

        {/* Lipstick Icon */}
        <div className="glossy-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transform rotate-12"
          >
            <path
              d="M8 2C6.89543 2 6 2.89543 6 4V8C6 9.10457 6.89543 10 8 10H10V18C10 19.1046 10.8954 20 12 20C13.1046 20 14 19.1046 14 18V10H16C17.1046 10 18 9.10457 18 8V4C18 2.89543 17.1046 2 16 2H8Z"
              fill="oklch(0.55 0.15 25)"
            />
            <path
              d="M9 4H15V6H9V4Z"
              fill="oklch(0.75 0.08 80)"
            />
          </svg>
        </div>
      </div>

      {/* Main Title */}
      <h1
        className="text-6xl md:text-8xl font-bold mb-4 font-happy-monkey"
        style={{
          background: 'linear-gradient(135deg, oklch(0.55 0.15 25) 0%, oklch(0.75 0.08 80) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        SimplySoph
      </h1>

      {/* Tagline */}
      <p
        className="text-lg md:text-xl font-open-sans uppercase tracking-[0.5em] text-[oklch(0.20_0.01_280)]"
        style={{ letterSpacing: '0.5em' }}
      >
        FASHION & STYLE CREATOR
      </p>

      {/* Decorative Swoosh */}
      <div className="mt-8">
        <svg
          width="300"
          height="20"
          viewBox="0 0 300 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 10 Q75 5 150 10 Q225 15 290 10"
            stroke="oklch(0.55 0.15 25)"
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