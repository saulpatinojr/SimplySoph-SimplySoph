// v2: purges previously cached /api/ responses from the v1 cache
const CACHE_NAME = "simplysoph-v2";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/icons/logo_short.png",
  "/icons/logo_badge.png",
];

// Install — cache static assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache (SPA-friendly)
self.addEventListener("fetch", event => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Never cache API responses (dynamic data, and some routes are authenticated)
  if (new URL(event.request.url).pathname.startsWith("/api/")) return;

  // For navigation requests, always serve index.html (SPA)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match("/index.html").then(res => {
          if (res) return res;
          return new Response("Network error and not cached", {
            status: 503,
            statusText: "Service Unavailable",
          });
        })
      )
    );
    return;
  }

  // For assets, use network-first strategy
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful GET responses
        if (response.ok && event.request.method === "GET") {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(res => {
          if (res) return res;
          return new Response("Network error and not cached", {
            status: 503,
            statusText: "Service Unavailable",
          });
        })
      )
  );
});
