import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Menu, X, ArrowRight, Search as SearchIcon } from "lucide-react";
import { useState } from "react";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

const ALL_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/videos", label: "Videos" },
  { href: "/photos", label: "Photos" },
  { href: "/passport", label: "Passport" },
];

const RIGHT_NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  const desktopLinkClass = (href: string) => {
    const isActive = href === "/" ? location === "/" : location.startsWith(href);
    return [
      "text-sm font-medium transition-colors",
      isActive ? "text-primary font-semibold" : "text-foreground/80 hover:text-primary",
    ].join(" ");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50" role="navigation" aria-label="Main navigation">
      <div className="container">
        <div className="flex items-center h-20 relative">
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            <Link href="/" aria-label={`${APP_TITLE} home`}>
              <img src="/icons/logo_short.png" alt={APP_TITLE} className="h-12 w-auto object-contain" />
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4 mx-auto">
            {ALL_NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} className={desktopLinkClass(link.href)}>
                {link.label}
              </Link>
            ))}
            <span className="w-px h-5 bg-border/60" aria-hidden="true" />
            {RIGHT_NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} className={desktopLinkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 gap-3 items-center">
            {isAuthenticated ? (
              <>
                <Link href="/admin" className="text-sm font-medium text-primary hover:underline">Admin</Link>
                <Button variant="ghost" size="sm" onClick={() => logout()} className="text-sm font-medium hover:text-destructive">Sign Out</Button>
              </>
            ) : (
              <span className="btn-gold px-4 py-2 rounded-full text-white font-medium text-sm flex items-center gap-2 cursor-default opacity-80">
                Join by Mailing List
                <ArrowRight size={14} />
              </span>
            )}
          </div>

          <div className="md:hidden ml-auto">
            <button onClick={() => setMobileMenuOpen(v => !v)} aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} aria-controls="mobile-menu">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden pb-4 border-t border-border/50">
            <div className="pt-4 flex flex-col gap-3">
              {ALL_NAV_LINKS.concat(RIGHT_NAV_LINKS).map(link => (
                <Link key={link.href} href={link.href} className="py-2 text-sm font-medium text-foreground/80 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <Button variant="ghost" size="sm" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                  Sign Out
                </Button>
              ) : (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <SearchIcon size={16} /> Join by Mailing List
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
