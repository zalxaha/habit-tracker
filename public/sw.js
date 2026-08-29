// public/sw.js
// Minimal, honest service worker for Starlog.
//
// Data (habits/notes) lives on GitHub via /api/*, so those requests always
// go to the network — caching them would risk showing stale streaks or
// notes. Only the app shell (HTML/JS/CSS/icons) is cached so the app can
// still open (in a read-only, possibly-stale way) without a connection.

const CACHE_NAME = "starlog-shell-v1";
const SHELL_URLS = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache API calls — data must always be fresh from GitHub.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Network-first for navigations, so users get the latest deploy when
  // online, with a cached fallback when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((res) => res || caches.match("/")))
    );
    return;
  }

  // Stale-while-revalidate for static assets (JS/CSS/fonts/icons).
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
