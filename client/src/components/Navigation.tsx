import { Link } from "wouter";
import { Button } from "./ui/button";
import { Menu, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { LOGIN_PATH } from "@/const";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/blog", label: "Blog" },
    { href: "/videos", label: "Videos" },
    { href: "/photos", label: "Photos" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const { isAuthenticated } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="container">
        <div className="flex items-center justify-center h-20 relative">
          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a className="text-sm font-medium hover:text-primary transition-colors">
                  {link.label}
                </a>
              </Link>
            ))}
          </div>

          {/* Join Button - Top Right */}
          <Link href={isAuthenticated ? "/admin" : LOGIN_PATH}>
            <button className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 btn-gold px-4 py-2 rounded-full text-white font-medium text-sm items-center gap-2">
              {isAuthenticated ? "Studio" : "Join the journey"}
              <ArrowRight size={14} />
            </button>
          </Link>

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
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                  onClick={(e) => {
                    try {
                      setMobileMenuOpen(false);
                    } catch (err) {
                      console.error('Error closing mobile menu:', err);
                    }
                  }}
                >
                  {link.label}
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
