import { useState, useMemo } from "react";
import { ArrowRight, Sparkles, X, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import { useQuery } from "@tanstack/react-query";
import { fetchPublishedBlogPosts, type BlogPost } from "@/lib/content";

// ── Skeletons ────────────────────────────────────────────────────────────────
function FeaturedSkeleton() {
  return (
    <div className="magazine-featured rounded-2xl overflow-hidden border border-border/40 bg-card">
      <div className="skeleton w-full aspect-[16/9]" />
      <div className="p-6 md:p-8 space-y-3">
        <div className="skeleton h-3 w-24 rounded-full" />
        <div className="skeleton h-9 w-3/4 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-5/6 rounded" />
        <div className="skeleton h-3 w-28 rounded-full mt-2" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border/40 bg-card">
      <div className="skeleton w-full aspect-[4/3]" />
      <div className="p-5 space-y-2.5">
        <div className="skeleton h-3 w-20 rounded-full" />
        <div className="skeleton h-5 w-5/6 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-24 rounded-full mt-1" />
      </div>
    </div>
  );
}

function SideCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl border border-border/40 bg-card p-4">
      <div className="skeleton flex-shrink-0 rounded-xl w-20 h-20" />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="skeleton h-3 w-14 rounded-full" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
      </div>
    </div>
  );
}

// ── Post meta row ─────────────────────────────────────────────────────────────
function PostMeta({ post }: { post: BlogPost }) {
  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      })
    : null;

  return (
    <div className="post-meta">
      {post.category && (
        <span className="post-meta-category">{post.category}</span>
      )}
      {post.category && dateStr && <span className="post-meta-divider" aria-hidden="true" />}
      {dateStr && (
        <time dateTime={post.publishedAt?.toString()}>{dateStr}</time>
      )}
      {post.readingTime && (
        <>
          <span className="post-meta-divider" aria-hidden="true" />
          <span>{post.readingTime} min read</span>
        </>
      )}
    </div>
  );
}

// ── Featured card (spans 2 cols, 16:9) ────────────────────────────────────────
function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group magazine-featured">
      <article className="h-full overflow-hidden rounded-2xl border border-border/50 bg-card luxury-card cursor-pointer">
        <div className="overflow-hidden aspect-[16/9]">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover card-img-zoom"
              loading="eager"
              width={1200}
              height={675}
            />
          ) : (
            <FeaturedPlaceholder />
          )}
        </div>
        <div className="p-6 md:p-8 flex flex-col gap-3">
          <PostMeta post={post} />
          {/* Featured label */}
          <div className="flex items-center gap-2">
            <TrendingUp size={13} style={{ color: "var(--primary)" }} aria-hidden="true" />
            <span
              className="font-sans font-semibold uppercase"
              style={{ fontSize: "0.65rem", letterSpacing: "0.18em", color: "var(--primary)" }}
            >
              Featured
            </span>
          </div>
          <h2
            className="font-display font-semibold leading-[1.15] line-clamp-2"
            style={{
              fontSize: "clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem)",
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
            }}
          >
            {post.title}
          </h2>
          {post.excerpt && (
            <p
              className="line-clamp-2 leading-relaxed"
              style={{ fontSize: "0.9rem", color: "var(--muted-foreground)" }}
            >
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center gap-1.5 pt-1" style={{ color: "var(--primary)", fontSize: "0.8rem", fontWeight: 600 }}>
            Read more <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
}

// ── Sidebar compact card ──────────────────────────────────────────────────────
function SideCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <article className="flex gap-4 rounded-xl border border-border/40 bg-card p-4 transition-all duration-300 hover:border-border hover:shadow-md cursor-pointer">
        <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-muted">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover card-img-zoom"
              loading="lazy"
              width={80}
              height={80}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles size={18} style={{ color: "oklch(from var(--primary) l c h / 0.28)" }} />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <PostMeta post={post} />
          <h3
            className="font-display font-semibold leading-snug line-clamp-2"
            style={{ fontSize: "clamp(0.85rem, 0.8rem + 0.2vw, 1rem)", letterSpacing: "-0.01em", color: "var(--foreground)" }}
          >
            {post.title}
          </h3>
        </div>
      </article>
    </Link>
  );
}

// ── Standard grid card (4:3) ─────────────────────────────────────────────────
function PostCard({ post, delay = 0 }: { post: BlogPost; delay?: number }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <article
        className="h-full overflow-hidden rounded-2xl border border-border/50 bg-card luxury-card cursor-pointer reveal-up"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="overflow-hidden aspect-[4/3]">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover card-img-zoom"
              loading="lazy"
              width={600}
              height={450}
            />
          ) : (
            <FeaturedPlaceholder dim />
          )}
        </div>
        <div className="p-5 md:p-6 flex flex-col gap-2.5">
          <PostMeta post={post} />
          <h2
            className="font-display font-semibold leading-[1.2] line-clamp-2"
            style={{
              fontSize: "clamp(0.95rem, 0.88rem + 0.4vw, 1.2rem)",
              letterSpacing: "-0.018em",
              color: "var(--foreground)",
            }}
          >
            {post.title}
          </h2>
          {post.excerpt && (
            <p
              className="line-clamp-2 leading-relaxed"
              style={{ fontSize: "0.825rem", color: "var(--muted-foreground)" }}
            >
              {post.excerpt}
            </p>
          )}
          <div
            className="flex items-center gap-1 pt-0.5 font-sans font-semibold"
            style={{ fontSize: "0.75rem", color: "var(--primary)" }}
          >
            Read more <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </article>
    </Link>
  );
}

// ── Placeholder fill ──────────────────────────────────────────────────────────
function FeaturedPlaceholder({ dim = false }: { dim?: boolean }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: dim
          ? "linear-gradient(135deg, oklch(from var(--primary) l c h / 0.05) 0%, var(--muted) 100%)"
          : "linear-gradient(135deg, oklch(from var(--primary) l c h / 0.08) 0%, var(--muted) 100%)",
      }}
    >
      <Sparkles
        className="h-10 w-10"
        style={{ color: "oklch(from var(--primary) l c h / 0.25)" }}
      />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ filtered = false }: { filtered?: boolean }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-border py-20 flex flex-col items-center gap-5 text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: "oklch(from var(--primary) l c h / 0.08)" }}
      >
        <Sparkles className="h-6 w-6" style={{ color: "var(--primary)" }} />
      </div>
      <div className="space-y-1.5">
        <p
          className="font-display font-semibold"
          style={{ fontSize: "clamp(1.25rem, 1.1rem + 0.5vw, 1.75rem)", color: "var(--foreground)" }}
        >
          {filtered ? "No posts match this filter" : "The first drop is coming soon"}
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          {filtered ? "Try clearing the filter to see all posts." : "No published stories yet — check back soon."}
        </p>
      </div>
    </div>
  );
}

// ── Main Blog page ────────────────────────────────────────────────────────────
export default function Blog() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: fetchPublishedBlogPosts,
  });

  // Collect unique categories
  const categories = useMemo(() => {
    const cats = new Set(posts.map(p => p.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [posts]);

  const filtered = useMemo(() =>
    activeCategory ? posts.filter(p => p.category === activeCategory) : posts,
    [posts, activeCategory]
  );

  const [featured, ...rest] = filtered;
  const sidebar = rest.slice(0, 3);
  const grid    = rest.slice(3);

  return (
    <>
      <MetaTags
        title="Blog — Simply Soph"
        description="Fashion diaries, style guides, and creative stories from Simply Soph."
      />
      <Navigation />

      <main>
        {/* ── Page header ──────────────────────────────────────── */}
        <section
          className="py-14 md:py-18"
          style={{
            background: `linear-gradient(in oklab 160deg,
              oklch(0.99 0.012 58) 0%,
              oklch(0.975 0.018 18) 50%,
              oklch(0.985 0.014 75) 100%)`,
          }}
        >
          <div className="container">
            <div className="flex flex-col gap-4 max-w-xl reveal-up">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-block", width: "24px", height: "1.5px",
                    background: "var(--primary)", borderRadius: "9999px",
                  }}
                />
                <span
                  className="font-sans font-semibold uppercase"
                  style={{ fontSize: "0.68rem", letterSpacing: "0.26em", color: "var(--primary)" }}
                >
                  The Journal
                </span>
              </div>
              <h1
                className="font-display font-semibold leading-none"
                style={{
                  fontSize: "clamp(2.5rem, 1.5rem + 4vw, 4.5rem)",
                  letterSpacing: "-0.03em",
                  color: "var(--foreground)",
                }}
              >
                Stories &amp;
                <span className="block gradient-text">Inspiration</span>
              </h1>
              <p style={{ fontSize: "0.9rem", color: "var(--muted-foreground)", maxWidth: "40ch", lineHeight: 1.7 }}>
                Fashion diaries, style guides, beauty discoveries, and creative stories — straight from Soph.
              </p>
            </div>
          </div>
        </section>

        <span className="section-rule block" aria-hidden="true" />

        {/* ── Category filter bar ───────────────────────────────── */}
        {categories.length > 0 && (
          <div
            className="sticky z-30 border-b border-border/40"
            style={{
              top: "var(--nav-h, 68px)",
              background: "oklch(0.99 0.012 58 / 0.92)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <div className="container">
              <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
                <button
                  className={[
                    "flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-sans font-semibold transition-all",
                    "text-[0.72rem] tracking-wide uppercase",
                    !activeCategory
                      ? "bg-primary text-white shadow-sm"
                      : "bg-transparent text-foreground/60 hover:text-foreground hover:bg-muted",
                  ].join(" ")}
                  onClick={() => setActiveCategory(null)}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={[
                      "flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-sans font-semibold transition-all",
                      "text-[0.72rem] tracking-wide uppercase",
                      activeCategory === cat
                        ? "bg-primary text-white shadow-sm"
                        : "bg-transparent text-foreground/60 hover:text-foreground hover:bg-muted",
                    ].join(" ")}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
                {activeCategory && (
                  <button
                    className="flex-shrink-0 ml-auto flex items-center gap-1 text-[0.72rem] font-sans font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setActiveCategory(null)}
                    aria-label="Clear filter"
                  >
                    <X size={13} /> Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Magazine editorial grid ────────────────────────────── */}
        <div className="container py-10 md:py-14">

          {isLoading ? (
            /* Skeleton grid */
            <>
              {/* Featured + sidebar skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7 mb-10">
                <FeaturedSkeleton />
                <div className="flex flex-col gap-4">
                  <SideCardSkeleton />
                  <SideCardSkeleton />
                  <SideCardSkeleton />
                </div>
              </div>
              {/* Standard grid skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </>
          ) : !filtered.length ? (
            <EmptyState filtered={!!activeCategory} />
          ) : (
            <>
              {/* ── Row 1: featured (2/3) + sidebar compact cards (1/3) */}
              {featured && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7 mb-10">
                  <FeaturedCard post={featured} />

                  {/* Sidebar: up to 3 compact cards stacked */}
                  <div className="flex flex-col gap-4">
                    {sidebar.length > 0 ? (
                      sidebar.map((post, i) => (
                        <SideCard key={post.id ?? post.slug} post={post} />
                      ))
                    ) : (
                      /* Filler when there's only 1 post */
                      <div
                        className="flex-1 rounded-xl border border-dashed border-border/50 flex items-center justify-center"
                        style={{ minHeight: "160px" }}
                      >
                        <p className="text-xs text-muted-foreground">More stories coming soon</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Divider between featured row and grid */}
              {grid.length > 0 && (
                <>
                  <div className="flex items-center gap-4 mb-8">
                    <span className="flex-1 section-rule" />
                    <span
                      className="font-sans font-semibold uppercase flex-shrink-0"
                      style={{ fontSize: "0.68rem", letterSpacing: "0.20em", color: "var(--muted-foreground)" }}
                    >
                      More Stories
                    </span>
                    <span className="flex-1 section-rule" />
                  </div>

                  {/* ── Row 2+: standard 3-col grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
                    {grid.map((post, i) => (
                      <PostCard
                        key={post.id ?? post.slug}
                        post={post}
                        delay={Math.min(i, 3) * 80}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
