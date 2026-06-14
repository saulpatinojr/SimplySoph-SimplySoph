import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Menu, X, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

const NAV_LINKS = [
  { href: "/",       label: "Home" },
  { href: "/blog",   label: "Blog" },
  { href: "/videos", label: "Videos" },
  { href: "/photos", label: "Photos" },
  { href: "/passport", label: "Passport" },
];

const SECONDARY_LINKS = [
  { href: "/about",   label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const linkClass = (href: string) =>
    [
      "relative text-sm font-medium tracking-wide transition-colors duration-150 after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:transition-transform after:duration-200 hover:after:scale-x-100",
      isActive(href)
        ? "text-primary font-semibold after:bg-primary after:scale-x-100"
        : "text-foreground/70 hover:text-foreground after:bg-primary",
    ].join(" ");

  return (
    <nav
      className={[
        "sticky top-0 z-50 transition-shadow duration-300",
        scrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border/60 shadow-sm"
          : "bg-background/80 backdrop-blur-md border-b border-border/30",
      ].join(" ")}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container">
        <div className="relative flex h-[72px] items-center">

          {/* Logo */}
          <Link href="/" aria-label={`${APP_TITLE} home`} className="flex-shrink-0">
            <img
              src="/icons/logo_short.png"
              alt={APP_TITLE}
              className="h-11 w-auto object-contain transition-opacity duration-150 hover:opacity-80"
              width={88}
              height={44}
              loading="eager"
            />
          </Link>

          {/* Desktop nav — centred */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-6">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
            <span className="h-4 w-px bg-border/70" aria-hidden="true" />
            {SECONDARY_LINKS.map(link => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            {isAuthenticated ? (
              <>
                <Link href="/admin" className="text-sm font-medium text-primary hover:underline underline-offset-2">
                  Admin
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-sm hover:text-destructive"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <button
                type="button"
                className="btn-gold flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: "var(--primary)" }}
                aria-label="Join the mailing list"
              >
                Join the List
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg md:hidden transition-colors hover:bg-muted"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden border-t border-border/50 pb-5"
            role="menu"
          >
            <div className="flex flex-col gap-1 pt-3">
              {NAV_LINKS.concat(SECONDARY_LINKS).map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  className={[
                    "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-primary/8 text-primary font-semibold"
                      : "text-foreground/75 hover:bg-muted hover:text-foreground",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-2 border-t border-border/50 pt-3">
                {isAuthenticated ? (
                  <>
                    <Link href="/admin" role="menuitem" className="block rounded-md px-3 py-2.5 text-sm font-medium text-primary">
                      Admin Studio
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 w-full justify-start text-sm hover:text-destructive"
                      onClick={() => logout()}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn-gold mt-1 flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white"
                  >
                    Join the List <ArrowRight size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
