/**
 * Sanitize a user-provided URL for use as an image/media src.
 *
 * Defense-in-depth for URL-based sinks (`<img src>`, `<video src>`):
 *
 * 1. The input is parsed with the WHATWG URL parser — the same parser the
 *    browser uses to resolve the attribute — so validation cannot be
 *    bypassed with encoding tricks (`java\tscript:`, mixed case, leading
 *    control characters) that string matching on the raw input would miss.
 * 2. The returned value is the parser's *normalized* serialization
 *    (`URL.href`), never the raw input string.
 * 3. The normalized value must match an explicit scheme allowlist, checked
 *    with literal prefixes. Everything else — `javascript:`, `vbscript:`,
 *    `data:text/html`, unparseable input — returns "" so the element
 *    renders nothing.
 *
 * Allowed: http:, https:, blob:, and data:image/* except SVG
 * (`data:image/svg+xml` can embed script; inert inside <img>, but the value
 * may be copied to contexts where it is not).
 */

// data:image payload: media type, optional parameters (each introduced by
// ";"), then "," and body. Every quantified group must consume a literal
// ";" or "," first, so the pattern cannot backtrack polynomially.
const DATA_IMAGE_PATTERN =
  /^data:image\/([a-z0-9.+-]+)((?:;[a-z0-9-]+=[^;,]*)*(?:;base64)?),([\s\S]*)$/i;

export function safeMediaUrl(url: string | undefined | null): string {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return "";

  let parsed: URL;
  try {
    // The base makes relative paths ("/uploads/a.png") resolve the same
    // way the browser would resolve them from the current page.
    parsed = new URL(trimmed, globalThis.location?.origin ?? "http://localhost");
  } catch {
    return "";
  }

  const normalized = parsed.href;

  if (
    normalized.startsWith("https://") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }

  if (normalized.startsWith("data:")) {
    const match = DATA_IMAGE_PATTERN.exec(normalized);
    if (match && match[1].toLowerCase() !== "svg+xml") {
      // Reassemble from the validated components rather than passing the
      // matched input through.
      return `data:image/${match[1]}${match[2]},${match[3]}`;
    }
  }

  return "";
}
