import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import HeroBanner from "@/components/HeroBanner";
import InstagramFeed from "@/components/InstagramFeed";
import TikTokCommentFeed from "@/components/TikTokCommentFeed";
import AIPersonaComments from "@/components/AIPersonaComments";
import YouTubeLiveChat from "@/components/YouTubeLiveChat";
import { NewsletterModal, useNewsletterModal } from "@/components/NewsletterModal";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { Button } from "@/components/ui/button";
import { ArrowRight, Image as ImageIcon, Sparkles, Video, Waves } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { ENABLE_REALTIME_FEED, LOGIN_PATH, TIKTOK_VIDEO_ID, YOUTUBE_LIVE_VIDEO_ID } from "@/const";
import { fetchPublishedBlogPosts, fetchVideos, subscribeToLatestHighlights, type BlogPost, type LiveFeedItem } from "@/lib/content";
import { useAuth } from "@/_core/hooks/useAuth";
import { fetchCreatorProfile } from "@/lib/content";
import { useQuery } from "@tanstack/react-query";

const highlightIconMap: Record<LiveFeedItem["type"], ReactNode> = {
  blog: <Sparkles className="h-4 w-4 text-primary" />,
  video: <Video className="h-4 w-4" style={{ color: "var(--accent)" }} />,
  album: <ImageIcon className="h-4 w-4" style={{ color: "oklch(0.62 0.14 350)" }} />,
  destination: <Sparkles className="h-4 w-4 text-amber-400" />,
};

type SpotlightProps = { posts: BlogPost[]; loading: boolean };

function SpotlightGrid({ posts, loading }: SpotlightProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-xl overflow-hidden">
          <div className="skeleton aspect-[16/10] w-full" />
          <div className="p-6 space-y-3">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-7 w-3/4 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl overflow-hidden">
              <div className="skeleton aspect-video w-full" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-3 w-16 rounded" />
                <div className="skeleton h-5 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="py-16 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--muted)" }}>
          <Sparkles className="h-6 w-6" style={{ color: "var(--foreground-faint)" }} />
        </div>
        <p className="font-display text-2xl font-semibold" style={{ color: "var(--foreground)" }}>The first drop is coming soon</p>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No published stories yet. Check back soon.</p>
      </div>
    );
  }

  const [featured, ...rest] = posts;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Link href={`/blog/${featured.slug}`} className="md:col-span-2">
        <article className="featured-card group h-full cursor-pointer">
          <div className="overflow-hidden" style={{ aspectRatio: "16 / 10" }}>
            {featured.coverImage ? (
              <img src={featured.coverImage} alt={featured.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="eager" width={800} height={500} />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--muted) 0%, var(--surface-2) 100%)" }}>
                <Sparkles className="h-10 w-10" style={{ color: "var(--foreground-faint)" }} />
              </div>
            )}
          </div>
          <div className="p-6 md:p-8 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em]" style={{ color: "var(--muted-foreground)" }}>
              <Waves className="h-3.5 w-3.5" /> Featured Story
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight" style={{ color: "var(--foreground)" }}>{featured.title}</h2>
            <p className="text-base leading-relaxed max-w-2xl" style={{ color: "var(--muted-foreground)" }}>{featured.excerpt || featured.description}</p>
            <div className="mt-2 inline-flex items-center gap-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Read more <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </article>
      </Link>

      <div className="flex flex-col gap-6">
        {rest.slice(0, 2).map(post => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <article className="story-card group h-full cursor-pointer">
              <div className="overflow-hidden rounded-xl" style={{ aspectRatio: "4 / 3" }}>
                {post.coverImage ? (
                  <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" width={640} height={480} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--muted) 0%, var(--surface-2) 100%)" }}>
                    <ImageIcon className="h-8 w-8" style={{ color: "var(--foreground-faint)" }} />
                  </div>
                )}
              </div>
              <div className="p-4 space-y-2">
                <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "var(--muted-foreground)" }}>{post.category || "Story"}</p>
                <h3 className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>{post.title}</h3>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  return <div />;
}
