import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "hypertrof.ia",
    short_name: "hypertrof.ia",
    description:
      "Diario de cargas, rutinas, nutrición y comunidad para atletas y entrenadores.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0b0c",
    theme_color: "#0a0b0c",
    orientation: "portrait",
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