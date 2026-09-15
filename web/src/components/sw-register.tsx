// Registra el service worker y recarga la página cuando cambia el controlador
// (nueva versión disponible). Solo actúa en producción.
"use client";

import { useEffect } from "react";

/** Componente sin UI que registra /sw.js en el navegador. */
export function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      // Evita recargas en bucle cuando cambia el controlador del SW.
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        location.reload();
      });
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
