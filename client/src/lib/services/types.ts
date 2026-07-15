export type CreatorProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  bio?: string;
  role?: "admin" | "user";
  preferences?: Record<string, any>;
};

/** A reusable item in the admin media library. */
export type MediaAsset = {
  id: string;
  title: string;
  mediaType: "image" | "video";
  source: "upload" | "youtube" | "instagram" | "tiktok" | "external";
  url: string;
  thumbnailUrl?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type MediaAssetInput = Omit<MediaAsset, "id" | "createdAt" | "updatedAt">;

export type MediaPlacement = {
  id: string;
  targetKey: string;
  slot: "feature" | "inline" | "gallery" | "companion";
  assetId: string;
  title: string;
  mediaType: "image" | "video";
  source: MediaAsset["source"];
  url: string;
  thumbnailUrl?: string;
  status: "published" | "hidden";
  createdAt: Date;
  updatedAt: Date;
};

export type ContentRelatedLink = {
  id: string;
  type: "blog" | "video" | "album" | "destination" | "external";
  title: string;
  url: string;
  description?: string;
  imageUrl?: string;
  matchReason?: string;
};

export type ContentProduct = {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  productUrl: string;
  price?: string;
  retailer?: string;
  notes?: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  status: "draft" | "published" | "archived";
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  publishAt?: Date;
  readingTime?: number;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  disclosureText?: string;
  coverImageAlt?: string;
  categoryId?: string;
  authorId: string;
  views?: number;
  likes?: number;
  cityGuideNotes?: string[];
  featuredProducts?: ContentProduct[];
  relatedLinks?: ContentRelatedLink[];
};

export type BlogPostInput = {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  categoryId?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  disclosureText?: string;
  coverImageAlt?: string;
  status: "draft" | "published" | "archived";
  publishAt?: Date;
  authorId: string;
  cityGuideNotes?: string[];
  featuredProducts?: ContentProduct[];
  relatedLinks?: ContentRelatedLink[];
};

export type VideoEntry = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  platform?: "youtube" | "vimeo" | "other";
  duration?: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  publishAt?: Date;
  categoryId?: string;
  authorId: string;
  views?: number;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  disclosureText?: string;
  thumbnailAlt?: string;
  cityGuideNotes?: string[];
  featuredProducts?: ContentProduct[];
  relatedLinks?: ContentRelatedLink[];
};

export type VideoInput = {
  title: string;
  slug: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  categoryId?: string;
  publishAt?: Date;
  authorId: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  disclosureText?: string;
  thumbnailAlt?: string;
  cityGuideNotes?: string[];
  featuredProducts?: ContentProduct[];
  relatedLinks?: ContentRelatedLink[];
};

export type PhotoAlbum = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
  publishAt?: Date;
  categoryId?: string;
  authorId: string;
  tags?: string[];
  canonicalUrl?: string;
  disclosureText?: string;
  coverImageAlt?: string;
  status?: "draft" | "published" | "archived";
  cityGuideNotes?: string[];
  featuredProducts?: ContentProduct[];
  relatedLinks?: ContentRelatedLink[];
};

export type PhotoAlbumInput = {
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  categoryId?: string;
  canonicalUrl?: string;
  disclosureText?: string;
  coverImageAlt?: string;
  status?: "draft" | "published" | "archived";
  publishAt?: Date;
  authorId: string;
  cityGuideNotes?: string[];
  featuredProducts?: ContentProduct[];
  relatedLinks?: ContentRelatedLink[];
};

export type Photo = {
  id: string;
  albumId: string;
  imageUrl: string;
  imageUrls?: {
    thumbnail: string;
    medium: string;
    large: string;
    original: string;
  };
  caption?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PhotoInput = {
  albumId: string;
  imageUrl: string;
  imageUrls?: {
    thumbnail: string;
    medium: string;
    large: string;
    original: string;
  };
  caption?: string;
  order: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  type: "blog" | "video" | "photo";
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryInput = {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  type: "blog" | "video" | "photo";
};

export type ScheduledPost = {
  id: string;
  contentId?: string; // If repurposed from existing content
  platform: "instagram_post" | "instagram_reel" | "youtube_shorts" | "tiktok";
  caption: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  scheduledAt: Date;
  status: "scheduled" | "posted" | "failed";
  createdAt: Date;
  updatedAt: Date;
  postedAt?: Date;
};

export type ScheduledPostInput = {
  contentId?: string;
  platform: "instagram_post" | "instagram_reel" | "youtube_shorts" | "tiktok";
  caption: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  scheduledAt: Date;
  status: "scheduled" | "posted" | "failed";
};

import type { Destination } from "./destination";

export type LiveFeedItem =
  | { type: "destination"; payload: Destination }
  | { type: "blog"; payload: BlogPost }
  | { type: "video"; payload: VideoEntry }
  | { type: "album"; payload: PhotoAlbum };
