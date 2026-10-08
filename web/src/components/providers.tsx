"use client";

/**
 * providers.tsx
 * Providers globales de la aplicación: TanStack Query, tema (next-themes) y
 * sincronización de perfil (Zustand + Supabase). También registra el service
 * worker de la PWA y aplica el color de acento del usuario.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { Toaster } from "@/components/ui/toast";
import { SWRegister } from "@/components/sw-register";
import { createClient } from "@/lib/supabase/client";
import { pastelAccent } from "@/lib/utils";

// Forma de la fila de `profiles` (con campos extra permitidos).
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
  role?: "athlete" | "trainer" | "admin" | null;
  plan?: "free" | "plus" | "deluxe" | null;
  is_admin?: boolean | null;
  is_trainer_approved?: boolean | null;
  onboarded?: boolean | null;
} & Record<string, unknown>;

interface ProfileState {
  profile: ProfileRow | null;
  setProfile: (p: ProfileRow | null) => void;
}

// Store global del perfil (compartido por componentes de toda la app).
export const useProfile = create<ProfileState>((set) => ({
  profile: null,
  setProfile: (p) => set({ profile: p }),
}));

/** Crea un QueryClient con los valores por defecto de la app. */
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

/** Devuelve un QueryClient estable: uno nuevo en servidor y singleton en browser. */
function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

// Mantiene el chrome del navegador / status bar de iOS en sincronía con el
// tema elegido por el usuario (no solo con el del sistema).
function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const root = document.documentElement;
    const bg =
      getComputedStyle(root).getPropertyValue("--bg").trim() ||
      (resolvedTheme === "dark" ? "#171a17" : "#f2efe8");

    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]:not([media])'
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", bg);
    root.style.colorScheme = resolvedTheme === "dark" ? "dark" : "light";
  }, [resolvedTheme]);

  return null;
}

/** Aplica el color de acento del perfil como variable CSS global. */
function AccentApplier() {
  const profile = useProfile((s) => s.profile);

  useEffect(() => {
    if (!profile?.accent_color) {
      document.documentElement.removeAttribute("data-accent");
      return;
    }
    document.documentElement.style.setProperty(
      "--user-accent",
      pastelAccent(profile.accent_color)
    );
    document.documentElement.setAttribute("data-accent", "true");
  }, [profile?.accent_color]);

  return null;
}

/**
 * Mantiene el store de perfil en sincronía con la sesión de Supabase.
 * Escucha cambios de auth y carga la fila de `profiles` con reintentos.
 */
function ProfileSync() {
  const setProfile = useProfile((s) => s.setProfile);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    // Carga el perfil desde Supabase; si falla, usa metadata del JWT.
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
          .select("*")
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

    // Reacciona a login, refresco de token, actualización o cierre de sesión.
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

    // Carga inicial: usa la sesión cacheada y luego el usuario fresco.
    supabase.auth.getSession().then(async (s) => {
      const sessionUser = s.data.session?.user ?? null;
      const { data: fresh } = await supabase.auth.getUser();
      void load(sessionUser?.id ?? null, fresh?.user ?? sessionUser);
    });

    // Limpieza: evita actualizaciones si el componente se desmonta.
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [setProfile]);

  return null;
}

/** Envuelve la app con todos los providers globales. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        enableColorScheme
        disableTransitionOnChange
      >
        <ThemeColorSync />
        <AccentApplier />
        <ProfileSync />
        <SWRegister />
        {children}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}