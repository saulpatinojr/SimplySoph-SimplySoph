import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./common";
import type { CreatorProfile } from "./types";
import { OWNER_FIREBASE_UID } from "@/const";

export async function fetchCreatorProfile(
  uid: string
): Promise<CreatorProfile | null> {
  const docRef = doc(db(), "users", uid);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data() as CreatorProfile;
  }
  return null;
}

export async function upsertCreatorProfile(
  profile: Partial<CreatorProfile> & { uid: string }
): Promise<CreatorProfile> {
  const docRef = doc(db(), "users", profile.uid);
  const snapshot = await getDoc(docRef);

  // Owner UID (from VITE_OWNER_FIREBASE_UID env var) is always admin
  const isOwner = Boolean(
    OWNER_FIREBASE_UID && profile.uid === OWNER_FIREBASE_UID
  );

  if (snapshot.exists()) {
    const existing = snapshot.data() as CreatorProfile;
    // Auto-promote to admin if this is the owner and isn't already marked
    const roleUpdate: Partial<CreatorProfile> =
      isOwner && existing.role !== "admin" ? { role: "admin" } : {};
    await updateDoc(docRef, { ...profile, ...roleUpdate });
    return { ...existing, ...profile, ...roleUpdate } as CreatorProfile;
  } else {
    const newProfile: CreatorProfile = {
      ...profile,
      role: isOwner ? "admin" : "user",
      preferences: {},
    } as CreatorProfile;
    await setDoc(docRef, newProfile);
    return newProfile;
  }
}
