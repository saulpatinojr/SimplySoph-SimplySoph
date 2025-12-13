import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import { useQuery } from "@tanstack/react-query";
import { fetchPhotoAlbumById, fetchPhotosByAlbum } from "@/lib/content";
import { useRoute } from "wouter";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function PhotoAlbum() {
  const [, params] = useRoute("/photos/:slug");
  const albumSlug = params?.slug;

  const {
    data: album,
    isLoading: albumLoading,
    error: albumError,
  } = useQuery({
    queryKey: ["album", albumSlug],
    queryFn: () => fetchPhotoAlbumById(albumSlug!),
    enabled: Boolean(albumSlug),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: photos,
    isLoading: photosLoading,
    error: photosError,
  } = useQuery({
    queryKey: ["album", "photos", album?.id],
    queryFn: () => fetchPhotosByAlbum(album!.id),
    enabled: Boolean(album?.id),
    staleTime: 5 * 60 * 1000,
  });

  if (albumError || photosError) {
    console.error("Failed to load album:", albumError || photosError);
  }

  if (albumLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading album...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Album not found</p>
            <Link href="/photos">
              <Button variant="outline">
                <ArrowLeft size={16} className="mr-2" />
                Back to Gallery
              </Button>
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
        title={`${album.title} - SimplySoph Photo Gallery`}
        description={album.description || `Explore the ${album.title} photo collection from SimplySoph`}
        image={album.coverImage}
        url={`/photos/${album.slug}`}
      />
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="gradient-bg py-16">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <Link href="/photos">
                <Button variant="ghost" className="mb-6 gap-2">
                  <ArrowLeft size={16} />
                  Back to Gallery
                </Button>
              </Link>
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 tracking-tight">
                  {album.title}
                </h1>
                {album.description && (
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {album.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Photos Grid */}
        <section className="py-16">
          <div className="container">
            {photosLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square bg-muted animate-pulse" />
                  </Card>
                ))}
              </div>
            ) : photos && photos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden group cursor-pointer">
                    <div className="aspect-square overflow-hidden">
                      <picture>
                        <source
                          media="(max-width: 640px)"
                          srcSet={photo.imageUrls?.thumbnail || photo.imageUrl}
                        />
                        <source
                          media="(max-width: 1024px)"
                          srcSet={photo.imageUrls?.medium || photo.imageUrl}
                        />
                        <img
                          src={photo.imageUrls?.large || photo.imageUrl}
                          alt={photo.caption || ""}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </picture>
                    </div>
                    {photo.caption && (
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {photo.caption}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <ImageIcon size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No photos in this album yet.</p>
              </Card>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}