import { useRoute } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import ShareButtons from "@/components/ShareButtons";
import { ArrowLeft, Calendar, Eye, Heart, Clock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBlogPostBySlug,
  incrementPostViews,
  togglePostLike,
  type ContentProduct,
  type ContentRelatedLink,
} from "@/lib/content";
import { useEffect, useRef, useState } from "react";
import { Comments } from "@/components/Comments";
import RelatedPosts from "@/components/RelatedPosts";
import DOMPurify from "dompurify";
import { toast } from "sonner";
import RelatedStoryGrid from "@/components/RelatedStoryGrid";
import { Card, CardContent } from "@/components/ui/card";

function mapRelatedLinksToStories(links?: ContentRelatedLink[]) {
  if (!Array.isArray(links) || links.length === 0) return [];
  return links.map(link => ({
    id: link.id,
    type:
      link.type === "destination"
        ? "external"
        : (link.type as "blog" | "video" | "album" | "external"),
    title: link.title,
    description: link.description,
    imageUrl: link.imageUrl,
    url: link.url,
    matchReason: link.matchReason || "Editor curated",
  }));
}

// ── Reading time helper ────────────────────────────────────────────────────────────
function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// ── Like button ──────────────────────────────────────────────────────────────────
function LikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const queryClient  = useQueryClient();
  // Persist liked state in session only (no localStorage — sandboxed iframe)
  const [liked, setLiked]   = useState(false);
  const [count, setCount]   = useState(initialLikes);
  const [animating, setAnimating] = useState(false);

  const { mutate: doLike } = useMutation({
    mutationFn: () => togglePostLike(postId, !liked),
    onMutate: () => {
      // Optimistic UI
      const next = !liked;
      setLiked(next);
      setCount(c => next ? c + 1 : Math.max(0, c - 1));
      setAnimating(true);
      setTimeout(() => setAnimating(false), 400);
    },
    onError: () => {
      // Revert on error
      setLiked(l => !l);
      setCount(c => liked ? c + 1 : Math.max(0, c - 1));
      toast.error("Couldn't save your like — please try again.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog", "detail"] });
    },
  });

  return (
    <button
      onClick={() => doLike()}
      aria-label={liked ? "Unlike this post" : "Like this post"}
      aria-pressed={liked}
      className={["like-btn", liked ? "liked" : ""].join(" ").trim()}
    >
      <span className="like-icon" aria-hidden="true">
        <Heart size={15} fill={liked ? "currentColor" : "none"} />
      </span>
      <span>
        {count > 0 ? count.toLocaleString() : "Like"}
      </span>
    </button>
  );
}

// ── Page-level loading skeleton ───────────────────────────────────────────────────
function PostSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <div className="py-14" style={{ background: "var(--muted)" }}>
          <div className="container max-w-4xl space-y-5">
            <div className="skeleton h-3 w-24 rounded-full" />
            <div className="skeleton h-12 w-3/4 rounded-lg" />
            <div className="skeleton h-12 w-1/2 rounded-lg" />
            <div className="flex gap-3 pt-2">
              <div className="skeleton h-4 w-20 rounded-full" />
              <div className="skeleton h-4 w-16 rounded-full" />
              <div className="skeleton h-4 w-24 rounded-full" />
            </div>
          </div>
        </div>
        <div className="container max-w-4xl py-10 space-y-6">
          <div className="skeleton aspect-video w-full rounded-2xl" />
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-4 rounded" />)}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ── Main BlogPost page ────────────────────────────────────────────────────────────
export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog", "detail", slug],
    queryFn: () => fetchBlogPostBySlug(slug),
    enabled: Boolean(slug),
  });

  const hasIncremented = useRef(false);
  useEffect(() => {
    if (!post || hasIncremented.current) return;
    hasIncremented.current = true;
    void incrementPostViews(post.id).catch(err => {
      console.warn("[BlogPost] view increment failed:", err);
    });
  }, [post]);

  // Reading progress bar — tracks scroll through article
  const [readProgress, setReadProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop || document.body.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setReadProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoading) return <PostSkeleton />;

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="text-center space-y-5">
            <p
              className="font-display font-semibold"
              style={{ fontSize: "clamp(1.5rem,1.2rem+1vw,2.5rem)", letterSpacing:"-0.02em" }}
            >
              Post Not Found
            </p>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem" }}>
              The post you’re looking for doesn’t exist or has been removed.
            </p>
            <Link href="/blog">
              <Button variant="outline" className="gap-2 mt-2">
                <ArrowLeft size={15} /> Back to Blog
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const readingTime = post.readingTime ?? estimateReadingTime(post.content ?? "");

  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : null;

  const currentUrl = typeof window !== "undefined"
    ? `${window.location.origin}/blog/${post.slug}`
    : `/blog/${post.slug}`;
  const relatedStories = mapRelatedLinksToStories(post.relatedLinks);

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title={`${post.title} — Simply Soph`}
        description={
          post.excerpt ||
          `Read ${post.title} on Simply Soph — fashion content and styling inspiration.`
        }
        image={post.coverImage}
        url={`/blog/${post.slug}`}
        type="article"
        publishedTime={post.publishedAt?.toISOString?.()}
        author="Simply Soph"
        section={post.categoryId || "Fashion"}
      />
      <Navigation />

      <main className="flex-1">
        {/* ── Hero header ─────────────────────────────────────────── */}
        <section
          className="pt-10 pb-12"
          style={{
            background: `linear-gradient(in oklab 160deg,
              oklch(0.99 0.012 58) 0%,
              oklch(0.975 0.018 18) 60%,
              oklch(0.985 0.014 75) 100%)`,
          }}
        >
          <div className="container max-w-4xl">
            {/* Back link */}
            <Link href="/blog">
              <button
                className="inline-flex items-center gap-1.5 mb-8 font-sans font-medium transition-colors"
                style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}
              >
                <ArrowLeft size={14} /> Back to Blog
              </button>
            </Link>

            {/* Category chip */}
            {post.categoryId && (
              <div className="mb-4">
                <span className="badge-category">{post.categoryId}</span>
              </div>
            )}

            {/* Title */}
            <h1
              className="font-display font-semibold leading-[1.1] mb-6"
              style={{
                fontSize: "clamp(2rem, 1.4rem + 2.5vw, 3.5rem)",
                letterSpacing: "-0.025em",
                color: "var(--foreground)",
                maxWidth: "20ch",
              }}
            >
              {post.title}
            </h1>

            {/* Post meta row */}
            <div className="post-meta mb-6">
              {dateStr && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} aria-hidden="true" />
                  <time dateTime={post.publishedAt?.toString()}>{dateStr}</time>
                </span>
              )}
              {dateStr && <span className="post-meta-divider" aria-hidden="true" />}
              <span className="flex items-center gap-1.5">
                <Clock size={12} aria-hidden="true" />
                {readingTime} min read
              </span>
              {post.views != null && (
                <>
                  <span className="post-meta-divider" aria-hidden="true" />
                  <span className="flex items-center gap-1.5">
                    <Eye size={12} aria-hidden="true" />
                    {post.views.toLocaleString()} views
                  </span>
                </>
              )}
            </div>

            {/* Action row: like + share */}
            <div className="flex flex-wrap items-center gap-3">
              <LikeButton postId={post.id} initialLikes={post.likes ?? 0} />
              <ShareButtons url={currentUrl} title={post.title} image={post.coverImage} compact />
            </div>
          </div>
        </section>

        {/* ── Cover image ────────────────────────────────────────── */}
        {post.coverImage && (
          <div className="container max-w-4xl -mt-6 mb-0 relative z-10">
            <div className="aspect-video rounded-2xl overflow-hidden shadow-lg">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
                width={1200}
                height={675}
                loading="eager"
              />
            </div>
          </div>
        )}

        {/* ── Article body ────────────────────────────────────────── */}
        <section className="py-12">
          <div className="container max-w-4xl">
            <div
              className="rounded-2xl border border-border/50 p-8 md:p-12"
              style={{ background: "var(--card)" }}
            >
              <article
                className="prose prose-lg max-w-none font-cause"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(post.content ?? "", {
                    ADD_TAGS: ["iframe"],
                    ADD_ATTR: ["allowfullscreen", "frameborder", "src", "allow"],
                  }),
                }}
              />

              {/* Bottom share bar */}
              <div
                className="mt-12 pt-8 border-t border-border/50 flex flex-wrap items-center justify-between gap-4"
              >
                <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                  Enjoyed this? Share it!
                </p>
                <ShareButtons url={currentUrl} title={post.title} image={post.coverImage} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Comments ───────────────────────────────────────────── */}
        {(post.featuredProducts?.length || 0) > 0 && (
          <section className="pb-12">
            <div className="container max-w-4xl">
              <h2 className="mb-4 text-2xl font-semibold font-display tracking-[-0.02em]">
                Shop this story
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(post.featuredProducts as ContentProduct[]).map(product => (
                  <Card key={product.id} className="overflow-hidden border-border/60">
                    <div className="aspect-4/3 bg-muted">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <CardContent className="space-y-2 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{product.brand}</p>
                      <h3 className="font-medium leading-tight">{product.name}</h3>
                      {product.price && <p className="text-sm text-muted-foreground">{product.price}</p>}
                      <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        View product
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {relatedStories.length > 0 && (
          <section className="pb-12">
            <div className="container max-w-4xl">
              <RelatedStoryGrid title="Related reads and destinations" stories={relatedStories} />
            </div>
          </section>
        )}

        <section className="pb-16">
          <div className="container max-w-4xl">
            <div
              className="rounded-2xl border border-border/50 p-8 md:p-10"
              style={{ background: "var(--card)" }}
            >
              <Comments postId={post.id} postType="blog" />
            </div>
          </div>
        </section>

        {/* ── Related posts ─────────────────────────────────────────── */}
        <section
          className="py-14 border-t border-border/40"
          style={{ background: "var(--muted/30)" }}
        >
          <div className="container max-w-4xl">
            <RelatedPosts currentPostId={post.id} categoryId={post.categoryId} tags={post.tags} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
