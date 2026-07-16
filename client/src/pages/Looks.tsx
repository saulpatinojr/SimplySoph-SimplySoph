import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Handshake, Info, Loader2, MapPin } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { MEDIA_KIT_OFFERINGS } from "@/lib/services/growth";
import {
  fetchAllLooks,
  fetchPublishedLooks,
  filterLooks,
  listLookOccasions,
  Look,
  LookSeason,
} from "@/lib/content";

const SEASONS: LookSeason[] = ["spring", "summer", "autumn", "winter"];

function LookCard({ look }: { look: Look }) {
  return (
    <Link href={`/looks/${look.slug}`}>
      <div className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-card/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        {look.status === "draft" && (
          <div className="absolute right-3 top-3 z-10 rounded-full border border-yellow-300/50 bg-yellow-500/90 px-2 py-1 text-[10px] font-bold uppercase text-yellow-50 shadow-lg">
            DRAFT
          </div>
        )}
        <div className="aspect-3/4 overflow-hidden bg-muted">
          {look.heroImageUrl ? (
            <img
              src={look.heroImageUrl}
              alt={look.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl">
              👗
            </div>
          )}
        </div>
        <div className="space-y-1.5 p-4">
          <h3 className="font-heading text-lg font-bold leading-tight">
            {look.title}
          </h3>
          {look.subtitle && (
            <p className="line-clamp-1 text-sm text-muted-foreground">
              {look.subtitle}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            {look.season && <span>{look.season}</span>}
            {look.occasionTags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="rounded-full border border-border/60 px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
            {look.products.length > 0 && (
              <span className="ml-auto text-primary">
                shop {look.products.length}{" "}
                {look.products.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Looks() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [seasonFilter, setSeasonFilter] = useState<LookSeason | "">("");
  const [occasionFilter, setOccasionFilter] = useState("");

  const { data: looks = [], isLoading } = useQuery({
    queryKey: ["looks", isAdmin ? "all" : "published"],
    queryFn: () => (isAdmin ? fetchAllLooks() : fetchPublishedLooks()),
  });

  const occasions = useMemo(() => listLookOccasions(looks), [looks]);
  const filtered = useMemo(
    () =>
      filterLooks(looks, {
        season: seasonFilter || undefined,
        occasion: occasionFilter || undefined,
      }),
    [looks, seasonFilter, occasionFilter]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Looks | SimplySoph"
        description="What I wore, where I wore it, and where to get it — shoppable outfits from every trip and season."
        url="/looks"
        image={looks[0]?.heroImageUrl}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "SimplySoph Looks",
            description:
              "A shoppable lookbook of outfits worn across SimplySoph trips and seasons.",
            hasPart: filtered.map(look => ({
              "@type": "CreativeWork",
              name: look.title,
              url: `https://simplysoph.com/looks/${look.slug}`,
            })),
          })}
        </script>
      </Helmet>
      <Navigation />

      <main className="flex-1 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),rgba(10,10,12,0))]" />

        <div className="container max-w-6xl">
          <div className="text-center mb-10 space-y-4">
            <h1 className="text-5xl md:text-7xl font-heading font-bold">
              Looks
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              What I wore, where I wore it, and where to get it.
            </p>
          </div>

          {/* Affiliate disclosure — always visible above the grid */}
          <div className="mx-auto mb-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
            <p>
              Some product links on this page are affiliate links — if you shop
              through them I may earn a small commission at no extra cost to
              you. Thank you for supporting SimplySoph!
            </p>
          </div>

          {/* Filters */}
          <div className="mb-12 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant={!seasonFilter && !occasionFilter ? "default" : "outline"}
              onClick={() => {
                setSeasonFilter("");
                setOccasionFilter("");
              }}
            >
              All looks
            </Button>
            {SEASONS.map(season => (
              <Button
                key={season}
                type="button"
                variant={seasonFilter === season ? "default" : "outline"}
                onClick={() =>
                  setSeasonFilter(current => (current === season ? "" : season))
                }
                className="capitalize"
              >
                {season}
              </Button>
            ))}
            {occasions.map(occasion => (
              <Button
                key={occasion}
                type="button"
                size="sm"
                variant={occasionFilter === occasion ? "default" : "outline"}
                onClick={() =>
                  setOccasionFilter(current =>
                    current === occasion ? "" : occasion
                  )
                }
                className="capitalize"
              >
                {occasion}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-32 text-muted-foreground border border-dashed border-white/10 rounded-3xl p-12">
              {looks.length === 0
                ? "The lookbook is being styled — first outfits landing soon!"
                : "No looks matched that filter."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(look => (
                <LookCard key={look.id} look={look} />
              ))}
            </div>
          )}

          {/* Collab CTA band */}
          <section className="mt-20 rounded-3xl border border-border/60 bg-card/80 p-8 md:p-12">
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              <p className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.25em] text-primary/90">
                <Handshake size={14} aria-hidden /> For brands
              </p>
              <h2 className="font-heading text-3xl font-bold">
                Style your next launch with SimplySoph
              </h2>
              <div className="grid gap-4 text-left md:grid-cols-2">
                {MEDIA_KIT_OFFERINGS.slice(0, 2).map(offering => (
                  <div
                    key={offering.title}
                    className="rounded-2xl border border-border/60 bg-muted/30 p-5"
                  >
                    <h3 className="font-heading font-semibold">
                      {offering.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {offering.description}
                    </p>
                  </div>
                ))}
              </div>
              <Link href="/media-kit#partnership-inquiry">
                <Button size="lg" className="gap-2">
                  <MapPin size={16} aria-hidden /> Start a collaboration
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
