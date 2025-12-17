import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  deleteDoc,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QueryFieldFilterConstraint,
  type QueryOrderByConstraint,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseFirestore } from "./firebase";
import { generateSearchTokens } from "./search";
import { ENABLE_REALTIME_FEED } from "@/const";

function db() {
  return getFirebaseFirestore();
}

// Helpers
function withId<T>(doc: QueryDocumentSnapshot): T {
  return { id: doc.id, ...doc.data() } as T;
}

function mapDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  // If it's a Firestore Timestamp, it has toDate()
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }
  // If it's already a Date
  if (timestamp instanceof Date) return timestamp;
  // Fallback for strings/numbers if necessary
  return new Date(timestamp);
}

// Mappers
function mapPost(data: any): BlogPost {
  return {
    ...data,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
    publishedAt: mapDate(data.publishedAt),
  };
}

function mapVideo(data: any): VideoEntry {
  return {
    ...data,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
    publishedAt: mapDate(data.publishedAt),
  };
}

function mapAlbum(data: any): PhotoAlbum {
  return {
    ...data,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
  };
}

function mapPhoto(data: any): Photo {
  return {
    ...data,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
  };
}

function mapCategory(data: any): Category {
  return {
    ...data,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
  };
}

function mapScheduledPost(data: any): ScheduledPost {
  return {
    ...data,
    scheduledAt: mapDate(data.scheduledAt)!,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
    postedAt: mapDate(data.postedAt),
  };
}


// Types
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

// Implementations

export async function fetchCreatorProfile(uid: string): Promise<CreatorProfile | null> {
  const docRef = doc(db(), "users", uid);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data() as CreatorProfile;
  }
  return null;
}

export async function upsertCreatorProfile(profile: Partial<CreatorProfile> & { uid: string }): Promise<CreatorProfile> {
  const docRef = doc(db(), "users", profile.uid);
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    await updateDoc(docRef, profile);
    return { ...snapshot.data(), ...profile } as CreatorProfile;
  } else {
    const newProfile = {
      ...profile,
      role: "user", // Default role
      preferences: {},
    } as CreatorProfile;
    await setDoc(docRef, newProfile);
    return newProfile;
  }
}

export async function fetchAllBlogPosts(): Promise<BlogPost[]> {
  const snapshot = await getDocs(
    query(collection(db(), "blogPosts"), orderBy("createdAt", "desc"))
  );
  return snapshot.docs.map(docSnap => mapPost(withId(docSnap)));
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const snapshot = await getDocs(
    query(collection(db(), "blogPosts"), where("slug", "==", slug), limit(1))
  );
  if (snapshot.empty) return null;
  return mapPost(withId(snapshot.docs[0]));
}

export async function fetchBlogPostById(id: string): Promise<BlogPost | null> {
  const snapshot = await getDoc(doc(db(), "blogPosts", id));
  if (!snapshot.exists()) return null;
  return mapPost({ id: snapshot.id, ...(snapshot.data() as DocumentData) });
}

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

export async function saveBlogPost(
  input: BlogPostInput,
  postId?: string
): Promise<string> {
  const collectionRef = collection(db(), "blogPosts");
  const now = serverTimestamp();
  const searchTokens = generateSearchTokens(input.title, input.excerpt, input.content);

  if (postId) {
    const ref = doc(collectionRef, postId);
    const payload: Partial<BlogPost> = {
      ...input,
      excerpt: input.excerpt ?? null,
      coverImage: input.coverImage ?? null,
      categoryId: input.categoryId ?? null,
      updatedAt: now as any, // Cast for partial update
      readingTime: Math.max(1, Math.round(input.content.split(/\s+/).length / 200)),
      searchTokens,
    };
    if (input.status === "published") {
      payload.publishedAt = now as any;
    }
    await updateDoc(ref, payload);
    return postId;
  }

  const ref = doc(collectionRef);
  await setDoc(ref, {
    ...input,
    excerpt: input.excerpt ?? null,
    coverImage: input.coverImage ?? null,
    categoryId: input.categoryId ?? null,
    createdAt: now,
    updatedAt: now,
    publishedAt: input.status === "published" ? now : null,
    readingTime: Math.max(1, Math.round(input.content.split(/\s+/).length / 200)),
    views: 0,
    likes: 0,
    searchTokens,
  });
  return ref.id;
}

export async function deleteBlogPost(postId: string): Promise<void> {
  await deleteDoc(doc(db(), "blogPosts", postId));
}

export async function fetchVideos(limitCount?: number): Promise<VideoEntry[]> {
  const snapshot = await getDocs(
    query(
      collection(db(), "videos"),
      orderBy("publishedAt", "desc"),
      ...(limitCount ? [limit(limitCount)] : [])
    )
  );
  return snapshot.docs.map(docSnap => mapVideo(withId(docSnap)));
}

export type VideoInput = {
  title: string;
  slug: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  categoryId?: string;
  authorId: string;
};

export async function saveVideo(
  input: VideoInput,
  videoId?: string
): Promise<string> {
  const collectionRef = collection(db(), "videos");
  const now = serverTimestamp();
  const searchTokens = generateSearchTokens(input.title, input.description);

  if (videoId) {
    const ref = doc(collectionRef, videoId);
    await updateDoc(ref, {
      ...input,
      description: input.description ?? null,
      thumbnailUrl: input.thumbnailUrl ?? null,
      categoryId: input.categoryId ?? null,
      updatedAt: now,
      searchTokens,
    });
    return videoId;
  }

  const ref = doc(collectionRef);
  await setDoc(ref, {
    ...input,
    description: input.description ?? null,
    thumbnailUrl: input.thumbnailUrl ?? null,
    categoryId: input.categoryId ?? null,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    views: 0,
    searchTokens,
  });
  return ref.id;
}

export async function deleteVideo(videoId: string): Promise<void> {
  await deleteDoc(doc(db(), "videos", videoId));
}

export async function fetchVideoById(id: string): Promise<VideoEntry | null> {
  const snapshot = await getDoc(doc(db(), "videos", id));
  if (!snapshot.exists()) return null;
  return mapVideo({ id: snapshot.id, ...(snapshot.data() as DocumentData) });
}

export async function fetchPhotoAlbums(): Promise<PhotoAlbum[]> {
  const snapshot = await getDocs(
    query(collection(db(), "photoAlbums"), orderBy("createdAt", "desc"))
  );
  return snapshot.docs.map(docSnap => mapAlbum(withId(docSnap)));
}

export async function fetchPhotosByAlbum(albumId: string): Promise<Photo[]> {
  const snapshot = await getDocs(
    query(
      collection(db(), "photos"),
      where("albumId", "==", albumId),
      orderBy("order", "asc")
    )
  );
  return snapshot.docs.map(docSnap => mapPhoto(withId(docSnap)));
}

export type PhotoAlbumInput = {
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  categoryId?: string;
  authorId: string;
};

export async function savePhotoAlbum(
  input: PhotoAlbumInput,
  albumId?: string
): Promise<string> {
  const collectionRef = collection(db(), "photoAlbums");
  const now = serverTimestamp();

  if (albumId) {
    const ref = doc(collectionRef, albumId);
    await updateDoc(ref, {
      ...input,
      description: input.description ?? null,
      coverImage: input.coverImage ?? null,
      categoryId: input.categoryId ?? null,
      updatedAt: now,
    });
    return albumId;
  }

  const ref = doc(collectionRef);
  await setDoc(ref, {
    ...input,
    description: input.description ?? null,
    coverImage: input.coverImage ?? null,
    categoryId: input.categoryId ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function deletePhotoAlbum(albumId: string): Promise<void> {
  // First delete all photos in the album
  const photosSnapshot = await getDocs(
    query(collection(db(), "photos"), where("albumId", "==", albumId))
  );
  const deletePromises = photosSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
  await Promise.all(deletePromises);

  // Then delete the album
  await deleteDoc(doc(db(), "photoAlbums", albumId));
}

export async function fetchPhotoAlbumById(id: string): Promise<PhotoAlbum | null> {
  const snapshot = await getDoc(doc(db(), "photoAlbums", id));
  if (!snapshot.exists()) return null;
  return mapAlbum({ id: snapshot.id, ...(snapshot.data() as DocumentData) });
}

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

export async function savePhoto(input: PhotoInput, photoId?: string): Promise<string> {
  const collectionRef = collection(db(), "photos");
  const now = serverTimestamp();

  if (photoId) {
    const ref = doc(collectionRef, photoId);
    await updateDoc(ref, {
      ...input,
      caption: input.caption ?? null,
      imageUrls: input.imageUrls ?? null,
      updatedAt: now,
    });
    return photoId;
  }

  const ref = doc(collectionRef);
  await setDoc(ref, {
    ...input,
    caption: input.caption ?? null,
    imageUrls: input.imageUrls ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function deletePhoto(photoId: string): Promise<void> {
  await deleteDoc(doc(db(), "photos", photoId));
}

export async function fetchPhotoById(id: string): Promise<Photo | null> {
  const snapshot = await getDoc(doc(db(), "photos", id));
  if (!snapshot.exists()) return null;
  return mapPhoto({ id: snapshot.id, ...(snapshot.data() as DocumentData) });
}

export async function fetchCategories(type?: "blog" | "video" | "photo"): Promise<Category[]> {
  const constraints: (QueryFieldFilterConstraint | QueryOrderByConstraint)[] = [];
  if (type) {
    constraints.push(where("type", "==", type));
  }
  constraints.push(orderBy("createdAt", "desc"));
  const snapshot = await getDocs(
    query(collection(db(), "categories"), ...constraints)
  );
  return snapshot.docs.map(docSnap => mapCategory(withId(docSnap)));
}

export type CategoryInput = {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  type: "blog" | "video" | "photo";
};

export async function saveCategory(
  input: CategoryInput,
  categoryId?: string
): Promise<string> {
  const collectionRef = collection(db(), "categories");
  const now = serverTimestamp();

  if (categoryId) {
    const ref = doc(collectionRef, categoryId);
    await updateDoc(ref, {
      ...input,
      description: input.description ?? null,
      color: input.color ?? null,
      updatedAt: now,
    });
    return categoryId;
  }

  const ref = doc(collectionRef);
  await setDoc(ref, {
    ...input,
    description: input.description ?? null,
    color: input.color ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await deleteDoc(doc(db(), "categories", categoryId));
}

export async function fetchCategoryById(id: string): Promise<Category | null> {
  const snapshot = await getDoc(doc(db(), "categories", id));
  if (!snapshot.exists()) return null;
  return mapCategory({ id: snapshot.id, ...(snapshot.data() as DocumentData) });
}

// Scheduled Post Implementation
export async function fetchScheduledPosts(from: Date, to: Date): Promise<ScheduledPost[]> {
  const snapshot = await getDocs(
    query(
      collection(db(), "scheduledPosts"),
      where("scheduledAt", ">=", from),
      where("scheduledAt", "<=", to),
      orderBy("scheduledAt", "asc")
    )
  );
  return snapshot.docs.map(docSnap => mapScheduledPost(withId(docSnap)));
}

export type ScheduledPostInput = {
  contentId?: string;
  platform: "instagram_post" | "instagram_reel" | "youtube_shorts" | "tiktok";
  caption: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  scheduledAt: Date;
  status: "scheduled" | "posted" | "failed";
};

export async function saveScheduledPost(input: ScheduledPostInput, id?: string): Promise<string> {
  const collectionRef = collection(db(), "scheduledPosts");
  const now = serverTimestamp();

  if (id) {
    const ref = doc(collectionRef, id);
    await updateDoc(ref, {
      ...input,
      contentId: input.contentId ?? null,
      thumbnailUrl: input.thumbnailUrl ?? null,
      updatedAt: now,
    });
    return id;
  }

  const ref = doc(collectionRef);
  await setDoc(ref, {
    ...input,
    contentId: input.contentId ?? null,
    thumbnailUrl: input.thumbnailUrl ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function deleteScheduledPost(id: string): Promise<void> {
  await deleteDoc(doc(db(), "scheduledPosts", id));
}

export type LiveFeedItem =
  | { type: "blog"; payload: BlogPost }
  | { type: "video"; payload: VideoEntry }
  | { type: "album"; payload: PhotoAlbum };

export function subscribeToLatestHighlights(
  handler: (items: LiveFeedItem[]) => void
): Unsubscribe | null {
  if (!ENABLE_REALTIME_FEED) return null;

  const postQuery = query(
    collection(db(), "blogPosts"),
    where("status", "==", "published"),
    orderBy("publishedAt", "desc"),
    limit(5)
  );
  const videoQuery = query(
    collection(db(), "videos"),
    orderBy("publishedAt", "desc"),
    limit(5)
  );
  const albumQuery = query(
    collection(db(), "photoAlbums"),
    orderBy("createdAt", "desc"),
    limit(5)
  );

  const unsubscribers: Unsubscribe[] = [];

  const emit = async () => {
    const [postsSnap, videosSnap, albumsSnap] = await Promise.all([
      getDocs(postQuery),
      getDocs(videoQuery),
      getDocs(albumQuery),
    ]);

    const feed: LiveFeedItem[] = [
      ...postsSnap.docs.map(docSnap => ({
        type: "blog" as const,
        payload: mapPost(withId(docSnap)),
      })),
      ...videosSnap.docs.map(docSnap => ({
        type: "video" as const,
        payload: mapVideo(withId(docSnap)),
      })),
      ...albumsSnap.docs.map(docSnap => ({
        type: "album" as const,
        payload: mapAlbum(withId(docSnap)),
      })),
    ].sort((a, b) => {
      const dateA =
        a.type === "blog"
          ? a.payload.publishedAt
          : a.type === "video"
            ? a.payload.publishedAt
            : a.payload.createdAt;
      const dateB =
        b.type === "blog"
          ? b.payload.publishedAt
          : b.type === "video"
            ? b.payload.publishedAt
            : b.payload.createdAt;
      return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
    });

    handler(feed.slice(0, 9));
  };

  unsubscribers.push(onSnapshot(postQuery, emit));
  unsubscribers.push(onSnapshot(videoQuery, emit));
  unsubscribers.push(onSnapshot(albumQuery, emit));

  emit().catch(error =>
    console.error("[Firebase] Failed to prime live highlights", error)
  );

  return () => unsubscribers.forEach(unsub => unsub());
}
