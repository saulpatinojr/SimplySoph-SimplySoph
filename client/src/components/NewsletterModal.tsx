import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { subscribeToNewsletter } from '@/lib/newsletter';
import { logNewsletterEvent } from '@/lib/analytics';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      logNewsletterEvent('open', { path: window.location.pathname });
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setSubmitting(true);
    try {
      await subscribeToNewsletter(email.trim(), name.trim());
      logNewsletterEvent('submit', { path: window.location.pathname, email: email.trim() });
      toast.success('Successfully subscribed to newsletter!');
      localStorage.setItem('newsletter_subscribed', 'true');
      setEmail('');
      setName('');
      onClose();
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      if (error instanceof Error && error.message === 'Already subscribed') {
        toast.info('You are already subscribed!');
        localStorage.setItem('newsletter_subscribed', 'true');
        onClose();
      } else {
        toast.error('Failed to subscribe. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleDismiss() {
    logNewsletterEvent('dismiss', { path: window.location.pathname });
    localStorage.setItem('newsletter_dismissed', Date.now().toString());
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Stay Updated! 💌
          </DialogTitle>
        </DialogHeader>
        <p className="text-center text-gray-600 mb-4">
          Get the latest fashion tips, style guides, and exclusive content delivered to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Subscribing...' : 'Subscribe'}
            </Button>
            <Button type="button" variant="outline" onClick={handleDismiss}>
              Maybe Later
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage newsletter modal display logic
export function useNewsletterModal(options?: {
  isSubscribed?: boolean;
  isAuthenticated?: boolean;
  // delay before showing in ms (default 10000). Set to 0 for immediate.
  delayMs?: number;
  // if true, show on exit-intent (mouse leaves toward top of viewport)
  showOnExitIntent?: boolean;
  // if >0, store a seen-until timestamp in localStorage for this many ms
  sessionCooldownMs?: number;
  // optional server-side check function that returns a boolean indicating subscription
  serverCheck?: () => Promise<boolean>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isSubscribed = false,
    isAuthenticated = false,
    delayMs = 10000,
    showOnExitIntent = false,
    sessionCooldownMs = 0,
    serverCheck,
  } = options ?? {};

  useEffect(() => {
    let cancelled = false;

    // If user is authenticated or locally subscribed, don't show
    const alreadySubscribedLocal = Boolean(localStorage.getItem('newsletter_subscribed')) || isSubscribed;
    if (isAuthenticated || alreadySubscribedLocal) return;

    // Check seen status: either sessionStorage (default) or a seen-until timestamp
    if (sessionCooldownMs > 0) {
      const seenUntil = localStorage.getItem('newsletter_seen_until');
      if (seenUntil && Date.now() < parseInt(seenUntil, 10)) return;
    } else {
      const seenThisSession = sessionStorage.getItem('newsletter_seen_this_session');
      if (seenThisSession) return;
    }

    // Respect dismissals stored in localStorage (30 day cooldown)
    const dismissed = localStorage.getItem('newsletter_dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < thirtyDays) return;
    }

    const runServerCheck = async () => {
      if (!serverCheck) return false;
      try {
        const res = await serverCheck();
        return Boolean(res);
      } catch (err) {
        console.warn('[Newsletter] serverCheck error', err);
        return false;
      }
    };

    const markSeen = () => {
      if (sessionCooldownMs > 0) {
        localStorage.setItem('newsletter_seen_until', String(Date.now() + sessionCooldownMs));
      } else {
        sessionStorage.setItem('newsletter_seen_this_session', 'true');
      }
    };

    const openNow = () => {
      if (cancelled) return;
      markSeen();
      setIsOpen(true);
      logNewsletterEvent('open', { path: window.location.pathname });
    };

    const scheduleOpen = async () => {
      const srvSubscribed = await runServerCheck();
      if (cancelled) return;
      if (srvSubscribed) {
        localStorage.setItem('newsletter_subscribed', 'true');
        return;
      }

      if (showOnExitIntent && typeof window !== 'undefined') {
        let triggered = false;
        const onMouseMove = (e: MouseEvent) => {
          if (e.clientY <= 10 && !triggered) {
            triggered = true;
            openNow();
            cleanup();
          }
        };
        const onTouchStart = () => {
          /* no-op for touch */
        };
        const cleanup = () => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('touchstart', onTouchStart);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchstart', onTouchStart);

        if (delayMs > 0) {
          const t = setTimeout(() => {
            if (!triggered) openNow();
            cleanup();
          }, delayMs);
          return () => {
            cancelled = true;
            clearTimeout(t);
            cleanup();
          };
        }

        return () => {
          cancelled = true;
          cleanup();
        };
      }

      if (delayMs <= 0) {
        openNow();
        return;
      }

      const timer = setTimeout(() => {
        openNow();
      }, delayMs);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    };

    const cleanup = scheduleOpen();
    return () => {
      cancelled = true;
      if (typeof cleanup === 'function') {
        try {
          (cleanup as () => void)();
        } catch {}
      }
    };
  }, [isSubscribed, isAuthenticated, delayMs, showOnExitIntent, sessionCooldownMs, serverCheck]);

  return { isOpen, setIsOpen };
}
