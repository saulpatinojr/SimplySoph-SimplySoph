import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Handshake, Info, Loader2, MapPin } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import ShopTheLook from "@/components/ShopTheLook";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  fetchLookBySlug,
  fetchPublishedDestinations,
  lookToGrowthLook,
} from "@/lib/content";

export default function LookDetail() {
  const params = useParams();
  const slug = params.slug ?? "";
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: look, isLoading } = useQuery({
    queryKey: ["looks", "detail", slug, isAdmin],
    queryFn: () => fetchLookBySlug(slug, { includeDrafts: isAdmin }),
    enabled: Boolean(slug),
  });

  const { data: destinations = [] } = useQuery({
    queryKey: ["destinations", "published"],
    queryFn: () => fetchPublishedDestinations(),
    enabled: Boolean(look?.destinationSlug),
  });
  const wornIn = destinations.find(d => d.slug === look?.destinationSlug);

  const growthLook = useMemo(
    () => (look ? lookToGrowthLook(look) : null),
    [look]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!look) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 py-32 text-center">
          <h1 className="font-heading text-3xl font-bold">
            This look is off the rack
          </h1>
          <p className="text-muted-foreground">
            The outfit you're looking for isn't in the lookbook.
          </p>
          <Link href="/looks">
            <Button variant="outline" className="gap-2">
              <ArrowLeft size={16} /> Back to Looks
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title={`${look.title} — Looks | SimplySoph`}
        description={
          look.subtitle ||
          look.body?.slice(0, 150) ||
          `Shop the "${look.title}" look from SimplySoph.`
        }
        url={`/looks/${look.slug}`}
        image={look.heroImageUrl}
      />
      <Navigation />

      <main className="flex-1 py-16 md:py-24">
        <div className="container max-w-5xl space-y-10">
          <Link href="/looks">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} /> All looks
            </Button>
          </Link>

          <header className="space-y-3 text-center">
            <h1 className="font-heading text-4xl font-bold md:text-5xl">
              {look.title}
            </h1>
            {look.subtitle && (
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                {look.subtitle}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              {look.season && (
                <span className="rounded-full border border-border/60 px-3 py-1 capitalize">
                  {look.season}
                </span>
              )}
              {look.occasionTags.map(tag => (
                <span
                  key={tag}
                  className="rounded-full border border-border/60 px-3 py-1 capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>

          {look.body && (
            <p className="mx-auto max-w-2xl whitespace-pre-line leading-relaxed text-muted-foreground">
              {look.body}
            </p>
          )}

          {wornIn && (
            <Link href={`/passport/${wornIn.slug}`}>
              <div className="group mx-auto flex max-w-md cursor-pointer items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-5 transition-shadow hover:shadow-lg">
                <MapPin size={18} className="shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Worn in
                  </p>
                  <p className="font-heading text-lg font-bold">
                    {wornIn.city}
                    {wornIn.country ? `, ${wornIn.country}` : ""}
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* Affiliate disclosure above products */}
          {look.products.length > 0 && (
            <div className="mx-auto flex max-w-3xl items-start gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
              <p>
                {look.affiliateDisclosure ||
                  "Some links below are affiliate links — I may earn a small commission at no extra cost to you."}
              </p>
            </div>
          )}

          {growthLook && <ShopTheLook look={growthLook} />}

          {look.gallery.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-heading text-2xl font-bold">More angles</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {look.gallery.map(photo => (
                  <div
                    key={photo.url}
                    className="aspect-3/4 overflow-hidden rounded-2xl border border-border/60 bg-white/5"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || look.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Collab CTA */}
          <section className="rounded-3xl border border-border/60 bg-card/80 p-8 text-center">
            <p className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.25em] text-primary/90">
              <Handshake size={14} aria-hidden /> For brands
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold">
              Want your pieces styled like this?
            </h2>
            <Link href="/media-kit#partnership-inquiry">
              <Button className="mt-4">Start a collaboration</Button>
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
