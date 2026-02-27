import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentPhotos } from '@/lib/content';

export function PhotoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch recent photos directly
  // Bolt Optimization: Replace N+1 query pattern (fetching albums then photos for each)
  // with a single query for recent photos
  const { data: allPhotos = [] } = useQuery({
    queryKey: ['recentPhotos'],
    queryFn: () => fetchRecentPhotos(20),
  });

  // Auto-cycle through photos
  useEffect(() => {
    if (allPhotos.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % allPhotos.length);
    }, 4000); // Change photo every 4 seconds
    
    return () => clearInterval(interval);
  }, [allPhotos.length]);

  const goToPrevious = () => {
    setCurrentIndex(prev => 
      prev === 0 ? allPhotos.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % allPhotos.length);
  };

  if (!allPhotos.length) {
    return (
      <div className="relative w-full max-w-2xl mx-auto aspect-4/3 rounded-2xl bg-linear-to-br from-primary/10 via-background to-muted flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading gallery...</p>
      </div>
    );
  }

  const currentPhoto = allPhotos[currentIndex];

  return (
    <div className="relative w-full max-w-2xl mx-auto group">
      {/* Photo Display */}
      <div className="relative aspect-4/3 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <img
          src={currentPhoto.imageUrl}
          alt={currentPhoto.caption || 'Gallery photo'}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Caption */}
        {currentPhoto.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <p className="text-sm font-medium drop-shadow-lg">
              {currentPhoto.caption}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-linear-to-br from-[oklch(0.55_0.15_25)] to-[oklch(0.70_0.12_50)] text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
        aria-label="Previous photo"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-linear-to-br from-[oklch(0.55_0.15_25)] to-[oklch(0.70_0.12_50)] text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
        aria-label="Next photo"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {allPhotos.slice(0, Math.min(10, allPhotos.length)).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === currentIndex
                ? 'w-8 bg-linear-to-r from-[oklch(0.55_0.15_25)] to-[oklch(0.70_0.12_50)]'
                : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to photo ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
