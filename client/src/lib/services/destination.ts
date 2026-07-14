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

export type DestinationCoordinates = {
  lat: number;
  lng: number;
};

export type DestinationItineraryBlock = {
  title: string;
  timeLabel?: string;
  neighborhood?: string;
  description: string;
};

export type DestinationProduct = {
  id: string;
  name: string;
  brand: string;
  price?: string;
  imageUrl: string;
  productUrl: string;
  retailer?: string;
  notes?: string;
};

export type DestinationFeaturedLook = {
  title: string;
  description?: string;
  imageUrl: string;
  items: DestinationProduct[];
};

export type DestinationRelatedLink = {
  id: string;
  type: "blog" | "video" | "album" | "external";
  title: string;
  description?: string;
  imageUrl?: string;
  url: string;
  matchReason?: string;
};

export type Destination = {
  id: string;
  slug: string;
  city: string;
  country?: string; // Optional but good for a passport
  storySummary?: string;
  date: Date;
  coverStampUrl: string; // The main stamp on the landing page
  mediaItems: DestinationMediaItem[];
  coordinates?: DestinationCoordinates | null;
  seasonLabel?: string;
  budgetLabel?: string;
  vibeTags?: string[];
  highlights?: string[];
  itineraryBlocks?: DestinationItineraryBlock[];
  featuredLook?: DestinationFeaturedLook | null;
  relatedLinks?: DestinationRelatedLink[];
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
};

export type DestinationInput = Omit<Destination, "id" | "createdAt" | "updatedAt">;

const DESTINATIONS_COLLECTION = "destinations";

function mapDestination(data: any, id: string): Destination {
  return {
    ...data,
    id,
    coverStampUrl: data.coverStampUrl || "",
    mediaItems: Array.isArray(data.mediaItems) ? data.mediaItems : [],
    date: mapDate(data.date) || new Date(),
    createdAt: mapDate(data.createdAt) || new Date(),
    updatedAt: mapDate(data.updatedAt) || new Date(),
    storySummary: data.storySummary || undefined,
    coordinates: data.coordinates ?? null,
    seasonLabel: data.seasonLabel || undefined,
    budgetLabel: data.budgetLabel || undefined,
    vibeTags: Array.isArray(data.vibeTags) ? data.vibeTags : [],
    highlights: Array.isArray(data.highlights) ? data.highlights : [],
    itineraryBlocks: Array.isArray(data.itineraryBlocks)
      ? data.itineraryBlocks
      : [],
    featuredLook: data.featuredLook ?? null,
    relatedLinks: Array.isArray(data.relatedLinks) ? data.relatedLinks : [],
  } as Destination;
}

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
    return snapshot.docs.map(doc => mapDestination(doc.data(), doc.id));
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
    return snapshot.docs.map(doc => mapDestination(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching all destinations:", error);
    throw error;
  }
}

export async function fetchDestinationBySlug(
  slug: string,
  options?: { includeDrafts?: boolean }
): Promise<Destination | null> {
  try {
    const firestore = db();
    // Security rules only allow non-admin list queries that filter on
    // status == "published"; unfiltered slug lookups are denied for visitors.
    const q = options?.includeDrafts
      ? query(
          collection(firestore, DESTINATIONS_COLLECTION),
          where("slug", "==", slug),
          limit(1)
        )
      : query(
          collection(firestore, DESTINATIONS_COLLECTION),
          where("slug", "==", slug),
          where("status", "==", "published"),
          limit(1)
        );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docRef = snapshot.docs[0];
    return mapDestination(docRef.data(), docRef.id);
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
    return mapDestination(snapshot.data(), snapshot.id);
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
