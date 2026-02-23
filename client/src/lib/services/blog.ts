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
import { db, mapDate, withId } from "./common";
import { generateSearchTokens } from "../search";
import type { BlogPost, BlogPostInput } from "./types";

function mapPost(data: any): BlogPost {
  return {
    ...data,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
    publishedAt: mapDate(data.publishedAt),
  };
}

export async function fetchAllBlogPosts(): Promise<BlogPost[]> {
  const snapshot = await getDocs(
    query(collection(db(), "blogPosts"), orderBy("createdAt", "desc"))
  );
  return snapshot.docs.map(docSnap => mapPost(withId(docSnap)));
}

export async function fetchPublishedBlogPosts(limitCount?: number): Promise<BlogPost[]> {
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

export async function incrementPostViews(postId: string): Promise<void> {
  const ref = doc(db(), "blogPosts", postId);
  await updateDoc(ref, {
    views: increment(1),
  });
}
