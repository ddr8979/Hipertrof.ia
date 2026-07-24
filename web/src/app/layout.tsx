import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { BottomNav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "HipertrofIA — Tu app de fitness",
  description: "Entrenamiento, nutrición y análisis para atletas y personal trainers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,300;1,400;1,700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#060810" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="HipertrofIA" />
      </head>
      <body>
        <AuthProvider>
          <div id="app-shell">
            {children}
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
