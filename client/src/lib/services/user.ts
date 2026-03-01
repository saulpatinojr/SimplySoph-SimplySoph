import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./common";
import type { CreatorProfile } from "./types";

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

const ADMIN_EMAILS = [
  "sophia@simplysoph.com",
  "administrator@simplysoph.com",
  "saulpatinojr@gmail.com",
];

export async function upsertCreatorProfile(
  profile: Partial<CreatorProfile> & { uid: string }
): Promise<CreatorProfile> {
  const docRef = doc(db(), "users", profile.uid);
  const snapshot = await getDoc(docRef);

  const isAdmin =
    profile.email && ADMIN_EMAILS.includes(profile.email.toLowerCase());
  const assignedRole = isAdmin ? "admin" : "user";

  if (snapshot.exists()) {
    const existingData = snapshot.data();
    // Upgrade existing users to admin if their email matches
    const roleToUse = isAdmin ? "admin" : existingData.role || "user";

    await updateDoc(docRef, { ...profile, role: roleToUse });
    return { ...existingData, ...profile, role: roleToUse } as CreatorProfile;
  } else {
    const newProfile = {
      ...profile,
      role: assignedRole, // Assign admin if matching email, otherwise user
      preferences: {},
    } as CreatorProfile;
    await setDoc(docRef, newProfile);
    return newProfile;
  }
}
