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
import type { ContentProduct } from "./types";
import type { GrowthLook } from "./growth";

export type LookSeason = "spring" | "summer" | "autumn" | "winter";

export type LookPhoto = {
  url: string;
  caption?: string;
};

export type Look = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  heroImageUrl: string;
  gallery: LookPhoto[];
  season?: LookSeason;
  /** e.g. "airport", "dinner", "beach club" — drives the public filters. */
  occasionTags: string[];
  /** Shoppable products — ContentProduct so FeaturedProductsEditor works as-is. */
  products: ContentProduct[];
  /** Rendered above the product grid; required to publish when products exist. */
  affiliateDisclosure?: string;
  /** The trip this look was worn on (passport destination slug). */
  destinationSlug?: string;
  body?: string;
  featured: boolean;
  publishedAt?: Date;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
};

export type LookInput = Omit<Look, "id" | "createdAt" | "updatedAt">;

const LOOKS_COLLECTION = "looks";

function mapLook(data: any, id: string): Look {
  return {
    ...data,
    id,
    slug: data.slug || "",
    title: data.title || "",
    subtitle: data.subtitle || undefined,
    heroImageUrl: data.heroImageUrl || "",
    gallery: Array.isArray(data.gallery) ? data.gallery : [],
    season: data.season || undefined,
    occasionTags: Array.isArray(data.occasionTags) ? data.occasionTags : [],
    products: Array.isArray(data.products) ? data.products : [],
    affiliateDisclosure: data.affiliateDisclosure || undefined,
    destinationSlug: data.destinationSlug || undefined,
    body: data.body || undefined,
    featured: Boolean(data.featured),
    publishedAt: mapDate(data.publishedAt) || undefined,
    createdAt: mapDate(data.createdAt) || new Date(),
    updatedAt: mapDate(data.updatedAt) || new Date(),
  } as Look;
}

export async function fetchPublishedLooks(limitCount?: number): Promise<Look[]> {
  try {
    const firestore = db();
    // Security rules only allow visitor list queries that filter on
    // status == "published" (isPublishedStrict).
    const q = limitCount
      ? query(
          collection(firestore, LOOKS_COLLECTION),
          where("status", "==", "published"),
          orderBy("publishedAt", "desc"),
          limit(limitCount)
        )
      : query(
          collection(firestore, LOOKS_COLLECTION),
          where("status", "==", "published"),
          orderBy("publishedAt", "desc")
        );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => mapLook(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching published looks:", error);
    throw error;
  }
}

export async function fetchAllLooks(): Promise<Look[]> {
  try {
    const firestore = db();
    const q = query(
      collection(firestore, LOOKS_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => mapLook(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching all looks:", error);
    throw error;
  }
}

export async function fetchLookBySlug(
  slug: string,
  options?: { includeDrafts?: boolean }
): Promise<Look | null> {
  try {
    const firestore = db();
    const q = options?.includeDrafts
      ? query(
          collection(firestore, LOOKS_COLLECTION),
          where("slug", "==", slug),
          limit(1)
        )
      : query(
          collection(firestore, LOOKS_COLLECTION),
          where("slug", "==", slug),
          where("status", "==", "published"),
          limit(1)
        );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docRef = snapshot.docs[0];
    return mapLook(docRef.data(), docRef.id);
  } catch (error) {
    console.error("Error fetching look by slug:", error);
    throw error;
  }
}

export async function fetchLookById(id: string): Promise<Look | null> {
  try {
    const firestore = db();
    const docRef = doc(firestore, LOOKS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return mapLook(snapshot.data(), snapshot.id);
  } catch (error) {
    console.error("Error fetching look by id:", error);
    throw error;
  }
}

export async function createLook(data: LookInput): Promise<string> {
  try {
    const firestore = db();
    const docRef = doc(collection(firestore, LOOKS_COLLECTION));
    await setDoc(docRef, {
      ...data,
      publishedAt: data.publishedAt
        ? Timestamp.fromDate(data.publishedAt)
        : data.status === "published"
          ? serverTimestamp()
          : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating look:", error);
    throw error;
  }
}

export async function updateLook(
  id: string,
  data: Partial<LookInput>
): Promise<void> {
  try {
    const firestore = db();
    const docRef = doc(firestore, LOOKS_COLLECTION, id);
    const updateData: any = { ...data, updatedAt: serverTimestamp() };
    if (data.publishedAt) {
      updateData.publishedAt = Timestamp.fromDate(data.publishedAt);
    } else if (data.status === "published") {
      // First publish without an explicit date — stamp it now.
      const existing = await getDoc(docRef);
      if (existing.exists() && !existing.data().publishedAt) {
        updateData.publishedAt = serverTimestamp();
      }
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating look:", error);
    throw error;
  }
}

export async function deleteLook(id: string): Promise<void> {
  try {
    const firestore = db();
    const docRef = doc(firestore, LOOKS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting look:", error);
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* Pure helpers                                                        */
/* ------------------------------------------------------------------ */

/** Adapt a Look for the existing ShopTheLook component (GrowthLook). */
export function lookToGrowthLook(look: Look): GrowthLook {
  return {
    id: look.id,
    title: look.title,
    description: look.subtitle,
    imageUrl: look.heroImageUrl,
    destinationSlugs: look.destinationSlug ? [look.destinationSlug] : [],
    items: look.products.map(product => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      tags: [],
      retailer: product.retailer ?? "",
    })),
  };
}

export type LookFilters = {
  season?: LookSeason;
  occasion?: string;
};

export function filterLooks(looks: Look[], filters: LookFilters): Look[] {
  return looks.filter(look => {
    if (filters.season && look.season !== filters.season) return false;
    if (filters.occasion && !look.occasionTags.includes(filters.occasion)) {
      return false;
    }
    return true;
  });
}

export function listLookOccasions(looks: Look[]): string[] {
  return Array.from(new Set(looks.flatMap(l => l.occasionTags))).sort();
}
