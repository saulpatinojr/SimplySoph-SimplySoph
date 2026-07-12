import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Mail,
  Instagram,
  Youtube,
  Sparkles,
  ExternalLink,
  Briefcase,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { MEDIA_KIT_OFFERINGS, MEDIA_KIT_PROOF_POINTS } from "@/lib/services/growth";
import MediaKitInquiryForm from "@/components/MediaKitInquiryForm";

const proofChips = [
  { label: "Travel + style storytelling", icon: MapPin },
  { label: "Multi-format deliverables", icon: Camera },
  { label: "Conversion-minded product placement", icon: Briefcase },
  { label: "Clear disclosure workflow", icon: CheckCircle2 },
];

const platforms = [
  {
    name: "Instagram",
    handle: "@smply.soph",
    url: "https://www.instagram.com/smply.soph",
    icon: Instagram,
  },
  {
    name: "YouTube",
    handle: "@smply.soph",
    url: "https://www.youtube.com/@smply.soph",
    icon: Youtube,
  },
  {
    name: "TikTok",
    handle: "@smply.soph",
    url: "https://www.tiktok.com/@smply.soph",
    icon: Camera,
  },
];

export default function MediaKitPageContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Media Kit - SimplySoph Brand Partnerships"
        description="Partner with SimplySoph for authentic fashion and lifestyle content. View services, collaboration options, and inquiry details."
        url="/media-kit"
      />
      <Navigation />

      <main className="flex-1">
        <section className="gradient-bg py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-heading font-bold mb-4 tracking-tight">
                media kit
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                creator-led travel, style, and brand storytelling built for more than one format ✨
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a href="#partnership-inquiry">
                  <Button className="btn-gold text-white gap-2">
                    <Mail size={16} />
                    Start a Partnership Inquiry
                  </Button>
                </a>
                <a href="mailto:hello@simplysoph.com?subject=Media%20Kit%20Request">
                  <Button variant="outline" className="gap-2">
                    Request one-sheet
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container">
            <h2 className="text-2xl font-heading font-bold text-center mb-10">
              Why brands brief here
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {proofChips.map(stat => (
                <Card
                  key={stat.label}
                  className="p-6 text-center hover:shadow-lg transition-shadow"
                >
                  <stat.icon size={28} className="mx-auto text-primary mb-3" />
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container">
            <h2 className="text-2xl font-heading font-bold text-center mb-10">
              Collaboration Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {MEDIA_KIT_OFFERINGS.map(service => (
                <Card key={service.title} className="p-8">
                  <h3 className="text-xl font-heading font-bold mb-2">{service.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{service.description}</p>
                  <ul className="space-y-2">
                    {service.outcomes.map(item => (
                      <li key={item} className="text-sm flex items-center gap-2">
                        <Sparkles size={12} className="text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container max-w-5xl">
            <div className="grid gap-6 md:grid-cols-2">
              {MEDIA_KIT_PROOF_POINTS.map(point => (
                <Card key={point.title} className="p-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Sparkles size={14} /> {point.title}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{point.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container">
            <h2 className="text-2xl font-heading font-bold text-center mb-10">
              Where to Find Me
            </h2>
            <div className="flex flex-wrap justify-center gap-6">
              {platforms.map(platform => (
                <a
                  key={platform.name}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Card className="p-6 text-center hover:shadow-lg transition-shadow min-w-[180px]">
                    <platform.icon
                      size={32}
                      className="mx-auto text-primary mb-3 group-hover:scale-110 transition-transform"
                    />
                    <div className="font-bold">{platform.name}</div>
                    <div className="text-sm text-muted-foreground">{platform.handle}</div>
                    <ExternalLink size={12} className="mx-auto mt-2 text-muted-foreground" />
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="partnership-inquiry" className="py-16 bg-muted/30">
          <div className="container">
            <Card className="max-w-3xl mx-auto p-10">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-heading font-bold mb-3">
                  Start a partnership inquiry
                </h2>
                <p className="text-muted-foreground">
                  Share your timeline, platform needs, and launch context. I’ll reply with fit, deliverable ideas, and next steps.
                </p>
              </div>
              <MediaKitInquiryForm />
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
