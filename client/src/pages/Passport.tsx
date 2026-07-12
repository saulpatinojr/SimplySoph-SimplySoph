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

export default function Passport() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

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

  const countries = useMemo(
    () => listDestinationCountries(destinations),
    [destinations]
  );

  const filteredDestinations = useMemo(
    () => filterDestinations(destinations, searchTerm, countryFilter),
    [destinations, searchTerm, countryFilter]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Passport | SimplySoph"
        description="Explore destinations around the world."
        url="/passport"
      />
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
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDestinations.length === 0 ? (
            <div className="text-center py-32 text-muted-foreground border border-dashed border-white/10 rounded-3xl p-12">
              No passport destinations matched that filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12">
              {filteredDestinations.map(dest => {
                const profile = getDestinationProfile(dest);
                return (
                <Link key={dest.id} href={`/passport/${dest.slug}`}>
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
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
