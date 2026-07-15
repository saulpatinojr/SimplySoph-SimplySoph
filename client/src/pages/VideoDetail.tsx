import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import ShareButtons from "@/components/ShareButtons";
import { useQuery } from "@tanstack/react-query";
import {
  fetchVideoBySlug,
  incrementVideoViews,
  type ContentProduct,
  type ContentRelatedLink,
} from "@/lib/content";
import { useRoute, Link } from "wouter";
import { ArrowLeft, ExternalLink, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import RelatedStoryGrid from "@/components/RelatedStoryGrid";
import PageMediaRail from "@/components/PageMediaRail";

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

export default function VideoDetail() {
  const [, params] = useRoute("/videos/:slug");
  const videoSlug = params?.slug;

  const {
    data: video,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["video", videoSlug],
    queryFn: () => fetchVideoBySlug(videoSlug!),
    enabled: Boolean(videoSlug),
    staleTime: 5 * 60 * 1000,
  });

  if (error) console.error("Failed to load video:", error);

  // Increment view count once the video data is loaded
  useEffect(() => {
    if (video?.id) {
      void incrementVideoViews(video.id).catch(err =>
        console.warn("[VideoDetail] Failed to increment views:", err)
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading video...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Video not found</p>
            <Link href="/videos">
              <Button variant="outline">
                <ArrowLeft size={16} className="mr-2" />
                Back to Videos
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Detect embed URL
  const getEmbedUrl = (url: string): string | null => {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    // TikTok — native video embed using oembed/v2 embed
    const tiktokMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    if (tiktokMatch) return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
    return null;
  };

  const isTikTok = (url: string) => /tiktok\.com/.test(url);

  const embedUrl = getEmbedUrl(video.videoUrl);
  const relatedStories = mapRelatedLinksToStories(video.relatedLinks);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title={`${video.title} - SimplySoph Videos`}
        description={video.description || `Watch ${video.title} on SimplySoph`}
        image={video.thumbnailUrl}
        url={`/videos/${video.slug}`}
      />
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="gradient-bg py-8">
          <div className="container max-w-4xl">
            <Link href="/videos">
              <Button variant="ghost" className="mb-4 gap-2">
                <ArrowLeft size={16} />
                Back to Videos
              </Button>
            </Link>
          </div>
        </section>

        {/* Video Content */}
        <section className="py-8">
          <div className="container max-w-4xl">
            {/* Video Player or Link */}
            {embedUrl ? (
              <div className={`rounded-xl overflow-hidden shadow-lg mb-8 mx-auto ${
                isTikTok(video.videoUrl)
                  ? "max-w-sm aspect-9/16"
                  : "aspect-video"
              }`}>
                <iframe
                  src={embedUrl}
                  title={video.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <Card className="mb-8 overflow-hidden">
                {video.thumbnailUrl && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-6 text-center">
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 btn-gold px-6 py-3 rounded-full text-white font-medium"
                  >
                    Watch on{" "}
                    {video.platform === "youtube"
                      ? "YouTube"
                      : "External Platform"}
                    <ExternalLink size={16} />
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Video Info */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-heading font-bold">
                {video.title}
              </h1>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {video.publishedAt && (
                  <span>
                    {new Date(video.publishedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
                {video.duration && (
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {formatDuration(video.duration)}
                  </span>
                )}
                {video.views !== undefined && video.views > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye size={14} />
                    {video.views.toLocaleString()} views
                  </span>
                )}
              </div>

              {video.description && (
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {video.description}
                </p>
              )}

              {/* External link if not embedded */}
              {!embedUrl && (
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                >
                  Watch Video <ExternalLink size={14} />
                </a>
              )}
            </div>

            {/* Share Buttons */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                Share this video
              </h3>
              <ShareButtons
                title={video.title}
                url={`/videos/${video.slug}`}
                image={video.thumbnailUrl ?? undefined}
              />
            </div>

            {(video.featuredProducts?.length || 0) > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-2xl font-semibold font-display tracking-[-0.02em]">
                  Shop this episode
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(video.featuredProducts as ContentProduct[]).map(product => (
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
            )}

            {relatedStories.length > 0 && (
              <div className="mt-10">
                <RelatedStoryGrid title="Watch next" stories={relatedStories} />
              </div>
            )}
          </div>
        </section>
      </main>

      <PageMediaRail targetKey={`video:${video.id}`} title="More from SimplySoph" />

      <Footer />
    </div>
  );
}
