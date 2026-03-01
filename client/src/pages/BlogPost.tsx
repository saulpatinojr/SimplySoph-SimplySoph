import { useRoute } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import ShareButtons from "@/components/ShareButtons";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchBlogPostBySlug, incrementPostViews } from "@/lib/content";
import { useEffect, useRef } from "react";
import { Comments } from "@/components/Comments";
import RelatedPosts from "@/components/RelatedPosts";
import DOMPurify from "dompurify";

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
    void incrementPostViews(post.id).catch(error => {
      console.warn("[Blog] Failed to increment views", error);
    });
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-16">
          <div className="container max-w-4xl">
            <div className="space-y-6 animate-pulse">
              <div className="h-12 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="aspect-video bg-muted rounded" />
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-5/6" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 py-16">
          <div className="container max-w-4xl text-center">
            <h1 className="text-3xl font-heading font-bold mb-4">
              Post Not Found
            </h1>
            <p className="text-muted-foreground mb-8">
              The blog post you're looking for doesn't exist.
            </p>
            <Link href="/blog">
              <Button>Back to Blog</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title={`${post.title} - SimplySoph`}
        description={
          post.excerpt ||
          `Read ${post.title} on SimplySoph - premium fashion content and styling tips.`
        }
        image={post.coverImage}
        url={`/blog/${post.slug}`}
        type="article"
        publishedTime={post.publishedAt?.toISOString()}
        author="SimplySoph"
        section="Fashion"
      />
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="gradient-bg py-12">
          <div className="container max-w-4xl">
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="gap-2 mb-6">
                <ArrowLeft size={16} /> Back to Blog
              </Button>
            </Link>

            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              {post.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {post.publishedAt && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Eye size={16} />
                {post.views} views
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container max-w-4xl">
            {post.coverImage && (
              <div className="aspect-video rounded-lg overflow-hidden mb-8">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <Card className="p-8 md:p-12">
              <article
                className="prose prose-lg max-w-none font-cause"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(post.content, {
                    ADD_TAGS: ["iframe"],
                    ADD_ATTR: [
                      "allow",
                      "allowfullscreen",
                      "frameborder",
                      "scrolling",
                    ],
                  }),
                }}
              />
            </Card>

            {/* Share Buttons */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                Share this post
              </h3>
              <ShareButtons
                title={post.title}
                url={`/blog/${post.slug}`}
                image={post.coverImage ?? undefined}
              />
            </div>

            {/* Comments Section */}
            <div className="mt-12">
              <Comments postId={post.id} postType="blog" />
            </div>

            {/* Related Posts */}
            <RelatedPosts
              currentPostId={post.id}
              tags={(post as any).tags}
              categoryId={(post as any).categoryId}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
