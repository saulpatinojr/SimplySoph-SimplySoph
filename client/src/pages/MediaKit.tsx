import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Users,
  TrendingUp,
  Mail,
  Instagram,
  Youtube,
  Sparkles,
  Download,
  ExternalLink,
} from "lucide-react";

const stats = [
  { label: "Combined Followers", value: "50K+", icon: Users },
  { label: "Monthly Impressions", value: "200K+", icon: TrendingUp },
  { label: "Engagement Rate", value: "8.5%", icon: Sparkles },
  { label: "Content Pieces/Month", value: "30+", icon: Camera },
];

const services = [
  {
    title: "Sponsored Posts",
    description:
      "Authentic, styled content showcasing your brand across my platforms.",
    includes: ["2 Instagram posts", "3 Stories", "1 Blog feature"],
  },
  {
    title: "Brand Ambassadorship",
    description:
      "Long-term partnership integrating your brand into my content ecosystem.",
    includes: [
      "Monthly content cadence",
      "Exclusive event attendance",
      "Product launches",
    ],
  },
  {
    title: "Content Creation",
    description:
      "Professional photo and video content for your brand's own channels.",
    includes: [
      "Shot list collaboration",
      "Professional editing",
      "Usage rights",
    ],
  },
  {
    title: "Event Coverage",
    description:
      "Live event coverage and content creation for launches and activations.",
    includes: [
      "Real-time Stories/TikTok",
      "Post-event recap content",
      "Blog write-up",
    ],
  },
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

export default function MediaKit() {
  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Media Kit - SimplySoph Brand Partnerships"
        description="Partner with SimplySoph for authentic fashion and lifestyle content. View stats, services, and collaboration opportunities."
        url="/media-kit"
      />
      <Navigation />

      <main className="flex-1">
        {/* Hero */}
        <section className="gradient-bg py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-heading font-bold mb-4 tracking-tight">
                media kit
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                let's create something beautiful together ✨
              </p>
              <a href="mailto:hello@simplysoph.com">
                <Button className="btn-gold text-white gap-2">
                  <Mail size={16} />
                  Get in Touch
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-2xl font-heading font-bold text-center mb-10">
              By the Numbers
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map(stat => (
                <Card
                  key={stat.label}
                  className="p-6 text-center hover:shadow-lg transition-shadow"
                >
                  <stat.icon size={28} className="mx-auto text-primary mb-3" />
                  <div className="text-3xl font-bold font-heading mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <h2 className="text-2xl font-heading font-bold text-center mb-10">
              Collaboration Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {services.map(service => (
                <Card key={service.title} className="p-8">
                  <h3 className="text-xl font-heading font-bold mb-2">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {service.description}
                  </p>
                  <ul className="space-y-2">
                    {service.includes.map(item => (
                      <li
                        key={item}
                        className="text-sm flex items-center gap-2"
                      >
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

        {/* Platforms */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-2xl font-heading font-bold text-center mb-10">
              Where to Find Me
            </h2>
            <div className="flex flex-wrap justify-center gap-6">
              {platforms.map(p => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Card className="p-6 text-center hover:shadow-lg transition-shadow min-w-[180px]">
                    <p.icon
                      size={32}
                      className="mx-auto text-primary mb-3 group-hover:scale-110 transition-transform"
                    />
                    <div className="font-bold">{p.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {p.handle}
                    </div>
                    <ExternalLink
                      size={12}
                      className="mx-auto mt-2 text-muted-foreground"
                    />
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <Card className="max-w-2xl mx-auto p-10 text-center">
              <h2 className="text-2xl font-heading font-bold mb-4">
                Ready to Collaborate?
              </h2>
              <p className="text-muted-foreground mb-6">
                I'm always looking for exciting new partnerships. Let's make
                something amazing together.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <a href="mailto:hello@simplysoph.com">
                  <Button className="btn-gold text-white gap-2">
                    <Mail size={16} />
                    Email Me
                  </Button>
                </a>
                <a href="/contact">
                  <Button variant="outline" className="gap-2">
                    Contact Form
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
