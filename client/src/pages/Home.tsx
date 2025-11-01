import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, Video, Image as ImageIcon } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { data: recentPosts, isLoading: postsLoading } = trpc.blog.list.useQuery();
  const { data: recentVideos } = trpc.video.list.useQuery();

  const featuredPosts = recentPosts?.slice(0, 3) || [];
  const featuredVideos = recentVideos?.slice(0, 3) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="gradient-bg py-20 md:py-32">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium tracking-wide">
              <Sparkles size={16} />
              SIMPLY SOPH
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold leading-tight text-balance">
              Style That Speaks{" "}
              <span className="gradient-text">Volumes</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              your go-to for outfit inspo, trend alerts, and all things fashion ✨
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/blog">
                <button className="btn-gold px-8 py-4 rounded-full text-white font-medium text-lg transition-all hover:scale-105 flex items-center gap-2">
                  Explore Blog <ArrowRight size={18} />
                </button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="px-8 py-4 rounded-full text-lg border-2 hover:border-primary hover:text-primary">
                  About Me
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Blog Posts */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-heading font-bold tracking-tight">latest drops</h2>
              <p className="text-muted-foreground mt-2 text-sm uppercase tracking-wider">fresh fits & style tips</p>
            </div>
            <Link href="/blog">
              <Button variant="ghost" className="gap-2">
                View All <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          {postsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-video bg-muted animate-pulse" />
                  <CardContent className="p-6 space-y-3">
                    <div className="h-6 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <div key={post.id} className="luxury-card overflow-hidden h-full group">
                    {post.coverImage && (
                      <div className="aspect-video bg-muted overflow-hidden">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="font-heading font-semibold text-xl mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="mt-4 text-sm text-primary font-medium flex items-center gap-1">
                        Read More <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No posts yet. Check back soon!</p>
            </Card>
          )}
        </div>
      </section>

      {/* Content Grid */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Videos */}
            <Link href="/videos">
              <div className="luxury-card p-8 cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <Video size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-xl mb-2">Video Content</h3>
                    <p className="text-muted-foreground mb-4">
                      Watch my latest videos, tutorials, and behind-the-scenes content.
                    </p>
                    <div className="text-primary font-medium flex items-center gap-1">
                      Explore Videos <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Photos */}
            <Link href="/photos">
              <div className="luxury-card p-8 cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-accent/10 text-accent">
                    <ImageIcon size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-xl mb-2">Photo Gallery</h3>
                    <p className="text-muted-foreground mb-4">
                      Browse my curated photo collections and style inspiration.
                    </p>
                    <div className="text-accent font-medium flex items-center gap-1">
                      View Gallery <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
