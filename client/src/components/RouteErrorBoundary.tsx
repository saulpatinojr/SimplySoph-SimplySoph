import { cn } from "@/lib/utils";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import Navigation from "./Navigation";
import Footer from "./Footer";
import { captureClientError } from "@/lib/monitoring";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Route-level error boundary that catches errors within individual pages
 * and shows a user-friendly error message with recovery options,
 * without crashing the entire application.
 */
class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureClientError("route-error-boundary", {
      name: error.name,
      message: error.message,
      stack: `${error.stack ?? ""}\n${errorInfo.componentStack ?? ""}`,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="flex flex-col items-center text-center max-w-md">
              <AlertTriangle size={48} className="text-destructive mb-6" />
              <h2 className="text-2xl font-heading font-semibold mb-2">
                Something went wrong
              </h2>
              <p className="text-muted-foreground mb-6">
                This page encountered an error. You can try reloading or head
                back to the homepage.
              </p>

              {this.state.error && (
                <div className="p-3 w-full rounded bg-muted overflow-auto mb-6 text-left">
                  <pre className="text-xs text-muted-foreground whitespace-break-spaces">
                    {this.state.error.message}
                  </pre>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg",
                    "bg-primary text-primary-foreground",
                    "hover:opacity-90 cursor-pointer text-sm"
                  )}
                >
                  <RotateCcw size={14} />
                  Reload
                </button>
                <a
                  href="/"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg",
                    "bg-muted text-foreground",
                    "hover:bg-muted/80 cursor-pointer text-sm"
                  )}
                >
                  <Home size={14} />
                  Home
                </a>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
