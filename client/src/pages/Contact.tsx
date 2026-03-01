import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import {
  Mail,
  Instagram,
  Youtube,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { submitContactMessage } from "@/lib/content";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    const result = await submitContactMessage(form);
    if (result.success) {
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } else {
      setStatus("error");
      setErrorMsg(result.error || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Contact SimplySoph - Let's Connect & Create"
        description="Get in touch with SimplySoph for collaborations, brand partnerships, and creative opportunities. Let's create something amazing together."
        url="/contact"
      />
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="gradient-bg py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                Get in Touch
              </h1>
              <p className="text-lg text-muted-foreground">
                Let's connect and create something amazing together
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="container max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <div className="space-y-6">
                <Card className="p-8">
                  <h2 className="text-2xl font-heading font-bold mb-6">
                    Send a Message
                  </h2>
                  {status === "success" ? (
                    <div className="text-center py-8 space-y-3">
                      <CheckCircle
                        size={48}
                        className="mx-auto text-green-500"
                      />
                      <p className="font-medium text-lg">Message sent!</p>
                      <p className="text-sm text-muted-foreground">
                        I'll get back to you within 24-48 hours.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setStatus("idle")}
                        className="mt-4"
                      >
                        Send another message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="contact-name"
                          className="text-sm font-medium block mb-1"
                        >
                          Name *
                        </label>
                        <Input
                          id="contact-name"
                          value={form.name}
                          onChange={e =>
                            setForm(f => ({ ...f, name: e.target.value }))
                          }
                          required
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="contact-email"
                          className="text-sm font-medium block mb-1"
                        >
                          Email *
                        </label>
                        <Input
                          id="contact-email"
                          type="email"
                          value={form.email}
                          onChange={e =>
                            setForm(f => ({ ...f, email: e.target.value }))
                          }
                          required
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="contact-subject"
                          className="text-sm font-medium block mb-1"
                        >
                          Subject
                        </label>
                        <Input
                          id="contact-subject"
                          value={form.subject}
                          onChange={e =>
                            setForm(f => ({ ...f, subject: e.target.value }))
                          }
                          placeholder="What's this about?"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="contact-message"
                          className="text-sm font-medium block mb-1"
                        >
                          Message *
                        </label>
                        <textarea
                          id="contact-message"
                          value={form.message}
                          onChange={e =>
                            setForm(f => ({ ...f, message: e.target.value }))
                          }
                          required
                          rows={5}
                          placeholder="Tell me about your idea..."
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        />
                      </div>
                      {status === "error" && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle size={14} /> {errorMsg}
                        </p>
                      )}
                      <Button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full btn-gold text-white gap-2"
                      >
                        <Send size={16} />
                        {status === "loading" ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  )}
                </Card>
              </div>

              {/* Contact Info & What I Do */}
              <div className="space-y-6">
                <Card className="p-8">
                  <h3 className="font-heading font-bold text-xl mb-4">
                    Connect With Me
                  </h3>
                  <div className="space-y-3">
                    <a
                      href="mailto:hello@simplysoph.com"
                      className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Mail size={20} />
                      </div>
                      <div>
                        <div className="font-medium">Email</div>
                        <div className="text-sm text-muted-foreground">
                          hello@simplysoph.com
                        </div>
                      </div>
                    </a>
                    <a
                      href="https://www.instagram.com/smply.soph"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Instagram size={20} />
                      </div>
                      <div>
                        <div className="font-medium">Instagram</div>
                        <div className="text-sm text-muted-foreground">
                          @smply.soph
                        </div>
                      </div>
                    </a>
                    <a
                      href="https://www.youtube.com/@smply.soph"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Youtube size={20} />
                      </div>
                      <div>
                        <div className="font-medium">YouTube</div>
                        <div className="text-sm text-muted-foreground">
                          @smply.soph
                        </div>
                      </div>
                    </a>
                  </div>
                </Card>

                <Card className="p-8">
                  <h3 className="font-heading font-bold text-xl mb-4">
                    What I Do
                  </h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Brand partnerships and sponsored content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Fashion and beauty collaborations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Content creation and photography</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Speaking engagements and events</span>
                    </li>
                  </ul>
                </Card>

                <Card className="p-8 gradient-bg">
                  <h3 className="font-heading font-bold text-xl mb-4">
                    Response Time
                  </h3>
                  <p className="text-muted-foreground">
                    I typically respond to emails and messages within 24-48
                    hours. For urgent inquiries, please mention "URGENT" in your
                    subject line.
                  </p>
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
