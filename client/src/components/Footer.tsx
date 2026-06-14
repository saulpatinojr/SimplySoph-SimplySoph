import { Link } from "wouter";
import { Instagram, Youtube, Mail, ArrowUpRight } from "lucide-react";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { APP_TITLE, APPLE_APP_URL, ANDROID_APP_URL } from "@/const";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: "/blog", label: "Blog" },
    { href: "/videos", label: "Videos" },
    { href: "/photos", label: "Photos" },
  ];

  const aboutLinks = [
    { href: "/about", label: "About Me" },
    { href: "/contact", label: "Contact" },
  ];

  const socials = [
    {
      href: "https://www.tiktok.com/@smply.soph",
      label: "TikTok",
      icon: <TikTokIcon size={19} />,
      external: true,
    },
    {
      href: "https://instagram.com/simplysoph",
      label: "Instagram",
      icon: <Instagram size={19} />,
      external: true,
    },
    {
      href: "https://youtube.com/@simplysoph",
      label: "YouTube",
      icon: <Youtube size={19} />,
      external: true,
    },
    {
      href: "mailto:hello@simplysoph.com",
      label: "Email",
      icon: <Mail size={19} />,
      external: false,
    },
  ];

  const hasAppLinks = Boolean(APPLE_APP_URL || ANDROID_APP_URL);

  return (
    <footer
      role="contentinfo"
      style={{
        background: "oklch(0.14 0.018 28)",
        color: "oklch(0.82 0.010 45)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          height: "1px",
          background:
            "linear-gradient(to right, transparent 0%, oklch(0.50 0.20 22 / 0.45) 30%, oklch(0.76 0.09 78 / 0.55) 50%, oklch(0.50 0.20 22 / 0.45) 70%, transparent 100%)",
        }}
      />

      <div className="container py-14 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          <div className="sm:col-span-2 md:col-span-1 flex flex-col gap-5">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <svg
                viewBox="0 0 34 34"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 flex-shrink-0"
                aria-hidden="true"
              >
                <circle cx="17" cy="17" r="17" fill="oklch(0.50 0.20 22)" />
                <text
                  x="17"
                  y="22"
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
                className="font-cause font-bold text-xl"
                style={{ color: "oklch(0.96 0.010 55)", letterSpacing: "-0.01em" }}
              >
                {APP_TITLE}
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-52" style={{ color: "oklch(0.62 0.010 42)" }}>
              Fashion, lifestyle, and creative content for the modern generation.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold" style={{ color: "oklch(0.96 0.010 55)" }}>Quick Links</h4>
            <nav className="flex flex-col space-y-2">
              {quickLinks.map(link => (
                <Link key={link.href} href={link.href} className="text-sm transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold" style={{ color: "oklch(0.96 0.010 55)" }}>About</h4>
            <nav className="flex flex-col space-y-2">
              {aboutLinks.map(link => (
                <Link key={link.href} href={link.href} className="text-sm transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold" style={{ color: "oklch(0.96 0.010 55)" }}>Follow</h4>
            <div className="flex items-center gap-3 flex-wrap">
              {socials.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.external ? "_blank" : undefined}
                  rel={social.external ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors hover:bg-white/5"
                  style={{ borderColor: "oklch(1 0 0 / 0.10)" }}
                  aria-label={social.label}
                >
                  {social.icon}
                  <span>{social.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t" style={{ borderColor: "oklch(1 0 0 / 0.10)" }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm" style={{ color: "oklch(0.62 0.010 42)" }}>
            <p>© {currentYear} {APP_TITLE}. All rights reserved.</p>
            {hasAppLinks && (
              <div className="flex items-center gap-4">
                {APPLE_APP_URL && (
                  <a href={APPLE_APP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                    App Store <ArrowUpRight size={14} />
                  </a>
                )}
                {ANDROID_APP_URL && (
                  <a href={ANDROID_APP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                    Google Play <ArrowUpRight size={14} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
