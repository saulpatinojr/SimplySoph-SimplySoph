import { describe, expect, it } from "vitest";

import { safeMediaUrl } from "../client/src/lib/safeUrl";

describe("safeMediaUrl", () => {
  it("passes through normal https and http URLs", () => {
    expect(safeMediaUrl("https://example.com/a.png")).toBe("https://example.com/a.png");
    expect(safeMediaUrl("http://example.com/a.png")).toBe("http://example.com/a.png");
  });

  it("normalizes rather than echoing the raw input", () => {
    expect(safeMediaUrl("HTTPS://EXAMPLE.COM/a.png")).toBe("https://example.com/a.png");
    expect(safeMediaUrl("  https://example.com/a.png  ")).toBe("https://example.com/a.png");
  });

  it("resolves relative paths against the current origin", () => {
    expect(safeMediaUrl("/uploads/a.png")).toBe(`${window.location.origin}/uploads/a.png`);
  });

  it("allows blob URLs (local file previews)", () => {
    const blob = "blob:https://example.com/3d6c8e0a-1111-2222-3333-444455556666";
    expect(safeMediaUrl(blob)).toBe(blob);
  });

  it("blocks javascript: in any disguise", () => {
    expect(safeMediaUrl("javascript:alert(1)")).toBe("");
    expect(safeMediaUrl("JaVaScRiPt:alert(1)")).toBe("");
    expect(safeMediaUrl(" \tjavascript:alert(1)")).toBe("");
    expect(safeMediaUrl("java\tscript:alert(1)")).toBe("");
  });

  it("blocks other dangerous or unknown schemes", () => {
    expect(safeMediaUrl("vbscript:msgbox(1)")).toBe("");
    expect(safeMediaUrl("file:///etc/passwd")).toBe("");
    expect(safeMediaUrl("ftp://example.com/a.png")).toBe("");
    expect(safeMediaUrl("data:text/html,<script>alert(1)</script>")).toBe("");
  });

  it("allows data:image payloads except SVG", () => {
    const png = "data:image/png;base64,iVBORw0KGgo=";
    expect(safeMediaUrl(png)).toBe(png);
    const withParams = "data:image/webp;charset=utf-8;base64,AAAA";
    expect(safeMediaUrl(withParams)).toBe(withParams);
    expect(safeMediaUrl("data:image/svg+xml,<svg onload=alert(1)/>")).toBe("");
    expect(safeMediaUrl("data:image/svg+xml;base64,PHN2Zz4=")).toBe("");
  });

  it("returns empty string for empty or malformed input", () => {
    expect(safeMediaUrl("")).toBe("");
    expect(safeMediaUrl("   ")).toBe("");
    expect(safeMediaUrl(null)).toBe("");
    expect(safeMediaUrl(undefined)).toBe("");
    expect(safeMediaUrl("https://exa mple.com/%")).toBe("");
  });
});
