import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "hypertrof.ia",
    short_name: "hypertrof.ia",
    description:
      "Diario de cargas, rutinas, nutrición y comunidad para atletas y entrenadores.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    display_override: ["standalone"],
    orientation: "portrait",
    lang: "es",
    dir: "ltr",
    categories: ["fitness", "health", "sports", "lifestyle"],
    background_color: "#0b0d0b",
    theme_color: "#0b0d0b",
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