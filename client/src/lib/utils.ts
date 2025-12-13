import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Image optimization utilities
export interface OptimizedImage {
  thumbnail: Blob;
  medium: Blob;
  large: Blob;
  original: Blob;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Get image dimensions from a File or Blob
 */
export async function getImageDimensions(file: File | Blob): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Resize an image using Canvas API
 */
export async function resizeImage(
  file: File | Blob,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Optimize an image for multiple sizes
 */
export async function optimizeImage(file: File): Promise<OptimizedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Get original dimensions
  const dimensions = await getImageDimensions(file);

  // Convert original to WebP if not already
  const original = file.type === 'image/webp' ? file :
    await resizeImage(file, dimensions.width, dimensions.height, 0.9);

  // Generate sizes
  const [thumbnail, medium, large] = await Promise.all([
    resizeImage(file, 300, 300, 0.8), // Thumbnail
    resizeImage(file, 800, 800, 0.85), // Medium
    resizeImage(file, 1600, 1600, 0.9), // Large
  ]);

  return {
    thumbnail,
    medium,
    large,
    original,
  };
}

/**
 * Generate responsive image URLs for Firebase Storage
 * Note: Firebase Storage doesn't support dynamic resizing, so we store multiple sizes
 */
export function generateResponsiveImageUrls(baseUrl: string): {
  thumbnail: string;
  medium: string;
  large: string;
  original: string;
} {
  // For Firebase Storage, we need to store files with size suffixes
  const basePath = baseUrl.replace('/photos/', '/photos/optimized/');

  return {
    thumbnail: basePath.replace('.webp', '_thumb.webp'),
    medium: basePath.replace('.webp', '_medium.webp'),
    large: basePath.replace('.webp', '_large.webp'),
    original: baseUrl,
  };
}
