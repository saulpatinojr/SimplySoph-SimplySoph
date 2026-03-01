import { Link } from "wouter";
import { Instagram, Youtube, Mail } from "lucide-react";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { APP_TITLE } from "@/const";
import { APPLE_APP_URL, ANDROID_APP_URL } from "@/const";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="bg-muted/30 border-t border-border/50 mt-auto font-sans"
    >
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/">
              <a className="inline-block">
                <h3 className="font-heading font-bold text-xl text-foreground">
                  {APP_TITLE}
                </h3>
              </a>
            </Link>
            <p className="text-sm text-muted-foreground max-w-50">
              Fashion, lifestyle, and creative content for the modern
              generation.
            </p>
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Stay in the loop
              </p>
              <NewsletterSignup />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/blog">
                <a className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </a>
              </Link>
              <Link href="/videos">
                <a className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Videos
                </a>
              </Link>
              <Link href="/photos">
                <a className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Photos
                </a>
              </Link>
            </nav>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">About</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/about">
                <a className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Me
                </a>
              </Link>
              <Link href="/contact">
                <a className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </a>
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Legal</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/privacy-policy">
                <a className="text-sm text-foreground/90 font-medium hover:text-primary transition-colors underline underline-offset-4 decoration-primary/30">
                  Privacy Policy
                </a>
              </Link>
              <Link href="/terms-of-service">
                <a className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </Link>
            </nav>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Connect</h4>
            <div className="flex gap-4" aria-label="Social media links">
              <a
                href="https://www.tiktok.com/@smply.soph"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="TikTok"
              >
                <TikTokIcon size={20} />
              </a>
              <a
                href="https://www.instagram.com/smply.soph"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.youtube.com/@smply.soph"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
              <a
                href="mailto:sophia@simplysoph.com"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>
            © {currentYear} {APP_TITLE}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/login">
              <a className="hover:text-primary transition-colors font-medium">
                Login
              </a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
