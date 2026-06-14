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

  // Tagline rotation every 4.5s
  useEffect(() => {
    const id = window.setInterval(() => {
      setTaglineIndex(prev => (prev + 1) % FEATURED_TAGLINES.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  // Floating orb animation
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
    const titleTopEdge    = titleRect.top    - parentRect.top  - parentRect.height / 2;
    const titleBottomEdge = titleRect.bottom - parentRect.top  - parentRect.height / 2;
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
      {/* Warm radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 50% -5%,
              oklch(0.50 0.20 22 / 0.07) 0%,
              transparent 65%
            ),
            radial-gradient(ellipse 60% 40% at 80% 60%,
              oklch(0.76 0.09 78 / 0.05) 0%,
              transparent 60%
            )
          `,
        }}
      />

      {/* Fine grain overlay for editorial texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      <div className="container">
        {/* Asymmetric two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 xl:gap-20 items-center min-h-[82vh] py-16 md:py-20">

          {/* ── Left column: editorial headline + CTA ──── */}
          <div
            className="flex flex-col gap-7"
            style={{
              opacity:   mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(22px)",
              transition: "opacity 600ms 60ms cubic-bezier(0.16,1,0.3,1), transform 600ms 60ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  width: "28px",
                  height: "1.5px",
                  background: "var(--primary)",
                  borderRadius: "9999px",
                  opacity: 0.7,
                }}
              />
              <span className="text-xs font-sans font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
                Fashion &amp; Style Creator
              </span>
            </div>

            {/* Wordmark */}
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
                className="absolute inset-0 font-sans italic"
                style={{
                  fontSize: "clamp(0.875rem, 0.8rem + 0.35vw, 1rem)",
                  color: "oklch(from var(--foreground) l c h / 0.52)",
                  animation: "fade-up 400ms cubic-bezier(0.16,1,0.3,1) both",
                }}
              >
                {FEATURED_TAGLINES[taglineIndex]}
              </p>
            </div>

            {/* Decorative SVG swoosh */}
            <div aria-hidden="true" className="-mt-2">
              <svg width="220" height="16" viewBox="0 0 220 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 8 Q55 3 110 8 Q165 13 216 8"
                  stroke="oklch(0.50 0.20 22)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.50"
                />
              </svg>
            </div>

            {/* CTA row */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link href="/blog">
                <a className="btn-primary inline-flex items-center gap-2">
                  Read the stories
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
              </Link>
              <Link href="/photos">
                <a
                  className="group flex items-center gap-2 text-sm font-sans font-medium transition-colors"
                  style={{ color: "oklch(from var(--foreground) l c h / 0.60)" }}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full border transition-all group-hover:bg-primary/8 group-hover:border-primary/40"
                    style={{ borderColor: "oklch(from var(--border) l c h / 0.70)" }}
                  >
                    <Sparkles size={13} aria-hidden="true" />
                  </span>
                  View gallery
                </a>
              </Link>
            </div>

            {/* Pillar stats */}
            <div className="flex gap-8 pt-2">
              {[
                { value: "Style",    label: "Diaries"   },
                { value: "Fashion",  label: "Stories"   },
                { value: "Creative", label: "Community" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-0.5">
                  <span
                    className="font-display font-semibold text-xl"
                    style={{ letterSpacing: "-0.01em", color: "var(--foreground)" }}
                  >
                    {stat.value}
                  </span>
                  <span
                    className="text-xs font-sans uppercase tracking-[0.15em]"
                    style={{ color: "oklch(from var(--foreground) l c h / 0.42)" }}
                  >
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column: ImageStack + floating orbs ── */}
          <div
            className="relative flex items-center justify-center"
            style={{
              opacity:   mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 700ms 180ms cubic-bezier(0.16,1,0.3,1), transform 700ms 180ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {/* Soft glow behind image stack */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 rounded-[2.5rem] blur-3xl"
              style={{
                background: "radial-gradient(ellipse 80% 70% at 50% 50%, oklch(0.50 0.20 22 / 0.10) 0%, transparent 70%)",
              }}
            />

            {/* Floating brand-color orb row */}
            <div
              ref={rowRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              {[
                { label: "Style",   bg: "oklch(0.50 0.20 22 / 0.92)",  text: "white",                   size: 40 },
                { label: "Beauty",  bg: "oklch(0.76 0.09 78 / 0.92)",  text: "oklch(0.22 0.03 70)",    size: 36 },
                { label: "Fashion", bg: "oklch(0.94 0.025 10 / 0.92)", text: "oklch(0.28 0.05 10)",    size: 38 },
                { label: "Travel",  bg: "oklch(0.96 0 0 / 0.85)",       text: "oklch(0.30 0.008 40)",   size: 36 },
              ].map(({ label, bg, text, size }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <button
                      className="orb-btn pointer-events-auto absolute left-1/2 top-1/2 flex items-center justify-center rounded-full font-sans font-semibold shadow-md backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
                      style={{
                        width: size,
                        height: size,
                        fontSize: 9,
                        letterSpacing: "0.05em",
                        background: bg,
                        color: text,
                        transform: "translate3d(0,0,0)",
                        border: "1px solid oklch(1 0 0 / 0.18)",
                      }}
                      onClick={() => navigate('/blog')}
                      aria-label={`Browse ${label} content`}
                    >
                      {label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span className="text-xs">Browse {label}</span>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Main image stack */}
            <div className="relative z-10 w-full max-w-[420px] xl:max-w-[480px]">
              <ImageStack />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade edge into the next section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, var(--background) 100%)",
        }}
      />
    </section>
  );
};

export default HeroBanner;
