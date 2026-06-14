import { Link } from "wouter";
import { Instagram, Youtube, Mail } from "lucide-react";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { APP_TITLE, APPLE_APP_URL, ANDROID_APP_URL } from "@/const";

// Pinterest icon — Lucide doesn't include it, so a minimal inline SVG
function PinterestIcon({ size = 19 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: "/blog",     label: "Blog"    },
    { href: "/videos",  label: "Videos"  },
    { href: "/photos",  label: "Photos"  },
    { href: "/passport",label: "Passport"},
  ];

  const aboutLinks = [
    { href: "/about",   label: "About Me"   },
    { href: "/contact", label: "Contact"    },
  ];

  const socials = [
    {
      href:  "https://www.tiktok.com/@smply.soph",
      label: "TikTok",
      icon:  <TikTokIcon size={18} />,
    },
    {
      href:  "https://www.instagram.com/simplysoph",
      label: "Instagram",
      icon:  <Instagram size={18} />,
    },
    {
      href:  "https://www.youtube.com/@simplysoph",
      label: "YouTube",
      icon:  <Youtube size={18} />,
    },
    {
      href:  "https://www.pinterest.com/simplysoph",
      label: "Pinterest",
      icon:  <PinterestIcon size={18} />,
    },
    {
      href:  "mailto:hello@simplysoph.com",
      label: "Email",
      icon:  <Mail size={18} />,
    },
  ];

  const hasAppLinks = Boolean(APPLE_APP_URL || ANDROID_APP_URL);

  return (
    <footer role="contentinfo">
      {/* Top gradient rule — cherry red → gold */}
      <div
        aria-hidden="true"
        style={{
          height: "1px",
          background:
            "linear-gradient(to right, transparent 0%, oklch(0.50 0.20 22 / 0.5) 25%, oklch(0.76 0.09 78 / 0.6) 50%, oklch(0.50 0.20 22 / 0.5) 75%, transparent 100%)",
        }}
      />

      {/* Footer body */}
      <div
        style={{
          background: "oklch(0.12 0.018 28)",
          color: "oklch(0.78 0.010 45)",
        }}
      >
        <div className="container py-14 md:py-16">
          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">

            {/* Brand column */}
            <div className="sm:col-span-2 md:col-span-1 flex flex-col gap-5">
              <Link href="/" className="group inline-flex items-center gap-2.5" aria-label={`${APP_TITLE} home`}>
                {/* Logo mark — SS monogram in cherry red circle */}
                <svg
                  viewBox="0 0 34 34"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 flex-shrink-0 transition-opacity group-hover:opacity-90"
                  aria-hidden="true"
                >
                  <circle cx="17" cy="17" r="17" fill="oklch(0.50 0.20 22)" />
                  <text
                    x="17"
                    y="22.5"
                    textAnchor="middle"
                    fill="white"
                    fontFamily="Georgia, serif"
                    fontWeight="700"
                    fontSize="13"
                    letterSpacing="0.5"
                  >
                    SS
                  </text>
                </svg>
                <span
                  className="font-cause font-bold text-xl transition-opacity group-hover:opacity-90"
                  style={{ color: "oklch(0.96 0.010 55)", letterSpacing: "-0.01em" }}
                >
                  {APP_TITLE}
                </span>
              </Link>

              <p
                className="text-sm leading-relaxed"
                style={{ color: "oklch(0.58 0.010 42)", maxWidth: "18rem" }}
              >
                Fashion, lifestyle, and creative content for the modern generation.
              </p>

              {/* Social icon row */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target={s.href.startsWith('mailto') ? undefined : "_blank"}
                    rel={s.href.startsWith('mailto') ? undefined : "noopener noreferrer"}
                    aria-label={`${APP_TITLE} on ${s.label}`}
                    className="group/icon inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all"
                    style={{
                      borderColor: "oklch(1 0 0 / 0.10)",
                      color: "oklch(0.65 0.010 42)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "oklch(0.50 0.20 22 / 0.60)";
                      (e.currentTarget as HTMLAnchorElement).style.color = "oklch(0.78 0.20 22)";
                      (e.currentTarget as HTMLAnchorElement).style.background = "oklch(0.50 0.20 22 / 0.10)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "oklch(1 0 0 / 0.10)";
                      (e.currentTarget as HTMLAnchorElement).style.color = "oklch(0.65 0.010 42)";
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="space-y-4">
              <h4
                className="text-sm font-semibold uppercase tracking-[0.15em]"
                style={{ color: "oklch(0.96 0.010 55)" }}
              >
                Explore
              </h4>
              <nav className="flex flex-col gap-2" aria-label="Footer explore links">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* About links */}
            <div className="space-y-4">
              <h4
                className="text-sm font-semibold uppercase tracking-[0.15em]"
                style={{ color: "oklch(0.96 0.010 55)" }}
              >
                About
              </h4>
              <nav className="flex flex-col gap-2" aria-label="Footer about links">
                {aboutLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Newsletter mini-CTA */}
            <div className="space-y-4">
              <h4
                className="text-sm font-semibold uppercase tracking-[0.15em]"
                style={{ color: "oklch(0.96 0.010 55)" }}
              >
                Stay in the Loop
              </h4>
              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.58 0.010 42)" }}>
                Get style drops, exclusive content, and behind-the-scenes directly to your inbox.
              </p>
              <Link href="/contact">
                <a
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: "oklch(0.50 0.20 22)",
                    color: "white",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "oklch(0.44 0.22 22)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "oklch(0.50 0.20 22)";
                  }}
                >
                  Subscribe free
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </Link>

              {/* App store badges (conditionally rendered) */}
              {hasAppLinks && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {APPLE_APP_URL && (
                    <a
                      href={APPLE_APP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors hover:bg-white/5"
                      style={{ borderColor: "oklch(1 0 0 / 0.10)", color: "oklch(0.78 0.010 45)" }}
                    >
                      App Store
                    </a>
                  )}
                  {ANDROID_APP_URL && (
                    <a
                      href={ANDROID_APP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors hover:bg-white/5"
                      style={{ borderColor: "oklch(1 0 0 / 0.10)", color: "oklch(0.78 0.010 45)" }}
                    >
                      Google Play
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
            style={{
              borderColor: "oklch(1 0 0 / 0.07)",
              color: "oklch(0.48 0.008 40)",
            }}
          >
            <p>© {currentYear} {APP_TITLE}. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/contact" className="transition-colors hover:text-white">
                Privacy
              </Link>
              <Link href="/contact" className="transition-colors hover:text-white">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
