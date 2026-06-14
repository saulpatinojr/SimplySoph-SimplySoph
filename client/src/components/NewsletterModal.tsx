import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { subscribeToNewsletter } from '@/lib/newsletter';
import { logNewsletterEvent } from '@/lib/analytics';
import { Mail, X } from 'lucide-react';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

let _subscribedInSession = false;
let _dismissedAtTimestamp = 0;
const SESSION_COOLDOWN_MS = 30 * 60 * 1000;

/**
 * Convenience hook — manages open/close state for NewsletterModal.
 * Usage: const { isOpen, open, close } = useNewsletterModal();
 */
export function useNewsletterModal() {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    open:  () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}

export function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      await subscribeToNewsletter(email.trim(), name.trim() || undefined);
      logNewsletterEvent('submit', { path: window.location.pathname });
      _subscribedInSession = true;
      toast.success('You\'re subscribed! Check your inbox for a welcome note 💌');
      setEmail('');
      setName('');
      onClose();
    } catch (error: any) {
      console.error('[newsletter] subscription error:', error);
      if (error instanceof Error && error.message === 'Already subscribed') {
        _subscribedInSession = true;
        toast.info('You\'re already subscribed — no need to sign up again!');
        onClose();
      } else if (error?.code === 'permission-denied') {
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
    _dismissedAtTimestamp = Date.now();
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
