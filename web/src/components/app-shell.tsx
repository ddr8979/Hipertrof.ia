"use client";

/**
 * app-shell.tsx
 * Estructura de navegación de la app autenticada.
 * Desktop: sidebar agrupado en 3 secciones (Principal / Herramientas / Cuenta).
 * Móvil: header con logo centrado (☰ · logo · avatar) + píldora inferior de
 * 5 tabs. Todo lo secundario vive en el sheet "Más", sin duplicar destinos.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Barbell as Dumbbell, ForkKnife as Utensils, User, Users, SignOut as LogOut, Gear as Settings, ClockCounterClockwise as History, ChartLineUp as ChartLine, BookOpenText, Calculator, Barbell as BicepsFlexed, List as Menu, ChatCircleDots } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/components/providers";
import { Avatar } from "@/components/ui/primitives";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { DmNotifications } from "@/components/dm-notifications";
import { RestTimer } from "@/components/rest-timer";
import { HudNav, HUD_ITEMS, isActive } from "@/components/hud-nav";
import { ThemeToggle } from "@/components/brand-icons";
import { Sheet } from "@/components/ui/sheet";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

/** Sección "Principal": los 5 tabs de la píldora (una sola fuente de verdad). */
const PRINCIPAL: NavItem[] = HUD_ITEMS.map((i) => ({
  href: i.href,
  label: i.label,
  icon: i.icon,
}));

/** Herramientas: lo que se consulta, no se usa a diario. */
const HERRAMIENTAS: NavItem[] = [
  { href: "/ejercicios", label: "Ejercicios", icon: BicepsFlexed },
  { href: "/nutricion", label: "Nutrición", icon: Utensils },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/progreso", label: "Progreso", icon: ChartLine },
  { href: "/glosario", label: "Diccionario", icon: BookOpenText },
  { href: "/historial", label: "Historial", icon: History },
];

/** Cuenta: identidad y configuración. */
const CUENTA: NavItem[] = [
  { href: "/perfil", label: "Perfil", icon: User },
  { href: "/entrenadores", label: "Entrenadores", icon: Users },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

const SECTIONS: { title: string; items: NavItem[] }[] = [
  { title: "Principal", items: PRINCIPAL },
  { title: "Herramientas", items: HERRAMIENTAS },
  { title: "Cuenta", items: CUENTA },
];

/** Rutas fuera de "Principal" (resaltan el ☰ del header). */
const SECONDARY = [...HERRAMIENTAS, ...CUENTA];

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

/** Marca centrada: el logo es el elemento centrado de ambas barras. */
function BrandMark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2" aria-label="Hipertrof.ia - Inicio">
      <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-ink)]">
        <Dumbbell className="size-4" weight="bold" />
      </span>
      <span className="font-display text-[15px] font-bold tracking-tight">
        hypertrof<span className="text-[var(--accent)]">.ia</span>
      </span>
    </Link>
  );
}

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

  const secondaryActive = SECONDARY.some((n) => isActive(pathname, n.href));

  // En una conversación (pantalla completa) no mostramos header ni barra inferior.
  const isChatThread = /^\/mensajes\/[^/]+$/.test(pathname);

  return (
    <div className="min-h-dvh">
      <div className="flex min-h-dvh items-start lg:pl-60">
        {/* Sidebar desktop */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl lg:flex">
          {/* Logo centrado */}
          <div className="flex h-16 items-center justify-center border-b border-[var(--border)] px-5">
            <BrandMark />
          </div>

          <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
            {SECTIONS.map((section) => (
              <div key={section.title} className="flex flex-col gap-0.5">
                <p className="px-3 pb-1 text-xs font-semibold text-[var(--muted)]">
                  {section.title}
                </p>
                {section.items.map((n) => (
                  <NavLink key={n.href} {...n} />
                ))}
              </div>
            ))}
          </nav>

          {/* Footer del sidebar: perfil + tema + logout */}
          <div className="border-t border-[var(--border)] p-3">
            <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
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
              <ThemeToggle variant="compact" />
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

        {/* Contenido + header móvil: ☰ · logo centrado · mensajes */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          {!isChatThread && (
            <header
              className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-xl lg:hidden"
              style={{ paddingTop: "env(safe-area-inset-top)" }}
            >
              <div className="relative flex h-13 items-center justify-between px-4">
                <button
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  aria-label="Más opciones"
                  aria-expanded={moreOpen}
                  className={cn(
                    "-ml-1 flex size-8 items-center justify-center rounded-lg transition-colors",
                    secondaryActive
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-2)] hover:bg-[var(--surface-2)]"
                  )}
                >
                  <Menu className="size-5" weight="bold" />
                </button>
                {/* Logo centrado en el eje del header */}
                <div className="pointer-events-none absolute inset-x-0 flex justify-center">
                  <BrandMark />
                </div>
                {/* Mensajes con badge (Perfil vive en la píldora inferior) */}
                <Link
                  href="/mensajes"
                  aria-label="Mensajes"
                  className="relative flex size-8 items-center justify-center rounded-lg transition-colors text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                >
                  <ChatCircleDots className="size-5" weight="bold" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[4.5px] items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-bold text-white animate-pop">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              </div>
            </header>
          )}
          <main
            className={cn(
              "mx-auto w-full min-w-0 flex-1 max-w-3xl px-4 pt-6 sm:px-6 sm:pt-8 lg:max-w-none lg:pb-14 lg:pt-8",
              isChatThread
                ? "pb-4"
                : "pb-[calc(4.75rem_+_env(safe-area-inset-bottom))]"
            )}
          >
            {children}
          </main>
        </div>
      </div>

      {/* HUD inferior: 5 tabs (móvil); se auto-oculta en hilos de chat y
          durante el descanso en /entrenar. */}
      <HudNav />

      {/* Sheet "Más": todo lo secundario, agrupado y sin duplicar el HUD */}
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Más">
        <div className="flex flex-col gap-5">
          {SECTIONS.filter((sec) => sec.title !== "Principal").map((section) => (
            <div key={section.title} className="flex flex-col gap-0.5">
              <p className="px-3 pb-1 text-xs font-semibold text-[var(--muted)]">
                {section.title}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {section.items.map(({ href, label, icon: Icon }) => (
                  <NavLink
                    key={href}
                    href={href}
                    label={label}
                    icon={Icon}
                    onClick={() => setMoreOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4">
            <ThemeToggle variant="list" label="Tema de la aplicación" />
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
            >
              <LogOut className="size-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      </Sheet>

      <DmNotifications />
      <RestTimer />
    </div>
  );
}
