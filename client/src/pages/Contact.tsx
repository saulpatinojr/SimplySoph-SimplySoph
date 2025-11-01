import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Mail, Instagram, Youtube } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
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
              {/* Contact Info */}
              <div className="space-y-6">
                <Card className="p-8">
                  <h2 className="text-2xl font-heading font-bold mb-6">Let's Collaborate</h2>
                  <p className="text-muted-foreground mb-6">
                    I'm always excited to work with brands, fellow creators, and anyone passionate 
                    about fashion and creativity. Whether it's a collaboration, sponsorship, or just 
                    a friendly chat, I'd love to hear from you!
                  </p>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Connect With Me</h3>
                    
                    <a 
                      href="mailto:hello@simplysoph.com" 
                      className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Mail size={20} />
                      </div>
                      <div>
                        <div className="font-medium">Email</div>
                        <div className="text-sm text-muted-foreground">hello@simplysoph.com</div>
                      </div>
                    </a>

                    <a 
                      href="https://instagram.com" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Instagram size={20} />
                      </div>
                      <div>
                        <div className="font-medium">Instagram</div>
                        <div className="text-sm text-muted-foreground">@simplysoph</div>
                      </div>
                    </a>

                    <a 
                      href="https://youtube.com" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Youtube size={20} />
                      </div>
                      <div>
                        <div className="font-medium">YouTube</div>
                        <div className="text-sm text-muted-foreground">SimplySoph</div>
                      </div>
                    </a>
                  </div>
                </Card>
              </div>

              {/* Quick Info */}
              <div className="space-y-6">
                <Card className="p-8">
                  <h3 className="font-heading font-bold text-xl mb-4">What I Do</h3>
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
                  <h3 className="font-heading font-bold text-xl mb-4">Response Time</h3>
                  <p className="text-muted-foreground">
                    I typically respond to emails and messages within 24-48 hours. For urgent 
                    inquiries, please mention "URGENT" in your subject line.
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
