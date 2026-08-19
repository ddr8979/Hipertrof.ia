import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileProvider } from "@/components/profile-provider";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Entrená",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, onboarded")
    .eq("id", user.id)
    .single();

  if (profile && !profile.onboarded) redirect("/onboarding");

  return (
    <>
      <ProfileProvider />
      <AppShell>{children}</AppShell>
    </>
  );
}