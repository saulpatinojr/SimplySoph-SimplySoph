import { Link } from "wouter";
import { Instagram, Youtube, Mail } from "lucide-react";
import { APP_TITLE } from "@/const";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-lg gradient-text">{APP_TITLE}</h3>
            <p className="text-sm text-muted-foreground">
              Fashion, lifestyle, and creative content for the modern generation.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/blog"><a className="text-sm text-muted-foreground hover:text-primary transition-colors">Blog</a></Link>
              <Link href="/videos"><a className="text-sm text-muted-foreground hover:text-primary transition-colors">Videos</a></Link>
              <Link href="/photos"><a className="text-sm text-muted-foreground hover:text-primary transition-colors">Photos</a></Link>
            </nav>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h4 className="font-semibold">About</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/about"><a className="text-sm text-muted-foreground hover:text-primary transition-colors">About Me</a></Link>
              <Link href="/contact"><a className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</a></Link>
            </nav>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="font-semibold">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="YouTube">
                <Youtube size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Email">
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {currentYear} {APP_TITLE}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
