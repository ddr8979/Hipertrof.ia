const SHELL_CACHE = "hypertrofia-shell-v2";
const DATA_CACHE = "hypertrofia-data-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== SHELL_CACHE && k !== DATA_CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "hypertrof.ia", {
      body: data.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url ?? "/mensajes" },
      tag: data.tag ?? "dm",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const url = new URL(event.notification.data?.url ?? "/mensajes", self.location.origin).href;
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const w of windows) {
        if (w.url.includes(self.location.origin)) {
          await w.navigate(url);
          await w.focus();
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;

  // Imagenes y medios externos (CDN de Spotify, ejercicios, etc.): el
  // navegador los maneja directo, sin pasar por el service worker.
  if (url.origin !== location.origin && !url.hostname.endsWith("supabase.co")) return;

  // Datos de Supabase: network-first con respaldo en cache
  if (url.hostname.endsWith("supabase.co")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(DATA_CACHE);
        try {
          const res = await fetch(event.request);
          if (res.ok) cache.put(event.request, res.clone());
          return res;
        } catch (err) {
          const cached = await cache.match(event.request);
          if (cached) return cached;
          throw err;
        }
      })()
    );
    return;
  }

  // Navegación: network-first, fallback a cache de la shell
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        try {
          const res = await fetch(event.request);
          if (res.ok) cache.put("/dashboard", res.clone());
          return res;
        } catch (err) {
          const cached = await cache.match("/dashboard");
          if (cached) return cached;
          throw err;
        }
      })()
    );
    return;
  }

  // Assets estáticos: cache-first
  event.respondWith(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const res = await fetch(event.request);
      if (res.ok && (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons"))) {
        cache.put(event.request, res.clone());
      }
      return res;
    })()
  );
});
