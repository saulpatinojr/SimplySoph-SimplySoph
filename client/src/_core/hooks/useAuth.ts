import { LOGIN_PATH } from "@/const";
import { getFirebaseAuth } from "@/lib/firebase";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

type UseAuthReturn = {
  user: Awaited<ReturnType<typeof trpc.auth.me.useQuery>>["data"] | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: unknown;
  isAuthenticated: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SESSION_ENDPOINT = "/api/auth/session";

async function postSession(idToken: string) {
  const response = await fetch(SESSION_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || "Failed to establish Firebase session cookie"
    );
  }
}

export function useAuth(options?: UseAuthOptions): UseAuthReturn {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};
  const utils = trpc.useUtils();
  const firebaseAuth = getFirebaseAuth();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(
    firebaseAuth.currentUser
  );
  const [authReady, setAuthReady] = useState<boolean>(false);
  const sessionUidRef = useRef<string | null>(null);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const establishSession = useCallback(
    async (user: FirebaseUser) => {
      if (sessionUidRef.current === user.uid) {
        return;
      }

      try {
        const idToken = await user.getIdToken(true);
        await postSession(idToken);
        sessionUidRef.current = user.uid;
        await utils.auth.me.invalidate();
      } catch (error) {
        sessionUidRef.current = null;
        throw error;
      }
    },
    [utils]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async user => {
      setFirebaseUser(user);
      setAuthReady(true);

      if (user) {
        try {
          await establishSession(user);
        } catch (error) {
          console.error("[Auth] Failed to establish session", error);
        }
      } else {
        sessionUidRef.current = null;
        utils.auth.me.setData(undefined, null);
      }
    });

    return unsubscribe;
  }, [establishSession, firebaseAuth, utils]);

  useEffect(() => {
    if (!authReady) return;
    if (!firebaseUser) return;
    if (meQuery.isLoading) return;
    if (meQuery.data) return;

    sessionUidRef.current = null;
    establishSession(firebaseUser).catch(error => {
      console.error("[Auth] Session refresh failed", error);
    });
  }, [authReady, establishSession, firebaseUser, meQuery.data, meQuery.isLoading]);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(firebaseAuth, provider);
  }, [firebaseAuth]);

  const logout = useCallback(async () => {
    try {
      await signOut(firebaseAuth);
      sessionUidRef.current = null;
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [firebaseAuth, logoutMutation, utils]);

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      firebaseUser,
      loading:
        !authReady || meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    authReady,
    firebaseUser,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (!authReady) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    try {
      window.location.assign(redirectPath);
    } catch (err) {
      console.error("Failed to redirect:", err);
    }
  }, [
    authReady,
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    loginWithGoogle,
    logout,
    refresh: () => meQuery.refetch(),
  };
}
