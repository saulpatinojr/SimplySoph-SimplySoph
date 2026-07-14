import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreatorProfile } from "@/lib/content";

const authRuntime = vi.hoisted(() => ({
  auth: { currentUser: null as any },
  listener: null as ((user: any) => void) | null,
}));

const contentMocks = vi.hoisted(() => ({
  upsertCreatorProfile: vi.fn(),
  fetchCreatorProfile: vi.fn(),
}));

const authSdkMocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  getRedirectResult: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/content", () => ({
  upsertCreatorProfile: contentMocks.upsertCreatorProfile,
  fetchCreatorProfile: contentMocks.fetchCreatorProfile,
}));

vi.mock("@/lib/firebase", () => ({
  getFirebaseAuth: () => authRuntime.auth,
  microsoftProvider: { providerId: "microsoft.com" },
}));

vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: class {
    setCustomParameters() {
      // no-op for tests
    }
  },
  onAuthStateChanged: authSdkMocks.onAuthStateChanged,
  getRedirectResult: authSdkMocks.getRedirectResult,
  signInWithRedirect: authSdkMocks.signInWithRedirect,
  signOut: authSdkMocks.signOut,
}));

import { useAuth } from "./useAuth";

const baseProfile: CreatorProfile = {
  uid: "u-1",
  email: "user@example.com",
  displayName: "User",
  photoURL: null,
  role: "user",
  preferences: {},
};

function authenticatedUser() {
  return {
    uid: "u-1",
    email: "user@example.com",
    displayName: "User",
    photoURL: null,
  };
}

let locationAssignMock: ReturnType<typeof vi.fn>;

describe("useAuth hook edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/");

    // jsdom's window.location (and its "assign" property) is
    // non-configurable in this jsdom version, so vi.spyOn cannot wrap it,
    // and a Proxy can't lie about a non-configurable/non-writable target
    // property either (invariant violation at runtime). Replace
    // window.location with a plain object whose fields stay live via
    // document.location (a separate accessor jsdom keeps in sync with
    // history.pushState), while "assign" is a fresh, inspectable mock.
    locationAssignMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: {
        assign: locationAssignMock,
        get pathname() { return document.location.pathname; },
        get href() { return document.location.href; },
        get search() { return document.location.search; },
        get hash() { return document.location.hash; },
        get origin() { return document.location.origin; },
        get host() { return document.location.host; },
        get protocol() { return document.location.protocol; },
      },
    });

    authRuntime.auth.currentUser = null;
    authRuntime.listener = null;

    authSdkMocks.onAuthStateChanged.mockImplementation((auth: any, cb: any) => {
      authRuntime.listener = cb;
      cb(auth.currentUser ?? null);
      return () => undefined;
    });

    authSdkMocks.getRedirectResult.mockResolvedValue(null);

    contentMocks.upsertCreatorProfile.mockResolvedValue(baseProfile);
    contentMocks.fetchCreatorProfile.mockResolvedValue(baseProfile);
  });

  it("redirects unauthenticated users when redirect option is enabled", async () => {
    renderHook(() =>
      useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login" })
    );

    await waitFor(() => {
      expect(locationAssignMock).toHaveBeenCalledWith("/login");
    });
  });

  it("does not redirect when already at the redirect path", async () => {
    window.history.pushState({}, "", "/login");

    renderHook(() =>
      useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login" })
    );

    await waitFor(() => {
      expect(locationAssignMock).not.toHaveBeenCalled();
    });
  });

  it("does not redirect when authenticated even if profile hydration fails", async () => {
    authRuntime.auth.currentUser = authenticatedUser();
    contentMocks.upsertCreatorProfile.mockRejectedValueOnce(
      new Error("hydrate failure")
    );

    const { result } = renderHook(() =>
      useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login" })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(locationAssignMock).not.toHaveBeenCalled();
  });

  it("refresh keeps previous profile when latest profile is missing", async () => {
    authRuntime.auth.currentUser = authenticatedUser();

    contentMocks.fetchCreatorProfile
      .mockResolvedValueOnce(baseProfile)
      .mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user?.uid).toBe("u-1");
    });

    const previousProfile = result.current.user;

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.user).toEqual(previousProfile);
  });

  it("refresh stores error when profile fetch fails", async () => {
    authRuntime.auth.currentUser = authenticatedUser();

    const refreshError = new Error("refresh failed");
    contentMocks.fetchCreatorProfile
      .mockResolvedValueOnce(baseProfile)
      .mockRejectedValueOnce(refreshError);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBe(refreshError);
  });
});
