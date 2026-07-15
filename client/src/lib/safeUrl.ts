/**
 * Sanitize a user-provided URL for use as an image/media src.
 *
 * Only http(s), blob, and data:image/* URLs pass through; anything else
 * (javascript:, data:text/html, vbscript:, malformed input) returns "" so
 * the element simply renders nothing.
 */
export function safeMediaUrl(url: string | undefined | null): string {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "blob:") {
      return trimmed;
    }
    if (parsed.protocol === "data:" && /^data:image\//i.test(trimmed)) {
      return trimmed;
    }
  } catch {
    // Unparseable URL — treat as unsafe.
  }
  return "";
}
