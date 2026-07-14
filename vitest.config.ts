import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      // Pin the functions runtime deps to a single copy so vi.mock() in
      // tests/ intercepts the same module that functions/src imports.
      "firebase-admin": path.resolve(
        import.meta.dirname,
        "functions",
        "node_modules",
        "firebase-admin"
      ),
      "firebase-functions": path.resolve(
        import.meta.dirname,
        "functions",
        "node_modules",
        "firebase-functions"
      ),
    },
  },
  test: {
    environment: "jsdom",
    include: ["client/src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
  },
});
