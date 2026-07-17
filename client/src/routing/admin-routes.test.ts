/**
 * Structural invariants for the admin surface.
 *
 * wouter's <Switch> is first-match-wins, so ADMIN_ROUTES is order-sensitive.
 * These tests turn the ordering conventions documented in App.tsx into hard
 * failures instead of silent route shadowing, and guarantee the sidebar can
 * never link to a route that doesn't exist.
 */
import { describe, expect, it, vi } from "vitest";

// The route table is what we're testing; stub the heavyweight page imports
// App.tsx pulls in at module scope so this stays a fast, node-only test.
vi.mock("@/lib/firebase", () => ({
  getFirebaseAuth: () => ({ currentUser: null }),
  getFirebaseStorage: () => ({}),
  microsoftProvider: {},
}));

import { ADMIN_ROUTES } from "@/App";
import { menuItems } from "@/components/DashboardLayout";

const routePaths = ADMIN_ROUTES.map(r => r.path);

/** Would the wouter pattern `pattern` match the concrete path `path`? */
function patternMatches(pattern: string, path: string): boolean {
  const regex = new RegExp(
    "^" +
      pattern
        .split("/")
        .map(seg => (seg.startsWith(":") ? "[^/]+" : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
        .join("/") +
      "$"
  );
  return regex.test(path);
}

describe("ADMIN_ROUTES integrity", () => {
  it("has no duplicate paths", () => {
    expect(new Set(routePaths).size).toBe(routePaths.length);
  });

  it("keeps the bare /admin dashboard route last", () => {
    expect(routePaths[routePaths.length - 1]).toBe("/admin");
  });

  it("never shadows a static route with an earlier param route", () => {
    const shadowed: string[] = [];
    routePaths.forEach((later, j) => {
      if (later.includes(":")) return; // only concrete paths can be shadowed this way
      for (let i = 0; i < j; i++) {
        if (routePaths[i].includes(":") && patternMatches(routePaths[i], later)) {
          shadowed.push(`${routePaths[i]} (index ${i}) shadows ${later} (index ${j})`);
        }
      }
    });
    expect(shadowed).toEqual([]);
  });

  it("only contains /admin-prefixed paths", () => {
    for (const path of routePaths) {
      expect(path === "/admin" || path.startsWith("/admin/")).toBe(true);
    }
  });
});

describe("sidebar menu ↔ route table", () => {
  it("every sidebar item points at a declared admin route", () => {
    const missing = menuItems
      .map(item => item.path)
      .filter(path => !routePaths.includes(path));
    expect(missing).toEqual([]);
  });

  it("every list-level admin section has a sidebar entry", () => {
    // Sections are the first path segment after /admin for non-param routes.
    const sections = new Set(
      routePaths
        .filter(p => p !== "/admin" && !p.includes(":"))
        .map(p => p.split("/")[2])
    );
    const menuSections = new Set(
      menuItems.map(item => item.path.split("/")[2]).filter(Boolean)
    );
    const uncovered = [...sections].filter(s => !menuSections.has(s));
    expect(uncovered).toEqual([]);
  });
});
