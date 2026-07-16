import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ExternalLink,
  Heart,
  HeartCrack,
  Loader2,
  MapPin,
  Plane,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import Lightbox from "@/components/Lightbox";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  fetchPlushBySlug,
  fetchPublishedDestinations,
  Plush,
} from "@/lib/content";

function CertificatePanel({ plush }: { plush: Plush }) {
  const seal = plush.colorPalette?.[0] || "var(--primary)";
  const rows: Array<[string, string]> = [
    ["Name", plush.name],
    ["Species", plush.species],
    ...(plush.nickname ? ([["Known as", plush.nickname]] as Array<[string, string]>) : []),
    ...(plush.size ? ([["Size", plush.size]] as Array<[string, string]>) : []),
    [
      "Adoption date",
      plush.adoptionDate.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    ],
  ];

  return (
    <div className="relative rounded-3xl border-2 border-border/60 bg-card/80 p-8">
      <p className="text-center font-serif text-xs uppercase tracking-[0.35em] text-muted-foreground">
        Certificate of Adoption
      </p>
      <div className="mt-6 space-y-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-4 border-b border-dashed border-border/60 pb-2"
          >
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </span>
            <span className="font-heading text-lg font-semibold capitalize">
              {value}
            </span>
          </div>
        ))}
      </div>
      {plush.personalityTraits && plush.personalityTraits.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {plush.personalityTraits.map(trait => (
            <span
              key={trait}
              className="rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs"
            >
              {trait}
            </span>
          ))}
        </div>
      )}
      <span
        aria-hidden
        className="absolute -bottom-4 right-8 flex h-14 w-14 rotate-[-12deg] items-center justify-center rounded-full border-2 border-white/20 text-[10px] font-black uppercase text-white/85 shadow-lg"
        style={{ background: seal }}
      >
        SS·SEAL
      </span>
    </div>
  );
}

export default function MenagerieDetail() {
  const params = useParams();
  const slug = params.slug ?? "";
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: plush, isLoading } = useQuery({
    queryKey: ["menagerie", "detail", slug, isAdmin],
    queryFn: () => fetchPlushBySlug(slug, { includeDrafts: isAdmin }),
    enabled: Boolean(slug),
  });

  const destinationSlugs = plush?.destinationSlugs ?? [];
  const { data: destinations = [] } = useQuery({
    queryKey: ["destinations", "published"],
    queryFn: () => fetchPublishedDestinations(),
    enabled: destinationSlugs.length > 0,
  });
  const visited = destinations.filter(d => destinationSlugs.includes(d.slug));

  const galleryImages = (plush?.gallery ?? []).map(photo => ({
    url: photo.url,
    alt: photo.caption || plush?.name || "Plush photo",
  }));

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

  if (!plush) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 py-32 text-center">
          <h1 className="font-heading text-3xl font-bold">
            This plush hasn't checked in yet
          </h1>
          <p className="text-muted-foreground">
            The adoption certificate you're looking for isn't on file.
          </p>
          <Link href="/menagerie">
            <Button variant="outline" className="gap-2">
              <ArrowLeft size={16} /> Back to the Menagerie
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
        title={`${plush.name} — The Menagerie | SimplySoph`}
        description={
          plush.originStory ||
          `${plush.name} the ${plush.species}, adopted into the SimplySoph menagerie.`
        }
        url={`/menagerie/${plush.slug}`}
        image={plush.heroPhoto?.url}
      />
      <Navigation />

      <main className="flex-1 py-16 md:py-24">
        <div className="container max-w-5xl space-y-12">
          <Link href="/menagerie">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} /> The Menagerie
            </Button>
          </Link>

          <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-start">
            <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl border-4 border-white/10 bg-white/5 shadow-2xl">
              {plush.heroPhoto?.url ? (
                <img
                  src={plush.heroPhoto.url}
                  alt={plush.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-7xl">
                  🧸
                </div>
              )}
              {plush.travelsWithMe && (
                <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-border/60 bg-card/90 px-3 py-1 text-[11px] uppercase tracking-widest">
                  <Plane size={12} aria-hidden /> travel buddy
                </span>
              )}
            </div>
            <CertificatePanel plush={plush} />
          </div>

          {plush.whyStory && (
            <section className="mx-auto max-w-3xl space-y-3">
              <h2 className="font-heading text-2xl font-bold">
                Why {plush.name}?
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                {plush.whyStory}
              </p>
            </section>
          )}

          {plush.adaptingStory && (
            <section className="mx-auto max-w-3xl space-y-3">
              <h2 className="font-heading text-2xl font-bold">
                How it's going
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                {plush.adaptingStory}
              </p>
            </section>
          )}

          {plush.originStory && (
            <section className="mx-auto max-w-3xl space-y-3">
              <h2 className="font-heading text-2xl font-bold">
                Adoption story
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                {plush.originStory}
              </p>
            </section>
          )}

          {((plush.likes?.length ?? 0) > 0 ||
            (plush.dislikes?.length ?? 0) > 0) && (
            <section className="mx-auto max-w-3xl space-y-4">
              <h2 className="font-heading text-2xl font-bold">
                Likes &amp; dislikes
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                  <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-400">
                    <Heart size={13} aria-hidden /> Loves
                  </p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {(plush.likes ?? []).map(like => (
                      <li key={like}>{like}</li>
                    ))}
                    {(plush.likes?.length ?? 0) === 0 && <li>Still deciding…</li>}
                  </ul>
                </div>
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
                  <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-rose-400">
                    <HeartCrack size={13} aria-hidden /> Not a fan of
                  </p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {(plush.dislikes ?? []).map(dislike => (
                      <li key={dislike}>{dislike}</li>
                    ))}
                    {(plush.dislikes?.length ?? 0) === 0 && (
                      <li>Nothing yet — very agreeable</li>
                    )}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {plush.productUrl && (
            <div className="mx-auto max-w-3xl">
              <a
                href={plush.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
              >
                <ExternalLink size={14} aria-hidden /> Meet {plush.name}'s
                character on the official Jellycat site
              </a>
            </div>
          )}

          {galleryImages.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-heading text-2xl font-bold">Gallery</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {galleryImages.map((image, index) => (
                  <button
                    key={image.url}
                    type="button"
                    onClick={() => {
                      setLightboxIndex(index);
                      setLightboxOpen(true);
                    }}
                    className="group aspect-square overflow-hidden rounded-2xl border border-border/60 bg-white/5"
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>
              <Lightbox
                images={galleryImages}
                initialIndex={lightboxIndex}
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
              />
            </section>
          )}

          {visited.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-heading text-2xl font-bold">
                Travels with me
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {visited.map(dest => (
                  <Link key={dest.id} href={`/passport/${dest.slug}`}>
                    <div className="group cursor-pointer rounded-2xl border border-border/60 bg-card/80 p-5 transition-shadow hover:shadow-lg">
                      <div className="flex items-center gap-2 text-primary">
                        <MapPin size={14} aria-hidden />
                        <span className="text-xs uppercase tracking-[0.2em]">
                          {dest.country || "Destination"}
                        </span>
                      </div>
                      <h3 className="mt-1 font-heading text-xl font-bold">
                        {dest.city}
                      </h3>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        {dest.date.toLocaleDateString(undefined, {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
