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
import { ref as storageRef, deleteObject } from "firebase/storage";
import { db, mapDate, withId } from "./common";
import { getFirebaseStorage } from "../firebase";
import { syncPhotoAlbumToAlgolia, deleteFromAlgolia } from "./algolia";
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
    // Sync to Algolia (no-op if env vars not set)
    void syncPhotoAlbumToAlgolia(albumId, {
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      coverImage: input.coverImage,
      status: input.status,
      publishedAt: input.status === 'published' ? new Date() : null,
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
  // Sync new album to Algolia (no-op if env vars not set)
  void syncPhotoAlbumToAlgolia(ref.id, {
    title: input.title,
    description: input.description,
    categoryId: input.categoryId,
    coverImage: input.coverImage,
    status: input.status,
    publishedAt: input.status === 'published' ? new Date() : null,
  });
  return ref.id;
}

export async function deletePhotoAlbum(albumId: string): Promise<void> {
  const storage = getFirebaseStorage();

  // First delete all photos in the album (Firestore docs + Storage files)
  const photosSnapshot = await getDocs(
    query(collection(db(), "photos"), where("albumId", "==", albumId))
  );
  const deletePromises = photosSnapshot.docs.map(async (docSnap) => {
    const data = docSnap.data();
    // Clean up all image size variants from Storage (best-effort)
    const urlsToDelete: string[] = [];
    if (data?.imageUrl) urlsToDelete.push(data.imageUrl);
    if (data?.imageUrls) {
      const variants = data.imageUrls as Record<string, string>;
      urlsToDelete.push(...Object.values(variants));
    }
    await Promise.all(
      urlsToDelete.map(url =>
        deleteObject(storageRef(storage, url)).catch(() =>
          console.warn("Could not delete photo from Storage", url)
        )
      )
    );
    return deleteDoc(docSnap.ref);
  });
  await Promise.all(deletePromises);

  // Clean up album cover image if stored in Firebase Storage
  const albumSnap = await getDoc(doc(db(), "photoAlbums", albumId));
  if (albumSnap.exists()) {
    const albumData = albumSnap.data();
    if (albumData?.coverImage) {
      try {
        await deleteObject(storageRef(storage, albumData.coverImage));
      } catch {
        console.warn("Could not delete album cover from Storage", albumData.coverImage);
      }
    }
  }

  // Then delete the album document
  await deleteDoc(doc(db(), "photoAlbums", albumId));
  // Remove from Algolia index (no-op if env vars not set)
  void deleteFromAlgolia(albumId);
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
  const snapshot = await getDoc(doc(db(), "photos", photoId));
  if (snapshot.exists()) {
    const data = snapshot.data();
    const storage = getFirebaseStorage();
    const urlsToDelete: string[] = [];
    if (data?.imageUrl) urlsToDelete.push(data.imageUrl);
    if (data?.imageUrls) {
      const variants = data.imageUrls as Record<string, string>;
      urlsToDelete.push(...Object.values(variants));
    }
    await Promise.all(
      urlsToDelete.map(url =>
        deleteObject(storageRef(storage, url)).catch(() =>
          console.warn("Could not delete photo from Storage", url)
        )
      )
    );
  }
  await deleteDoc(doc(db(), "photos", photoId));
}

export async function fetchPhotoById(id: string): Promise<Photo | null> {
  const snapshot = await getDoc(doc(db(), "photos", id));
  if (!snapshot.exists()) return null;
  return mapPhoto({ id: snapshot.id, ...(snapshot.data() as DocumentData) });
}
