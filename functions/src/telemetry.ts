import * as functions from "firebase-functions";

type LogLevel = "info" | "warn" | "error";

type TelemetryContext = Record<string, unknown>;

const MAX_STRING_LEN = 240;

function clip(value: string): string {
  return value.length > MAX_STRING_LEN
    ? `${value.slice(0, MAX_STRING_LEN)}...`
    : value;
}

function redactText(value: string): string {
  return clip(
    value
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
      .replace(/\b(Bearer\s+)?[A-Za-z0-9_-]{20,}\b/g, "[redacted-token]")
      .replace(
        /(api[_-]?key|token|access[_-]?token|refresh[_-]?token|password|secret)=([^&\s]+)/gi,
        "$1=[redacted]"
      )
  );
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated-depth]";

  if (typeof value === "string") return redactText(value);
  if (typeof value === "number" || typeof value === "boolean" || value == null) {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: redactText(value.name || "Error"),
      message: redactText(value.message || "Unknown error"),
      stack: value.stack ? redactText(value.stack) : undefined,
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map(item => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 40);
    for (const [key, entryValue] of entries) {
      out[key] = sanitizeValue(entryValue, depth + 1);
    }
    return out;
  }

  return redactText(String(value));
}

function writeLog(level: LogLevel, event: string, context?: TelemetryContext): void {
  const payload = {
    event,
    ...(context ? (sanitizeValue(context) as TelemetryContext) : {}),
  };

  if (level === "info") {
    functions.logger.info(event, payload);
    return;
  }

  if (level === "warn") {
    functions.logger.warn(event, payload);
    return;
  }

  functions.logger.error(event, payload);
}

export function logInfo(event: string, context?: TelemetryContext): void {
  writeLog("info", event, context);
}

export function logWarn(event: string, context?: TelemetryContext): void {
  writeLog("warn", event, context);
}

export function logError(event: string, context?: TelemetryContext): void {
  writeLog("error", event, context);
}
