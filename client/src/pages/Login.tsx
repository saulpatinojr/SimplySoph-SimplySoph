import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Loader2, LogIn, ShieldOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Redirect } from "wouter";

/**
 * Turn a Firebase Auth error into a message a human can act on.
 */
function describeAuthError(error: unknown): string | null {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      // The user closed the popup — not an error worth alarming them with.
      return null;
    case "auth/account-exists-with-different-credential":
      return "This email is already registered with a different sign-in provider. Try the other 'Continue with' button for this email.";
    case "auth/unauthorized-domain":
      return "This site's domain is not authorized for sign-in. Add it under Firebase Console → Authentication → Authorized domains.";
    case "auth/network-request-failed":
      return "Network error during sign-in. Check your connection and try again.";
    default:
      return error instanceof Error
        ? error.message
        : "Unable to complete sign-in. Please try again.";
  }
}

export default function Login() {
  const {
    loginWithGoogle,
    loginWithMicrosoft,
    logout,
    loading,
    error,
    isAuthenticated,
    user,
    firebaseUser,
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    setErrorMessage(describeAuthError(error));
    setIsSubmitting(false);
  }, [error]);

  // Profile loaded — admin goes to dashboard; everyone else is denied
  if (isAuthenticated && user) {
    if (user.role === "admin") {
      return <Redirect to="/admin" />;
    }
    // Authenticated but not admin — keep the user signed in until they choose.
    return (
      <AccessDenied
        onSignOut={logout}
        displayName={user.displayName ?? user.email ?? ""}
        email={user.email ?? ""}
      />
    );
  }

  // Still loading profile after auth — show spinner instead of login buttons.
  if (isAuthenticated && !user && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAuthenticated && !user) {
    return (
      <AccessDenied
        onSignOut={logout}
        displayName={firebaseUser?.displayName ?? firebaseUser?.email ?? ""}
        email={firebaseUser?.email ?? ""}
        detail={
          errorMessage ??
          "Your sign-in completed, but SimplySoph could not load an admin profile for this account."
        }
      />
    );
  }

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      // Redirect happens after this call
    } catch (error: any) {
      console.error("[Auth] Google sign-in failed", error);
      setErrorMessage(describeAuthError(error));
      setIsSubmitting(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithMicrosoft();
      // Redirect happens after this call
    } catch (error: any) {
      console.error("[Auth] Microsoft sign-in failed", error);
      setErrorMessage(describeAuthError(error));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src={APP_LOGO}
            alt={APP_TITLE}
            className="h-20 w-20 rounded-xl object-cover shadow-lg ring-1 ring-border"
          />
          <div>
            <h1 className="text-3xl font-heading font-semibold">
              Welcome back to {APP_TITLE}
            </h1>
            <p className="text-muted-foreground mt-2">
              Sign in to manage your content and access admin features.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            size="lg"
            className="w-full flex items-center justify-center gap-3"
            onClick={handleGoogleLogin}
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Continue with Google
              </>
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full flex items-center justify-center gap-3"
            onClick={handleMicrosoftLogin}
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Continue with Microsoft
              </>
            )}
          </Button>

          {errorMessage && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md py-2 px-3">
              {errorMessage}
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          By signing in you agree to the{" "}
          <Link href="/terms-of-service">
            <a className="underline hover:text-primary transition-colors">
              Terms
            </a>
          </Link>{" "}
          and acknowledge the{" "}
          <Link href="/privacy-policy">
            <a className="underline hover:text-primary transition-colors">
              Privacy Policy
            </a>
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

// ── AccessDenied ─────────────────────────────────────────────────────────────

interface AccessDeniedProps {
  displayName: string;
  email: string;
  detail?: string;
  onSignOut: () => void;
}

/**
 * Shown when an authenticated user doesn't have the admin role.
 */
function AccessDenied({
  displayName,
  email,
  detail,
  onSignOut,
}: AccessDeniedProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <ShieldOff className="h-16 w-16 text-destructive mx-auto" />
        <div>
          <h1 className="text-2xl font-heading font-semibold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            {detail ??
              `${displayName ? `${displayName}, your` : "Your"} account doesn't have admin access to SimplySoph.`}
          </p>
          {email && (
            <p className="mt-3 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Signed in as {email}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={onSignOut}
          className="w-full max-w-xs"
        >
          Sign Out Now
        </Button>
      </div>
    </div>
  );
}
