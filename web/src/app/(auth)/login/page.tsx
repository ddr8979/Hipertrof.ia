/**
 * (auth)/login/page.tsx
 * Página de inicio de sesión dentro del grupo de rutas `(auth)`.
 */

import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";

// Proveedores OAuth habilitados, definidos por variable de entorno.
const PROVIDERS = (process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "google")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

/** Página de login. */
export default function LoginPage() {
  return (
    <AuthShell>
      <AuthCard mode="login" providers={PROVIDERS} />
    </AuthShell>
  );
}

/** Envoltorio visual con fondo decorativo para las pantallas de auth. */
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}
      />
      <div className="relative w-full max-w-md">{children}</div>
    </main>
  );
}