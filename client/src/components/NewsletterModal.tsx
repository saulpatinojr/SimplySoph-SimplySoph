import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { subscribeToNewsletter } from '@/lib/newsletter';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setSubmitting(true);
    try {
      await subscribeToNewsletter(email.trim(), name.trim());
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
export function useNewsletterModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const subscribed = localStorage.getItem('newsletter_subscribed');
    const dismissed = localStorage.getItem('newsletter_dismissed');
    
    if (subscribed) return;

    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < thirtyDays) return;
    }

    // Show after 10 seconds on first visit
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return { isOpen, setIsOpen };
}
