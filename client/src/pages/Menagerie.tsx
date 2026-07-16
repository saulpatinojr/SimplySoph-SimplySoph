import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Loader2, PawPrint, Plane, Sparkles } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  fetchAllPlushies,
  fetchPublishedPlushies,
  filterPlushies,
  getDailySpotlight,
  getMenagerieStats,
  listPlushSpecies,
  Plush,
  PlushSize,
} from "@/lib/content";

const SIZES: PlushSize[] = ["tiny", "small", "medium", "large", "huge"];

/** The stamped wax-seal accent — first palette color, else site primary. */
function sealColor(plush: Plush): string {
  return plush.colorPalette?.[0] || "var(--primary)";
}

function CertificateCard({ plush }: { plush: Plush }) {
  return (
    <Link href={`/menagerie/${plush.slug}`}>
      <div className="group relative flex h-full cursor-pointer flex-col rounded-2xl border border-border/60 bg-card/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        {plush.status === "draft" && (
          <div className="absolute -top-3 -right-3 z-10 rounded-full border border-yellow-300/50 bg-yellow-500/90 px-2 py-1 text-[10px] font-bold uppercase text-yellow-50 shadow-lg">
            DRAFT
          </div>
        )}
        <p className="text-center font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Certificate of Adoption
        </p>
        <div className="relative mx-auto mt-4 h-40 w-40 overflow-hidden rounded-full border-4 border-white/10 bg-white/5 shadow-2xl">
          {plush.heroPhoto?.url ? (
            <img
              src={plush.heroPhoto.thumbnailUrl || plush.heroPhoto.url}
              alt={plush.name}
              loading="lazy"
              className="h-full w-full object-cover transition-all group-hover:brightness-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl">
              🧸
            </div>
          )}
        </div>
        <div className="mt-4 space-y-1 text-center">
          <h3 className="font-heading text-xl font-bold uppercase tracking-widest">
            {plush.name}
          </h3>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary/90">
            {plush.species}
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Adopted{" "}
            {plush.adoptionDate.toLocaleDateString(undefined, {
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-4">
          {plush.travelsWithMe ? (
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Plane size={11} aria-hidden /> travel buddy
            </span>
          ) : (
            <span />
          )}
          {/* Wax-seal stamp */}
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/20 text-[8px] font-black uppercase text-white/80 shadow-inner"
            style={{ background: sealColor(plush) }}
          >
            SS
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Menagerie() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState<PlushSize | "">("");
  const [travelOnly, setTravelOnly] = useState(false);

  const { data: plushies = [], isLoading } = useQuery({
    queryKey: ["menagerie", isAdmin ? "all" : "published"],
    queryFn: () => (isAdmin ? fetchAllPlushies() : fetchPublishedPlushies()),
  });

  const species = useMemo(() => listPlushSpecies(plushies), [plushies]);
  const stats = useMemo(() => getMenagerieStats(plushies), [plushies]);
  const spotlight = useMemo(
    () => getDailySpotlight(plushies, new Date()),
    [plushies]
  );

  const filtered = useMemo(
    () =>
      filterPlushies(plushies, {
        search,
        species: speciesFilter || undefined,
        size: sizeFilter || undefined,
        travelBuddiesOnly: travelOnly,
      }),
    [plushies, search, speciesFilter, sizeFilter, travelOnly]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="The Menagerie | SimplySoph"
        description="Meet the Jellycat crew — every plush adopted into the SimplySoph family, with their stories, personalities, and travel stamps."
        url="/menagerie"
        image={spotlight?.heroPhoto?.url}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "The SimplySoph Menagerie",
            description:
              "A collection of adopted Jellycat plushies with adoption certificates, origin stories, and travel history.",
            hasPart: filtered.map(plush => ({
              "@type": "CreativeWork",
              name: plush.name,
              url: `https://simplysoph.com/menagerie/${plush.slug}`,
            })),
          })}
        </script>
      </Helmet>
      <Navigation />

      <main className="flex-1 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),rgba(10,10,12,0))]" />

        <div className="container max-w-6xl">
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-5xl md:text-7xl font-heading font-bold">
              The Menagerie
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Every Jellycat here was formally adopted, named, and issued a
              certificate. Meet the whole soft-hearted crew.
            </p>
          </div>

          {/* Collection stats strip */}
          {!isLoading && stats.total > 0 && (
            <div className="mx-auto mb-10 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
              {[
                [String(stats.total), "plushies adopted"],
                [String(stats.speciesCount), "species"],
                [
                  stats.memberSinceYear ? `since ${stats.memberSinceYear}` : "—",
                  "growing the family",
                ],
                [String(stats.travelBuddyCount), "travel buddies"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border/60 bg-card/80 p-4 text-center"
                >
                  <div className="font-heading text-2xl font-bold">{value}</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Today's spotlight */}
          {spotlight && (
            <Link href={`/menagerie/${spotlight.slug}`}>
              <div className="group mx-auto mb-12 flex max-w-3xl cursor-pointer items-center gap-6 rounded-3xl border border-border/60 bg-card/80 p-6 transition-shadow hover:shadow-xl">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white/10 bg-white/5">
                  {spotlight.heroPhoto?.url ? (
                    <img
                      src={
                        spotlight.heroPhoto.thumbnailUrl ||
                        spotlight.heroPhoto.url
                      }
                      alt={spotlight.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">
                      🧸
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-primary/90">
                    <Sparkles size={12} aria-hidden /> Today's spotlight
                  </p>
                  <h2 className="font-heading text-2xl font-bold">
                    {spotlight.name}
                  </h2>
                  <p className="truncate text-sm text-muted-foreground">
                    {spotlight.originStory ||
                      `${spotlight.species}, adopted ${spotlight.adoptionDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}.`}
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* Filters */}
          <div className="mx-auto mb-12 grid max-w-3xl gap-3 rounded-3xl border border-border/60 bg-card/80 p-4 md:grid-cols-[1.6fr_1fr_1fr_auto] md:p-5">
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search by name, species, or personality"
              aria-label="Search the menagerie"
            />
            <select
              value={speciesFilter}
              onChange={event => setSpeciesFilter(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Filter by species"
            >
              <option value="">All species</option>
              {species.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={sizeFilter}
              onChange={event => setSizeFilter(event.target.value as PlushSize | "")}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Filter by size"
            >
              <option value="">All sizes</option>
              {SIZES.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant={travelOnly ? "default" : "outline"}
              onClick={() => setTravelOnly(current => !current)}
            >
              <Plane size={14} className="mr-1.5" /> Travel buddies
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-32 text-muted-foreground border border-dashed border-white/10 rounded-3xl p-12">
              <PawPrint className="mx-auto mb-4 h-8 w-8" aria-hidden />
              {plushies.length === 0
                ? "The menagerie is settling in — adoption certificates coming soon!"
                : "No plushies matched that filter."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map(plush => (
                <CertificateCard key={plush.id} plush={plush} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
