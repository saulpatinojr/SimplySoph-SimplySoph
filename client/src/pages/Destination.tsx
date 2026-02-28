import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import { fetchDestinationBySlug, Destination } from "@/lib/content";
import { Loader2, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DestinationPage() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();

  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      try {
        const data = await fetchDestinationBySlug(slug);
        if (data) setDestination(data);
        else setLocation("/passport");
      } catch (error) {
        console.error("Failed to load destination", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const activeMedia = activeMediaIndex !== null && destination?.mediaItems ? destination.mediaItems[activeMediaIndex] : null;

  return (
    <div className="min-h-screen flex flex-col bg-background/95">
      <MetaTags
        title={`${destination?.city || 'Destination'} | Passport`}
        description={`Explore stamps from ${destination?.city || 'this destination'}.`}
        url={`/passport/${slug}`}
      />
      <Navigation />

      <main className="flex-1 py-12 md:py-20 relative overflow-hidden flex flex-col items-center justify-center">
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !destination ? (
          <div className="text-center py-32 text-muted-foreground">Destination not found.</div>
        ) : (
          <div className="container max-w-5xl">
            <Button variant="ghost" className="mb-8" onClick={() => setLocation("/passport")}>
              <ArrowLeft size={16} className="mr-2" /> Back to Passport
            </Button>

            {/* Passport Book Layout */}
            <div className="bg-[#f0e6d2] text-black w-full min-h-[60vh] rounded-2xl shadow-2xl overflow-hidden relative border-8 border-[#3b2f2f] flex flex-col md:flex-row">
              {/* Left Page: Header / Info */}
              <div className="w-full md:w-1/2 p-10 md:p-16 border-b md:border-b-0 md:border-r border-[#d4c5b0] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] relative">
                <div className="absolute top-4 right-4 text-xs font-mono opacity-50">
                  PASSPORT NO. {destination.id.slice(0, 8).toUpperCase()}
                </div>
                <div className="space-y-6 pt-10">
                  <div className="border-b-2 border-black/20 pb-4">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-60">Visa Type</p>
                    <p className="text-xl font-serif">TOURIST</p>
                  </div>
                  <div className="border-b-2 border-black/20 pb-4">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-60">Destination</p>
                    <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-widest text-[#2a2a2a]">
                      {destination.city}
                    </h1>
                  </div>
                  <div className="border-b-2 border-black/20 pb-4">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-60">Entry Date</p>
                    <p className="text-2xl font-serif">
                      {destination.date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Decorative background stamp */}
                <div className="absolute bottom-10 right-10 opacity-10 pointer-events-none rotate-[-15deg]">
                  <img src={destination.coverStampUrl} alt="" className="w-48 h-48 object-contain grayscale" />
                </div>
              </div>

              {/* Right Page: Visa Stamps Grid */}
              <div className="w-full md:w-1/2 p-8 md:p-12 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] flex items-center justify-center">
                <div className="w-full h-full border-4 border-dashed border-[#d4c5b0] p-6 grid grid-cols-2 gap-6 place-items-center">
                  {destination.mediaItems && destination.mediaItems.length > 0 ? (
                    destination.mediaItems.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => setActiveMediaIndex(index)}
                        className="cursor-pointer hover:scale-110 transition-transform duration-300 relative group"
                        style={{
                          transform: `rotate(${Math.random() * 20 - 10}deg)`
                        }}
                      >
                        <div className="relative w-28 h-28 md:w-32 md:h-32">
                          <img
                            src={item.visaThumbnailUrl || 'https://via.placeholder.com/150'}
                            alt={`Visa Stamp ${index}`}
                            className="w-full h-full object-contain filter drop-shadow-lg mix-blend-multiply opacity-90 group-hover:opacity-100"
                          />
                        </div>
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {item.title || `View ${item.type}`}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center text-black/40 font-serif italic py-12">
                      No visas issued yet for this destination.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Modal for Media */}
      {activeMediaIndex !== null && activeMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-12">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 right-6 text-white hover:bg-white/20"
            onClick={() => setActiveMediaIndex(null)}
          >
            <X size={32} />
          </Button>

          <div className="w-full max-w-5xl max-h-[85vh] flex flex-col items-center justify-center space-y-4">
            {activeMedia.title && (
              <h3 className="text-white text-xl font-heading font-semibold uppercase tracking-widest">
                {activeMedia.title}
              </h3>
            )}

            <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
              {activeMedia.type === 'image' && (
                <img
                  src={activeMedia.url}
                  alt={activeMedia.title || "Media"}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl border border-white/10"
                />
              )}
              {activeMedia.type === 'video' && (
                <video
                  src={activeMedia.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl border border-white/10"
                />
              )}
              {activeMedia.type === 'url' && (
                <iframe
                  src={activeMedia.url}
                  className="w-full aspect-video md:aspect-[21/9] rounded-lg shadow-2xl border border-white/10"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
