import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { subscribeToNewsletter } from '@/lib/newsletter';
import { logNewsletterEvent } from '@/lib/analytics';
import { Mail, X } from 'lucide-react';
import { NEWSLETTER_INTEREST_OPTIONS, PHASE4_LEAD_MAGNET } from '@/lib/services/growth';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROMPTED_SESSION_KEY = 'ss-newsletter-prompted';
const SUBSCRIBED_KEY = 'ss-newsletter-subscribed';
const AUTO_OPEN_MIN_MS = 15_000;
const AUTO_OPEN_MAX_MS = 75_000;

function markSubscribed() {
  try { localStorage.setItem(SUBSCRIBED_KEY, '1'); } catch { /* private mode */ }
}

function shouldAutoPrompt(): boolean {
  try {
    if (localStorage.getItem(SUBSCRIBED_KEY)) return false;
    return !sessionStorage.getItem(PROMPTED_SESSION_KEY);
  } catch {
    return false;
  }
}

/**
 * Convenience hook — manages open/close state for NewsletterModal.
 * Usage: const { isOpen, open, close } = useNewsletterModal({ autoOpen: true });
 *
 * With autoOpen, the modal pops up at most once per browser session
 * (sessionStorage), after a random 15–75s delay, and never for visitors
 * who already subscribed (localStorage). Manual open() always works.
 */
export function useNewsletterModal(options?: { autoOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const autoOpen = options?.autoOpen ?? false;

  useEffect(() => {
    if (!autoOpen || !shouldAutoPrompt()) return;
    const delay = AUTO_OPEN_MIN_MS + Math.random() * (AUTO_OPEN_MAX_MS - AUTO_OPEN_MIN_MS);
    const t = setTimeout(() => {
      if (!shouldAutoPrompt()) return; // subscribed or prompted meanwhile
      try { sessionStorage.setItem(PROMPTED_SESSION_KEY, '1'); } catch { /* private mode */ }
      setIsOpen(true);
    }, delay);
    return () => clearTimeout(t);
  }, [autoOpen]);

  return {
    isOpen,
    open:  () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}

export function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [interests, setInterests] = useState<string[]>(['travel-style']);
  const [submitting, setSubmitting] = useState(false);

  function toggleInterest(interest: string) {
    setInterests(current =>
      current.includes(interest)
        ? current.filter(item => item !== interest)
        : [...current, interest]
    );
  }

  useEffect(() => {
    if (isOpen) logNewsletterEvent('open', { path: window.location.pathname });
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setSubmitting(true);
    try {
      const result = await subscribeToNewsletter(email.trim(), {
        name: name.trim() || undefined,
        source: window.location.pathname,
        interests,
        leadMagnet: PHASE4_LEAD_MAGNET.title,
      });
      logNewsletterEvent('submit', { path: window.location.pathname });
      markSubscribed();
      if (result.pendingConfirmation) {
        toast.success('Almost done. Check your inbox and confirm your subscription to activate updates.');
      } else if (result.isNew) {
        toast.success('You\'re subscribed! Check your inbox for a welcome note 💌');
      } else {
        toast.info('You\'re already subscribed — no need to sign up again!');
      }
      setEmail('');
      setName('');
      setInterests(['travel-style']);
      onClose();
    } catch (error: any) {
      console.error('[newsletter] subscription error:', error);
      if (error?.code === 'permission-denied') {
        toast.error('Subscription is currently unavailable. Please try again later.');
      } else if (error?.code === 'unavailable') {
        toast.error('No internet connection. Please check your connection and try again.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleDismiss() {
    logNewsletterEvent('dismiss', { path: window.location.pathname });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0" style={{ borderRadius: 'var(--radius-xl)' }}>
        <div
          className="relative flex h-28 items-center justify-center overflow-hidden"
          style={{ background: 'oklch(from var(--primary) l c h / 0.07)' }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 50%, var(--primary) 0%, transparent 60%), radial-gradient(circle at 80% 50%, oklch(0.76 0.09 78) 0%, transparent 60%)',
            }}
          />
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: 'oklch(from var(--primary) l c h / 0.15)', color: 'var(--primary)' }}
          >
            <Mail size={26} />
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
            style={{ background: 'oklch(from var(--foreground) l c h / 0.08)', color: 'var(--muted-foreground)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-8 pb-8 pt-5">
          <DialogHeader className="mb-1 text-left">
            <DialogTitle className="font-display text-2xl font-semibold" style={{ letterSpacing: '-0.015em' }}>
              Stay in the loop
            </DialogTitle>
          </DialogHeader>
          <p className="mb-6 text-sm" style={{ color: 'var(--muted-foreground)', maxWidth: '40ch' }}>
            Get the latest fashion tips, style guides, and exclusive content delivered to your inbox.
          </p>

          <div className="mb-6 rounded-2xl border border-border/60 bg-muted/40 p-4">
            <p className="font-medium text-sm">Included right away</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {PHASE4_LEAD_MAGNET.title}: {PHASE4_LEAD_MAGNET.description}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nl-email">Email <span style={{ color: 'var(--primary)' }}>*</span></Label>
              <Input
                id="nl-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nl-name">Name <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="nl-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your first name"
                autoComplete="given-name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>What should I send you most?</Label>
              <div className="flex flex-wrap gap-2">
                {NEWSLETTER_INTEREST_OPTIONS.map(option => {
                  const active = interests.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleInterest(option.id)}
                      className="rounded-full border px-3 py-1.5 text-sm transition-colors"
                      style={{
                        borderColor: active ? 'var(--primary)' : 'var(--border)',
                        background: active ? 'oklch(from var(--primary) l c h / 0.12)' : 'transparent',
                        color: active ? 'var(--primary)' : 'var(--foreground)',
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Subscribing...' : 'Subscribe'}
              </Button>
              <Button type="button" variant="outline" onClick={handleDismiss}>Not now</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
