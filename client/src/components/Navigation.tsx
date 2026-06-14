import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Menu, X, ArrowRight, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { SearchBar } from "@/components/SearchBar";

const NAV_LINKS = [
  { href: "/blog",    label: "Blog" },
  { href: "/videos",  label: "Videos" },
  { href: "/photos",  label: "Photos" },
  { href: "/passport",label: "Passport" },
  { href: "/about",   label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navigation() {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [scrolled,   setScrolled]     = useState(false);
  const [shrunk,     setShrunk]       = useState(false);
  const { isAuthenticated, logout }   = useAuth();
  const [location]                    = useLocation();
  const searchRef                     = useRef<HTMLDivElement>(null);

  // Scroll detection — two thresholds: border at 12px, logo shrink at 60px
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      setShrunk(window.scrollY > 60);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu + search on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location]);

  // Close search on outside click
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchOpen]);

  // Cmd+K / Ctrl+K global shortcut to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const linkClass = (href: string) =>
    [
      "relative text-[13px] font-medium tracking-wide py-1 transition-colors duration-150",
      "after:absolute after:-bottom-0.5 after:left-0 after:h-[1.5px] after:w-full",
      "after:origin-left after:scale-x-0 after:transition-transform after:duration-200",
      "hover:after:scale-x-100",
      isActive(href)
        ? "text-primary font-semibold after:bg-primary after:scale-x-100"
        : "text-foreground/65 hover:text-foreground after:bg-primary",
    ].join(" ");

  return (
    <>
      <nav
        className={[
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-background/92 backdrop-blur-2xl border-b border-border/50 shadow-[0_1px_12px_oklch(0.18_0.01_30/0.07)]"
            : "bg-background/75 backdrop-blur-md border-b border-transparent",
        ].join(" ")}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container">
          <div
            className="relative flex items-center transition-all duration-300"
            style={{ height: shrunk ? "56px" : "68px" }}
          >
            {/* ── Logo ── */}
            <Link href="/" aria-label={`${APP_TITLE} home`} className="flex-shrink-0 mr-8">
              <img
                src="/icons/logo_short.png"
                alt={APP_TITLE}
                className="w-auto object-contain transition-all duration-300 hover:opacity-80"
                style={{ height: shrunk ? "32px" : "40px" }}
                width={88}
                height={44}
                loading="eager"
              />
            </Link>

            {/* ── Desktop nav links ── */}
            <div className="hidden md:flex flex-1 items-center gap-5">
              {NAV_LINKS.map(link => (
                <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* ── Desktop right actions ── */}
            <div className="hidden md:flex items-center gap-2 ml-auto">
              {/* Search toggle */}
              <button
                type="button"
                onClick={() => setSearchOpen(v => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Toggle search"
                aria-expanded={searchOpen}
              >
                <Search size={17} />
              </button>

              {isAuthenticated ? (
                <>
                  <Link href="/admin" className="text-[13px] font-medium text-primary hover:underline underline-offset-2 px-2">
                    Studio
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logout()}
                    className="text-[13px] hover:text-destructive"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-primary ml-2 flex items-center gap-1.5 !py-2 !px-4 !text-[13px]"
                  aria-label="Join the mailing list"
                >
                  Join the List
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* ── Mobile: search + hamburger ── */}
            <div className="flex items-center gap-1 ml-auto md:hidden">
              <button
                type="button"
                onClick={() => setSearchOpen(v => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Toggle search"
              >
                <Search size={18} />
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                onClick={() => setMobileOpen(v => !v)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* ── Search bar drop-down ── */}
          {searchOpen && (
            <div ref={searchRef} className="pb-4 pt-1 border-t border-border/30">
              <SearchBar
                autoFocus
                onResultClick={() => setSearchOpen(false)}
                placeholder="Search posts, videos, photos…"
              />
            </div>
          )}
        </div>

        {/* ── Mobile slide-down menu ── */}
        {mobileOpen && (
          <div
            id="mobile-menu"
            className="md:hidden border-t border-border/40 bg-background/97 backdrop-blur-xl"
            role="menu"
          >
            <div className="container py-5 flex flex-col gap-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  className={[
                    "flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-primary/8 text-primary"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                  )}
                </Link>
              ))}

              <div className="mt-4 pt-4 border-t border-border/40 flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <Link href="/admin" className="text-sm font-medium text-primary hover:underline px-3">
                      Studio Dashboard
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => logout()}
                      className="justify-start px-3 hover:text-destructive"
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn-primary w-full justify-center flex items-center gap-2"
                  >
                    Join the List
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
