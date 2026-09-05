import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hypertrof.ia — Entrená. Evolucioná. Conectá.",
    template: "%s · Hypertrof.ia",
  },
  description:
    "Diario de cargas inteligente, rutinas, nutrición y comunidad fitness. Tu progreso, tus métricas, tu perfil.",
  applicationName: "Hypertrof.ia",
  manifest: "/manifest.webmanifest",
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0d0b" },
    { media: "(prefers-color-scheme: light)", color: "#f5f6f3" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://static.exercisedb.dev" crossOrigin="" />
        <link rel="preconnect" href="https://i.scdn.co" crossOrigin="" />
        <link rel="preconnect" href="https://api.spotify.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className={`${inter.variable} ${space.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}