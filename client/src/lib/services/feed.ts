import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db, mapDate, withId } from "./common";
import { ENABLE_REALTIME_FEED } from "@/const";
import type { LiveFeedItem, BlogPost, VideoEntry, PhotoAlbum } from "./types";

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
