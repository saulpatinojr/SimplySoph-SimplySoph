import { LOGIN_PATH } from "@/const";
import {
  fetchCreatorProfile,
  upsertCreatorProfile,
  type CreatorProfile,
} from "@/lib/content";
import { getFirebaseAuth, microsoftProvider } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type AuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

type UseAuthReturn = {
  user: CreatorProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: unknown;
  isAuthenticated: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useAuth(options?: UseAuthOptions): UseAuthReturn {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const auth = getFirebaseAuth();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(
    auth.currentUser
  );
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  const hydrateProfile = useCallback(async (user: FirebaseUser | null) => {
    if (!user) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profile = await upsertCreatorProfile({
        uid: user.uid,
        email: user.email ?? null,
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
      });
      const enriched = await fetchCreatorProfile(user.uid);
      // The effective role comes from the auth claim (resolved in upsert),
      // not from the stored document — the client is not allowed to persist
      // an admin role, so the doc may say "user" for a legitimate admin.
      setProfile(enriched ? { ...enriched, role: profile.role } : profile);
    } catch (upsertError) {
      console.error("[Auth] Failed to upsert profile", upsertError);
      setError(upsertError);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);
      void hydrateProfile(user);
    });

    // Check for redirect result on mount
    getRedirectResult(auth)
      .then(result => {
        if (result?.user) {
          void hydrateProfile(result.user);
        }
      })
      .catch(err => {
        console.error("[Auth] Redirect error:", err);
        setError(err);
      });

    return () => unsubscribe();
  }, [auth, hydrateProfile]);

  // Popup-first sign-in. signInWithRedirect relies on third-party storage
  // between the site origin and the auth handler, which modern browsers
  // (Chrome storage partitioning, Safari ITP) block — the user picks an
  // account and lands back signed out. Popup avoids that entirely; we only
  // fall back to redirect when the environment can't show a popup.
  const signInWithProvider = useCallback(
    async (provider: AuthProvider) => {
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        const code = (err as { code?: string })?.code;
        if (
          code === "auth/popup-blocked" ||
          code === "auth/operation-not-supported-in-this-environment"
        ) {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw err;
      }
    },
    [auth]
  );

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithProvider(provider);
  }, [signInWithProvider]);

  const loginWithMicrosoft = useCallback(async () => {
    await signInWithProvider(microsoftProvider);
  }, [signInWithProvider]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setProfile(null);
    setFirebaseUser(null);
  }, [auth]);

  const refresh = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const latest = await fetchCreatorProfile(firebaseUser.uid);
      setProfile(prev => latest ?? prev);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  const state = useMemo(() => {
    return {
      user: profile,
      firebaseUser,
      loading,
      error,
      // Base authenticated state on Firebase Auth itself, NOT the Firestore profile,
      // so a profile-fetch failure doesn't accidentally log the user out of the UI.
      isAuthenticated: Boolean(firebaseUser),
    };
  }, [profile, firebaseUser, loading, error]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (state.isAuthenticated) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    try {
      window.location.assign(redirectPath);
    } catch (err) {
      console.error("Failed to redirect:", err);
    }
  }, [redirectOnUnauthenticated, redirectPath, loading, state.isAuthenticated]);

  return {
    ...state,
    loginWithGoogle,
    loginWithMicrosoft,
    logout,
    refresh,
  };
}
