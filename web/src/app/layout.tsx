/**
 * layout.tsx
 * Layout raíz de la app (App Router). Define fuentes, metadata/SEO, viewport
 * de PWA y envuelve todo el árbol con los providers globales.
 */

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

// Tipografía optimizada por next/font. Una sola familia para todo (display y
// cuerpo): el tracking cerrado de las headings aporta el look de grotesco
// moderno tipo Instagram Sans.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Metadata global: títulos, descripción, PWA, iconos y Open Graph.
export const metadata: Metadata = {
  title: {
    default: "Hypertrof.ia — Entrená. Evolucioná. Conectá.",
    template: "%s · Hypertrof.ia",
  },
  description:
    "Diario de cargas inteligente, rutinas, nutrición y comunidad fitness. Tu progreso, tus métricas, tu perfil.",
  applicationName: "Hypertrof.ia",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Hypertrof.ia",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_UY",
    siteName: "Hypertrof.ia",
    title: "Hypertrof.ia",
    description:
      "Diario de cargas inteligente, rutinas, nutrición y comunidad fitness.",
  },
};

// Configuración del viewport móvil/PWA (color de barra, escalas, safe areas).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/** Layout raíz: documento HTML, fuentes, preconnects y providers. */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Preconexión a orígenes externos usados por la app (imágenes, Spotify) */}
        <link rel="preconnect" href="https://static.exercisedb.dev" crossOrigin="" />
        <link rel="preconnect" href="https://i.scdn.co" crossOrigin="" />
        <link rel="preconnect" href="https://api.spotify.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}