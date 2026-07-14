import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = process.cwd();
const SRC_ROOT = path.join(REPO_ROOT, "client", "src");
const APP_ROUTE_FILE = path.join(SRC_ROOT, "App.tsx");

const STATIC_PATH_ALLOWLIST = new Set([
  "/favicon.ico",
  "/manifest.json",
  "/sw.js",
]);

const STATIC_PREFIX_ALLOWLIST = [
  "/icons/",
  "/assets/",
];

function walkFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx") || fullPath.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractAppRoutePatterns(appSource: string): string[] {
  const routeMatches = appSource.matchAll(/<Route\s+path="([^"]+)"/g);
  const routes = new Set<string>();

  for (const match of routeMatches) {
    routes.add(match[1]);
  }

  return Array.from(routes);
}

function extractInternalLinks(fileText: string): string[] {
  const links = new Set<string>();

  const pattern = /(?:href\s*=|navigate\s*\(|setLocation\s*\()\s*(["'`])(\/[^"'`)]*)\1/g;
  const matches = fileText.matchAll(pattern);

  for (const match of matches) {
    const rawPath = match[2].trim();
    if (!rawPath || !rawPath.startsWith("/")) {
      continue;
    }

    const normalized = normalizePath(rawPath);
    if (normalized) {
      links.add(normalized);
    }
  }

  return Array.from(links);
}

function normalizePath(input: string): string | null {
  const withoutQuery = input.split("?")[0].split("#")[0];
  if (!withoutQuery.startsWith("/")) {
    return null;
  }

  if (STATIC_PATH_ALLOWLIST.has(withoutQuery)) {
    return null;
  }

  for (const prefix of STATIC_PREFIX_ALLOWLIST) {
    if (withoutQuery.startsWith(prefix)) {
      return null;
    }
  }

  // Convert template placeholders into path segments for pattern comparison.
  const deTemplated = withoutQuery.replace(/\$\{[^}]+\}/g, "segment");
  return deTemplated;
}

function routePatternToRegExp(routePattern: string): RegExp {
  const escaped = routePattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/:([A-Za-z0-9_]+)/g, "[^/]+");

  return new RegExp(`^${escaped}$`);
}

function isPathCoveredByRoutes(pathname: string, routes: string[]): boolean {
  return routes.some(route => routePatternToRegExp(route).test(pathname));
}

describe("internal links route coverage", () => {
  it("ensures every internal app link resolves to a declared route", () => {
    const appSource = fs.readFileSync(APP_ROUTE_FILE, "utf8");
    const routePatterns = extractAppRoutePatterns(appSource);

    const sourceFiles = walkFiles(SRC_ROOT);
    sourceFiles.push(path.join(REPO_ROOT, "client", "index.html"));

    const unmatchedLinks: Array<{ file: string; link: string }> = [];

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, "utf8");
      const links = extractInternalLinks(content);

      for (const link of links) {
        if (!isPathCoveredByRoutes(link, routePatterns)) {
          unmatchedLinks.push({
            file: path.relative(REPO_ROOT, file),
            link,
          });
        }
      }
    }

    expect(unmatchedLinks).toEqual([]);
  });
});
