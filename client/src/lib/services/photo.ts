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
  where,
} from "firebase/firestore";
import { db, mapDate, withId } from "./common";
import type { Photo, PhotoAlbum, PhotoAlbumInput, PhotoInput } from "./types";

function mapAlbum(data: any): PhotoAlbum {
  return {
    ...data,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
    publishAt: mapDate(data.publishAt),
  };
}

function mapPhoto(data: any): Photo {
  return {
    ...data,
    createdAt: mapDate(data.createdAt)!,
    updatedAt: mapDate(data.updatedAt)!,
  };
}

export async function fetchPhotoAlbums(): Promise<PhotoAlbum[]> {
  const snapshot = await getDocs(
    query(collection(db(), "photoAlbums"), orderBy("createdAt", "desc"))
  );
  return snapshot.docs.map(docSnap => mapAlbum(withId(docSnap)));
}

export async function fetchPhotosByAlbum(albumId: string): Promise<Photo[]> {
  const snapshot = await getDocs(
    query(
      collection(db(), "photos"),
      where("albumId", "==", albumId),
      orderBy("order", "asc")
    )
  );
  return snapshot.docs.map(docSnap => mapPhoto(withId(docSnap)));
}

export async function fetchRecentPhotos(limitCount: number): Promise<Photo[]> {
  const snapshot = await getDocs(
    query(
      collection(db(), "photos"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    )
  );
  return snapshot.docs.map(docSnap => mapPhoto(withId(docSnap)));
}

export async function savePhotoAlbum(
  input: PhotoAlbumInput,
  albumId?: string
): Promise<string> {
  const collectionRef = collection(db(), "photoAlbums");
  const now = serverTimestamp();

  if (albumId) {
    const ref = doc(collectionRef, albumId);
    await updateDoc(ref, {
      ...input,
      description: input.description ?? null,
      coverImage: input.coverImage ?? null,
      categoryId: input.categoryId ?? null,
      publishAt: input.publishAt ?? null,
      updatedAt: now,
    });
    return albumId;
  }

  const ref = doc(collectionRef);
  await setDoc(ref, {
    ...input,
    description: input.description ?? null,
    coverImage: input.coverImage ?? null,
    categoryId: input.categoryId ?? null,
    publishAt: input.publishAt ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function deletePhotoAlbum(albumId: string): Promise<void> {
  // First delete all photos in the album
  const photosSnapshot = await getDocs(
    query(collection(db(), "photos"), where("albumId", "==", albumId))
  );
  const deletePromises = photosSnapshot.docs.map(docSnap =>
    deleteDoc(docSnap.ref)
  );
  await Promise.all(deletePromises);

  // Then delete the album
  await deleteDoc(doc(db(), "photoAlbums", albumId));
}

export async function fetchPhotoAlbumById(
  id: string
): Promise<PhotoAlbum | null> {
  const snapshot = await getDoc(doc(db(), "photoAlbums", id));
  if (!snapshot.exists()) return null;
  return mapAlbum({ id: snapshot.id, ...(snapshot.data() as DocumentData) });
}

export async function savePhoto(
  input: PhotoInput,
  photoId?: string
): Promise<string> {
  const collectionRef = collection(db(), "photos");
  const now = serverTimestamp();

  if (photoId) {
    const ref = doc(collectionRef, photoId);
    await updateDoc(ref, {
      ...input,
      caption: input.caption ?? null,
      imageUrls: input.imageUrls ?? null,
      updatedAt: now,
    });
    return photoId;
  }

  const ref = doc(collectionRef);
  await setDoc(ref, {
    ...input,
    caption: input.caption ?? null,
    imageUrls: input.imageUrls ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function deletePhoto(photoId: string): Promise<void> {
  await deleteDoc(doc(db(), "photos", photoId));
}

export async function fetchPhotoById(id: string): Promise<Photo | null> {
  const snapshot = await getDoc(doc(db(), "photos", id));
  if (!snapshot.exists()) return null;
  return mapPhoto({ id: snapshot.id, ...(snapshot.data() as DocumentData) });
}
