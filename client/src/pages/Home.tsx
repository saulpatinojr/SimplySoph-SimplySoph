import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import HeroBanner from "@/components/HeroBanner";
import InstagramFeed from "@/components/InstagramFeed";
import TikTokCommentFeed from "@/components/TikTokCommentFeed";
import AIPersonaComments from "@/components/AIPersonaComments";
import YouTubeLiveChat from "@/components/YouTubeLiveChat";
import {
  NewsletterModal,
  useNewsletterModal,
} from "@/components/NewsletterModal";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Image as ImageIcon,
  Sparkles,
  Video,
  Waves,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  ENABLE_REALTIME_FEED,
  FEATURED_TAGLINES,
  LOGIN_PATH,
  TIKTOK_VIDEO_ID,
  YOUTUBE_LIVE_VIDEO_ID,
} from "@/const";
import {
  fetchPublishedBlogPosts,
  fetchVideos,
  subscribeToLatestHighlights,
  type BlogPost,
  type LiveFeedItem,
} from "@/lib/content";
import { useAuth } from "@/_core/hooks/useAuth";
import { fetchCreatorProfile } from "@/lib/content";
import { useQuery } from "@tanstack/react-query";

const highlightIconMap: Record<LiveFeedItem["type"], ReactNode> = {
  destination: <Sparkles className="h-4 w-4 text-amber-400" />,
  blog: <Sparkles className="h-4 w-4 text-primary" />,
  video: <Video className="h-4 w-4 text-accent" />,
  album: <ImageIcon className="h-4 w-4 text-rose-400" />,
};

type SpotlightProps = {
  posts: BlogPost[];
  loading: boolean;
};

function SpotlightGrid({ posts, loading }: SpotlightProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(item => (
          <Card key={item} className="overflow-hidden">
            <div className="aspect-video bg-muted animate-pulse" />
            <CardContent className="p-6 space-y-3">
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <Card className="p-12 text-center border-dashed">
        <p className="text-muted-foreground">
          No published stories yet. The first drop is coming soon.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {posts.map(post => (
        <Link key={post.id} href={`/blog/${post.slug}`}>
          <article className="luxury-card overflow-hidden h-full group">
            {post.coverImage ? (
              <div className="aspect-video bg-muted overflow-hidden">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="aspect-video bg-linear-to-br from-primary/10 via-background to-muted flex items-center justify-center text-muted-foreground">
                <Sparkles className="h-8 w-8" />
              </div>
            )}
            <div className="p-6 space-y-3">
              <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                {post.publishedAt?.toLocaleDateString(undefined, {
                  month: "short",
                  day: "2-digit",
                }) ?? "draft"}
              </div>
              <h3 className="font-heading font-semibold text-xl leading-tight line-clamp-2">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {post.excerpt}
                </p>
              )}
              <div className="pt-2 text-sm text-primary font-medium flex items-center gap-2">
                Read the story <ArrowRight size={14} />
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}

function LiveHighlightTicker({ items }: { items: LiveFeedItem[] }) {
  if (!items.length) return null;

  return (
    <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
        <Waves className="h-4 w-4" /> Live pulse
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {items.map(entry => {
          const targetHref =
            entry.type === "blog"
              ? `/blog/${entry.payload.slug}`
              : entry.type === "video"
                ? "/videos"
                : "/photos";

          const title =
            entry.type === "blog"
              ? entry.payload.title
              : entry.type === "video"
                ? entry.payload.title
                : entry.type === "destination"
                  ? entry.payload.city
                  : entry.payload.title;

          const timestamp =
            entry.type === "blog"
              ? entry.payload.publishedAt
              : entry.type === "video"
                ? entry.payload.publishedAt
                : entry.payload.createdAt;

          return (
            <Link key={`${entry.type}-${entry.payload.id}`} href={targetHref}>
              <div className="group rounded-2xl border border-white/10 bg-background/40 p-4 transition-all hover:border-primary hover:-translate-y-1">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="rounded-full bg-white/10 p-2">
                    {highlightIconMap[entry.type]}
                  </div>
                  <span className="truncate">{title}</span>
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {entry.type} \u00b7{" "}
                  {timestamp?.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }) ?? "just now"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [liveHighlights, setLiveHighlights] = useState<LiveFeedItem[]>([]);

  const { data: recentPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["blog", "home"],
    queryFn: () => fetchPublishedBlogPosts(6),
  });

  const { data: recentVideos } = useQuery({
    queryKey: ["videos", "home"],
    queryFn: () => fetchVideos(6),
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTaglineIndex(prev => (prev + 1) % FEATURED_TAGLINES.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!ENABLE_REALTIME_FEED) return;
    const unsubscribe = subscribeToLatestHighlights(setLiveHighlights);
    return () => {
      unsubscribe?.();
    };
  }, []);

  const featuredPosts = useMemo(
    () => recentPosts?.slice(0, 3) ?? [],
    [recentPosts]
  );
  const featuredVideos = useMemo(
    () => recentVideos?.slice(0, 3) ?? [],
    [recentVideos]
  );

  // Derive the most recent video title for AIPersonaComments topic
  const latestVideoTitle = featuredVideos[0]?.title ?? "latest fashion content";

  const serverCheck = async () => {
    try {
      if (!user?.uid) return false;
      const profile = await fetchCreatorProfile(user.uid);
      return Boolean((profile as any)?.newsletterSubscribed) || false;
    } catch (err) {
      console.warn("serverCheck fetchCreatorProfile failed", err);
      return false;
    }
  };

  const { isOpen: newsletterOpen, setIsOpen: setNewsletterOpen } =
    useNewsletterModal({
      isSubscribed: Boolean(localStorage.getItem("newsletter_subscribed")),
      isAuthenticated: Boolean(user),
      serverCheck,
    });

  return (
    <div className="min-h-screen flex flex-col">
      <NewsletterModal
        isOpen={newsletterOpen}
        onClose={() => setNewsletterOpen(false)}
      />
      <MetaTags
        title="SimplySoph - Premium Fashion Creator Platform"
        description="Discover the latest fashion trends, styling tips, and exclusive content from SimplySoph. Join our community of fashion enthusiasts and creators."
        url="/"
      />
      <Navigation />

      <HeroBanner />

      <section className="relative overflow-hidden pb-20 md:pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),rgba(10,10,12,0))]" />
        <div className="container">
          <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.4em] text-white/80">
              <Sparkles className="h-4 w-4" /> simply soph studio
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-bold leading-tight text-balance">
              {FEATURED_TAGLINES[taglineIndex]}
            </h1>
            <p className="text-base md:text-lg text-white/70 max-w-2xl">
              curated looks, cinematic visuals, and playful storytelling from a
              fresh creator rewriting the style playbook.
            </p>
            <div className="w-full mt-8 mb-4">
              <PhotoCarousel />
            </div>
          </div>
          {liveHighlights.length > 0 && (
            <LiveHighlightTicker items={liveHighlights} />
          )}
        </div>
      </section>

      {/* YouTube Live — only renders when VITE_YOUTUBE_LIVE_VIDEO_ID is set */}
      {ENABLE_REALTIME_FEED && YOUTUBE_LIVE_VIDEO_ID && (
        <YouTubeLiveChat
          videoId={YOUTUBE_LIVE_VIDEO_ID}
          isLive={true}
          channelName="SimplySoph"
        />
      )}

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-12">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                Latest drop
              </p>
              <h2 className="text-4xl font-heading font-bold tracking-tight">
                Stories & style diaries
              </h2>
            </div>
            <Link href="/blog">
              <Button variant="ghost" className="gap-2">
                View all <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
          <SpotlightGrid posts={featuredPosts} loading={postsLoading} />
        </div>
      </section>

      <section className="py-16 md:py-24 bg-linear-to-b from-background via-muted/20 to-background">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/videos">
              <div className="luxury-card p-8 cursor-pointer h-full transition-transform hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <Video size={24} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                      video channel
                    </div>
                    <h3 className="font-heading font-bold text-2xl">
                      Motion looks & moodboards
                    </h3>
                    <p className="text-muted-foreground">
                      Watch cinematic edits, get-ready-with-me sessions, and
                      behind-the-scenes vibes.
                    </p>
                    {featuredVideos.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground/80">
                        {featuredVideos.slice(0, 3).map(video => (
                          <span
                            key={video.id}
                            className="rounded-full border border-white/20 px-3 py-1"
                          >
                            {video.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/photos">
              <div className="luxury-card p-8 cursor-pointer h-full transition-transform hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-rose-100/10 text-rose-400">
                    <ImageIcon size={24} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                      photo gallery
                    </div>
                    <h3 className="font-heading font-bold text-2xl">
                      Editorial stills & moodboards
                    </h3>
                    <p className="text-muted-foreground">
                      Dive into album drops with saturated colors, film
                      textures, and collaborative shoots.
                    </p>
                    <div className="text-primary font-medium flex items-center gap-1">
                      View gallery <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Social Wall: TikTok comments + AI persona reactions side by side */}
      {TIKTOK_VIDEO_ID && (
        <section className="py-16 bg-linear-to-b from-muted/10 to-background">
          <div className="container">
            <div className="mb-10">
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                social wall
              </p>
              <h2 className="text-4xl font-heading font-bold tracking-tight">
                The internet is talking
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TikTokCommentFeed
                videoId={TIKTOK_VIDEO_ID}
                maxComments={6}
              />
              <AIPersonaComments
                topic={latestVideoTitle}
              />
            </div>
          </div>
        </section>
      )}

      <InstagramFeed />

      <Footer />
    </div>
  );
}
