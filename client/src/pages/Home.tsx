import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import HeroBanner from "@/components/HeroBanner";
import InstagramFeed from "@/components/InstagramFeed";
import TikTokCommentFeed from "@/components/TikTokCommentFeed";
import YouTubeLiveChat from "@/components/YouTubeLiveChat";
import { NewsletterModal, useNewsletterModal } from "@/components/NewsletterModal";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { Button } from "@/components/ui/button";
import { ArrowRight, Image as ImageIcon, Sparkles, Video, Waves } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { ENABLE_REALTIME_FEED, OWNER_FIREBASE_UID, TIKTOK_VIDEO_ID, YOUTUBE_LIVE_VIDEO_ID } from "@/const";
import { fetchPublishedBlogPosts, subscribeToLatestHighlights, type BlogPost, type LiveFeedItem } from "@/lib/content";
import { fetchCreatorProfile } from "@/lib/content";
import { useQuery } from "@tanstack/react-query";

const highlightIconMap: Record<LiveFeedItem["type"], ReactNode> = {
  blog: <Sparkles className="h-4 w-4 text-primary" />,
  video: <Video className="h-4 w-4" style={{ color: "var(--accent)" }} />,
  album: <ImageIcon className="h-4 w-4" style={{ color: "oklch(0.62 0.14 350)" }} />,
  destination: <Sparkles className="h-4 w-4 text-amber-400" />,
};

function highlightLinkInfo(item: LiveFeedItem): { id: string; url: string; title: string } {
  switch (item.type) {
    case "blog":
      return { id: item.payload.id, url: `/blog/${item.payload.slug}`, title: item.payload.title };
    case "video":
      return { id: item.payload.id, url: `/videos/${item.payload.slug}`, title: item.payload.title };
    case "album":
      return { id: item.payload.id, url: `/photos/${item.payload.slug}`, title: item.payload.title };
    case "destination":
      return { id: item.payload.id, url: `/passport/${item.payload.slug}`, title: item.payload.city };
  }
}

type SpotlightProps = { posts: BlogPost[]; loading: boolean };

function SpotlightGrid({ posts, loading }: SpotlightProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        <div className="md:col-span-2 rounded-2xl overflow-hidden border border-border/40 bg-card">
          <div className="skeleton aspect-[16/10] w-full" />
          <div className="p-6 md:p-8 space-y-3">
            <div className="skeleton h-3 w-20 rounded-full" />
            <div className="skeleton h-8 w-3/4 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-3 w-28 rounded-full mt-2" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-border/40 bg-card flex gap-4 p-4">
              <div className="skeleton rounded-xl flex-shrink-0 w-24 h-24" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="skeleton h-3 w-14 rounded-full" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-4/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-20 flex flex-col items-center gap-5 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "oklch(from var(--primary) l c h / 0.08)" }}
        >
          <Sparkles className="h-6 w-6" style={{ color: "var(--primary)" }} />
        </div>
        <div className="space-y-1">
          <p className="font-display text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
            The first drop is coming soon
          </p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            No published stories yet. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  const [featured, ...rest] = posts;
  const sidebar = rest.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
      {/* Featured card */}
      <Link href={`/blog/${featured.slug}`} className="md:col-span-2 group">
        <article className="h-full overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:shadow-lg hover:border-border cursor-pointer">
          <div className="overflow-hidden" style={{ aspectRatio: "16 / 10" }}>
            {featured.coverImage ? (
              <img
                src={featured.coverImage}
                alt={featured.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                loading="eager"
                width={800}
                height={500}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, oklch(from var(--primary) l c h / 0.08) 0%, var(--muted) 100%)" }}
              >
                <Sparkles className="h-10 w-10" style={{ color: "oklch(from var(--primary) l c h / 0.30)" }} />
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
                style={{ color: "var(--primary)" }}
              >
                <Waves className="h-3 w-3" aria-hidden="true" />
                Featured Story
              </span>
              {featured.categoryId && (
                <>
                  <span className="h-3 w-px bg-border" aria-hidden="true" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {featured.categoryId}
                  </span>
                </>
              )}
            </div>

            <h2
              className="font-display font-semibold leading-[1.15]"
              style={{
                fontSize: "clamp(1.5rem, 1.2rem + 1vw, 2.25rem)",
                color: "var(--foreground)",
                letterSpacing: "-0.02em",
              }}
            >
              {featured.title}
            </h2>

            {(featured.excerpt || featured.seoDescription) && (
              <p
                className="text-base leading-relaxed"
                style={{ color: "var(--muted-foreground)", maxWidth: "60ch" }}
              >
                {featured.excerpt || featured.seoDescription}
              </p>
            )}

            <div
              className="mt-auto inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Read the story
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </div>
        </article>
      </Link>

      {/* Sidebar cards */}
      <div className="flex flex-col gap-4">
        {sidebar.map((post) => (
          <Link key={post.id || post.slug} href={`/blog/${post.slug}`} className="group">
            <article className="flex gap-4 rounded-2xl border border-border/50 bg-card p-4 transition-all duration-200 hover:shadow-md hover:border-border cursor-pointer">
              <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-muted">
                {post.coverImage ? (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                    loading="lazy"
                    width={96}
                    height={96}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="h-5 w-5" style={{ color: "oklch(from var(--primary) l c h / 0.30)" }} />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center gap-1.5 min-w-0">
                {post.categoryId && (
                  <span
                    className="text-xs font-semibold uppercase tracking-[0.15em] truncate"
                    style={{ color: "var(--primary)" }}
                  >
                    {post.categoryId}
                  </span>
                )}
                <h3
                  className="font-display font-semibold leading-snug line-clamp-2"
                  style={{ fontSize: "clamp(0.875rem, 0.85rem + 0.15vw, 1rem)", color: "var(--foreground)" }}
                >
                  {post.title}
                </h3>
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium mt-0.5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Read
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </div>
            </article>
          </Link>
        ))}

        {posts.length > 4 && (
          <Link href="/blog">
            <div
              className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              style={{ color: "var(--muted-foreground)" }}
            >
              View all stories <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { isOpen, close } = useNewsletterModal({ autoOpen: true });

  const { data: blogPosts = [], isLoading: blogLoading } = useQuery({
    queryKey: ["published-blog-posts"],
    queryFn: () => fetchPublishedBlogPosts(5),
  });

  const { data: profile } = useQuery({
    queryKey: ["creator-profile"],
    queryFn: () => fetchCreatorProfile(OWNER_FIREBASE_UID),
    enabled: Boolean(OWNER_FIREBASE_UID),
  });

  const [highlights, setHighlights] = useState<LiveFeedItem[]>([]);

  useEffect(() => {
    if (!ENABLE_REALTIME_FEED) return;
    const unsub = subscribeToLatestHighlights((items) => setHighlights(items));
    return unsub ?? undefined;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="SimplySoph — Fashion & Style Creator"
        description="Fashion, lifestyle, and exclusive content from SimplySoph. Discover the latest trends, styling tips, and behind-the-scenes moments."
        url="/"
      />
      <Navigation />

      <main className="flex-1">
        <HeroBanner />

        {/* Latest Stories */}
        <section className="py-16 md:py-20" aria-labelledby="spotlight-heading">
          <div className="container">
            <div className="flex items-end justify-between mb-8 md:mb-10">
              <div>
                <p
                  className="text-xs font-sans font-semibold uppercase tracking-[0.2em] mb-2"
                  style={{ color: "var(--primary)" }}
                >
                  Latest Stories
                </p>
                <h2
                  id="spotlight-heading"
                  className="font-display font-semibold"
                  style={{
                    fontSize: "clamp(1.5rem, 1.2rem + 1vw, 2.25rem)",
                    letterSpacing: "-0.02em",
                    color: "var(--foreground)",
                  }}
                >
                  From the Blog
                </h2>
              </div>
              <Link href="/blog">
                <Button variant="ghost" size="sm" className="hidden md:inline-flex gap-2 text-sm font-medium">
                  All stories <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <SpotlightGrid posts={blogPosts} loading={blogLoading} />
          </div>
        </section>

        {/* Photo Carousel */}
        <section className="py-10 md:py-14" style={{ background: "oklch(from var(--muted) l c h / 0.4)" }} aria-label="Photo highlights">
          <div className="container">
            <p
              className="text-xs font-sans font-semibold uppercase tracking-[0.2em] mb-2"
              style={{ color: "var(--primary)" }}
            >
              Photo Moments
            </p>
            <h2
              className="font-display font-semibold mb-8"
              style={{
                fontSize: "clamp(1.5rem, 1.2rem + 1vw, 2.25rem)",
                letterSpacing: "-0.02em",
                color: "var(--foreground)",
              }}
            >
              Behind the Lens
            </h2>
            <PhotoCarousel />
          </div>
        </section>

        {/* Live highlights */}
        {ENABLE_REALTIME_FEED && highlights.length > 0 && (
          <section className="py-10 md:py-14" aria-label="Latest highlights">
            <div className="container">
              <p
                className="text-xs font-sans font-semibold uppercase tracking-[0.2em] mb-2"
                style={{ color: "var(--primary)" }}
              >
                Live Updates
              </p>
              <h2
                className="font-display font-semibold mb-8"
                style={{
                  fontSize: "clamp(1.5rem, 1.2rem + 1vw, 2.25rem)",
                  letterSpacing: "-0.02em",
                  color: "var(--foreground)",
                }}
              >
                What's Happening
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {highlights.map((item) => {
                  const { id, url, title } = highlightLinkInfo(item);
                  return (
                    <li key={id}>
                      <Link href={url}>
                        <div className="rounded-2xl border border-border/50 bg-card p-4 flex gap-3 items-start hover:shadow-md transition-shadow duration-200 cursor-pointer h-full">
                          <span className="mt-0.5 flex-shrink-0">{highlightIconMap[item.type]}</span>
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>
                              {item.type}
                            </p>
                            <p className="text-sm font-medium leading-snug line-clamp-2" style={{ color: "var(--foreground)" }}>
                              {title}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {/* Social feeds */}
        {TIKTOK_VIDEO_ID && (
          <section className="py-10 md:py-14" style={{ background: "oklch(from var(--muted) l c h / 0.25)" }} aria-label="TikTok">
            <div className="container">
              <TikTokCommentFeed videoId={TIKTOK_VIDEO_ID} />
            </div>
          </section>
        )}

        {YOUTUBE_LIVE_VIDEO_ID && (
          <section className="py-10 md:py-14" aria-label="YouTube">
            <div className="container">
              <YouTubeLiveChat videoId={YOUTUBE_LIVE_VIDEO_ID} />
            </div>
          </section>
        )}

        <section className="py-10 md:py-14" style={{ background: "oklch(from var(--muted) l c h / 0.25)" }} aria-label="Instagram">
          <div className="container">
            <InstagramFeed />
          </div>
        </section>
      </main>

      <Footer />
      <NewsletterModal isOpen={isOpen} onClose={close} />
    </div>
  );
}
