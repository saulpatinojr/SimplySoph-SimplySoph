import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "path";
import { defineConfig } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(rootDir, "client"),
  publicDir: resolve(rootDir, "client", "public"),
  envDir: rootDir,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(rootDir, "client", "src"),
    },
  },
  build: {
    outDir: resolve(rootDir, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      // @emailjs/browser is an optional runtime dep guarded by env vars — don't bundle it
      external: ['@emailjs/browser'],
      onwarn(warning, warn) {
        // Suppress font self-reference warnings from CAuse custom font declarations
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.message?.includes('CAuse')) return;
        warn(warning);
      },
      output: {
        manualChunks: {
          // Firebase dependencies
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // React Query
          'react-query': ['@tanstack/react-query'],
          // Tiptap editor (for lazy loaded component)
          tiptap: ['@tiptap/react', '@tiptap/starter-kit'],
          // UI libraries
          'ui-libs': ['lucide-react', 'sonner', 'framer-motion'],
          // Routing
          router: ['wouter'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
