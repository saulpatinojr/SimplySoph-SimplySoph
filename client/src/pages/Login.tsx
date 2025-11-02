import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Loader2, LogIn } from "lucide-react";
import { useState } from "react";
import { Redirect } from "wouter";

export default function Login() {
  const { loginWithGoogle, loading, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Redirect to="/admin" />;
  }

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("[Auth] Google login failed", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in with Google"
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
          {errorMessage && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md py-2 px-3">
              {errorMessage}
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          By signing in you agree to the Terms and acknowledge the Privacy
          Policy.
        </p>
      </div>
    </div>
  );
}
