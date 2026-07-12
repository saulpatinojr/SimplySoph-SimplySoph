import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreatorProfile } from "./types";

const firestoreState = vi.hoisted(() => ({
  snapshot: {
    exists: () => false,
    data: () => undefined,
  },
}));

const firestoreMocks = vi.hoisted(() => ({
  doc: vi.fn(() => ({ path: "users/test-user" })),
  getDoc: vi.fn(async () => firestoreState.snapshot),
  setDoc: vi.fn(async () => undefined),
  updateDoc: vi.fn(async () => undefined),
}));

const authState = vi.hoisted(() => ({
  currentUser: {
    email: "author@example.com",
    getIdTokenResult: vi.fn(async () => ({ claims: { role: "user" } })),
  },
}));

vi.mock("firebase/firestore", () => ({
  doc: firestoreMocks.doc,
  getDoc: firestoreMocks.getDoc,
  setDoc: firestoreMocks.setDoc,
  updateDoc: firestoreMocks.updateDoc,
}));

vi.mock("./common", () => ({
  db: () => ({ mocked: true }),
}));

vi.mock("@/lib/firebase", () => ({
  getFirebaseAuth: () => ({ currentUser: authState.currentUser }),
}));

import { fetchCreatorProfile, upsertCreatorProfile } from "./user";

function setSnapshot(data: Partial<CreatorProfile> | null) {
  if (data) {
    firestoreState.snapshot = {
      exists: () => true,
      data: () => data,
    };
    return;
  }

  firestoreState.snapshot = {
    exists: () => false,
    data: () => undefined,
  };
}

describe("user profile service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.currentUser = {
      email: "author@example.com",
      getIdTokenResult: vi.fn(async () => ({ claims: { role: "user" } })),
    };
    setSnapshot(null);
  });

  it("returns null when a creator profile does not exist", async () => {
    setSnapshot(null);

    const profile = await fetchCreatorProfile("missing-user");

    expect(profile).toBeNull();
  });

  it("creates a normalized profile on first login", async () => {
    setSnapshot(null);

    const profile = await upsertCreatorProfile({
      uid: "first-login-user",
      email: "first@login.dev",
      displayName: "First Login",
      photoURL: null,
    });

    expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(1);
    expect(profile).toEqual({
      uid: "first-login-user",
      email: "first@login.dev",
      displayName: "First Login",
      photoURL: null,
      role: "user",
      preferences: {},
      bio: undefined,
    });
  });

  it("updates and returns merged profile on returning login", async () => {
    setSnapshot({
      uid: "returning-user",
      email: "old@example.com",
      displayName: "Old Name",
      photoURL: null,
      role: "user",
      preferences: { theme: "light" },
    });

    const profile = await upsertCreatorProfile({
      uid: "returning-user",
      email: "new@example.com",
      displayName: "New Name",
      photoURL: "https://example.com/avatar.jpg",
    });

    expect(firestoreMocks.updateDoc).toHaveBeenCalledTimes(1);
    const [, updates] = firestoreMocks.updateDoc.mock.calls[0];
    expect(updates).toEqual({
      email: "new@example.com",
      displayName: "New Name",
      photoURL: "https://example.com/avatar.jpg",
      role: "user",
    });

    expect(profile).toEqual({
      uid: "returning-user",
      email: "new@example.com",
      displayName: "New Name",
      photoURL: "https://example.com/avatar.jpg",
      role: "user",
      preferences: { theme: "light" },
      bio: undefined,
    });
  });

  it("promotes a user to admin when admin claim is present", async () => {
    authState.currentUser = {
      email: "author@example.com",
      getIdTokenResult: vi.fn(async () => ({ claims: { role: "admin" } })),
    };

    setSnapshot({
      uid: "promote-user",
      email: "author@example.com",
      displayName: "Promote Me",
      photoURL: null,
      role: "user",
      preferences: {},
    });

    const profile = await upsertCreatorProfile({
      uid: "promote-user",
      email: "author@example.com",
      displayName: "Promoted",
      photoURL: null,
    });

    const [, updates] = firestoreMocks.updateDoc.mock.calls[0];
    expect(updates.role).toBe("admin");
    expect(profile.role).toBe("admin");
  });

  it("demotes a user to user role when admin claim is removed", async () => {
    authState.currentUser = {
      email: "author@example.com",
      getIdTokenResult: vi.fn(async () => ({ claims: { role: "user" } })),
    };

    setSnapshot({
      uid: "demote-user",
      email: "author@example.com",
      displayName: "Demote Me",
      photoURL: null,
      role: "admin",
      preferences: {},
    });

    const profile = await upsertCreatorProfile({
      uid: "demote-user",
      email: "author@example.com",
      displayName: "Demoted",
      photoURL: null,
    });

    const [, updates] = firestoreMocks.updateDoc.mock.calls[0];
    expect(updates.role).toBe("user");
    expect(profile.role).toBe("user");
  });
});
