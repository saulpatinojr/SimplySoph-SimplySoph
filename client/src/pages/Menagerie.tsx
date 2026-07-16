import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import {
  BookHeart,
  Heart,
  HeartCrack,
  Loader2,
  PawPrint,
  Plane,
  Sparkles,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  buildFamilyFrames,
  fetchAllMenagerieBlogs,
  fetchAllPlushies,
  fetchPublishedMenagerieBlogs,
  fetchPublishedPlushies,
  getDailySpotlight,
  getMenagerieStats,
  MenagerieBlog,
  Plush,
} from "@/lib/content";

function introducedLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** One family member — profile photo on one side, bio on the other,
 *  alternating sides down the page. The whole card links to the bio page. */
function FamilyMemberFrame({
  plush,
  flipped,
}: {
  plush: Plush;
  flipped: boolean;
}) {
  return (
    <Link href={`/menagerie/${plush.slug}`}>
      <article
        className={cn(
          "group grid cursor-pointer items-center gap-6 rounded-3xl border border-border/60 bg-card/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:grid-cols-[minmax(0,300px)_1fr] md:gap-10 md:p-8",
          flipped && "md:grid-cols-[1fr_minmax(0,300px)]"
        )}
      >
        {plush.status === "draft" && (
          <div className="absolute -top-3 -right-3 z-10 rounded-full border border-yellow-300/50 bg-yellow-500/90 px-2 py-1 text-[10px] font-bold uppercase text-yellow-50 shadow-lg">
            DRAFT
          </div>
        )}

        {/* Profile photo */}
        <div
          className={cn(
            "relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-3xl border-4 border-white/10 bg-white shadow-2xl",
            flipped && "md:order-2"
          )}
        >
          {plush.heroPhoto?.url ? (
            <img
              src={plush.heroPhoto.thumbnailUrl || plush.heroPhoto.url}
              alt={plush.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">
              🧸
            </div>
          )}
          {plush.travelsWithMe && (
            <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-border/60 bg-card/90 px-2.5 py-1 text-[10px] uppercase tracking-widest">
              <Plane size={11} aria-hidden /> travel buddy
            </span>
          )}
        </div>

        {/* Bio */}
        <div className={cn("space-y-4", flipped && "md:order-1 md:text-right")}>
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-primary/90">
              We were introduced {introducedLabel(plush.adoptionDate)}
            </p>
            <h3 className="mt-1 font-heading text-3xl font-bold">
              {plush.name}
            </h3>
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
              {plush.species}
              {plush.nickname ? ` · "${plush.nickname}"` : ""}
            </p>
          </div>

          {plush.whyStory && (
            <p className="leading-relaxed text-muted-foreground">
              {plush.whyStory}
            </p>
          )}

          {plush.adaptingStory && (
            <p className="text-sm italic leading-relaxed text-muted-foreground/80">
              {plush.adaptingStory}
            </p>
          )}

          {((plush.likes?.length ?? 0) > 0 ||
            (plush.dislikes?.length ?? 0) > 0) && (
            <div
              className={cn(
                "flex flex-wrap gap-2",
                flipped && "md:justify-end"
              )}
            >
              {(plush.likes ?? []).map(like => (
                <span
                  key={`like-${like}`}
                  className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs"
                >
                  <Heart size={11} className="text-emerald-400" aria-hidden />
                  {like}
                </span>
              ))}
              {(plush.dislikes ?? []).map(dislike => (
                <span
                  key={`dislike-${dislike}`}
                  className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs"
                >
                  <HeartCrack size={11} className="text-rose-400" aria-hidden />
                  {dislike}
                </span>
              ))}
            </div>
          )}

          <p
            className={cn(
              "text-xs uppercase tracking-[0.2em] text-primary/70 opacity-0 transition-opacity group-hover:opacity-100"
            )}
          >
            Read {plush.name}'s full bio →
          </p>
        </div>
      </article>
    </Link>
  );
}

/** A diary entry breaking up the family rows. */
function BlogFrame({ blog }: { blog: MenagerieBlog }) {
  return (
    <aside className="relative mx-auto w-full max-w-3xl rounded-3xl border border-dashed border-primary/40 bg-primary/5 p-8 text-center">
      {blog.status === "draft" && (
        <div className="absolute -top-3 -right-3 z-10 rounded-full border border-yellow-300/50 bg-yellow-500/90 px-2 py-1 text-[10px] font-bold uppercase text-yellow-50 shadow-lg">
          DRAFT
        </div>
      )}
      <p className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.3em] text-primary/90">
        <BookHeart size={13} aria-hidden /> From the family diary
      </p>
      {blog.emoji && (
        <div className="mt-3 text-4xl" aria-hidden>
          {blog.emoji}
        </div>
      )}
      <h3 className="mt-2 font-heading text-2xl font-bold">{blog.title}</h3>
      {blog.imageUrl && (
        <img
          src={blog.imageUrl}
          alt={blog.title}
          loading="lazy"
          className="mx-auto mt-4 max-h-64 rounded-2xl object-cover"
        />
      )}
      <p className="mx-auto mt-3 max-w-xl whitespace-pre-line leading-relaxed text-muted-foreground">
        {blog.body}
      </p>
    </aside>
  );
}

export default function Menagerie() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: plushies = [], isLoading: plushiesLoading } = useQuery({
    queryKey: ["menagerie", isAdmin ? "all" : "published"],
    queryFn: () => (isAdmin ? fetchAllPlushies() : fetchPublishedPlushies()),
  });

  const { data: blogs = [], isLoading: blogsLoading } = useQuery({
    queryKey: ["menagerieBlogs", isAdmin ? "all" : "published"],
    queryFn: () =>
      isAdmin ? fetchAllMenagerieBlogs() : fetchPublishedMenagerieBlogs(),
  });

  const isLoading = plushiesLoading || blogsLoading;
  const stats = useMemo(() => getMenagerieStats(plushies), [plushies]);
  const spotlight = useMemo(
    () => getDailySpotlight(plushies, new Date()),
    [plushies]
  );
  const frames = useMemo(
    () => buildFamilyFrames(plushies, blogs),
    [plushies, blogs]
  );

  // Alternate photo sides for plush frames only — blog frames don't count.
  let plushIndex = -1;

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="The Menagerie — Meet the Family | SimplySoph"
        description="Meet the Jellycat family — every plush adopted into the SimplySoph household, with their bios, quirks, likes, dislikes, and diary entries."
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
              "Meet the family — a collection of adopted Jellycat plushies with bios, personalities, and diary entries.",
            hasPart: plushies.map(plush => ({
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

        <div className="container max-w-5xl">
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-5xl md:text-7xl font-heading font-bold">
              Meet the Family
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Every Jellycat here was formally adopted, named, and given a seat
              at the table. These are their stories.
            </p>
          </div>

          {/* Collection stats strip */}
          {!isLoading && stats.total > 0 && (
            <div className="mx-auto mb-14 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
              {[
                [String(stats.total), "family members"],
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
              <div className="group mx-auto mb-14 flex max-w-3xl cursor-pointer items-center gap-6 rounded-3xl border border-border/60 bg-card/80 p-6 transition-shadow hover:shadow-xl">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white/10 bg-white">
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
                    {spotlight.whyStory ||
                      spotlight.originStory ||
                      `${spotlight.species}, with us since ${introducedLabel(spotlight.adoptionDate)}.`}
                  </p>
                </div>
              </div>
            </Link>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : frames.length === 0 ? (
            <div className="text-center py-32 text-muted-foreground border border-dashed border-white/10 rounded-3xl p-12">
              <PawPrint className="mx-auto mb-4 h-8 w-8" aria-hidden />
              The family portraits are being framed — introductions coming
              soon!
            </div>
          ) : (
            <div className="relative space-y-10">
              {frames.map(frame => {
                if (frame.kind === "blog") {
                  return <BlogFrame key={`blog-${frame.blog.id}`} blog={frame.blog} />;
                }
                plushIndex++;
                return (
                  <FamilyMemberFrame
                    key={frame.plush.id}
                    plush={frame.plush}
                    flipped={plushIndex % 2 === 1}
                  />
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
