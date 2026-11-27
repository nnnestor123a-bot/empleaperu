// Service Worker PWA de EmpleaPerú
// POLÍTICA ESTRICTA: Solo cachea recursos públicos estáticos y la página /offline.
// JAMÁS cachea /api/*, CVs, sesiones, /postulante/*, /empresa/* ni /admin/*.

const CACHE_NAME = "empleaperu-public-v1";
const PUBLIC_ASSETS = ["/manifest.json", "/icon.svg", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Never intercept APIs or private routes
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/postulante") ||
    url.pathname.startsWith("/empresa") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/mensajes") ||
    url.pathname.startsWith("/notificaciones")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === "navigate") {
        return caches.match("/offline");
      }
      return new Response("Sin conexión", { status: 503 });
    })
  );
});
