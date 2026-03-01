import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import { Card } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Privacy Policy - SimplySoph"
        description="Privacy Policy for SimplySoph."
        url="/privacy-policy"
      />
      <Navigation />

      <main className="flex-1">
        <section className="gradient-bg py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-heading font-bold mb-4 tracking-tight">
                privacy policy
              </h1>
              <p className="text-lg text-muted-foreground">
                How we handle your information at SimplySoph
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
                    1. Introduction
                  </h2>
                  <p>
                    SimplySoph ("we," "our," or "us") is committed to protecting
                    your privacy. This Privacy Policy explains how we collect,
                    use, and safeguard your information when you visit our
                    website simplysoph.com and use our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                    2. Information We Collect
                  </h2>
                  <p>
                    We collect information that you provide directly to us, such
                    as when you sign in using Google or Microsoft, subscribe to
                    our newsletter, or contact us. This may include:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      Name and email address provided by your identity provider
                      (Google/Microsoft).
                    </li>
                    <li>Profile information and preferences.</li>
                    <li>Communications and feedback you send to us.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                    3. How We Use Your Information
                  </h2>
                  <p>We use your information to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide and maintain our services.</li>
                    <li>Personalize your experience on our platform.</li>
                    <li>
                      Communicate with you about updates, features, and
                      promotions.
                    </li>
                    <li>Analyze usage to improve our website and content.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                    4. Google API Disclosure
                  </h2>
                  <p>
                    SimplySoph uses Google APIs to provide authentication
                    services. When you sign in using Google, we access your
                    basic profile information (name, email address, and profile
                    picture). We use this data solely to create and manage your
                    user account and personalize your experience.
                  </p>
                  <p className="mt-2 italic">
                    SimplySoph's use and transfer to any other app of
                    information received from Google APIs will adhere to{" "}
                    <a
                      href="https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Google API Service User Data Policy
                    </a>
                    , including the Limited Use requirements.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                    5. Data Sharing and Security
                  </h2>
                  <p>
                    We do not sell your personal information. We only share data
                    with third-party service providers (like Firebase) as
                    necessary to provide our services. We implement reasonable
                    security measures to protect your data.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                    6. Limited Use Disclosure
                  </h2>
                  <p>
                    Our use of information received from Google APIs will adhere
                    to the Google API Service User Data Policy, including the
                    Limited Use requirements. We do not share this data with
                    third-party AI models or use it for advertising purposes.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                    7. Contact Us
                  </h2>
                  <p>
                    If you have any questions about this Privacy Policy, please
                    contact us at sophia@simplysoph.com.
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
