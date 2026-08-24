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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/components/providers";
import { Avatar } from "@/components/ui/primitives";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { DmNotifications } from "@/components/dm-notifications";
import { RestTimer } from "@/components/rest-timer";
import { useSpotifyNow } from "@/components/spotify-now";
import { Music4 } from "lucide-react";

function NowPlayingMini() {
  const { data } = useSpotifyNow();
  if (!data?.connected || data.hidden || !data.playing?.is_playing) return null;
  const p = data.playing;
  return (
    <Link
      href="/dashboard"
      title="Ahora suena en Spotify"
      className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] p-1.5 transition-colors hover:bg-[var(--surface-3)]"
    >
      {p.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.cover}
          referrerPolicy="no-referrer"
          alt=""
          className="size-8 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1DB954]/15 text-[#1DB954]">
          <Music4 className="size-3.5" />
        </span>
      )}
      <span className="flex min-w-0 flex-col">
        <span className="flex items-center gap-1 text-[10px] font-bold leading-tight">
          <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-[#1DB954]" />
          <span className="truncate">{p.name}</span>
        </span>
        <span className="truncate text-[9px] leading-tight text-[var(--muted)]">{p.artists}</span>
      </span>
    </Link>
  );
}

const NAV = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/rutinas", label: "Rutinas", icon: Dumbbell },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/nutricion", label: "Alimentación", icon: Utensils },
  { href: "/mensajes", label: "Mensajes", icon: MessageCircle },
  { href: "/explorar", label: "Social", icon: Compass },
  { href: "/ejercicios", label: "Ejercicios", icon: BicepsFlexed },
  { href: "/glosario", label: "Diccionario", icon: BookOpenText },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/perfil", label: "Perfil", icon: User },
  { href: "/ajustes", label: "Configuración", icon: Settings },
  { href: "/historial", label: "Historial", icon: History },
  { href: "/progreso", label: "Progreso", icon: ChartLine },
  { href: "/entrenadores", label: "Entrenadores", icon: Users },
];

function RailIcon({
  href,
  label,
  icon: Icon,
  badge,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={label}
      title={label}
      data-active={active ? "true" : undefined}
      className={cn(
        "relative z-10 flex size-9 items-center justify-center rounded-xl transition-all duration-200 active:scale-90",
        active
          ? "text-[var(--accent-ink)]"
          : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
      )}
    >
      <Icon className="size-4.5" />
      {badge ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const profile = useProfile((s) => s.profile);
  const railRef = useRef<HTMLElement>(null);
  const prevPathname = useRef(pathname);
  const [indTop, setIndTop] = useState<number | null>(null);

  // Indicador deslizante tipo Instagram: sigue al item activo del hub
  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    const nav = railRef.current;
    if (!nav) return;
    const el = nav.querySelector<HTMLElement>('a[data-active="true"]');
    if (el) setIndTop(el.offsetTop);
    else setIndTop(null);
  }, [pathname]);

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

  const NavLink = ({
    href,
    label,
    icon: Icon,
    className,
  }: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className?: string;
  }) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
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
  };

  return (
    <div className="min-h-dvh">
      <div className="flex min-h-dvh items-start lg:pl-60">
      {/* Rail lateral móvil: hub compacto, ocupa su propio espacio */}
      <nav ref={railRef} className="sticky top-24 z-40 ml-2 mt-2 flex max-h-[calc(100dvh-7rem)] flex-col items-center gap-1.5 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]/85 p-1.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:hidden">
        {/* Marca deslizante del item activo */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1.5 z-0 h-9 w-[calc(100%-0.75rem)] rounded-xl bg-[var(--accent)] shadow-[0_4px_14px_-4px_var(--accent-soft)] transition-[top,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ top: indTop ?? -48, opacity: indTop === null ? 0 : 1 }}
        />
        {NAV.map((n) => (
          <RailIcon key={n.href} {...n} badge={n.href === "/mensajes" ? (unread ?? 0) : undefined} />
        ))}
        <div className="relative z-10">
          <NowPlayingMini />
        </div>
      </nav>

      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-[var(--border)] px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-ink)]">
              <Dumbbell className="size-4.5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              hypertrof<span className="text-[var(--accent)]">.ia</span>
            </span>
          </Link>
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
                  {profile?.display_name ?? profile?.username}
                </p>
                <p className="truncate text-xs text-[var(--muted)]">
                  @{profile?.username}
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
      <main className="mx-auto w-full min-w-0 flex-1 max-w-3xl px-4 pb-12 pt-12 sm:px-6 sm:pt-16 lg:px-6 lg:pb-12 lg:pt-10">
          {children}
        </main>
      </div>

      <DmNotifications />
      <RestTimer />
    </div>
  );
}