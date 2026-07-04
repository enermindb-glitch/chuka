/* ==========================================================================
   Chuka Eng Hub — Service Worker
   Bump CACHE_NAME whenever you change any cached file so old installs pick
   up the update.
   ========================================================================== */

const CACHE_NAME = "chuka-eng-hub-v2";

const PRECACHE_URLS = [
  "index.html",
  "timetable.html",
  "events.html",
  "notes.html",
  "groups.html",
  "join-group.html",
  "personnel.html",
  "admin.html",
  "success.html",
  "style.css",
  "app.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "icons/favicon-16.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle same-origin GET requests. Everything else (Apps Script API
  // calls, POSTs, cross-origin requests) goes straight to the network so
  // data stays live and nothing stale gets served.
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached); // offline: fall back to cache

      // Cache-first for instant loads, but refresh the cache in the background.
      return cached || network;
    })
  );
});
