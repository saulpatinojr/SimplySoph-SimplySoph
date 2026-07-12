import { useAuth } from "@/_core/hooks/useAuth";
import { LOGIN_PATH } from "@/const";
import { Redirect } from "wouter";
import { useEffect, useState, type ReactNode } from "react";

type RequireAuthProps = {
  /** Only allow users with this role through. Omit to require any authenticated user. */
  role?: "admin" | "user";
  children: ReactNode;
};

/**
 * Router-level auth guard.
 *
 * Wrap admin (or any protected) routes with this component so the auth
 * check happens *before* the page component mounts—preventing
 * unnecessary Firestore queries and lazy-chunk downloads.
 *
 * Usage in App.tsx:
 *   <RequireAuth role="admin"><AdminDashboard /></RequireAuth>
 *
 * @see CODE_REVIEW_REPORT.md P1-03
 */
export default function RequireAuth({ role, children }: RequireAuthProps) {
  const { user, firebaseUser, loading, isAuthenticated } = useAuth();
  const [tokenRole, setTokenRole] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRoleFromToken() {
      if (!isAuthenticated || !firebaseUser) {
        if (!cancelled) {
          setTokenRole(null);
          setTokenError(null);
          setTokenLoading(false);
        }
        return;
      }

      setTokenLoading(true);
      setTokenError(null);

      try {
        const tokenResult = await firebaseUser.getIdTokenResult(false);
        if (!cancelled) {
          const claimRole =
            typeof tokenResult.claims.role === "string"
              ? tokenResult.claims.role
              : null;
          setTokenRole(claimRole);
        }
      } catch {
        if (!cancelled) {
          setTokenRole(null);
          setTokenError("Failed to verify access token role.");
        }
      } finally {
        if (!cancelled) {
          setTokenLoading(false);
        }
      }
    }

    void loadRoleFromToken();

    return () => {
      cancelled = true;
    };
  }, [firebaseUser, isAuthenticated]);

  if (loading || tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to={LOGIN_PATH} />;
  }

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-heading font-bold mb-2">Token Verification Error</h1>
          <p className="text-muted-foreground">{tokenError}</p>
        </div>
      </div>
    );
  }

  const resolvedRole = tokenRole ?? user?.role ?? null;

  if (role && resolvedRole !== role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-heading font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You need the <strong>{role}</strong> role to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
