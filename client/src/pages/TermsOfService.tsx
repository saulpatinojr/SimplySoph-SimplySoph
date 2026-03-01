import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import { Card } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Terms of Service - SimplySoph"
        description="Terms of Service for SimplySoph."
        url="/terms-of-service"
      />
      <Navigation />

      <main className="flex-1">
        <section className="gradient-bg py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-heading font-bold mb-4 tracking-tight">
                terms of service
              </h1>
              <p className="text-lg text-muted-foreground">
                The rules of the road for SimplySoph
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container max-w-4xl">
            <Card className="p-8 md:p-12">
              <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
                <p>
                  <strong>Last Updated: February 28, 2026</strong>
                </p>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                    1. Acceptance of Terms
                  </h2>
                  <p>
                    By accessing or using SimplySoph (simplysoph.com), you agree
                    to be bound by these Terms of Service. If you do not agree
                    to these terms, please do not use our website.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                    2. Use of Service
                  </h2>
                  <p>
                    Our service is provided for your personal, non-commercial
                    use. You agree not to use the service for any illegal or
                    unauthorized purpose.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                    3. User Content
                  </h2>
                  <p>
                    When you interact with our platform, you remain the owner of
                    any content you provide. However, you grant us a license to
                    use, display, and distribute such content as necessary to
                    provide the service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                    4. Intellectual Property
                  </h2>
                  <p>
                    All content on this website, including text, graphics,
                    logos, and images, is the property of SimplySoph or its
                    content creators and is protected by intellectual property
                    laws.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                    5. Limitation of Liability
                  </h2>
                  <p>
                    SimplySoph and its creators shall not be liable for any
                    direct, indirect, incidental, or consequential damages
                    resulting from your use of the service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                    6. Changes to Terms
                  </h2>
                  <p>
                    We reserve the right to modify these terms at any time. Your
                    continued use of the website after any such changes
                    constitutes your acceptance of the new terms.
                  </p>
                </section>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
