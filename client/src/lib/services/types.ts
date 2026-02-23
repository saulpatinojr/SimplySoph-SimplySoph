export type CreatorProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  bio?: string;
  role?: "admin" | "user";
  preferences?: Record<string, any>;
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
  readingTime?: number;
  tags?: string[];
  categoryId?: string;
  authorId: string;
  views?: number;
  likes?: number;
};

export type BlogPostInput = {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  categoryId?: string;
  status: "draft" | "published";
  authorId: string;
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
  categoryId?: string;
  authorId: string;
  views?: number;
  tags?: string[];
};

export type VideoInput = {
  title: string;
  slug: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  categoryId?: string;
  authorId: string;
};

export type PhotoAlbum = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
  categoryId?: string;
  authorId: string;
  tags?: string[];
};

export type PhotoAlbumInput = {
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  categoryId?: string;
  authorId: string;
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

export type LiveFeedItem =
  | { type: "blog"; payload: BlogPost }
  | { type: "video"; payload: VideoEntry }
  | { type: "album"; payload: PhotoAlbum };
