"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
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
  MessageCircle,
  BookOpenText,
  Calculator,
  BicepsFlexed,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/components/providers";
import { Avatar } from "@/components/ui/primitives";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { DmNotifications } from "@/components/dm-notifications";
import { RestTimer } from "@/components/rest-timer";
import { useSpotifyNow } from "@/components/spotify-now";
import { ThemeToggle } from "@/components/brand-icons";
import { SpotifyIcon } from "@/components/brand-icons";
import { Sheet } from "@/components/ui/sheet";

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
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1DB954]/15">
          <SpotifyIcon className="size-4" />
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

const PRIMARY = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/rutinas", label: "Rutinas", icon: Dumbbell },
  { href: "/mensajes", label: "Mensajes", icon: MessageCircle },
  { href: "/perfil", label: "Perfil", icon: User },
];

const SECONDARY = [
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/nutricion", label: "Alimentación", icon: Utensils },
  { href: "/explorar", label: "Social", icon: Compass },
  { href: "/ejercicios", label: "Ejercicios", icon: BicepsFlexed },
  { href: "/glosario", label: "Diccionario", icon: BookOpenText },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/entrenadores", label: "Entrenadores", icon: Users },
  { href: "/historial", label: "Historial", icon: History },
  { href: "/progreso", label: "Progreso", icon: ChartLine },
  { href: "/ajustes", label: "Configuración", icon: Settings },
];

const NAV = [...PRIMARY, ...SECONDARY];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

const TabLink = memo(function TabLink({
  href,
  label,
  icon: Icon,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors active:scale-95",
        active ? "text-[var(--accent)]" : "text-[var(--muted)]"
      )}
    >
      <Icon className="size-6" />
      <span>{label}</span>
      {badge ? (
        <span className="absolute left-[calc(50%+6px)] top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
});

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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const profile = useProfile((s) => s.profile);
  const [moreOpen, setMoreOpen] = useState(false);

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

      {/* Bottom tab bar (móvil, estilo iOS) */}
      {!isChatThread && (
        <nav
          aria-label="Navegación principal"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto flex max-w-lg items-stretch">
            {PRIMARY.map((t) => (
              <TabLink
                key={t.href}
                {...t}
                badge={t.href === "/mensajes" ? (unread ?? 0) : undefined}
              />
            ))}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-label="Más opciones"
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors active:scale-95",
                secondaryActive ? "text-[var(--accent)]" : "text-[var(--muted)]"
              )}
            >
              <Menu className="size-6" />
              <span>Más</span>
            </button>
          </div>
        </nav>
      )}

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