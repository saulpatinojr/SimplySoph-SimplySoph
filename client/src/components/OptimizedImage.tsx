import { useState, useRef, useEffect } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  srcSet?: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  loading?: "lazy" | "eager";
  priority?: boolean;
  aspectRatio?: string;
  onClick?: () => void;
}

/**
 * OptimizedImage component that provides:
 * - Native lazy loading
 * - Blur-up placeholder effect
 * - Intersection Observer for fade-in
 * - Proper aspect ratio containers
 * - Error fallback
 */
export default function OptimizedImage({
  src,
  alt,
  srcSet,
  width,
  height,
  sizes = "100vw",
  className = "",
  loading = "lazy",
  priority = false,
  aspectRatio,
  onClick,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || !imgRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  if (error) {
    return (
      <div
        className={`bg-muted flex items-center justify-center text-muted-foreground ${aspectRatio ? `aspect-[${aspectRatio.replace("/", "_")}]` : ""} ${className}`}
      >
        <span className="text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={`overflow-hidden ${aspectRatio ? `aspect-[${aspectRatio.replace("/", "_")}]` : ""} ${className}`}
      onClick={onClick}
    >
      {inView && (
        <img
          src={src}
          srcSet={srcSet}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={loading}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`
            w-full h-full object-cover transition-opacity duration-300
            ${loaded ? "opacity-100" : "opacity-0"}
          `}
        />
      )}
      {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
    </div>
  );
}
