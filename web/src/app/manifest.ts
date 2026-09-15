/**
 * manifest.ts — Manifiesto PWA de hypertrof.ia.
 *
 * Genera `/manifest.webmanifest` con metadatos de instalación: nombre,
 * colores, orientación e íconos (incluidos los maskable para Android).
 */
import type { MetadataRoute } from "next";

/** Construye el manifiesto consumido por el navegador para instalar la PWA. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    // Identidad y arranque de la app instalada.
    id: "/",
    name: "hypertrof.ia",
    short_name: "hypertrof.ia",
    description:
      "Diario de cargas, rutinas, nutrición y comunidad para atletas y entrenadores.",
    start_url: "/dashboard",
    scope: "/",
    // display standalone: se abre sin la barra del navegador.
    display: "standalone",
    display_override: ["standalone"],
    orientation: "portrait",
    lang: "es",
    dir: "ltr",
    categories: ["fitness", "health", "sports", "lifestyle"],
    // Colores base de fondo y barra de tema (tema oscuro).
    background_color: "#0b0d0b",
    theme_color: "#0b0d0b",
    // Íconos normales + maskable (safe area para recortes del launcher).
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}