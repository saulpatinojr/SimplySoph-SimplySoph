import React, { useEffect, useRef, useState } from 'react';
import ImageStack from '@/components/ImageStack';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { FEATURED_TAGLINES } from '@/const';

// Category pills that marquee across the bottom of the hero
const CATEGORY_PILLS = [
  'Style Diaries', 'Outfit Inspo', 'Beauty Finds', 'Travel Logs',
  'Fashion Week', 'Get Ready With Me', 'Trend Reports', 'Creative Direction',
];

const HeroBanner: React.FC = () => {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [mounted, setMounted]           = useState(false);
  const marqueeRef = useRef<HTMLDivElement>(null);

  // Staggered entrance
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Tagline rotation every 4.5 s
  useEffect(() => {
    const id = window.setInterval(() => {
      setTaglineIndex(prev => (prev + 1) % FEATURED_TAGLINES.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  // Pause marquee on hover
  const pauseMarquee  = () => { if (marqueeRef.current) marqueeRef.current.style.animationPlayState = 'paused'; };
  const resumeMarquee = () => { if (marqueeRef.current) marqueeRef.current.style.animationPlayState = 'running'; };

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'var(--background)' }}
      aria-label="Hero"
    >
      {/* ── Background glows ────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 50% -5%,
              oklch(0.50 0.20 22 / 0.14) 0%, transparent 65%),
            radial-gradient(ellipse 55% 40% at 85% 65%,
              oklch(0.76 0.09 78 / 0.16) 0%, transparent 60%)
          `,
        }}
      />

      {/* ── Fine-grain paper texture ────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.022]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      <div className="container">
        {/* ── Two-column asymmetric layout ─────────────────── */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 xl:gap-16 items-center py-12 md:py-16"
        >
          {/* ── Left: editorial copy ─────────────────────── */}
          <div
            className="flex flex-col gap-6"
            style={{
              opacity:   mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 600ms 60ms cubic-bezier(0.16,1,0.3,1), transform 600ms 60ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block', width: '28px', height: '1.5px',
                  background: 'var(--primary)', borderRadius: '9999px', opacity: 0.7,
                }}
              />
              <span
                className="font-sans font-semibold uppercase"
                style={{ fontSize: '0.7rem', letterSpacing: '0.26em', color: 'var(--primary)' }}
              >
                Fashion &amp; Style Creator
              </span>
            </div>

            {/* Wordmark */}
            <h1
              className="font-cause leading-none"
              style={{
                fontSize: 'clamp(3.8rem, 2rem + 6.5vw, 8rem)',
                letterSpacing: '-0.03em',
                color: 'var(--foreground)',
              }}
            >
              Simply
              <span className="block w-fit gradient-text" style={{ fontStyle: 'normal' }}>
                Soph
              </span>
            </h1>

            {/* Decorative swoosh under wordmark */}
            <div aria-hidden="true" className="-mt-3">
              <svg width="200" height="14" viewBox="0 0 200 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 7 Q50 2 100 7 Q150 12 196 7"
                  stroke="oklch(0.50 0.20 22)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.45"
                />
              </svg>
            </div>

            {/* Rotating tagline */}
            <div className="relative h-6 overflow-hidden" aria-live="polite" aria-atomic="true">
              <p
                key={taglineIndex}
                className="absolute inset-0 font-sans italic"
                style={{
                  fontSize: 'clamp(0.85rem, 0.78rem + 0.35vw, 0.975rem)',
                  color: 'oklch(from var(--foreground) l c h / 0.50)',
                  animation: 'fade-up 380ms cubic-bezier(0.16,1,0.3,1) both',
                }}
              >
                {FEATURED_TAGLINES[taglineIndex]}
              </p>
            </div>

            {/* Pillar stats row */}
            <div className="flex gap-8">
              {[
                { value: 'Style',    label: 'Diaries'   },
                { value: 'Fashion',  label: 'Stories'   },
                { value: 'Creative', label: 'Community' },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col gap-0.5">
                  <span
                    className="font-display font-semibold"
                    style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)', letterSpacing: '-0.01em', color: 'var(--foreground)' }}
                  >
                    {stat.value}
                  </span>
                  <span
                    className="font-sans uppercase"
                    style={{ fontSize: '0.68rem', letterSpacing: '0.15em', color: 'oklch(from var(--foreground) l c h / 0.40)' }}
                  >
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/blog">
                <a className="btn-primary inline-flex items-center gap-2">
                  Read the stories
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
              </Link>
              <Link href="/photos">
                <a
                  className="group flex items-center gap-2 font-sans font-medium transition-colors"
                  style={{ fontSize: '0.875rem', color: 'oklch(from var(--foreground) l c h / 0.58)' }}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full border transition-all group-hover:bg-primary/8 group-hover:border-primary/40"
                    style={{ borderColor: 'oklch(from var(--border) l c h / 0.70)' }}
                  >
                    <Sparkles size={12} aria-hidden="true" />
                  </span>
                  View gallery
                </a>
              </Link>
            </div>
          </div>

          {/* ── Right: ImageStack — enlarged, no orbs ────── */}
          <div
            className="relative flex items-center justify-center"
            style={{
              opacity:   mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(14px)',
              transition: 'opacity 700ms 180ms cubic-bezier(0.16,1,0.3,1), transform 700ms 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {/* Soft glow halo */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-[-10%] -z-10 rounded-[3rem] blur-3xl"
              style={{
                background: 'radial-gradient(ellipse 80% 70% at 50% 55%, oklch(0.50 0.20 22 / 0.09) 0%, transparent 70%)',
              }}
            />

            {/* Category chips — static, stacked on image corners */}
            <div aria-hidden="true" className="pointer-events-none absolute -top-3 -left-3 z-20">
              <span className="hero-chip" style={{ background: 'oklch(0.50 0.20 22 / 0.92)', color: '#fff' }}>
                Style
              </span>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-3 -right-3 z-20">
              <span className="hero-chip" style={{ background: 'oklch(0.76 0.09 78 / 0.92)', color: 'oklch(0.22 0.03 70)' }}>
                Fashion
              </span>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute top-1/2 -right-5 z-20 -translate-y-1/2">
              <span className="hero-chip" style={{ background: 'oklch(0.96 0.010 50 / 0.95)', color: 'oklch(0.30 0.01 40)', border: '1px solid oklch(0 0 0 / 0.07)' }}>
                Beauty
              </span>
            </div>

            {/* Image stack */}
            <div className="relative z-10 w-full max-w-[460px] xl:max-w-[520px]">
              <ImageStack />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom-of-hero category marquee strip ────────── */}
      <div
        className="relative w-full overflow-hidden border-t border-b"
        style={{
          borderColor: 'oklch(from var(--border) l c h / 0.50)',
          background: 'oklch(from var(--surface-1, var(--card)) l c h / 0.60)',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={pauseMarquee}
        onMouseLeave={resumeMarquee}
        aria-hidden="true"
      >
        <div
          ref={marqueeRef}
          className="marquee-track flex gap-0 whitespace-nowrap py-3"
        >
          {/* Duplicate pills for seamless loop */}
          {[...CATEGORY_PILLS, ...CATEGORY_PILLS].map((pill, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-5 font-sans"
              style={{ fontSize: '0.72rem', letterSpacing: '0.18em', color: 'oklch(from var(--foreground) l c h / 0.45)', textTransform: 'uppercase' }}
            >
              {pill}
              <span style={{ color: 'var(--primary)', opacity: 0.5, fontSize: '0.55rem' }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-20"
        style={{ background: 'linear-gradient(to bottom, transparent 0%, var(--background) 100%)' }}
      />
    </section>
  );
};

export default HeroBanner;
