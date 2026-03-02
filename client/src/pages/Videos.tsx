import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Play } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import { useQuery } from "@tanstack/react-query";
import { fetchVideos, type VideoEntry } from "@/lib/content";
import { cn, getTikTokEmbedUrl } from "@/lib/utils";
import { Link } from "wouter";

export default function Videos() {
  const {
    data: videos,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["videos", "list"],
    queryFn: () => fetchVideos(),
    staleTime: 5 * 60 * 1000,
  });

  if (error) {
    console.error("Failed to load videos:", error);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Videos - SimplySoph Get Ready With Me & Styling Tips"
        description="Watch SimplySoph's latest videos including get ready with me sessions, fashion hauls, styling tips, and behind-the-scenes content."
        url="/videos"
      />
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="gradient-bg py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-heading font-bold mb-4 tracking-tight">
                videos
              </h1>
              <p className="text-lg text-muted-foreground">
                get ready with me, hauls & styling tips \ud83c\udfa5
              </p>
            </div>
          </div>
        </section>

        {/* Videos Grid */}
        <section className="py-16">
          <div className="container">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-video bg-muted animate-pulse" />
                    <CardContent className="p-6 space-y-3">
                      <div className="h-6 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : videos && videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos.map(video => (
                  <Link
                    key={video.id}
                    href={`/videos/${video.slug}`}
                    className="block h-full"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                      {(() => {
                        const embedUrl = getTikTokEmbedUrl(video.videoUrl);
                        return (
                          <div
                            className={cn(
                              "relative bg-muted overflow-hidden group",
                              embedUrl
                                ? "rounded-xl border border-border aspect-9/16"
                                : "aspect-video"
                            )}
                          >
                            {video.thumbnailUrl ? (
                              <>
                                <img
                                  src={video.thumbnailUrl}
                                  alt={video.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                                    <Play
                                      size={24}
                                      className="text-white ml-1"
                                      fill="white"
                                    />
                                  </div>
                                </div>
                              </>
                            ) : embedUrl ? (
                              <iframe
                                src={embedUrl}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                loading="lazy"
                                title={video.title}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play
                                  size={48}
                                  className="text-muted-foreground"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      <CardContent className="p-6">
                        <div className="text-xs text-muted-foreground mb-2">
                          {video.publishedAt &&
                            new Date(video.publishedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                        </div>
                        <h3 className="font-heading font-semibold text-xl mb-2 line-clamp-2">
                          {video.title}
                        </h3>
                        {video.description && (
                          <p className="text-muted-foreground text-sm line-clamp-2">
                            {video.description}
                          </p>
                        )}
                        <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                          Watch now <ArrowRight size={14} />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                  <Play size={32} className="text-muted-foreground ml-1" />
                </div>
                <h2 className="text-2xl font-heading font-semibold mb-2">
                  No videos yet
                </h2>
                <p className="text-muted-foreground max-w-md">
                  New content is on the way! Check back soon for get ready with
                  me videos, hauls, and styling tips.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
