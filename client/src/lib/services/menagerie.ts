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
  where,
} from "firebase/firestore";
import { db, mapDate } from "./common";

export type PlushSize = "tiny" | "small" | "medium" | "large" | "huge";

export type PlushPhoto = {
  url: string;
  thumbnailUrl?: string;
  caption?: string;
};

export type Plush = {
  id: string;
  slug: string;
  /** The plush's given name, e.g. "Bartholomew". */
  name: string;
  /** Jellycat line/animal, e.g. "Bashful Bunny". */
  species: string;
  nickname?: string;
  size?: PlushSize;
  /** Accent colors (hex or CSS names) — drives the certificate seal. */
  colorPalette?: string[];
  /** The day this plush joined the family. Primary sort field. */
  adoptionDate: Date;
  originStory?: string;
  personalityTraits?: string[];
  heroPhoto: PlushPhoto;
  gallery: PlushPhoto[];
  travelsWithMe: boolean;
  /** Passport destinations this plush has visited (destination slugs). */
  destinationSlugs?: string[];
  /** Eligible for the daily spotlight rotation. */
  featured: boolean;
  sortOrder?: number;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
};

export type PlushInput = Omit<Plush, "id" | "createdAt" | "updatedAt">;

const MENAGERIE_COLLECTION = "menagerie";

function mapPlush(data: any, id: string): Plush {
  return {
    ...data,
    id,
    slug: data.slug || "",
    name: data.name || "",
    species: data.species || "",
    nickname: data.nickname || undefined,
    size: data.size || undefined,
    colorPalette: Array.isArray(data.colorPalette) ? data.colorPalette : [],
    adoptionDate: mapDate(data.adoptionDate) || new Date(),
    originStory: data.originStory || undefined,
    personalityTraits: Array.isArray(data.personalityTraits)
      ? data.personalityTraits
      : [],
    heroPhoto: data.heroPhoto || { url: "" },
    gallery: Array.isArray(data.gallery) ? data.gallery : [],
    travelsWithMe: Boolean(data.travelsWithMe),
    destinationSlugs: Array.isArray(data.destinationSlugs)
      ? data.destinationSlugs
      : [],
    featured: Boolean(data.featured),
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : undefined,
    createdAt: mapDate(data.createdAt) || new Date(),
    updatedAt: mapDate(data.updatedAt) || new Date(),
  } as Plush;
}

export async function fetchPublishedPlushies(
  limitCount?: number
): Promise<Plush[]> {
  try {
    const firestore = db();
    // Security rules only allow visitor list queries that filter on
    // status == "published" (isPublishedStrict).
    const q = limitCount
      ? query(
          collection(firestore, MENAGERIE_COLLECTION),
          where("status", "==", "published"),
          orderBy("adoptionDate", "desc"),
          limit(limitCount)
        )
      : query(
          collection(firestore, MENAGERIE_COLLECTION),
          where("status", "==", "published"),
          orderBy("adoptionDate", "desc")
        );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => mapPlush(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching published plushies:", error);
    throw error;
  }
}

export async function fetchAllPlushies(): Promise<Plush[]> {
  try {
    const firestore = db();
    const q = query(
      collection(firestore, MENAGERIE_COLLECTION),
      orderBy("adoptionDate", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => mapPlush(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching all plushies:", error);
    throw error;
  }
}

export async function fetchPlushBySlug(
  slug: string,
  options?: { includeDrafts?: boolean }
): Promise<Plush | null> {
  try {
    const firestore = db();
    const q = options?.includeDrafts
      ? query(
          collection(firestore, MENAGERIE_COLLECTION),
          where("slug", "==", slug),
          limit(1)
        )
      : query(
          collection(firestore, MENAGERIE_COLLECTION),
          where("slug", "==", slug),
          where("status", "==", "published"),
          limit(1)
        );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docRef = snapshot.docs[0];
    return mapPlush(docRef.data(), docRef.id);
  } catch (error) {
    console.error("Error fetching plush by slug:", error);
    throw error;
  }
}

export async function fetchPlushById(id: string): Promise<Plush | null> {
  try {
    const firestore = db();
    const docRef = doc(firestore, MENAGERIE_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return mapPlush(snapshot.data(), snapshot.id);
  } catch (error) {
    console.error("Error fetching plush by id:", error);
    throw error;
  }
}

export async function createPlush(data: PlushInput): Promise<string> {
  try {
    const firestore = db();
    const docRef = doc(collection(firestore, MENAGERIE_COLLECTION));
    await setDoc(docRef, {
      ...data,
      adoptionDate: Timestamp.fromDate(data.adoptionDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating plush:", error);
    throw error;
  }
}

export async function updatePlush(
  id: string,
  data: Partial<PlushInput>
): Promise<void> {
  try {
    const firestore = db();
    const docRef = doc(firestore, MENAGERIE_COLLECTION, id);
    const updateData: any = { ...data, updatedAt: serverTimestamp() };
    if (data.adoptionDate) {
      updateData.adoptionDate = Timestamp.fromDate(data.adoptionDate);
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating plush:", error);
    throw error;
  }
}

export async function deletePlush(id: string): Promise<void> {
  try {
    const firestore = db();
    const docRef = doc(firestore, MENAGERIE_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting plush:", error);
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* Pure helpers — filters, stats, spotlight (unit-tested)              */
/* ------------------------------------------------------------------ */

export type PlushFilters = {
  species?: string;
  size?: PlushSize;
  travelBuddiesOnly?: boolean;
  search?: string;
};

export function filterPlushies(plushies: Plush[], filters: PlushFilters): Plush[] {
  const search = filters.search?.trim().toLowerCase();
  return plushies.filter(plush => {
    if (filters.species && plush.species !== filters.species) return false;
    if (filters.size && plush.size !== filters.size) return false;
    if (filters.travelBuddiesOnly && !plush.travelsWithMe) return false;
    if (search) {
      const haystack = [
        plush.name,
        plush.nickname ?? "",
        plush.species,
        ...(plush.personalityTraits ?? []),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function listPlushSpecies(plushies: Plush[]): string[] {
  return Array.from(new Set(plushies.map(p => p.species).filter(Boolean))).sort();
}

export type MenagerieStats = {
  total: number;
  speciesCount: number;
  /** Year of the earliest adoption, or null when the collection is empty. */
  memberSinceYear: number | null;
  travelBuddyCount: number;
};

export function getMenagerieStats(plushies: Plush[]): MenagerieStats {
  const years = plushies.map(p => p.adoptionDate.getFullYear());
  return {
    total: plushies.length,
    speciesCount: listPlushSpecies(plushies).length,
    memberSinceYear: years.length ? Math.min(...years) : null,
    travelBuddyCount: plushies.filter(p => p.travelsWithMe).length,
  };
}

/** Deterministic daily pick from the featured plushies — same plush all
 *  day for every visitor, advancing at midnight. */
export function getDailySpotlight(plushies: Plush[], date: Date): Plush | null {
  const featured = plushies.filter(p => p.featured);
  const pool = featured.length ? featured : plushies;
  if (!pool.length) return null;
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) /
      86_400_000
  );
  return pool[dayOfYear % pool.length];
}
