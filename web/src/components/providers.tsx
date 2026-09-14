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

    async function load(userId: string | null, user: any = null) {
      if (!userId) {
        setProfile(null);
        return;
      }

      // Build profile from JWT metadata as fallback
      const fallback: ProfileRow = {
        id: userId,
        display_name:
          user?.user_metadata?.full_name ||
          user?.user_metadata?.name ||
          user?.user_metadata?.preferred_username ||
          null,
        username:
          user?.user_metadata?.preferred_username ||
          user?.email?.split("@")[0] ||
          null,
        avatar_url:
          user?.user_metadata?.avatar_url ||
          user?.user_metadata?.picture ||
          null,
        accent_color: null,
      };

      // Retry with backoff (trigger may be slow on first login)
      for (let attempt = 0; attempt < 3 && active; attempt++) {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, display_name, username, avatar_url, accent_color, streak_count, max_streak, weight_kg, tdee_kcal, diet_goal"
          )
          .eq("id", userId)
          .maybeSingle();

        if (data) {
          setProfile(data);
          return;
        }

        if (error && error.code !== "PGRST116") {
          console.warn(`Profile load attempt ${attempt + 1}:`, error.message);
        }

        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
        }
      }

      // Fallback to JWT-derived profile
      if (active && user) setProfile(fallback);
    }

    const { data: sub } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          setProfile(null);
          return;
        }
        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          const sessionUser = session?.user ?? null;
          void load(sessionUser?.id ?? null, sessionUser);
        }
      }
    );

    supabase.auth.getSession().then(async (s) => {
      const sessionUser = s.data.session?.user ?? null;
      const { data: fresh } = await supabase.auth.getUser();
      void load(sessionUser?.id ?? null, fresh?.user ?? sessionUser);
    });

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