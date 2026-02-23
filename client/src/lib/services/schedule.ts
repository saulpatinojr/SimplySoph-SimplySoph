import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db, mapDate, withId } from "./common";
import type { ScheduledPost, ScheduledPostInput } from "./types";

function mapScheduledPost(data: any): ScheduledPost {
  return {
    ...data,
    scheduledAt: mapDate(data.scheduledAt)!,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
    postedAt: mapDate(data.postedAt),
  };
}

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
