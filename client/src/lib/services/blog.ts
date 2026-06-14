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
  increment,
  type DocumentData,
} from "firebase/firestore";
import { ref as storageRef, deleteObject } from "firebase/storage";
import { db, mapDate, withId } from "./common";
import { getFirebaseStorage } from "../firebase";
import { generateSearchTokens } from "../search";
import { syncBlogPostToAlgolia, deleteFromAlgolia } from "./algolia";
import type { BlogPost, BlogPostInput } from "./types";

function mapPost(data: any): BlogPost {
  return {
    ...data,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
    publishedAt: mapDate(data.publishedAt),
    publishAt: mapDate(data.publishAt),
  };
}

export async function fetchAllBlogPosts(): Promise<BlogPost[]> {
  const snapshot = await getDocs(
    query(collection(db(), "blogPosts"), orderBy("createdAt", "desc"))
  );
  return snapshot.docs.map(docSnap => mapPost(withId(docSnap)));
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

export async function saveBlogPost(
  input: BlogPostInput,
  postId?: string
): Promise<string> {
  const collectionRef = collection(db(), "blogPosts");
  const now = serverTimestamp();
  const searchTokens = generateSearchTokens(
    input.title,
    input.excerpt,
    input.tags
  );

  if (postId) {
    const ref = doc(collectionRef, postId);
    // Use Record<string, unknown> so Firestore-legal null values don't conflict
    // with the optional-field types in BlogPost (string | undefined vs string | null).
    const payload: Record<string, unknown> = {
      ...input,
      excerpt: input.excerpt ?? null,
      coverImage: input.coverImage ?? null,
      categoryId: input.categoryId ?? null,
      tags: input.tags ?? null,
      status: input.status,
      publishAt: input.publishAt ?? null,
      authorId: input.authorId ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      updatedAt: now,
      readingTime: Math.max(
        1,
        Math.round(input.content.split(/\s+/).length / 200)
      ),
      searchTokens,
    };
    if (input.status === "published") {
      payload.publishedAt = now;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(ref, payload as any);
    // Sync to Algolia (no-op if env vars not set)
    void syncBlogPostToAlgolia(postId, {
      title: input.title,
      excerpt: input.excerpt,
      tags: input.tags,
      categoryId: input.categoryId,
      slug: input.slug,
      coverImage: input.coverImage,
      status: input.status,
      publishedAt: input.status === 'published' ? new Date() : null,
      readingTime: Math.max(1, Math.round(input.content.split(/\s+/).length / 200)),
    });
    return postId;
  }

  const ref = doc(collectionRef);
  await setDoc(ref, {
    ...input,
    excerpt: input.excerpt ?? null,
    coverImage: input.coverImage ?? null,
    categoryId: input.categoryId ?? null,
    tags: input.tags ?? null,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    publishAt: input.publishAt ?? null,
    status: input.status,
    authorId: input.authorId,
    createdAt: now,
    updatedAt: now,
    publishedAt: input.status === "published" ? now : null,
    readingTime: Math.max(
      1,
      Math.round(input.content.split(/\s+/).length / 200)
    ),
    views: 0,
    likes: 0,
    searchTokens,
  });
  // Sync new post to Algolia (no-op if env vars not set)
  void syncBlogPostToAlgolia(ref.id, {
    title: input.title,
    excerpt: input.excerpt,
    tags: input.tags,
    categoryId: input.categoryId,
    slug: input.slug,
    coverImage: input.coverImage,
    status: input.status,
    publishedAt: input.status === 'published' ? new Date() : null,
    readingTime: Math.max(1, Math.round(input.content.split(/\s+/).length / 200)),
  });
  return ref.id;
}

export async function deleteBlogPost(postId: string): Promise<void> {
  // Fetch the post to get storage URLs before deletion
  const snapshot = await getDoc(doc(db(), "blogPosts", postId));
  if (snapshot.exists()) {
    const data = snapshot.data();
    const storage = getFirebaseStorage();
    // Clean up cover image from Storage (best-effort, don't block deletion)
    if (data?.coverImage) {
      try {
        await deleteObject(storageRef(storage, data.coverImage));
      } catch {
        console.warn("Could not delete blog cover image from Storage", data.coverImage);
      }
    }
  }
  await deleteDoc(doc(db(), "blogPosts", postId));
  // Remove from Algolia index (no-op if env vars not set)
  void deleteFromAlgolia(postId);
}

export async function incrementPostViews(postId: string): Promise<void> {
  const ref = doc(db(), "blogPosts", postId);
  await updateDoc(ref, {
    views: increment(1),
  });
}

export async function togglePostLike(postId: string, liked: boolean): Promise<void> {
  const ref = doc(db(), "blogPosts", postId);
  await updateDoc(ref, {
    likes: increment(liked ? 1 : -1),
  });
}
