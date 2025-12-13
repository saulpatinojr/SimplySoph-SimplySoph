import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import { useQuery } from "@tanstack/react-query";
import { fetchPhotoAlbums } from "@/lib/content";
import { Image as ImageIcon } from "lucide-react";

export default function Photos() {
  const {
    data: albums,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["albums", "list"],
    queryFn: () => fetchPhotoAlbums(),
    staleTime: 5 * 60 * 1000,
  });

  if (error) {
    console.error("Failed to load photo albums:", error);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title="Photo Gallery - SimplySoph Curated Looks & Style Moments"
        description="Explore SimplySoph's photo gallery featuring curated looks, editorial stills, moodboards, and behind-the-scenes style moments."
        url="/photos"
      />
      <Navigation />
      
      <main className="flex-1">
        {/* Header */}
        <section className="gradient-bg py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-heading font-bold mb-4 tracking-tight">
                gallery
              </h1>
              <p className="text-lg text-muted-foreground">
                curated looks & style moments 📸
              </p>
            </div>
          </div>
        </section>

        {/* Albums Grid */}
        <section className="py-16">
          <div className="container">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square bg-muted animate-pulse" />
                    <CardContent className="p-6 space-y-3">
                      <div className="h-6 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : albums && albums.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {albums.map((album) => (
                  <Card key={album.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="aspect-square bg-muted overflow-hidden group">
                      {album.coverImage ? (
                        <img
                          src={album.coverImage}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={48} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-heading font-semibold text-xl mb-2 line-clamp-2">
                        {album.title}
                      </h3>
                      {album.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {album.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No photo albums yet. Check back soon!</p>
              </Card>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
