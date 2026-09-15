/**
 * (session)/layout.tsx
 * Layout a pantalla completa para las rutas de grupo `(session)` (p. ej.
 * /entrenar). Exige sesión activa y no usa el AppShell.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Entrenar",
};

/** Guard de sesión para las pantallas de entrenamiento a pantalla completa. */
export default async function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sin sesión: redirige al login.
  if (!user) redirect("/login");

  return <>{children}</>;
}