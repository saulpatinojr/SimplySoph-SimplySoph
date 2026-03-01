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
  signOut,
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
      setProfile(enriched ?? profile);
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

    return () => unsubscribe();
  }, [auth, hydrateProfile]);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  }, [auth]);

  const loginWithMicrosoft = useCallback(async () => {
    await signInWithPopup(auth, microsoftProvider);
  }, [auth]);

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
      isAuthenticated: Boolean(profile),
    };
  }, [profile, firebaseUser, loading, error]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    try {
      window.location.assign(redirectPath);
    } catch (err) {
      console.error("Failed to redirect:", err);
    }
  }, [redirectOnUnauthenticated, redirectPath, loading, state.user]);

  return {
    ...state,
    loginWithGoogle,
    loginWithMicrosoft,
    logout,
    refresh,
  };
}
