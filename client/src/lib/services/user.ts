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
}

export async function upsertCreatorProfile(
  profile: Partial<CreatorProfile> & { uid: string }
): Promise<CreatorProfile> {
  const docRef = doc(db(), "users", profile.uid);
  const snapshot = await getDoc(docRef);

  // Owner UID (from VITE_OWNER_FIREBASE_UID env var) is always admin
  // Additionally, include specific UIDs that also require permanent admin access
  const ADDITIONAL_ADMIN_UIDS = [
    "A5F4DaytsubHWaTUhtPzYqz6I0N2",
    "bcwjF01RNsfvXQGbIpKFYXcLOT53",
    "qCdqcGkkiQa4WvocECgxsWGZX3y2",
  ];

  const isOwnerOrAdmin = Boolean(
    (OWNER_FIREBASE_UID && profile.uid === OWNER_FIREBASE_UID) ||
    ADDITIONAL_ADMIN_UIDS.includes(profile.uid)
  );

  if (snapshot.exists()) {
    const existing = snapshot.data() as CreatorProfile;
    // Auto-promote to admin if this is the owner or an additional admin and isn't already marked
    const roleUpdate: Partial<CreatorProfile> =
      isOwnerOrAdmin && existing.role !== "admin" ? { role: "admin" } : {};
    await updateDoc(docRef, { ...profile, ...roleUpdate });
    return { ...existing, ...profile, ...roleUpdate } as CreatorProfile;
  } else {
    const newProfile: CreatorProfile = {
      ...profile,
      role: isOwnerOrAdmin ? "admin" : "user",
      preferences: {},
    } as CreatorProfile;
    await setDoc(docRef, newProfile);
    return newProfile;
  }
}
