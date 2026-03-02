import { useAuth } from "@/_core/hooks/useAuth";
import { LOGIN_PATH } from "@/const";
import { Redirect } from "wouter";
import type { ReactNode } from "react";

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
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
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

  if (role && user?.role !== role) {
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
