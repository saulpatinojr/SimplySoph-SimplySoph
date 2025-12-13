import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Play } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import { useQuery } from "@tanstack/react-query";
import { fetchVideos } from "@/lib/content";

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
                get ready with me, hauls & styling tips 🎥
              </p>
            </div>
          </div>
        </section>

        {/* Videos Grid */}
        <section className="py-16">
          <div className="container">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
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
                {videos.map((video) => (
                  <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <div className="relative aspect-video bg-muted overflow-hidden group">
                      {video.thumbnailUrl ? (
                        <>
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                              <Play size={24} className="text-white ml-1" fill="white" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play size={48} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="text-xs text-muted-foreground mb-2">
                        {video.publishedAt && new Date(video.publishedAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <h3 className="font-heading font-semibold text-xl mb-2 line-clamp-2">
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {video.description}
                        </p>
                      )}
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      >
                        Watch now <ArrowRight size={14} />
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No videos yet. Check back soon!</p>
              </Card>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
