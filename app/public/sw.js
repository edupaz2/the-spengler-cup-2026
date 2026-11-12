// Offline shell: card images and art are cache-first; everything else is network-first with a cache fallback.
const CACHE = "the-spengler-cup-v2";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  ),
);
function store(request, res) {
  const copy = res.clone();
  caches.open(CACHE).then((c) => c.put(request, copy));
  return res;
}
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const path = new URL(e.request.url).pathname;
  if (path.includes("/cards/") || path.includes("/art/")) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => (res.ok ? store(e.request, res) : res))),
    );
    return;
  }
  e.respondWith(fetch(e.request).then((res) => store(e.request, res)).catch(() => caches.match(e.request)));
});
