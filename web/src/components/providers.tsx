"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { Toaster } from "@/components/ui/toast";
import { SWRegister } from "@/components/sw-register";
import { createClient } from "@/lib/supabase/client";

export type ProfileRow = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  accent_color: string | null;
  streak_count?: number | null;
  max_streak?: number | null;
  weight_kg?: number | null;
  tdee_kcal?: number | null;
  diet_goal?: string | null;
} & Record<string, unknown>;

interface ProfileState {
  profile: ProfileRow | null;
  setProfile: (p: ProfileRow | null) => void;
}

export const useProfile = create<ProfileState>((set) => ({
  profile: null,
  setProfile: (p) => set({ profile: p }),
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function AccentApplier() {
  const profile = useProfile((s) => s.profile);

  useEffect(() => {
    if (!profile?.accent_color) {
      document.documentElement.removeAttribute("data-accent");
      return;
    }
    document.documentElement.style.setProperty(
      "--user-accent",
      profile.accent_color
    );
    document.documentElement.setAttribute("data-accent", "true");
  }, [profile?.accent_color]);

  return null;
}

function ProfileSync() {
  const setProfile = useProfile((s) => s.setProfile);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load(userId: string | null) {
      if (!userId) {
        setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (active) setProfile(data ?? null);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        void load(session?.user?.id ?? null);
      }
    });

    supabase.auth.getSession().then((s) => load(s.data.session?.user?.id ?? null));

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [setProfile]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <AccentApplier />
        <ProfileSync />
        <SWRegister />
        {children}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}