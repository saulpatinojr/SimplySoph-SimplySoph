import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MetaTags from '@/components/MetaTags';
import { toast } from 'sonner';
import { Mail, Instagram, Youtube, Send, CheckCircle2, Loader2 } from 'lucide-react';

// Social media links — update these when real handles are confirmed
const SOCIAL = [
  {
    label: 'Email',
    value: 'hello@simplysoph.com',
    href: 'mailto:hello@simplysoph.com',
    icon: Mail,
  },
  {
    label: 'Instagram',
    value: '@simplysoph',
    href: 'https://instagram.com/simplysoph',
    icon: Instagram,
    external: true,
  },
  {
    label: 'YouTube',
    value: 'SimplySoph',
    href: 'https://youtube.com/@simplysoph',
    icon: Youtube,
    external: true,
  },
];

type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Sends the form via mailto: as the primary channel.
 * Optionally wire in EmailJS / Resend here once API keys are available.
 */
async function sendContactForm(data: FormData): Promise<void> {
  // ── Option A: EmailJS (wire VITE_EMAILJS_* env vars to enable) ──────────
  const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (serviceId && templateId && publicKey) {
    const emailjs = await import('@emailjs/browser');
    await emailjs.send(
      serviceId,
      templateId,
      {
        from_name:    data.name,
        from_email:   data.email,
        subject:      data.subject,
        message:      data.message,
      },
      publicKey
    );
    return;
  }

  // ── Option B: mailto: fallback ──────────────────────────────────────────
  // Opens the user's mail client pre-filled. Works without any backend.
  const body = encodeURIComponent(
    `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`
  );
  const subject = encodeURIComponent(data.subject || 'Contact from SimplySoph.com');
  window.location.href = `mailto:hello@simplysoph.com?subject=${subject}&body=${body}`;

  // Give the mailto: a moment to open before resolving
  await new Promise(r => setTimeout(r, 600));
}

export default function Contact() {
  const [form, setForm] = useState<FormData>({
    name:    '',
    email:   '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<FormState>('idle');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setStatus('submitting');
    try {
      await sendContactForm(form);
      setStatus('success');
      toast.success("Message sent! I'll get back to you soon 💌");
    } catch (err) {
      console.error('[contact] send error:', err);
      setStatus('error');
      toast.error('Something went wrong. Please try emailing directly at hello@simplysoph.com');
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Contact SimplySoph — Let's Connect & Create"
        description="Get in touch with SimplySoph for collaborations, brand partnerships, and creative opportunities."
        url="/contact"
      />
      <Navigation />

      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="gradient-bg py-20">
          <div className="container">
            <div className="max-w-2xl">
              <p
                className="text-xs font-sans font-semibold uppercase tracking-[0.18em] mb-3"
                style={{ color: 'var(--primary)' }}
              >
                Let's work together
              </p>
              <h1
                className="font-display text-5xl md:text-6xl font-semibold mb-4"
                style={{ letterSpacing: '-0.025em', lineHeight: 1.1 }}
              >
                Get in Touch
              </h1>
              <p className="text-lg" style={{ color: 'var(--muted-foreground)', maxWidth: '52ch' }}>
                Whether it's a collaboration, brand partnership, or just a friendly chat —
                I'd love to hear from you.
              </p>
            </div>
          </div>
        </section>

        {/* ── Content ─────────────────────────────────────────── */}
        <section className="py-16">
          <div className="container max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

              {/* Contact form — takes 3/5 width on desktop */}
              <div className="lg:col-span-3">
                <Card className="p-8">
                  {status === 'success' ? (
                    /* ── Success state ── */
                    <div className="py-12 flex flex-col items-center text-center gap-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                        style={{ background: 'oklch(from var(--primary) l c h / 0.10)' }}
                      >
                        <CheckCircle2 size={32} style={{ color: 'var(--primary)' }} />
                      </div>
                      <h2 className="font-display font-semibold text-2xl">Message sent!</h2>
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)', maxWidth: '40ch' }}>
                        Thanks for reaching out. I'll get back to you as soon as possible.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: '', message: '' }); }}
                      >
                        Send another message
                      </Button>
                    </div>
                  ) : (
                    /* ── Form ── */
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                      <h2 className="font-display font-semibold text-2xl mb-1">Send a Message</h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="name">
                            Name <span style={{ color: 'var(--primary)' }}>*</span>
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Your name"
                            required
                            disabled={status === 'submitting'}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="email">
                            Email <span style={{ color: 'var(--primary)' }}>*</span>
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                            disabled={status === 'submitting'}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={form.subject}
                          onChange={handleChange}
                          placeholder="What's this about?"
                          disabled={status === 'submitting'}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="message">
                          Message <span style={{ color: 'var(--primary)' }}>*</span>
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          placeholder="Tell me about your project, collaboration idea, or just say hi!"
                          rows={6}
                          required
                          disabled={status === 'submitting'}
                          className="resize-none"
                        />
                      </div>

                      {status === 'error' && (
                        <p className="text-sm" style={{ color: 'oklch(0.577 0.245 27.325)' }}>
                          Something went wrong. Please try emailing{' '}
                          <a href="mailto:hello@simplysoph.com" className="underline">
                            hello@simplysoph.com
                          </a>{' '}
                          directly.
                        </p>
                      )}

                      <Button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="w-full gap-2"
                        style={{ background: 'var(--primary)', color: 'white' }}
                      >
                        {status === 'submitting' ? (
                          <><Loader2 size={16} className="animate-spin" /> Sending…</>
                        ) : (
                          <><Send size={16} /> Send Message</>
                        )}
                      </Button>
                    </form>
                  )}
                </Card>
              </div>

              {/* Sidebar — 2/5 width on desktop */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-7">
                  <h3 className="font-display font-semibold text-xl mb-5">Connect Directly</h3>
                  <div className="space-y-3">
                    {SOCIAL.map(({ label, value, href, icon: Icon, external }) => (
                      <a
                        key={label}
                        href={href}
                        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="flex items-center gap-3 p-3.5 rounded-xl border transition-colors group"
                        style={{
                          borderColor: 'oklch(from var(--foreground) l c h / 0.08)',
                          background: 'var(--surface-1)',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
                          (e.currentTarget as HTMLElement).style.background = 'oklch(from var(--primary) l c h / 0.05)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'oklch(from var(--foreground) l c h / 0.08)';
                          (e.currentTarget as HTMLElement).style.background = 'var(--surface-1)';
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'oklch(from var(--primary) l c h / 0.10)', color: 'var(--primary)' }}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-sans font-semibold">{label}</div>
                          <div className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{value}</div>
                        </div>
                        <ArrowRight
                          size={14}
                          className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--primary)' }}
                        />
                      </a>
                    ))}
                  </div>
                </Card>

                <Card className="p-7">
                  <h3 className="font-display font-semibold text-xl mb-4">What I Do</h3>
                  <ul className="space-y-2.5">
                    {[
                      'Brand partnerships & sponsored content',
                      'Fashion styling & lookbooks',
                      'Social media content creation',
                      'Creative collaborations & photoshoots',
                      'Speaking engagements & events',
                    ].map(item => (
                      <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        <span className="mt-1 flex-shrink-0" style={{ color: 'var(--primary)' }}>✦</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Named import alias for ArrowRight used inside JSX
const ArrowRight = ({ size, className, style }: { size: number; className?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
