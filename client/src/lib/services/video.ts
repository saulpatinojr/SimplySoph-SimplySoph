import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { ref as storageRef, deleteObject } from "firebase/storage";
import { db, mapDate, withId } from "./common";
import { getFirebaseStorage } from "../firebase";
import { generateSearchTokens } from "../search";
import type { VideoEntry, VideoInput } from "./types";

function mapVideo(data: any): VideoEntry {
  return {
    ...data,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
    publishedAt: mapDate(data.publishedAt),
  };
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
      tags: input.tags ?? [],
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      canonicalUrl: input.canonicalUrl ?? null,
      disclosureText: input.disclosureText ?? null,
      thumbnailAlt: input.thumbnailAlt ?? null,
      cityGuideNotes: input.cityGuideNotes ?? [],
      featuredProducts: input.featuredProducts ?? [],
      relatedLinks: input.relatedLinks ?? [],
      publishAt: input.publishAt ?? null,
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
    tags: input.tags ?? [],
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    canonicalUrl: input.canonicalUrl ?? null,
    disclosureText: input.disclosureText ?? null,
    thumbnailAlt: input.thumbnailAlt ?? null,
    cityGuideNotes: input.cityGuideNotes ?? [],
    featuredProducts: input.featuredProducts ?? [],
    relatedLinks: input.relatedLinks ?? [],
    publishAt: input.publishAt ?? null,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    views: 0,
    searchTokens,
  });
  return ref.id;
}

export async function deleteVideo(videoId: string): Promise<void> {
  // Fetch the video to get storage URLs before deletion
  const snapshot = await getDoc(doc(db(), "videos", videoId));
  if (snapshot.exists()) {
    const data = snapshot.data();
    const storage = getFirebaseStorage();
    // Clean up thumbnail from Storage (best-effort)
    if (data?.thumbnailUrl) {
      try {
        await deleteObject(storageRef(storage, data.thumbnailUrl));
      } catch {
        console.warn("Could not delete video thumbnail from Storage", data.thumbnailUrl);
      }
    }
  }
  await deleteDoc(doc(db(), "videos", videoId));
}

export async function fetchVideoById(id: string): Promise<VideoEntry | null> {
  const snapshot = await getDoc(doc(db(), "videos", id));
  if (!snapshot.exists()) return null;
  return mapVideo({ id: snapshot.id, ...(snapshot.data() as DocumentData) });
}

export async function fetchVideoBySlug(
  slug: string
): Promise<VideoEntry | null> {
  const { where } = await import("firebase/firestore");
  const snapshot = await getDocs(
    query(collection(db(), "videos"), where("slug", "==", slug), limit(1))
  );
  if (snapshot.empty) return null;
  return mapVideo(withId(snapshot.docs[0]));
}

export async function incrementVideoViews(videoId: string): Promise<void> {
  await updateDoc(doc(db(), "videos", videoId), {
    views: increment(1),
  });
}
