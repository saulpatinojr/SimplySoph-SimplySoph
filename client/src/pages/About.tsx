import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Sparkles, Heart, Camera } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Header */}
        <section className="gradient-bg py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                About Me
              </h1>
              <p className="text-lg text-muted-foreground">
                Fashion creator, style enthusiast, and creative storyteller
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="container max-w-4xl">
            <div className="space-y-12">
              {/* Intro */}
              <Card className="p-8 md:p-12">
                <h2 className="text-3xl font-heading font-bold mb-6">Hey there! 👋</h2>
                <div className="prose prose-lg max-w-none space-y-4 text-muted-foreground">
                  <p>
                    Welcome to my creative space! I'm a fashion content creator passionate about 
                    helping others discover their unique style and express themselves through fashion.
                  </p>
                  <p>
                    Through this platform, I share my journey in the world of fashion, beauty, and 
                    lifestyle. From style tips and trend forecasts to behind-the-scenes glimpses of 
                    my creative process, you'll find it all here.
                  </p>
                  <p>
                    My mission is to make fashion accessible, fun, and empowering for everyone. 
                    Whether you're looking for outfit inspiration, beauty recommendations, or just 
                    want to connect with a like-minded community, you're in the right place!
                  </p>
                </div>
              </Card>

              {/* Values */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">Authenticity</h3>
                  <p className="text-sm text-muted-foreground">
                    Real content, real style, real me. No filters on personality!
                  </p>
                </Card>

                <Card className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
                    <Heart size={24} />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">Community</h3>
                  <p className="text-sm text-muted-foreground">
                    Building a supportive space where everyone feels welcome
                  </p>
                </Card>

                <Card className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <Camera size={24} />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">Creativity</h3>
                  <p className="text-sm text-muted-foreground">
                    Pushing boundaries and exploring new ways to express style
                  </p>
                </Card>
              </div>

              {/* CTA */}
              <Card className="p-8 md:p-12 text-center gradient-bg">
                <h2 className="text-2xl font-heading font-bold mb-4">Let's Connect!</h2>
                <p className="text-muted-foreground mb-6">
                  Want to collaborate or just say hi? I'd love to hear from you!
                </p>
                <a href="/contact" className="inline-block">
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
                    Get in Touch
                  </button>
                </a>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
