import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import {
  fetchPublishedDestinations,
  fetchAllDestinations,
  Destination,
} from "@/lib/content";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { filterDestinations, getDestinationProfile, listDestinationCountries } from "@/lib/services/growth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import {
  getSavedPassportDestinations,
  savePassportDestination,
  trackAttributionEvent,
  unsavePassportDestination,
} from "@/lib/passport";
import { toast } from "sonner";

export default function Passport() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "admin";
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"stamp" | "list" | "map">("stamp");
  const [selectedMapSlug, setSelectedMapSlug] = useState<string>("");
  const [savedDestinationIds, setSavedDestinationIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const data = isAdmin
          ? await fetchAllDestinations()
          : await fetchPublishedDestinations();
        setDestinations(data);
      } catch (error) {
        console.error("Failed to load destinations", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedDestinationIds(new Set());
      return;
    }

    void getSavedPassportDestinations()
      .then(ids => {
        setSavedDestinationIds(new Set(ids));
      })
      .catch(() => {
        // Ignore transient saved-list fetch failures.
      });
  }, [isAuthenticated]);

  const countries = useMemo(
    () => listDestinationCountries(destinations),
    [destinations]
  );

  const baseFilteredDestinations = useMemo(
    () => filterDestinations(destinations, searchTerm, countryFilter),
    [destinations, searchTerm, countryFilter]
  );

  const filteredDestinations = useMemo(
    () =>
      savedOnly
        ? baseFilteredDestinations.filter(destination =>
            savedDestinationIds.has(destination.id)
          )
        : baseFilteredDestinations,
    [baseFilteredDestinations, savedDestinationIds, savedOnly]
  );
  const selectedMapDestination = useMemo(
    () =>
      filteredDestinations.find(destination => destination.slug === selectedMapSlug) ??
      filteredDestinations.find(destination => destination.coordinates) ??
      filteredDestinations[0],
    [filteredDestinations, selectedMapSlug]
  );

  useEffect(() => {
    if (selectedMapDestination && selectedMapDestination.slug !== selectedMapSlug) {
      setSelectedMapSlug(selectedMapDestination.slug);
    }
  }, [selectedMapDestination, selectedMapSlug]);

  async function toggleSavedDestination(destination: Destination) {
    if (!isAuthenticated) {
      toast.info("Sign in to save destinations to your passport shortlist.");
      return;
    }

    const isSaved = savedDestinationIds.has(destination.id);
    try {
      if (isSaved) {
        await unsavePassportDestination(destination.id);
      } else {
        await savePassportDestination(destination.id);
      }

      setSavedDestinationIds(current => {
        const next = new Set(current);
        if (isSaved) {
          next.delete(destination.id);
        } else {
          next.add(destination.id);
        }
        return next;
      });

      void trackAttributionEvent({
        eventType: isSaved ? "passport_unsave" : "passport_save",
        subjectType: "destination",
        subjectId: destination.id,
        source: "passport",
        metadata: {
          city: destination.city,
          slug: destination.slug,
        },
      });
    } catch {
      toast.error("Could not update saved destination. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Passport | SimplySoph"
        description="Explore destinations around the world."
        url="/passport"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "SimplySoph Passport",
            description: "Explore destination stories, itinerary notes, and travel-style guides.",
            hasPart: filteredDestinations.map(destination => ({
              "@type": "TouristDestination",
              name: destination.city,
              address: destination.country,
              url: `https://simplysoph.com/passport/${destination.slug}`,
            })),
          })}
        </script>
      </Helmet>
      <Navigation />

      <main className="flex-1 py-16 md:py-24 relative overflow-hidden">
        {/* Background aesthetic */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),rgba(10,10,12,0))]" />

        <div className="container max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-5xl md:text-7xl font-heading font-bold">
              Passport
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Stamps collected from around the world. Choose a destination to
              open its pages.
            </p>
            <div className="mx-auto grid max-w-3xl gap-3 rounded-3xl border border-border/60 bg-card/80 p-4 md:grid-cols-[1.8fr_1fr] md:p-5">
              <Input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Search city or country"
                aria-label="Search passport destinations"
              />
              <select
                value={countryFilter}
                onChange={event => setCountryFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                aria-label="Filter passport destinations by country"
              >
                <option value="">All countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                ["stamp", "Stamp grid"],
                ["list", "Itinerary list"],
                ["map", "Map view"],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={viewMode === value ? "default" : "outline"}
                  onClick={() => setViewMode(value as "stamp" | "list" | "map")}
                >
                  {label}
                </Button>
              ))}
              <Button
                type="button"
                variant={savedOnly ? "default" : "outline"}
                onClick={() => setSavedOnly(current => !current)}
              >
                {savedOnly ? "Saved only" : "Show saved"}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDestinations.length === 0 ? (
            <div className="text-center py-32 text-muted-foreground border border-dashed border-white/10 rounded-3xl p-12">
              No passport destinations matched that filter.
            </div>
          ) : viewMode === "stamp" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12">
              {filteredDestinations.map(dest => {
                const profile = getDestinationProfile(dest);
                return (
                <div key={dest.id} className="relative">
                  <button
                    type="button"
                    onClick={() => void toggleSavedDestination(dest)}
                    aria-label={
                      savedDestinationIds.has(dest.id)
                        ? `Remove ${dest.city} from saved destinations`
                        : `Save ${dest.city} to your passport`
                    }
                    className="absolute left-1 top-1 z-20 rounded-full border border-border/60 bg-card/90 px-2 py-1 text-[10px] uppercase tracking-[0.12em]"
                  >
                    {savedDestinationIds.has(dest.id) ? "Saved" : "Save"}
                  </button>
                  <Link href={`/passport/${dest.slug}`}>
                  <div className="group cursor-pointer flex flex-col items-center gap-4 transition-transform hover:scale-105 duration-300 relative">
                    {dest.status === "draft" && (
                      <div className="absolute -top-3 -right-3 z-10 bg-yellow-500/90 text-yellow-50 text-[10px] uppercase font-bold px-2 py-1 rounded-full shadow-lg border border-yellow-300/50 backdrop-blur-sm">
                        DRAFT
                      </div>
                    )}
                    <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl bg-white/5 flex items-center justify-center p-2">
                      {dest.coverStampUrl ? (
                        <img
                          src={dest.coverStampUrl}
                          alt={dest.city}
                          className="w-full h-full object-contain filter group-hover:brightness-110 transition-all drop-shadow-md"
                        />
                      ) : (
                        <div className="text-center text-muted-foreground uppercase tracking-widest text-xs rotate-[-15deg] border-2 border-dashed border-white/20 p-4 rounded-full">
                          {dest.city}
                        </div>
                      )}
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="font-heading font-bold text-xl uppercase tracking-widest">
                        {dest.city}
                      </h3>
                      {dest.country && (
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary/90">
                          {dest.country}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">
                        {dest.date.toLocaleDateString(undefined, {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {profile.seasonLabel}
                      </p>
                    </div>
                  </div>
                  </Link>
                </div>
                );
              })}
            </div>
          ) : viewMode === "list" ? (
            <div className="grid gap-6">
              {filteredDestinations.map(dest => {
                const profile = getDestinationProfile(dest);
                return (
                  <div key={dest.id} className="relative rounded-3xl border border-border/60 bg-card/80 p-6 transition-shadow hover:shadow-lg">
                    <div>
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-2xl font-semibold tracking-[-0.02em]">
                              <Link
                                href={`/passport/${dest.slug}`}
                                className="after:absolute after:inset-0 after:content-['']"
                              >
                                {dest.city}
                              </Link>
                            </h3>
                            {dest.country && <span className="text-sm text-primary">{dest.country}</span>}
                          </div>
                          <p className="text-sm text-muted-foreground">{dest.storySummary || profile.highlights[0]}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>{profile.seasonLabel}</span>
                            <span>•</span>
                            <span>{profile.budgetLabel}</span>
                            <span>•</span>
                            <span>{dest.date.toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>
                            <span>•</span>
                            <button
                              type="button"
                              className="relative z-10 font-medium text-primary"
                              onClick={() => void toggleSavedDestination(dest)}
                            >
                              {savedDestinationIds.has(dest.id) ? "Saved" : "Save"}
                            </button>
                          </div>
                        </div>
                        <div className="grid gap-2 text-sm md:max-w-sm">
                          {(dest.itineraryBlocks || []).slice(0, 3).map((block, index) => (
                            <div key={`${dest.id}-${index}`} className="rounded-xl bg-muted/50 px-3 py-2">
                              <div className="font-medium">{block.timeLabel ? `${block.timeLabel} · ` : ""}{block.title}</div>
                              <div className="text-muted-foreground">{block.neighborhood || block.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
              <div className="space-y-3">
                {filteredDestinations.map(dest => (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => setSelectedMapSlug(dest.slug)}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${selectedMapDestination?.slug === dest.slug ? "border-primary bg-primary/5" : "border-border/60 bg-card/70"}`}
                  >
                    <div className="font-medium">{dest.city}</div>
                    <div className="text-sm text-muted-foreground">{dest.country || "Destination"}</div>
                  </button>
                ))}
              </div>
              <div className="rounded-3xl border border-border/60 bg-card/80 p-4">
                {selectedMapDestination?.coordinates ? (
                  <iframe
                    title={`${selectedMapDestination.city} map`}
                    className="h-[420px] w-full rounded-2xl border-0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedMapDestination.coordinates.lng - 0.08}%2C${selectedMapDestination.coordinates.lat - 0.05}%2C${selectedMapDestination.coordinates.lng + 0.08}%2C${selectedMapDestination.coordinates.lat + 0.05}&layer=mapnik&marker=${selectedMapDestination.coordinates.lat}%2C${selectedMapDestination.coordinates.lng}`}
                  />
                ) : (
                  <div className="flex h-[420px] items-center justify-center text-muted-foreground">
                    Add destination coordinates in admin to enable the travel map.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
