import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Loader2, LogIn, ShieldOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Redirect } from "wouter";

export default function Login() {
  const {
    loginWithGoogle,
    loginWithMicrosoft,
    logout,
    loading,
    isAuthenticated,
    user,
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile loaded — admin goes to dashboard; everyone else is denied
  if (isAuthenticated && user) {
    if (user.role === "admin") {
      return <Redirect to="/admin" />;
    }
    // Authenticated but not admin — show access denied and auto sign-out
    return (
      <AccessDenied
        onSignOut={logout}
        displayName={user.displayName ?? user.email ?? ""}
      />
    );
  }

  // Still loading profile after auth — show spinner instead of login buttons
  if (isAuthenticated && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("[Auth] Google login failed", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in with Google"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithMicrosoft();
    } catch (error) {
      console.error("[Auth] Microsoft login failed", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in with Microsoft"
      );
    } finally {
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
  onSignOut: () => void;
}

/**
 * Shown when an authenticated user doesn't have the admin role.
 * Auto-signs them out after 3 s so they aren't left in limbo.
 */
function AccessDenied({ displayName, onSignOut }: AccessDeniedProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onSignOut();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onSignOut]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <ShieldOff className="h-16 w-16 text-destructive mx-auto" />
        <div>
          <h1 className="text-2xl font-heading font-semibold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            {displayName ? `${displayName}, your` : "Your"} account doesn't have
            admin access to SimplySoph. You'll be signed out automatically.
          </p>
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
