const CACHE_NAME = "urge-lab-complete-v12-dev-cache";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=20260426-dev-cache-1",
  "./app.js?v=20260426-dev-cache-1",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png"
];
const DEV_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const IS_DEV_HOST = DEV_HOSTS.has(self.location.hostname);

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("install", event => {
  if (IS_DEV_HOST) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  if (IS_DEV_HOST) {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("urge-lab")).map(key => caches.delete(key)))));
    self.clients.claim();
    return;
  }
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (IS_DEV_HOST) return;
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const networkFirst = event.request.mode === "navigate" ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/app.js") ||
    url.pathname.endsWith("/styles.css");

  if (networkFirst) {
    event.respondWith(
      fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html")))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
