import {
  collection,
  limit,
  orderBy,
  query,
  where,
  onSnapshot,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db, mapDate, withId } from "./common";
import { ENABLE_REALTIME_FEED } from "@/const";
import type { LiveFeedItem, BlogPost, VideoEntry, PhotoAlbum } from "./types";

function mapPost(data: Record<string, unknown>): BlogPost {
  return {
    ...data,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
    publishedAt: mapDate(data.publishedAt),
  } as BlogPost;
}

function mapVideo(data: Record<string, unknown>): VideoEntry {
  return {
    ...data,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
    publishedAt: mapDate(data.publishedAt),
  } as VideoEntry;
}

function mapAlbum(data: Record<string, unknown>): PhotoAlbum {
  return {
    ...data,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
  } as PhotoAlbum;
}

/**
 * Subscribe to the latest highlights feed (blog + video + album).
 *
 * FIX: Each onSnapshot callback now reads data directly from its own
 * snapshot instead of re-fetching all three collections via getDocs.
 * This reduces Firestore reads from ~12 to 3 on initial page load.
 *
 * @see CODE_REVIEW_REPORT.md Finding 1.3.4, P2-03
 */
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
    where("status", "==", "published"),
    orderBy("publishedAt", "desc"),
    limit(5)
  );
  const albumQuery = query(
    collection(db(), "photoAlbums"),
    where("status", "==", "published"),
    orderBy("createdAt", "desc"),
    limit(5)
  );

  let latestPosts: LiveFeedItem[] = [];
  let latestVideos: LiveFeedItem[] = [];
  let latestAlbums: LiveFeedItem[] = [];

  function emit() {
    const feed = [...latestPosts, ...latestVideos, ...latestAlbums].sort(
      (a, b) => {
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
      }
    );
    handler(feed.slice(0, 9));
  }

  const unsubscribers: Unsubscribe[] = [];

  unsubscribers.push(
    onSnapshot(postQuery, (snap: QuerySnapshot) => {
      latestPosts = snap.docs.map((d) => ({
        type: "blog" as const,
        payload: mapPost(withId(d)),
      }));
      emit();
    })
  );

  unsubscribers.push(
    onSnapshot(videoQuery, (snap: QuerySnapshot) => {
      latestVideos = snap.docs.map((d) => ({
        type: "video" as const,
        payload: mapVideo(withId(d)),
      }));
      emit();
    })
  );

  unsubscribers.push(
    onSnapshot(albumQuery, (snap: QuerySnapshot) => {
      latestAlbums = snap.docs.map((d) => ({
        type: "album" as const,
        payload: mapAlbum(withId(d)),
      }));
      emit();
    })
  );

  return () => unsubscribers.forEach((unsub) => unsub());
}
