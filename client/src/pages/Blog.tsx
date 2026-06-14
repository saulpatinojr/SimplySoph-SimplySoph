import { useState, useMemo } from "react";
import { ArrowRight, Sparkles, Search, X } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import { useQuery } from "@tanstack/react-query";
import { fetchPublishedBlogPosts, type BlogPost } from "@/lib/content";

// ── Skeleton ────────────────────────────────────────────────────────────────
function PostCardSkeleton({ large = false }: { large?: boolean }) {
  return (
    <div
      className="rounded-2xl overflow-hidden border border-border/40 bg-card"
      style={large ? { gridColumn: "span 2" } : {}}
    >
      <div className={`skeleton w-full ${large ? "aspect-[16/9]" : "aspect-[4/3]"}`} />
      <div className="p-5 md:p-6 space-y-3">
        <div className="skeleton h-3 w-20 rounded-full" />
        <div className={`skeleton rounded ${large ? "h-8 w-3/4" : "h-6 w-5/6"}`} />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-24 rounded-full mt-2" />
      </div>
    </div>
  );
}

// ── Post card ───────────────────────────────────────────────────────────────
interface PostCardProps {
  post: BlogPost;
  featured?: boolean;
}

function PostCard({ post, featured = false }: PostCardProps) {
  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <article
        className="h-full overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:shadow-lg hover:border-border cursor-pointer"
      >
        {/* Cover image */}
        <div
          className="overflow-hidden"
          style={{ aspectRatio: featured ? "16 / 9" : "4 / 3" }}
        >
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              loading={featured ? "eager" : "lazy"}
              width={featured ? 1200 : 600}
              height={featured ? 675 : 450}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(from var(--primary) l c h / 0.07) 0%, var(--muted) 100%)",
              }}
            >
              <Sparkles
                className="h-10 w-10"
                style={{ color: "oklch(from var(--primary) l c h / 0.28)" }}
              />
            </div>
          )}
        </div>

        {/* Text */}
        <div
          className={`flex flex-col gap-3 p-5 ${
            featured ? "md:p-8" : "md:p-6"
          }`}
        >
          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            {post.category && (
              <span
                className="text-xs font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--primary)" }}
              >
                {post.category}
              </span>
            )}
            {post.category && dateStr && (
              <span
                className="h-3 w-px"
                aria-hidden="true"
                style={{ background: "var(--border)" }}
              />
            )}
            {dateStr && (
              <time
                className="text-xs"
                style={{ color: "var(--muted-foreground)" }}
                dateTime={post.publishedAt?.toString()}
              >
                {dateStr}
              </time>
            )}
            {post.readingTime && (
              <>
                <span
                  className="h-3 w-px"
                  aria-hidden="true"
                  style={{ background: "var(--border)" }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {post.readingTime} min read
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h2
            className="font-display font-semibold leading-[1.15] line-clamp-2"
            style={{
              fontSize: featured
                ? "clamp(1.375rem, 1.1rem + 1vw, 2rem)"
                : "clamp(1rem, 0.95rem + 0.25vw, 1.25rem)",
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
            }}
          >
            {post.title}
          </h2>

          {/* Excerpt — only on non-tiny cards */}
          {post.excerpt && (
            <p
              className={`leading-relaxed ${
                featured ? "line-clamp-3" : "line-clamp-2"
              }`}
              style={{
                fontSize: "clamp(0.875rem, 0.85rem + 0.15vw, 1rem)",
                color: "var(--muted-foreground)",
                maxWidth: "60ch",
              }}
            >
              {post.excerpt}
            </p>
          )}

          {/* CTA */}
          <div
            className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "var(--primary)" }}
          >
            Read more
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>
        </div>
      </article>
    </Link>
  );
}

// ── Main Blog page ───────────────────────────────────────────────────────────
export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ["blog", "list"],
    queryFn: () => fetchPublishedBlogPosts(),
    staleTime: 5 * 60 * 1000,
  });

  // Derive unique categories from posts
  const categories = useMemo(() => {
    const cats = new Set<string>();
    posts.forEach((p) => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [posts]);

  // Filter posts by search + category
  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.excerpt ?? "").toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Blog — SimplySoph Fashion Stories & Style Diaries"
        description="Read the latest fashion stories, outfit inspiration, trend reports, and style diaries from SimplySoph."
        url="/blog"
      />
      <Navigation />

      <main className="flex-1">
        {/* ── Hero header ───────────────────────────── */}
        <section
          className="relative overflow-hidden py-20 md:py-24"
          style={{
            background: "var(--background)",
          }}
          aria-label="Blog header"
        >
          {/* Warm glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.50 0.20 22 / 0.06) 0%, transparent 65%)",
            }}
          />
          <div className="container">
            <div className="flex flex-col gap-4 max-w-xl">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-block",
                    width: "24px",
                    height: "1.5px",
                    background: "var(--primary)",
                    borderRadius: "9999px",
                    opacity: 0.7,
                  }}
                />
                <span
                  className="text-xs font-sans font-semibold uppercase tracking-[0.22em]"
                  style={{ color: "var(--primary)" }}
                >
                  Stories &amp; Style
                </span>
              </div>
              <h1
                className="font-cause leading-none"
                style={{
                  fontSize: "clamp(3rem, 1.5rem + 5vw, 6rem)",
                  letterSpacing: "-0.03em",
                  color: "var(--foreground)",
                }}
              >
                The Blog
              </h1>
              <p
                className="font-sans"
                style={{
                  fontSize: "clamp(0.875rem, 0.8rem + 0.35vw, 1rem)",
                  color: "var(--muted-foreground)",
                  maxWidth: "44ch",
                }}
              >
                Outfit inspo, trend reports &amp; style diaries
              </p>
            </div>
          </div>
        </section>

        {/* ── Filter + Search bar ──────────────────── */}
        <div
          className="sticky top-[72px] z-30 py-3"
          style={{
            background: "oklch(from var(--background) l c h / 0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="container">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Category chips */}
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                <button
                  onClick={() => setActiveCategory(null)}
                  className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition-all"
                  style={{
                    borderColor: activeCategory === null ? "var(--primary)" : "var(--border)",
                    background: activeCategory === null ? "oklch(from var(--primary) l c h / 0.10)" : "transparent",
                    color: activeCategory === null ? "var(--primary)" : "var(--muted-foreground)",
                  }}
                  aria-pressed={activeCategory === null}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                    className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition-all"
                    style={{
                      borderColor: activeCategory === cat ? "var(--primary)" : "var(--border)",
                      background: activeCategory === cat ? "oklch(from var(--primary) l c h / 0.10)" : "transparent",
                      color: activeCategory === cat ? "var(--primary)" : "var(--muted-foreground)",
                    }}
                    aria-pressed={activeCategory === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Inline search */}
              <div className="relative flex-shrink-0 w-full sm:w-56">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                  style={{ color: "var(--muted-foreground)" }}
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stories…"
                  className="w-full rounded-full border bg-transparent py-1.5 pl-8 pr-8 text-sm outline-none transition-colors focus:border-primary"
                  style={{ borderColor: "var(--border)" }}
                  aria-label="Search blog posts"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-full transition-colors hover:text-primary"
                    style={{ color: "var(--muted-foreground)" }}
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Post grid ─────────────────────────────── */}
        <section className="py-12 md:py-16" aria-label="Blog posts">
          <div className="container">

            {isLoading ? (
              // Loading skeleton
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <PostCardSkeleton large />
                </div>
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            ) : error ? (
              // Error state
              <div className="rounded-2xl border border-dashed border-border py-20 flex flex-col items-center gap-4 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(from var(--destructive) l c h / 0.08)" }}
                >
                  <Sparkles className="h-5 w-5" style={{ color: "var(--destructive)" }} />
                </div>
                <p className="font-display text-xl font-semibold" style={{ color: "var(--foreground)" }}>
                  Couldn’t load posts
                </p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Please check your connection and refresh the page.
                </p>
              </div>
            ) : filteredPosts.length === 0 ? (
              // Empty / no-results state
              <div className="rounded-2xl border border-dashed border-border py-20 flex flex-col items-center gap-4 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(from var(--primary) l c h / 0.08)" }}
                >
                  <Sparkles className="h-5 w-5" style={{ color: "var(--primary)" }} />
                </div>
                <p className="font-display text-xl font-semibold" style={{ color: "var(--foreground)" }}>
                  {searchQuery || activeCategory ? "No matching stories" : "Stories coming soon"}
                </p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {searchQuery || activeCategory
                    ? "Try clearing the search or filter."
                    : "Check back soon for the first drop."}
                </p>
                {(searchQuery || activeCategory) && (
                  <button
                    onClick={() => { setSearchQuery(""); setActiveCategory(null); }}
                    className="mt-2 text-sm font-medium"
                    style={{ color: "var(--primary)" }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              // Editorial grid:
              // First post: full-width on large screens (2 of 3 cols)
              // Remaining: standard 1/3 cards
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post, i) => (
                  <div
                    key={post.id || post.slug}
                    className={i === 0 && !searchQuery && !activeCategory ? "lg:col-span-2" : ""}
                  >
                    <PostCard
                      post={post}
                      featured={i === 0 && !searchQuery && !activeCategory}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Post count */}
            {!isLoading && filteredPosts.length > 0 && (
              <p
                className="mt-8 text-center text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                {filteredPosts.length} {filteredPosts.length === 1 ? "story" : "stories"}
                {(activeCategory || searchQuery) && " found"}
              </p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
