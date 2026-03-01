import { useQuery } from "@tanstack/react-query";
import { fetchPublishedBlogPosts, type BlogPost } from "@/lib/content";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface RelatedPostsProps {
  currentPostId: string;
  tags?: string[];
  categoryId?: string | null;
  maxItems?: number;
}

export default function RelatedPosts({
  currentPostId,
  tags = [],
  categoryId,
  maxItems = 3,
}: RelatedPostsProps) {
  const { data: allPosts } = useQuery({
    queryKey: ["blog", "list"],
    queryFn: () => fetchPublishedBlogPosts(),
    staleTime: 5 * 60 * 1000,
  });

  if (!allPosts || allPosts.length <= 1) return null;

  // Score posts by relevance: tag matches + same category
  const scored = allPosts
    .filter(p => p.id !== currentPostId)
    .map(post => {
      let score = 0;
      // Tag-based matching
      const postTags: string[] = (post as any).tags ?? [];
      for (const tag of tags) {
        if (postTags.includes(tag)) score += 2;
      }
      // Category matching
      if (categoryId && (post as any).categoryId === categoryId) score += 1;
      // Recency boost (newer posts scored slightly higher)
      if (post.publishedAt) {
        const daysOld =
          (Date.now() - new Date(post.publishedAt).getTime()) /
          (1000 * 60 * 60 * 24);
        if (daysOld < 30) score += 0.5;
      }
      return { post, score };
    })
    .sort((a, b) => b.score - a.score || Math.random() - 0.5)
    .slice(0, maxItems)
    .map(s => s.post);

  if (scored.length === 0) return null;

  return (
    <section className="mt-12">
      <h3 className="text-xl font-heading font-semibold mb-6">Related Posts</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {scored.map(post => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
              {post.coverImage && (
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <h4 className="font-heading font-semibold line-clamp-2 mb-1">
                  {post.title}
                </h4>
                {post.excerpt && (
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
                <span className="mt-2 text-sm text-primary font-medium inline-flex items-center gap-1">
                  Read More <ArrowRight size={12} />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
