import React, { useEffect, useRef, useState } from 'react';
import ImageStack from '@/components/ImageStack';
import { ArrowRight, Sparkles, Shirt, HeartHandshake } from 'lucide-react';
import { Link } from 'wouter';
import { FEATURED_TAGLINES } from '@/const';
import { useSiteConfig } from '@/contexts/SiteConfigContext';

// Pillar rows for the glass panel — same content as the old stats row
const PILLARS = [
  { icon: Sparkles,       title: 'Style',    label: 'Diaries & Moments'   },
  { icon: Shirt,          title: 'Fashion',  label: 'Editorial Stories'   },
  { icon: HeartHandshake, title: 'Creative', label: 'Community Building'  },
];

const HeroBanner: React.FC = () => {
  const { hero } = useSiteConfig();
  const CATEGORY_PILLS = hero.pills ?? [];
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
      {/* ── Dreamy drifting background blobs ─────────────────── */}
      <div
        aria-hidden="true"
        className="soft-drift pointer-events-none absolute -top-32 -left-32 -z-10 h-[480px] w-[480px] rounded-full opacity-50 blur-[90px]"
        style={{ background: 'oklch(from var(--secondary) l c h / 0.85)' }}
      />
      <div
        aria-hidden="true"
        className="soft-drift soft-drift-delay pointer-events-none absolute -bottom-40 -right-32 -z-10 h-[560px] w-[560px] rounded-full opacity-40 blur-[110px]"
        style={{ background: 'oklch(from var(--primary) l c h / 0.35)' }}
      />
      <div
        aria-hidden="true"
        className="soft-drift pointer-events-none absolute top-1/3 right-1/4 -z-10 h-[320px] w-[320px] rounded-full opacity-30 blur-[80px]"
        style={{ background: 'oklch(from var(--accent) l c h / 0.45)' }}
      />

      <div className="container">
        {/* ── Two-column asymmetric layout ─────────────────── */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 xl:gap-16 items-center py-14 md:py-20"
        >
          {/* ── Left: editorial copy ─────────────────────── */}
          <div
            className="flex flex-col gap-7"
            style={{
              opacity:   mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 600ms 60ms cubic-bezier(0.16,1,0.3,1), transform 600ms 60ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block', width: '48px', height: '1px',
                  background: 'oklch(from var(--primary) l c h / 0.50)',
                }}
              />
              <span
                className="label-caps"
                style={{ fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--primary)' }}
              >
                {hero.eyebrow}
              </span>
            </div>

            {/* Wordmark — second line italic, light, offset */}
            <h1
              className="font-cause leading-[0.95]"
              style={{
                fontSize: 'clamp(3.5rem, 1.8rem + 6vw, 7rem)',
                letterSpacing: '-0.03em',
                color: 'var(--foreground)',
              }}
            >
              {hero.heading}
              <span
                className="block w-fit italic ml-8 md:ml-20 mt-1"
                style={{ color: 'var(--primary)', fontWeight: 300 }}
              >
                {hero.subheading}
              </span>
            </h1>

            {/* Rotating tagline */}
            <div className="relative h-7 overflow-hidden" aria-live="polite" aria-atomic="true">
              <p
                key={taglineIndex}
                className="absolute inset-0 font-sans font-light tracking-wide"
                style={{
                  fontSize: 'clamp(0.95rem, 0.85rem + 0.4vw, 1.15rem)',
                  color: 'oklch(from var(--foreground) l c h / 0.55)',
                  animation: 'fade-up 380ms cubic-bezier(0.16,1,0.3,1) both',
                }}
              >
                {FEATURED_TAGLINES[taglineIndex]}
              </p>
            </div>

            {/* Pillar glass panel — icon circles + caps sublabels */}
            <div className="glass-panel relative overflow-hidden rounded-[2rem] p-4 md:p-5">
              <div
                aria-hidden="true"
                className="absolute top-0 left-0 h-1 w-full opacity-50"
                style={{
                  background: 'linear-gradient(to right, var(--secondary), var(--primary), var(--secondary))',
                }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2">
                {PILLARS.map(({ icon: Icon, title, label }, i) => (
                  <div
                    key={title}
                    className="flex items-center gap-4 rounded-2xl p-3 transition-colors"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'oklch(from var(--card) l c h / 0.55)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: i === 1
                          ? 'oklch(from var(--primary) l c h / 0.14)'
                          : i === 2
                            ? 'oklch(from var(--accent) l c h / 0.25)'
                            : 'oklch(from var(--secondary) l c h / 0.75)',
                        color: 'var(--primary)',
                      }}
                    >
                      <Icon size={18} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-display font-semibold leading-tight"
                        style={{ fontSize: '1.05rem', color: 'var(--foreground)' }}
                      >
                        {title}
                      </p>
                      <p
                        className="label-caps truncate"
                        style={{ fontSize: '0.58rem', letterSpacing: '0.18em', color: 'var(--muted-foreground)' }}
                      >
                        {label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA row — soft pills */}
            <div className="flex flex-wrap items-center gap-5 pt-1">
              <Link href="/blog">
                <a
                  className="label-caps inline-flex items-center gap-3 rounded-full px-9 py-4 transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    fontSize: '0.68rem',
                    letterSpacing: '0.2em',
                    background: 'var(--foreground)',
                    color: 'var(--background)',
                    boxShadow: '0 10px 40px -10px oklch(from var(--primary) l c h / 0.30)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary-foreground)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--foreground)'; e.currentTarget.style.color = 'var(--background)'; }}
                >
                  Read the stories
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
              </Link>
              <Link href="/photos">
                <a
                  className="label-caps group flex items-center gap-4 transition-colors"
                  style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--muted-foreground)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors group-hover:border-primary"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <Sparkles size={14} aria-hidden="true" />
                  </span>
                  View gallery
                </a>
              </Link>
            </div>
          </div>

          {/* ── Right: ImageStack in soft rounded frame ──── */}
          <div
            className="group relative flex items-center justify-center"
            style={{
              opacity:   mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(14px)',
              transition: 'opacity 700ms 180ms cubic-bezier(0.16,1,0.3,1), transform 700ms 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {/* Floating pill badges */}
            <div aria-hidden="true" className="pointer-events-none absolute -top-4 right-2 md:-right-2 z-20">
              <span
                className="label-caps inline-flex items-center rounded-full border px-5 py-2.5 backdrop-blur-md"
                style={{
                  fontSize: '0.62rem',
                  letterSpacing: '0.2em',
                  background: 'oklch(from var(--card) l c h / 0.80)',
                  borderColor: 'oklch(from var(--card) calc(l + 0.18) c h / 0.8)',
                  color: 'var(--primary)',
                  boxShadow: '0 8px 32px oklch(from var(--primary) l c h / 0.15)',
                }}
              >
                Style
              </span>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-5 left-0 md:-left-4 z-20 -rotate-6">
              <span
                className="inline-flex items-center rounded-full px-7 py-4 font-display italic"
                style={{
                  fontSize: '1rem',
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  boxShadow: '0 8px 32px oklch(from var(--primary) l c h / 0.30)',
                }}
              >
                Fashion, everyday
              </span>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute top-1/2 -right-3 z-20 -translate-y-1/2 hidden md:block">
              <span
                className="label-caps inline-flex items-center rounded-full border px-4 py-2 backdrop-blur-md"
                style={{
                  fontSize: '0.58rem',
                  letterSpacing: '0.2em',
                  background: 'oklch(from var(--accent) l c h / 0.30)',
                  borderColor: 'oklch(from var(--accent) l c h / 0.40)',
                  color: 'var(--accent-foreground)',
                }}
              >
                Beauty
              </span>
            </div>

            {/* Image stack in ethereal frame */}
            <div
              className="relative z-10 w-full max-w-[460px] xl:max-w-[540px] overflow-hidden rounded-[3rem] border-4 transition-transform duration-1000"
              style={{
                borderColor: 'oklch(from var(--card) calc(l + 0.15) c h / 0.9)',
                boxShadow: '0 8px 32px oklch(from var(--primary) l c h / 0.15)',
              }}
            >
              <ImageStack />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom-of-hero category marquee strip ────────── */}
      <div
        className="relative w-full overflow-hidden border-t border-b"
        style={{
          borderColor: 'oklch(from var(--card) calc(l + 0.18) c h / 0.50)',
          background: 'oklch(from var(--card) l c h / 0.30)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onMouseEnter={pauseMarquee}
        onMouseLeave={resumeMarquee}
        aria-hidden="true"
      >
        <div
          ref={marqueeRef}
          className="marquee-track flex gap-0 whitespace-nowrap py-4 opacity-60"
        >
          {/* Duplicate pills for seamless loop */}
          {[...CATEGORY_PILLS, ...CATEGORY_PILLS].map((pill, i) => (
            <span
              key={i}
              className="label-caps inline-flex items-center gap-1.5 px-6"
              style={{ fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--foreground)' }}
            >
              {pill}
              <span style={{ color: 'var(--primary)', opacity: 0.7, fontSize: '0.6rem', marginLeft: '1.5rem' }}>♥</span>
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
