import { Link } from "wouter";
import { Button } from "./ui/button";
import { Menu, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { LOGIN_PATH } from "@/const";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const leftNavLinks = [
    { href: "/", label: "Home" },
    { href: "/blog", label: "Blog" },
    { href: "/videos", label: "Videos" },
    { href: "/photos", label: "Photos" },
    { href: "/passport", label: "Passport" },
  ];

  const rightNavLinks = [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const { isAuthenticated } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="container">
        <div className="flex items-center h-20 relative">
          {/* Logo Badge - Left Side */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            <Link href="/">
              <a>
                <img
                  src="/icons/logo_badge.png"
                  alt={APP_TITLE}
                  className="h-12 w-auto object-contain"
                />
              </a>
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-4 mx-auto">
            {leftNavLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <a className="text-sm font-medium hover:text-primary transition-colors">
                  {link.label}
                </a>
              </Link>
            ))}
            {/* Spacer line between Passport and About */}
            <span className="w-px h-5 bg-border/60" aria-hidden="true" />
            {rightNavLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <a className="text-sm font-medium hover:text-primary transition-colors">
                  {link.label}
                </a>
              </Link>
            ))}
          </div>

          {/* Right Side - Join & Login */}
          <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 gap-3 items-center">
            <span className="btn-gold px-4 py-2 rounded-full text-white font-medium text-sm flex items-center gap-2 cursor-default opacity-80">
              Join by Mailing List
              <ArrowRight size={14} />
            </span>
            <Link href={LOGIN_PATH}>
              <a className="text-sm font-medium hover:text-primary transition-colors">
                {isAuthenticated ? "Studio" : "Login"}
              </a>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {[...leftNavLinks, ...rightNavLinks].map(link => (
              <Link key={link.href} href={link.href}>
                <a
                  className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              </Link>
            ))}
            <hr className="border-border/40 my-2" />
            <Link href={LOGIN_PATH}>
              <a
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {isAuthenticated ? "Studio" : "Login"}
              </a>
            </Link>
            <Link href="/privacy-policy">
              <a
                className="block py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Privacy Policy
              </a>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
