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
  deleteDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db, mapDate, withId } from "./common";
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
