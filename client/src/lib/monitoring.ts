import { logEvent as firebaseLogEvent } from "firebase/analytics";
import { getFirebaseAnalytics } from "@/lib/firebase";

type ErrorSource =
  | "window.error"
  | "window.unhandledrejection"
  | "error-boundary"
  | "route-error-boundary";

type SafeErrorPayload = {
  name: string;
  message: string;
  stack?: string;
};

const MAX_MESSAGE_LENGTH = 180;
const MAX_STACK_LENGTH = 600;

let globalHandlersAttached = false;

function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export function sanitizeTelemetryText(value: string): string {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\b(Bearer\s+)?[A-Za-z0-9_-]{20,}\b/g, "[redacted-token]")
    .replace(
      /(api[_-]?key|token|access[_-]?token|refresh[_-]?token|password|secret)=([^&\s]+)/gi,
      "$1=[redacted]"
    );
}

export function toSafeErrorPayload(error: unknown): SafeErrorPayload {
  if (error instanceof Error) {
    return {
      name: sanitizeTelemetryText(error.name || "Error"),
      message: clip(sanitizeTelemetryText(error.message || "Unknown error"), MAX_MESSAGE_LENGTH),
      stack: error.stack
        ? clip(sanitizeTelemetryText(error.stack), MAX_STACK_LENGTH)
        : undefined,
    };
  }

  const message =
    typeof error === "string"
      ? error
      : (() => {
          try {
            return JSON.stringify(error);
          } catch {
            return String(error);
          }
        })();

  return {
    name: "UnknownError",
    message: clip(sanitizeTelemetryText(message), MAX_MESSAGE_LENGTH),
  };
}

export function captureClientError(source: ErrorSource, error: unknown): void {
  const safe = toSafeErrorPayload(error);

  if (import.meta.env.DEV) {
    console.error(`[monitoring] ${source}`, safe);
  }

  void getFirebaseAnalytics()
    .then(analytics => {
      if (!analytics) return;
      firebaseLogEvent(analytics, "client_exception", {
        source,
        name: safe.name,
        message: safe.message,
        fatal: false,
      });
    })
    .catch(() => {
      // Never throw from monitoring.
    });
}

export function installGlobalErrorMonitoring(): void {
  if (typeof window === "undefined" || globalHandlersAttached) return;

  const onWindowError = (event: ErrorEvent) => {
    captureClientError("window.error", event.error ?? event.message);
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    captureClientError("window.unhandledrejection", event.reason);
  };

  window.addEventListener("error", onWindowError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  globalHandlersAttached = true;
}
