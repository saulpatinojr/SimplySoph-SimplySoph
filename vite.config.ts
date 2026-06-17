import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "path";
import { defineConfig } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(rootDir, "client"),
  publicDir: resolve(rootDir, "client", "public"),
  envDir: rootDir,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/logo_short.png", "icons/logo_badge.png"],
      manifest: {
        name: "SimplySoph",
        short_name: "SimplySoph",
        description: "Fashion, lifestyle, and creative content by SimplySoph",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#c5a55a",
        orientation: "portrait-primary",
        categories: ["lifestyle", "fashion", "blog"],
        icons: [
          {
            src: "/icons/logo_short.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icons/logo_badge.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "simplysoph-images",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "simplysoph-app",
            },
          },
        ],
      },
    }),
  ],
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
