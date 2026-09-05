const SHELL_CACHE = "hypertrofia-shell-v5";
const DATA_CACHE = "hypertrofia-data-v5";
const RUNTIME_CACHE = "hypertrofia-runtime-v5";

const SHELL_URLS = ["/", "/dashboard", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.allSettled(SHELL_URLS.map((u) => cache.add(u)));
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![SHELL_CACHE, DATA_CACHE, RUNTIME_CACHE].includes(k))
          .map((k) => caches.delete(k))
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

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (url.origin !== self.location.origin && !url.hostname.endsWith("supabase.co")) {
    return;
  }

  if (url.hostname.endsWith("supabase.co")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(DATA_CACHE);
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => null);
        return cached || (await network) || new Response("", { status: 504 });
      })()
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        try {
          const res = await fetch(req);
          if (res.ok && res.redirected === false) cache.put(req, res.clone());
          return res;
        } catch {
          const cached = (await cache.match(req)) || (await cache.match("/dashboard"));
          if (cached) return cached;
          throw new Error("offline");
        }
      })()
    );
    return;
  }

  const isStatic =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons") ||
    /\.(?:woff2?|ttf|otf|png|jpg|jpeg|webp|svg|gif|webm|mp4|ico)$/.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(req);
        if (cached) {
          fetch(req)
            .then((res) => {
              if (res.ok) cache.put(req, res.clone());
            })
            .catch(() => {});
          return cached;
        }
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch (err) {
          throw err;
        }
      })()
    );
  }
});