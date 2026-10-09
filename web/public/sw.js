// Service Worker de hypertrof.ia.
// Estrategia NETWORK-FIRST en todo: mientras haya red siempre servís la
// versión más reciente (evita quedar pegado a un deploy viejo). La caché
// queda solo como respaldo offline. Las notificaciones push siguen igual.
const SHELL_CACHE = "hypertrofia-shell-v7";
const DATA_CACHE = "hypertrofia-data-v7";
const RUNTIME_CACHE = "hypertrofia-runtime-v7";

const CURRENT_CACHES = [SHELL_CACHE, DATA_CACHE, RUNTIME_CACHE];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !CURRENT_CACHES.includes(k)).map((k) => caches.delete(k))
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
      const url = new URL(
        event.notification.data?.url ?? "/mensajes",
        self.location.origin
      ).href;
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const w of windows) {
        if (w.url.startsWith(self.location.origin)) {
          await w.navigate(url);
          await w.focus();
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});

// Network-first: intenta la red y cachea la respuesta; si falla, cae a caché.
async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === "basic") cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw new Error("offline");
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Solo nos ocupamos de nuestro origen y de Supabase.
  if (url.origin !== self.location.origin && !url.hostname.endsWith("supabase.co")) {
    return;
  }

  if (url.hostname.endsWith("supabase.co")) {
    event.respondWith(networkFirst(req, DATA_CACHE));
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await networkFirst(req, SHELL_CACHE);
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          const cached = (await cache.match(req)) || (await cache.match("/dashboard"));
          if (cached) return cached;
          throw new Error("offline");
        }
      })()
    );
    return;
  }

  event.respondWith(networkFirst(req, RUNTIME_CACHE));
});
