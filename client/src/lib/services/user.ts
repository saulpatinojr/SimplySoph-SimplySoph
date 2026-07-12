import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./common";
import type { CreatorProfile } from "./types";
import { getFirebaseAuth } from "@/lib/firebase";

const BOOTSTRAP_ADMIN_EMAILS = new Set([
  "sophia@simplysoph.com",
  "administrator@simplysoph.com",
  "saulpatinojr@gmail.com",
]);

function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  return Boolean(
    email && BOOTSTRAP_ADMIN_EMAILS.has(email.trim().toLowerCase())
  );
}

function normalizeRole(rawRole: unknown): "admin" | "user" {
  return rawRole === "admin" ? "admin" : "user";
}

function normalizePreferences(raw: unknown): Record<string, any> {
  return raw && typeof raw === "object" ? (raw as Record<string, any>) : {};
}

function normalizeCreatorProfile(
  raw: Partial<CreatorProfile> | undefined,
  uid: string,
  roleOverride?: "admin" | "user"
): CreatorProfile {
  return {
    uid,
    email: raw?.email ?? null,
    displayName: raw?.displayName ?? null,
    photoURL: raw?.photoURL ?? null,
    bio: raw?.bio,
    role: roleOverride ?? normalizeRole(raw?.role),
    preferences: normalizePreferences(raw?.preferences),
  };
}

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
}

/**
 * Fetch a creator profile from Firestore.
 *
 * FIX: Now explicitly returns `null` when the document does not exist,
 * matching the declared return type. Previously returned `undefined`.
 *
 * @see CODE_REVIEW_REPORT.md CR-10, P2-07
 */
export async function fetchCreatorProfile(
  uid: string
): Promise<CreatorProfile | null> {
  const docRef = doc(db(), "users", uid);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return normalizeCreatorProfile(snapshot.data() as Partial<CreatorProfile>, uid);
  }
  return null;
}

/**
 * Check whether the currently signed-in user holds the `admin` custom claim.
 *
 * This is the **authoritative** admin check \u2014 custom claims are set
 * server-side via the `setAdminClaim` Cloud Function and cannot be
 * spoofed by the client.
 *
 * @see docs/ADMIN_ROLES.md
 * @see CODE_REVIEW_REPORT.md P1-01, CR-2
 */
export async function checkAdminClaim(): Promise<boolean> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return false;

  try {
    // forceRefresh: true ensures custom claims set via setAdminClaim are
    // reflected immediately without requiring the user to log out and back in.
    // Firebase caches tokens for up to 1 hour; forcing a refresh fetches a new JWT.
    const tokenResult = await user.getIdTokenResult(/* forceRefresh */ true);
    return tokenResult.claims.role === "admin";
  } catch {
    return false;
  }
}

export async function checkAdminAccess(): Promise<boolean> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return false;

  if (await checkAdminClaim()) {
    return true;
  }

  return isBootstrapAdminEmail(user.email);
}

/**
 * Upsert (create or update) a creator profile on login.
 *
 * Admin role is determined by Firebase Custom Claims first, with the same
 * bootstrap admin email fallback used by Firestore and Storage rules.
 *
 * @see CODE_REVIEW_REPORT.md P1-01, P1-02
 */
export async function upsertCreatorProfile(
  profile: Partial<CreatorProfile> & { uid: string }
): Promise<CreatorProfile> {
  const docRef = doc(db(), "users", profile.uid);
  const snapshot = await getDoc(docRef);

  const isAdmin = await checkAdminAccess();
  const claimRole: "admin" | "user" = isAdmin ? "admin" : "user";

  if (snapshot.exists()) {
    const existing = normalizeCreatorProfile(
      snapshot.data() as Partial<CreatorProfile>,
      profile.uid,
      claimRole
    );
    const updates = stripUndefined({
      email: profile.email,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      bio: profile.bio,
      preferences: profile.preferences,
      role: claimRole,
    });
    await updateDoc(docRef, updates);
    return normalizeCreatorProfile({ ...existing, ...updates }, profile.uid, claimRole);
  } else {
    const newProfile = normalizeCreatorProfile(profile, profile.uid, claimRole);
    await setDoc(docRef, newProfile);
    return newProfile;
  }
}
