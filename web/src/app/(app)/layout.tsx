/**
 * (app)/layout.tsx
 * Layout de las rutas autenticadas. Exige sesión activa y perfil con
 * onboarding completo antes de renderizar el AppShell.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Entrená",
};

/** Guard de sesión/onboarding y envoltorio con AppShell. */
export default async function AppLayout({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, onboarded")
    .eq("id", user.id)
    .single();

  // Con sesión pero sin onboarding: redirige al asistente.
  if (profile && !profile.onboarded) redirect("/onboarding");

  return <AppShell>{children}</AppShell>;
}