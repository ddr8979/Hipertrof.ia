"use client";

/**
 * app-shell.tsx
 * Estructura de navegación principal de la app autenticada.
 * Renderiza el sidebar de escritorio (lg+), la tab bar inferior móvil y el
 * sheet "Más" con las secciones secundarias, además de elementos globales
 * como notificaciones de DM y el timer de descanso.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Dumbbell,
  Utensils,
  User,
  Users,
  Store,
  LogOut,
  Settings,
  History,
  Compass,
  ChartLine,
  BookOpenText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/components/providers";
import { Avatar } from "@/components/ui/primitives";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { DmNotifications } from "@/components/dm-notifications";
import { RestTimer } from "@/components/rest-timer";
import { HudNav, HUD_ITEMS, isActive } from "@/components/hud-nav";
import { useSpotifyNow } from "@/components/spotify-now";
import { ThemeToggle } from "@/components/brand-icons";
import { Sheet } from "@/components/ui/sheet";

/**
 * Tarjeta compacta con la canción que suena en Spotify del usuario.
 * No renderiza nada si no está conectado, está oculto o no hay reproducción.
 */
function NowPlayingMini() {
  const { data } = useSpotifyNow();
  if (!data?.connected || data.hidden || !data.playing?.is_playing) return null;
  const p = data.playing;
  return (
    <Link
      href="/dashboard"
      title="Ahora suena en Spotify"
      className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] p-2 transition-colors hover:bg-[var(--surface-3)]"
    >
      {p.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.cover}
          referrerPolicy="no-referrer"
          alt=""
          className="size-9 shrink-0 rounded-lg object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1DB954]/15">
          <svg
            role="img"
            viewBox="0 0 24 24"
            width={16}
            height={16}
            aria-label="Spotify"
            fill="#1ED760"
            dangerouslySetInnerHTML={{
              __html:
                '<path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.55 0 12 0zm5.5 17.33c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.45-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14C9.5 9.9 15 10.56 18.72 12.84c.36.18.54.78.24 1.2zm.13-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z"></path>',
            }}
          />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1 text-[11px] font-bold leading-tight">
          <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-[#1DB954]" />
          <span className="truncate">{p.name}</span>
        </span>
        <span className="truncate text-[10px] leading-tight text-[var(--muted)]">{p.artists}</span>
      </span>
    </Link>
  );
}

// Destinos del HUD (píldora inferior móvil): viven en hud-nav.tsx.
const PRIMARY = HUD_ITEMS;

// Destinos secundarios: sidebar desktop y sheet "Más" (incluye Perfil,
// que ya no entra en la píldora por espacio).
const SECONDARY = [
  { href: "/perfil", label: "Perfil", icon: User },
  { href: "/nutricion", label: "Alimentación", icon: Utensils },
  { href: "/explorar", label: "Social", icon: Compass },
  { href: "/glosario", label: "Diccionario", icon: BookOpenText },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/entrenadores", label: "Entrenadores", icon: Users },
  { href: "/historial", label: "Historial", icon: History },
  { href: "/progreso", label: "Progreso", icon: ChartLine },
  { href: "/ajustes", label: "Configuración", icon: Settings },
];

// Lista completa usada por el sidebar.
const NAV = [...PRIMARY, ...SECONDARY];

/** Enlace de navegación usado en el sidebar y el sheet "Más". */
const NavLink = memo(function NavLink({
  href,
  label,
  icon: Icon,
  className,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-[var(--surface-2)] text-[var(--text)]"
          : "text-[var(--text-2)] hover:text-[var(--text)]",
        className
      )}
    >
      <Icon className={cn("size-4.5", active && "text-[var(--accent)]")} />
      {label}
    </Link>
  );
});

/**
 * Shell de la aplicación autenticada.
 * Provee la navegación (sidebar/tab bar/sheet) y el contenedor del contenido.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const profile = useProfile((s) => s.profile);
  const [moreOpen, setMoreOpen] = useState(false);

  // Cantidad total de mensajes directos sin leer; se refresca cada 30 s.
  const { data: unread } = useQuery({
    queryKey: ["unread_dm"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_conversations");
      if (error) return 0;
      return (data ?? []).reduce((s: number, c: { unread?: number }) => s + (c.unread ?? 0), 0);
    },
    refetchInterval: 30000,
  });

  // Cierra la sesión en Supabase y vuelve al inicio.
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // Cierra el sheet "Más" al navegar
  const secondaryActive = SECONDARY.some((n) => isActive(pathname, n.href));

  // En una conversación (pantalla completa) no mostramos la barra inferior.
  const isChatThread = /^\/mensajes\/[^/]+$/.test(pathname);

  return (
    <div className="min-h-dvh">
      <div className="flex min-h-dvh items-start lg:pl-60">
        {/* Sidebar desktop */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl lg:flex">
          <div className="flex h-16 items-center justify-between gap-2.5 border-b border-[var(--border)] px-5">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-ink)]">
                <Dumbbell className="size-4.5" />
              </span>
              <span className="font-display text-lg font-bold tracking-tight">
                hypertrof<span className="text-[var(--accent)]">.ia</span>
              </span>
            </Link>
            <ThemeToggle variant="compact" />
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {NAV.map((n) => (
              <NavLink key={n.href} {...n} />
            ))}
          </nav>

          {/* Footer del sidebar: ahora suena + perfil + logout */}
          <div className="border-t border-[var(--border)] p-3">
            <NowPlayingMini />
            <div className="mt-2 flex items-center gap-2.5 rounded-xl px-2 py-2">
              <Link href="/perfil" className="flex min-w-0 flex-1 items-center gap-2.5">
                <Avatar
                  src={profile?.avatar_url}
                  size={34}
                  alt={profile?.display_name ?? profile?.username ?? "Perfil"}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {profile?.display_name || profile?.username || "Atleta"}
                  </p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    @{profile?.username || profile?.id?.slice(0, 8) || ""}
                  </p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--danger)]"
              >
                <LogOut className="size-4.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Contenido */}
        <main
          className={cn(
            "mx-auto w-full min-w-0 flex-1 max-w-3xl px-4 pt-12 sm:px-6 sm:pt-16 lg:max-w-none lg:pb-14 lg:pt-10",
            isChatThread
              ? "pb-4"
              : "pb-[calc(5rem_+_env(safe-area-inset-bottom))]"
          )}
        >
          {children}
        </main>
      </div>

      {/* HUD inferior: píldora flotante glass (móvil); se auto-oculta en
          hilos de chat y durante el descanso en /entrenar. */}
      <HudNav
        moreActive={secondaryActive}
        onMore={() => setMoreOpen(true)}
        unread={unread ?? 0}
      />

      {/* Sheet "Más" */}
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Más">
        <div className="flex flex-col gap-4">
          <ThemeToggle variant="list" label="Tema de la aplicación" />
          <NowPlayingMini />
          <div className="grid grid-cols-2 gap-1.5">
            {SECONDARY.map(({ href, label, icon: Icon }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                icon={Icon}
                onClick={() => setMoreOpen(false)}
              />
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
          >
            <LogOut className="size-4" /> Cerrar sesión
          </button>
        </div>
      </Sheet>

      <DmNotifications />
      <RestTimer />
    </div>
  );
}