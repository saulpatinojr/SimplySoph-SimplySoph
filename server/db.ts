import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { firebaseDb } from "./_core/firebaseAdmin";

type CategoryType = "blog" | "video" | "photo";

export type Category = {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  createdAt: Date | null;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  categoryId: string | null;
  authorId: string;
  status: "draft" | "published";
  views: number;
  likes: number;
  readingTime: number;
  publishedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type Video = {
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
  caption: string | null;
  order: number;
  createdAt: Date | null;
};

type CommentStatus = "pending" | "approved" | "spam";

export type Comment = {
  id: string;
  postId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: CommentStatus;
  createdAt: Date | null;
};

type BlogPostCreateInput = {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  categoryId?: string;
  status: "draft" | "published";
  authorId: string;
};

type BlogPostUpdateInput = Partial<Omit<BlogPostCreateInput, "authorId">> & {
  status?: "draft" | "published";
};

type VideoCreateInput = {
  title: string;
  slug: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  categoryId?: string;
  authorId: string;
};

type PhotoAlbumCreateInput = {
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  categoryId?: string;
  authorId: string;
};

function toDate(timestamp?: Timestamp | null): Date | null {
  if (!timestamp) return null;
  return timestamp.toDate();
}

function mapCategory(doc: QueryDocumentSnapshot<DocumentData>): Category {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name ?? "",
    slug: data.slug ?? "",
    type: data.type ?? "blog",
    createdAt: toDate(data.createdAt ?? null),
  };
}

function mapBlogPost(doc: QueryDocumentSnapshot<DocumentData>): BlogPost {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title ?? "",
    slug: data.slug ?? "",
    excerpt: data.excerpt ?? null,
    content: data.content ?? "",
    coverImage: data.coverImage ?? null,
    categoryId: data.categoryId ?? null,
    authorId: data.authorId ?? "",
    status: data.status ?? "draft",
    views: data.views ?? 0,
    likes: data.likes ?? 0,
    readingTime: data.readingTime ?? 5,
    publishedAt: toDate(data.publishedAt ?? null),
    createdAt: toDate(data.createdAt ?? null),
    updatedAt: toDate(data.updatedAt ?? null),
  };
}

function mapVideo(doc: QueryDocumentSnapshot<DocumentData>): Video {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title ?? "",
    slug: data.slug ?? "",
    description: data.description ?? null,
    videoUrl: data.videoUrl ?? "",
    thumbnailUrl: data.thumbnailUrl ?? null,
    categoryId: data.categoryId ?? null,
    authorId: data.authorId ?? "",
    views: data.views ?? 0,
    publishedAt: toDate(data.publishedAt ?? null),
    createdAt: toDate(data.createdAt ?? null),
  };
}

function mapPhotoAlbum(doc: QueryDocumentSnapshot<DocumentData>): PhotoAlbum {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title ?? "",
    slug: data.slug ?? "",
    description: data.description ?? null,
    coverImage: data.coverImage ?? null,
    categoryId: data.categoryId ?? null,
    authorId: data.authorId ?? "",
    createdAt: toDate(data.createdAt ?? null),
  };
}

function mapPhoto(doc: QueryDocumentSnapshot<DocumentData>): Photo {
  const data = doc.data();
  return {
    id: doc.id,
    albumId: data.albumId ?? "",
    imageUrl: data.imageUrl ?? "",
    caption: data.caption ?? null,
    order: data.order ?? 0,
    createdAt: toDate(data.createdAt ?? null),
  };
}

function mapComment(doc: QueryDocumentSnapshot<DocumentData>): Comment {
  const data = doc.data();
  return {
    id: doc.id,
    postId: data.postId ?? "",
    authorName: data.authorName ?? "",
    authorEmail: data.authorEmail ?? "",
    content: data.content ?? "",
    status: data.status ?? "pending",
    createdAt: toDate(data.createdAt ?? null),
  };
}

export async function getAllCategories(
  type?: CategoryType
): Promise<Category[]> {
  const db = firebaseDb();
  let query: Query<DocumentData> = db.collection("categories");
  if (type) {
    query = query.where("type", "==", type);
  }
  const snapshot = await query.get();
  return snapshot.docs.map(mapCategory);
}

export async function getPublishedBlogPosts(
  limit?: number
): Promise<BlogPost[]> {
  const db = firebaseDb();
  let query = db
    .collection("blogPosts")
    .where("status", "==", "published")
    .orderBy("publishedAt", "desc");

  if (limit) {
    query = query.limit(limit);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(mapBlogPost);
}

export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | undefined> {
  const db = firebaseDb();
  const snapshot = await db
    .collection("blogPosts")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return undefined;
  }

  return mapBlogPost(snapshot.docs[0]);
}

export async function getAllVideos(limit?: number): Promise<Video[]> {
  const db = firebaseDb();
  let query = db.collection("videos").orderBy("publishedAt", "desc");
  if (limit) {
    query = query.limit(limit);
  }
  const snapshot = await query.get();
  return snapshot.docs.map(mapVideo);
}

export async function getAllPhotoAlbums(): Promise<PhotoAlbum[]> {
  const db = firebaseDb();
  const snapshot = await db
    .collection("photoAlbums")
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map(mapPhotoAlbum);
}

export async function getPhotosByAlbumId(albumId: string): Promise<Photo[]> {
  const db = firebaseDb();
  const snapshot = await db
    .collection("photos")
    .where("albumId", "==", albumId)
    .orderBy("order", "asc")
    .get();
  return snapshot.docs.map(mapPhoto);
}

export async function incrementBlogViews(postId: string): Promise<void> {
  const db = firebaseDb();
  const docRef = db.collection("blogPosts").doc(postId);
  await docRef.update({
    views: FieldValue.increment(1),
    updatedAt: Timestamp.now(),
  });
}

export async function getApprovedComments(
  postId: string
): Promise<Comment[]> {
  const db = firebaseDb();
  const snapshot = await db
    .collection("comments")
    .where("postId", "==", postId)
    .where("status", "==", "approved")
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map(mapComment);
}

export async function createBlogPost(
  payload: BlogPostCreateInput
): Promise<string> {
  const db = firebaseDb();
  const now = Timestamp.now();
  const result = await db.collection("blogPosts").add({
    title: payload.title,
    slug: payload.slug,
    excerpt: payload.excerpt ?? null,
    content: payload.content,
    coverImage: payload.coverImage ?? null,
    categoryId: payload.categoryId ?? null,
    authorId: payload.authorId,
    status: payload.status,
    views: 0,
    likes: 0,
    readingTime: 5,
    publishedAt:
      payload.status === "published" ? now : null,
    createdAt: now,
    updatedAt: now,
  });
  return result.id;
}

export async function updateBlogPost(
  id: string,
  updates: BlogPostUpdateInput
): Promise<void> {
  const db = firebaseDb();
  const docRef = db.collection("blogPosts").doc(id);

  const data: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };

  if (updates.title !== undefined) data.title = updates.title;
  if (updates.slug !== undefined) data.slug = updates.slug;
  if (updates.excerpt !== undefined) data.excerpt = updates.excerpt ?? null;
  if (updates.content !== undefined) data.content = updates.content;
  if (updates.coverImage !== undefined)
    data.coverImage = updates.coverImage ?? null;
  if (updates.categoryId !== undefined)
    data.categoryId = updates.categoryId ?? null;
  if (updates.status !== undefined) {
    data.status = updates.status;
    if (updates.status === "published") {
      data.publishedAt = Timestamp.now();
    }
  }

  await docRef.update(data);
}

export async function deleteBlogPost(id: string): Promise<void> {
  const db = firebaseDb();
  await db.collection("blogPosts").doc(id).delete();
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const db = firebaseDb();
  const snapshot = await db
    .collection("blogPosts")
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map(mapBlogPost);
}

export async function createVideo(payload: VideoCreateInput): Promise<string> {
  const db = firebaseDb();
  const now = Timestamp.now();
  const result = await db.collection("videos").add({
    title: payload.title,
    slug: payload.slug,
    description: payload.description ?? null,
    videoUrl: payload.videoUrl,
    thumbnailUrl: payload.thumbnailUrl ?? null,
    categoryId: payload.categoryId ?? null,
    authorId: payload.authorId,
    views: 0,
    publishedAt: now,
    createdAt: now,
  });
  return result.id;
}

export async function createPhotoAlbum(
  payload: PhotoAlbumCreateInput
): Promise<string> {
  const db = firebaseDb();
  const now = Timestamp.now();
  const result = await db.collection("photoAlbums").add({
    title: payload.title,
    slug: payload.slug,
    description: payload.description ?? null,
    coverImage: payload.coverImage ?? null,
    categoryId: payload.categoryId ?? null,
    authorId: payload.authorId,
    createdAt: now,
  });
  return result.id;
}
