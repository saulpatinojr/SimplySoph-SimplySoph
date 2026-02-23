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

function mapCategory(data: any): Category {
  return {
    ...data,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
  };
}

export async function fetchCategories(type?: "blog" | "video" | "photo"): Promise<Category[]> {
  const constraints: (QueryFieldFilterConstraint | QueryOrderByConstraint)[] = [];
  if (type) {
    constraints.push(where("type", "==", type));
  }
  constraints.push(orderBy("createdAt", "desc"));
  const snapshot = await getDocs(
    query(collection(db(), "categories"), ...constraints)
  );
  return snapshot.docs.map(docSnap => mapCategory(withId(docSnap)));
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

export async function deleteCategory(categoryId: string): Promise<void> {
  await deleteDoc(doc(db(), "categories", categoryId));
}

export async function fetchCategoryById(id: string): Promise<Category | null> {
  const snapshot = await getDoc(doc(db(), "categories", id));
  if (!snapshot.exists()) return null;
  return mapCategory({ id: snapshot.id, ...(snapshot.data() as DocumentData) });
}
