import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
  type QueryFieldFilterConstraint,
  type QueryOrderByConstraint,
  type QueryLimitConstraint,
} from "firebase/firestore";
import { ENABLE_REALTIME_FEED, OWNER_FIREBASE_UID } from "@/const";
import { getFirebaseFirestore } from "./firebase";
import { generateSearchTokens } from "./search";

const db = () => getFirebaseFirestore();

type TimestampLike = Timestamp | Date | null | undefined;
type FirestoreDoc<T extends DocumentData> = T & { id: string };

const toDate = (value: TimestampLike): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  return value.toDate();
};

export type CreatorRole = "user" | "admin";

export type CreatorProfile = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: CreatorRole;
  bio?: string | null;
  socials?: Record<string, string>;
  lastSeenAt: Date | null;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  categoryId: string | null;
  status: "draft" | "published";
  authorId: string;
  readingTime: number;
  views: number;
  likes: number;
  publishedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type VideoEntry = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  categoryId: string | null;
  authorId: string;
  views: number;
  publishedAt: Date | null;
  createdAt: Date | null;
};

export type PhotoAlbum = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  categoryId: string | null;
  authorId: string;
  createdAt: Date | null;
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
  caption: string | null;
  order: number;
  createdAt: Date | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  type: "blog" | "video" | "photo";
  createdAt: Date | null;
};

const mapCategory = (data: FirestoreDoc<DocumentData>): Category => ({
  id: data.id,
  name: data.name ?? "",
  slug: data.slug ?? "",
  description: data.description ?? null,
  color: data.color ?? null,
  type: data.type ?? "blog",
  createdAt: toDate(data.createdAt),
});

const withId = <T extends DocumentData>(
  snapshot: QueryDocumentSnapshot<DocumentData>
): FirestoreDoc<T> => ({
  id: snapshot.id,
  ...(snapshot.data() as T),
});

const mapPost = (docData: FirestoreDoc<DocumentData>): BlogPost => ({
  id: docData.id,
  title: docData.title ?? "",
  slug: docData.slug ?? "",
  excerpt: docData.excerpt ?? null,
  content: docData.content ?? "",
  coverImage: docData.coverImage ?? null,
  categoryId: docData.categoryId ?? null,
  status: docData.status ?? "draft",
  authorId: docData.authorId ?? "",
  readingTime: docData.readingTime ?? 5,
  views: docData.views ?? 0,
  likes: docData.likes ?? 0,
  publishedAt: toDate(docData.publishedAt),
  createdAt: toDate(docData.createdAt),
  updatedAt: toDate(docData.updatedAt),
});

const mapVideo = (data: FirestoreDoc<DocumentData>): VideoEntry => ({
  id: data.id,
  title: data.title ?? "",
  slug: data.slug ?? "",
  description: data.description ?? null,
  videoUrl: data.videoUrl ?? "",
  thumbnailUrl: data.thumbnailUrl ?? null,
  categoryId: data.categoryId ?? null,
  authorId: data.authorId ?? "",
  views: data.views ?? 0,
  publishedAt: toDate(data.publishedAt),
  createdAt: toDate(data.createdAt),
});

const mapAlbum = (data: FirestoreDoc<DocumentData>): PhotoAlbum => ({
  id: data.id,
  title: data.title ?? "",
  slug: data.slug ?? "",
  description: data.description ?? null,
  coverImage: data.coverImage ?? null,
  categoryId: data.categoryId ?? null,
  authorId: data.authorId ?? "",
  createdAt: toDate(data.createdAt),
});

const mapPhoto = (data: FirestoreDoc<DocumentData>): Photo => ({
  id: data.id,
  albumId: data.albumId ?? "",
  imageUrl: data.imageUrl ?? "",
  imageUrls: data.imageUrls ?? undefined,
  caption: data.caption ?? null,
  order: data.order ?? 0,
  createdAt: toDate(data.createdAt),
});

export async function upsertCreatorProfile(payload: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<CreatorProfile> {
  const profileRef = doc(db(), "users", payload.uid);
  const existing = await getDoc(profileRef);
  const role: CreatorRole =
    existing.data()?.role ??
    (payload.uid === OWNER_FIREBASE_UID ? "admin" : "user");

  await setDoc(
    profileRef,
    {
      email: payload.email,
      name: payload.displayName,
      avatarUrl: payload.photoURL,
      role,
      lastSeenAt: serverTimestamp(),
    },
    { merge: true }
  );

  if (payload.uid === OWNER_FIREBASE_UID && OWNER_FIREBASE_UID) {
    await setDoc(
      doc(db(), "admins", payload.uid),
      { createdAt: serverTimestamp() },
      { merge: true }
    );
  }

  return {
    id: payload.uid,
    email: payload.email,
    name: payload.displayName,
    avatarUrl: payload.photoURL,
    role,
    lastSeenAt: new Date(),
  };
}

export async function fetchCreatorProfile(
  uid: string
): Promise<CreatorProfile | null> {
  const snapshot = await getDoc(doc(db(), "users", uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    email: data.email ?? null,
    name: data.name ?? null,
    avatarUrl: data.avatarUrl ?? null,
    role: (data.role ?? "user") as CreatorRole,
    bio: data.bio ?? null,
    socials: data.socials ?? {},
    lastSeenAt: toDate(data.lastSeenAt),
  };
}

export async function fetchPublishedBlogPosts(
  limitCount?: number
): Promise<BlogPost[]> {
  const snapshot = await getDocs(
    query(
      collection(db(), "blogPosts"),
      where("status", "==", "published"),
      orderBy("publishedAt", "desc"),
      ...(limitCount ? [limit(limitCount)] : [])
    )
  );
  return snapshot.docs.map(docSnap => mapPost(withId(docSnap)));
}

export async function fetchAllBlogPosts(): Promise<BlogPost[]> {
  const snapshot = await getDocs(
    query(collection(db(), "blogPosts"), orderBy("createdAt", "desc"))
  );
  return snapshot.docs.map(docSnap => mapPost(withId(docSnap)));
}

export async function fetchBlogPostBySlug(
  slug: string
): Promise<BlogPost | null> {
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

export async function incrementPostViews(postId: string): Promise<void> {
  await updateDoc(doc(db(), "blogPosts", postId), {
    views: increment(1),
    updatedAt: serverTimestamp(),
  });
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
  const searchTokens = generateSearchTokens(input.title, input.excerpt || input.content.substring(0, 500));

  if (postId) {
    const ref = doc(collectionRef, postId);
    const payload: Record<string, unknown> = {
      ...input,
      excerpt: input.excerpt ?? null,
      coverImage: input.coverImage ?? null,
      categoryId: input.categoryId ?? null,
      updatedAt: now,
      readingTime: Math.max(1, Math.round(input.content.split(/\s+/).length / 200)),
      searchTokens,
    };
    if (input.status === "published") {
      payload.publishedAt = now;
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
