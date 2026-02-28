import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  where
} from "firebase/firestore";
import { db, mapDate } from "./common";

export type DestinationMediaItem = {
  type: "image" | "video" | "url";
  url: string;
  visaThumbnailUrl: string; // The stamp/visa placeholder
  title?: string;
};

export type Destination = {
  id: string;
  slug: string;
  city: string;
  country?: string; // Optional but good for a passport
  date: Date;
  coverStampUrl: string; // The main stamp on the landing page
  mediaItems: DestinationMediaItem[];
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
};

export type DestinationInput = Omit<Destination, "id" | "createdAt" | "updatedAt">;

const DESTINATIONS_COLLECTION = "destinations";

export async function fetchPublishedDestinations(limitCount?: number): Promise<Destination[]> {
  try {
    const firestore = db();
    const q = limitCount
      ? query(
          collection(firestore, DESTINATIONS_COLLECTION),
          where("status", "==", "published"),
          orderBy("date", "desc"),
          limit(limitCount)
        )
      : query(
          collection(firestore, DESTINATIONS_COLLECTION),
          where("status", "==", "published"),
          orderBy("date", "desc")
        );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        date: mapDate(data.date) || new Date(),
        createdAt: mapDate(data.createdAt) || new Date(),
        updatedAt: mapDate(data.updatedAt) || new Date(),
      } as Destination;
    });
  } catch (error) {
    console.error("Error fetching published destinations:", error);
    throw error;
  }
}

export async function fetchAllDestinations(): Promise<Destination[]> {
  try {
    const firestore = db();
    const q = query(collection(firestore, DESTINATIONS_COLLECTION), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        date: mapDate(data.date) || new Date(),
        createdAt: mapDate(data.createdAt) || new Date(),
        updatedAt: mapDate(data.updatedAt) || new Date(),
      } as Destination;
    });
  } catch (error) {
    console.error("Error fetching all destinations:", error);
    throw error;
  }
}

export async function fetchDestinationBySlug(slug: string): Promise<Destination | null> {
  try {
    const firestore = db();
    const q = query(
      collection(firestore, DESTINATIONS_COLLECTION),
      where("slug", "==", slug),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docRef = snapshot.docs[0];
    const data = docRef.data();
    return {
      ...data,
      id: docRef.id,
      date: mapDate(data.date) || new Date(),
      createdAt: mapDate(data.createdAt) || new Date(),
      updatedAt: mapDate(data.updatedAt) || new Date(),
    } as Destination;
  } catch (error) {
    console.error("Error fetching destination by slug:", error);
    throw error;
  }
}

export async function fetchDestinationById(id: string): Promise<Destination | null> {
  try {
    const firestore = db();
    const docRef = doc(firestore, DESTINATIONS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id,
      date: mapDate(data.date) || new Date(),
      createdAt: mapDate(data.createdAt) || new Date(),
      updatedAt: mapDate(data.updatedAt) || new Date(),
    } as Destination;
  } catch (error) {
    console.error("Error fetching destination by id:", error);
    throw error;
  }
}

export async function createDestination(data: DestinationInput): Promise<string> {
  try {
    const firestore = db();
    const docRef = doc(collection(firestore, DESTINATIONS_COLLECTION));
    await setDoc(docRef, {
      ...data,
      date: Timestamp.fromDate(data.date),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating destination:", error);
    throw error;
  }
}

export async function updateDestination(id: string, data: Partial<DestinationInput>): Promise<void> {
  try {
    const firestore = db();
    const docRef = doc(firestore, DESTINATIONS_COLLECTION, id);
    const updateData: any = { ...data, updatedAt: serverTimestamp() };
    if (data.date) {
      updateData.date = Timestamp.fromDate(data.date);
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating destination:", error);
    throw error;
  }
}

export async function deleteDestination(id: string): Promise<void> {
  try {
    const firestore = db();
    const docRef = doc(firestore, DESTINATIONS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting destination:", error);
    throw error;
  }
}
