import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./common";
import type { CreatorProfile } from "./types";

export async function fetchCreatorProfile(uid: string): Promise<CreatorProfile | null> {
  const docRef = doc(db(), "users", uid);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data() as CreatorProfile;
  }
  return null;
}

export async function upsertCreatorProfile(profile: Partial<CreatorProfile> & { uid: string }): Promise<CreatorProfile> {
  const docRef = doc(db(), "users", profile.uid);
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    await updateDoc(docRef, profile);
    return { ...snapshot.data(), ...profile } as CreatorProfile;
  } else {
    const newProfile = {
      ...profile,
      role: "user", // Default role
      preferences: {},
    } as CreatorProfile;
    await setDoc(docRef, newProfile);
    return newProfile;
  }
}
