import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db, mapDate, withId } from "./common";
import type { MediaAsset, MediaAssetInput, MediaPlacement } from "./types";

const MEDIA_ASSETS = "mediaAssets";
const MEDIA_PLACEMENTS = "mediaPlacements";

function mapAsset(data: DocumentData): MediaAsset {
  return {
    ...data,
    tags: Array.isArray(data.tags) ? data.tags : [],
    createdAt: mapDate(data.createdAt) ?? new Date(),
    updatedAt: mapDate(data.updatedAt) ?? new Date(),
  } as MediaAsset;
}

export async function fetchMediaAssets(): Promise<MediaAsset[]> {
  const snapshot = await getDocs(
    query(collection(db(), MEDIA_ASSETS), orderBy("createdAt", "desc"))
  );
  return snapshot.docs.map(item => mapAsset(withId(item)));
}

export async function saveMediaAsset(
  input: MediaAssetInput,
  assetId?: string
): Promise<string> {
  const assets = collection(db(), MEDIA_ASSETS);
  if (assetId) {
    await updateDoc(doc(assets, assetId), { ...input, updatedAt: serverTimestamp() });
    return assetId;
  }

  const asset = doc(assets);
  await setDoc(asset, {
    ...input,
    tags: input.tags ?? [],
    thumbnailUrl: input.thumbnailUrl ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return asset.id;
}

export async function deleteMediaAsset(assetId: string): Promise<void> {
  await deleteDoc(doc(db(), MEDIA_ASSETS, assetId));
}

export async function fetchPublishedMediaPlacements(targetKey: string): Promise<MediaPlacement[]> {
  const snapshot = await getDocs(query(
    collection(db(), MEDIA_PLACEMENTS),
    where("targetKey", "==", targetKey),
    where("status", "==", "published"),
    orderBy("createdAt", "desc")
  ));
  return snapshot.docs.map(item => ({
    ...item.data(), id: item.id,
    createdAt: mapDate(item.data().createdAt) ?? new Date(),
    updatedAt: mapDate(item.data().updatedAt) ?? new Date(),
  } as MediaPlacement));
}

export async function placeMediaAsset(asset: MediaAsset, targetKey: string, slot: MediaPlacement["slot"] = "feature"): Promise<string> {
  const placement = doc(collection(db(), MEDIA_PLACEMENTS));
  await setDoc(placement, {
    targetKey, slot, assetId: asset.id, title: asset.title,
    mediaType: asset.mediaType, source: asset.source, url: asset.url,
    thumbnailUrl: asset.thumbnailUrl ?? null, status: "published",
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return placement.id;
}
