import React, { useEffect, useRef, useState } from 'react';
import ImageStack from '@/components/ImageStack';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useLocation } from 'wouter';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { FEATURED_TAGLINES } from '@/const';

const HeroBanner: React.FC = () => {
  const [, navigate] = useLocation();
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const rowRef = useRef<HTMLDivElement | null>(null);

  // Staggered entrance
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Tagline rotation
  useEffect(() => {
    const id = window.setInterval(() => {
      setTaglineIndex(prev => (prev + 1) % FEATURED_TAGLINES.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  // Orb animation — preserved from v1
  useEffect(() => {
    const root = rowRef.current;
    if (!root) return;
    const orbEls = Array.from(root.querySelectorAll<HTMLElement>('.orb-btn'));
    if (!orbEls.length) return;

    const titleEl = document.querySelector('h1');
    const titleRect = titleEl
      ? titleEl.getBoundingClientRect()
      : { left: 0, right: 400, width: 400, top: 0, bottom: 50, height: 50 };
    const parentRect = root.getBoundingClientRect();
    const titleLeftEdge  = titleRect.left  - parentRect.left - parentRect.width / 2;
    const titleRightEdge = titleRect.right - parentRect.left - parentRect.width / 2;
    const leftZoneCenter  = titleLeftEdge  - 15;
    const rightZoneCenter = titleRightEdge + 15;
    const titleTopEdge    = titleRect.top    - parentRect.top - parentRect.height / 2;
    const titleBottomEdge = titleRect.bottom - parentRect.top - parentRect.height / 2;
    const topBound       = titleTopEdge    - 3;
    const bottomBound    = titleBottomEdge + 3;
    const verticalCenter = (topBound + bottomBound) / 2;
    const verticalHeight = bottomBound - topBound;

    const nowBase  = performance.now();
    const orbsState = orbEls.map((el) => {
      const fullWidth = rightZoneCenter - leftZoneCenter;
      const centerX   = (leftZoneCenter + rightZoneCenter) / 2;
      return {
        el,
        baseX:  centerX,
        baseY:  verticalCenter,
        ampX:   fullWidth / 2,
        ampY:   verticalHeight / 2,
        freqX:  (0.0009 + Math.random() * 0.0016) * 0.56,
        freqY:  (0.0008 + Math.random() * 0.0014) * 0.56,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        jitter: 1.2 + Math.random() * 2.2,
      };
    });

    let raf = 0;
    const tick = () => {
      const t = performance.now() - nowBase;
      for (const s of orbsState) {
        const x = s.baseX + Math.sin(t * s.freqX + s.phaseX) * s.ampX + (Math.random() - 0.5) * s.jitter;
        const y = s.baseY + Math.sin(t * s.freqY + s.phaseY) * s.ampY + (Math.random() - 0.5) * s.jitter * 0.7;
        s.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "var(--background)" }}
      aria-label="Hero"
    >
      {/* Warm radial glow behind content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%,
            oklch(0.50 0.20 22 / 0.06) 0%,
            transparent 70%
          )`,
        }}
      />

      <div className="container">
        {/* ── Asymmetric two-column layout ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 xl:gap-20 items-center min-h-[78vh] py-16 md:py-20">

          {/* ─ Left column: editorial headline + CTA ──────────── */}
          <div
            className="flex flex-col gap-7"
            style={{
              opacity:   mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(22px)",
              transition: "opacity 600ms 60ms cubic-bezier(0.16,1,0.3,1), transform 600ms 60ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {/* Eyebrow label */}
            <div className="flex items-center gap-3">
              <span className="editorial-rule-short" aria-hidden="true" />
              <span
                className="text-xs font-sans font-semibold uppercase tracking-[0.25em] text-primary"
              >
                Fashion & Style Creator
              </span>
            </div>

            {/* Hero wordmark — CAuse font */}
            <h1
              className="font-cause leading-none"
              style={{
                fontSize: "clamp(3.5rem, 2rem + 6vw, 7.5rem)",
                letterSpacing: "-0.03em",
                color: "var(--foreground)",
              }}
            >
              Simply
              <span
                className="block gradient-text"
                style={{ fontStyle: "normal" }}
              >
                Soph
              </span>
            </h1>

            {/* Rotating tagline */}
            <div
              className="relative h-7 overflow-hidden"
              aria-live="polite"
              aria-atomic="true"
            >
              <p
                key={taglineIndex}
                className="absolute inset-0 text-fluid-base font-sans text-foreground/55 italic"
                style={{
                  animation: "fade-up 400ms cubic-bezier(0.16,1,0.3,1) both",
                }}
              >
                {FEATURED_TAGLINES[taglineIndex]}
              </p>
            </div>

            {/* Decorative SVG swoosh */}
            <div aria-hidden="true" className="-mt-2">
              <svg
                width="220"
                height="16"
                viewBox="0 0 220 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 8 Q55 3 110 8 Q165 13 216 8"
                  stroke="oklch(0.50 0.20 22)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.55"
                />
              </svg>
            </div>

            {/* CTA row */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link href="/blog">
                <a className="btn-primary">
                  Read the stories
                  <ArrowRight size={14} />
                </a>
              </Link>
              <Link href="/photos">
                <a
                  className="flex items-center gap-2 text-sm font-sans font-medium text-foreground/65 hover:text-primary transition-colors group"
                >
                  <span className="w-7 h-7 rounded-full border border-border/60 flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/6 transition-all">
                    <Sparkles size={13} />
                  </span>
                  View gallery
                </a>
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex gap-8 pt-2">
              {[
                { value: "Style",    label: "Diaries"   },
                { value: "Fashion",  label: "Stories"   },
                { value: "Creative", label: "Community" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-0.5">
                  <span className="font-display font-semibold text-xl text-foreground" style={{ letterSpacing: "-0.01em" }}>
                    {stat.value}
                  </span>
                  <span className="text-xs font-sans uppercase tracking-[0.15em] text-foreground/45">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ─ Right column: ImageStack + floating icon orbs ──── */}
          <div
            className="relative flex items-center justify-center"
            style={{
              opacity:   mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 700ms 180ms cubic-bezier(0.16,1,0.3,1), transform 700ms 180ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {/* Soft halo behind image stack */}
            <div
              aria-hidden="true"
              className="absolute inset-[-15%] rounded-full -z-10"
              style={{
                background: "radial-gradient(circle, oklch(0.50 0.20 22 / 0.07) 0%, transparent 70%)",
              }}
            />

            {/* ImageStack */}
            <div className="relative z-10">
              <ImageStack count={6} intervalMs={3500} />
            </div>

            {/* Floating icon orbs — preserved interaction from v1 */}
            <div
              className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none z-20"
              ref={rowRef}
            >
              <div className="relative w-80 h-24 overflow-visible">

                {/* Hanger → Photos */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate('/photos')}
                      aria-label="Gallery"
                      className="orb-btn absolute top-0 -left-20 w-12 h-12 rounded-full shadow-md flex items-center justify-center overflow-visible z-10 bg-transparent focus:outline-none"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <div className="glossy-icon w-full h-full !p-0 flex items-center justify-center" style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.90), oklch(0.94 0.04 22 / 0.70))' }}>
                        <span className="material-symbols-outlined material-fill-1 material-weight-700" style={{ fontSize: 18, color: 'oklch(0.50 0.20 22)' }}>checkroom</span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6}>Gallery</TooltipContent>
                </Tooltip>

                {/* Perfume → Contact */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate('/contact')}
                      aria-label="Perfume"
                      className="orb-btn absolute -top-4 -right-20 w-12 h-12 rounded-full shadow-md flex items-center justify-center overflow-visible z-10 bg-transparent focus:outline-none"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <div className="glossy-icon w-full h-full !p-0 flex items-center justify-center" style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.90), oklch(0.90 0.06 75 / 0.75))' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'oklch(0.58 0.12 70)' }}>fragrance</span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6}>Contact</TooltipContent>
                </Tooltip>

                {/* Shirt → Photos/apparel */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate('/photos')}
                      aria-label="Apparel"
                      className="orb-btn absolute top-10 -left-24 w-10 h-10 rounded-full shadow flex items-center justify-center overflow-visible z-10 bg-transparent focus:outline-none"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <div className="glossy-icon w-full h-full !p-0 flex items-center justify-center" style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.90), oklch(0.92 0.04 30 / 0.70))' }}>
                        <span className="material-symbols-outlined material-fill-1 material-weight-700" style={{ fontSize: 16, color: 'oklch(0.52 0.14 28)' }}>apparel</span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6}>Apparel</TooltipContent>
                </Tooltip>

                {/* Camera → Photos */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate('/photos')}
                      aria-label="Photos"
                      className="orb-btn absolute top-8 -right-22 w-10 h-10 rounded-full shadow flex items-center justify-center overflow-visible z-10 bg-transparent focus:outline-none"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <div className="glossy-icon w-full h-full !p-0 flex items-center justify-center" style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.90), oklch(0.92 0.04 22 / 0.70))' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'oklch(0.50 0.16 22)' }}>photo_camera</span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6}>Photos</TooltipContent>
                </Tooltip>

                {/* Airplane → About */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate('/about')}
                      aria-label="About"
                      className="orb-btn absolute top-20 -right-16 w-12 h-12 rounded-full shadow-md flex items-center justify-center overflow-visible z-10 bg-transparent focus:outline-none"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <div className="glossy-icon w-full h-full !p-0 flex items-center justify-center" style={{ background: 'radial-gradient(60% 60% at 30% 30%, rgba(255,255,255,0.90), oklch(0.90 0.05 60 / 0.70))' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'oklch(0.52 0.10 55)' }}>flight</span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={6}>About</TooltipContent>
                </Tooltip>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom editorial rule */}
      <span className="editorial-rule" aria-hidden="true" />
    </section>
  );
};

export default HeroBanner;
