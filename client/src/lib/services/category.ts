import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryFieldFilterConstraint,
  type QueryOrderByConstraint,
} from "firebase/firestore";
import { db, mapDate, withId } from "./common";
import type { Category, CategoryInput } from "./types";

function mapCategory(data: Record<string, unknown>): Category {
  return {
    ...data,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
  } as Category;
}

export async function fetchCategories(
  type?: "blog" | "video" | "photo"
): Promise<Category[]> {
  const constraints: (QueryFieldFilterConstraint | QueryOrderByConstraint)[] =
    [];
  if (type) {
    constraints.push(where("type", "==", type));
  }
  constraints.push(orderBy("createdAt", "desc"));
  const snapshot = await getDocs(
    query(collection(db(), "categories"), ...constraints)
  );
  return snapshot.docs.map((docSnap) => mapCategory(withId(docSnap)));
}

export async function saveCategory(
  input: CategoryInput,
  categoryId?: string
): Promise<string> {
  const collectionRef = collection(db(), "categories");
  const now = serverTimestamp();

  if (categoryId) {
    const ref = doc(collectionRef, categoryId);
    await updateDoc(ref, {
      ...input,
      description: input.description ?? null,
      color: input.color ?? null,
      updatedAt: now,
    });
    return categoryId;
  }

  const ref = doc(collectionRef);
  await setDoc(ref, {
    ...input,
    description: input.description ?? null,
    color: input.color ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

/**
 * Count how many content items reference a given category.
 *
 * @see CODE_REVIEW_REPORT.md P3-03
 */
export async function countCategoryReferences(
  categoryId: string
): Promise<{ blogs: number; videos: number; albums: number }> {
  const [blogs, videos, albums] = await Promise.all([
    getDocs(
      query(
        collection(db(), "blogPosts"),
        where("categoryId", "==", categoryId)
      )
    ),
    getDocs(
      query(
        collection(db(), "videos"),
        where("categoryId", "==", categoryId)
      )
    ),
    getDocs(
      query(
        collection(db(), "photoAlbums"),
        where("categoryId", "==", categoryId)
      )
    ),
  ]);

  return {
    blogs: blogs.size,
    videos: videos.size,
    albums: albums.size,
  };
}

/**
 * Delete a category.
 *
 * FIX: Now checks for orphaned references before deleting.
 * If any content references this category, throws an error with counts
 * so the caller can show a confirmation dialog.
 *
 * @see CODE_REVIEW_REPORT.md P3-03
 */
export async function deleteCategory(
  categoryId: string,
  force = false
): Promise<void> {
  if (!force) {
    const refs = await countCategoryReferences(categoryId);
    const total = refs.blogs + refs.videos + refs.albums;
    if (total > 0) {
      throw new Error(
        `Cannot delete: category is referenced by ${refs.blogs} blog(s), ${refs.videos} video(s), and ${refs.albums} album(s). Pass force=true to delete anyway.`
      );
    }
  }
  await deleteDoc(doc(db(), "categories", categoryId));
}

export async function fetchCategoryById(
  id: string
): Promise<Category | null> {
  const snapshot = await getDoc(doc(db(), "categories", id));
  if (!snapshot.exists()) return null;
  return mapCategory({
    id: snapshot.id,
    ...(snapshot.data() as DocumentData),
  });
}
