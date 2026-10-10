"use client";

/**
 * hud-nav.tsx
 * Barra inferior de navegación móvil estilo Instagram: pegada al borde, a todo
 * el ancho, sin etiquetas, con icono relleno (weight="fill") en el tab activo
 * y el avatar del usuario en la pestaña de perfil. Se auto-oculta en hilos de
 * chat y durante el descanso en /entrenar (el RestTimer tiene prioridad).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Barbell, Play, Compass } from "@phosphor-icons/react";
import { memo, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import { useWorkoutStore } from "@/lib/workout-store";
import { useProfile } from "@/components/providers";
import { Avatar } from "@/components/ui/primitives";

type HudIcon = ComponentType<{ className?: string; weight?: "light" | "fill" | "bold" }>;

/**
 * Destinos de la barra inferior (móvil): 5 tabs máximo.
 * /entrenar vive en el centro como acción primaria; el perfil usa el avatar.
 * El resto de rutas cuelgan del header y del sheet "Más".
 */
export const HUD_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: House },
  { href: "/rutinas", label: "Rutinas", icon: Barbell },
  { href: "/entrenar", label: "Entrenar", icon: Play },
  { href: "/explorar", label: "Social", icon: Compass },
] as const;

/** Determina si un href corresponde a la ruta actual (o a una subruta). */
export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/** Ítem de tab: icono solo, relleno cuando está activo (patrón Instagram). */
const TabItem = memo(function TabItem({
  href,
  label,
  icon: Icon,
  badge,
}: {
  href: string;
  label: string;
  icon: HudIcon;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className="relative flex h-12 w-12 items-center justify-center transition-transform active:scale-90"
    >
      <Icon
        className={cn("size-6 transition-colors", active ? "text-[var(--text)]" : "text-[var(--text-2)]")}
        weight={active ? "fill" : "light"}
      />
      {badge ? (
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-bold leading-none text-white animate-pop">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
});

/** Pestaña de perfil: avatar circular; anillo cuando está activa. */
function ProfileTab() {
  const pathname = usePathname();
  const profile = useProfile((s) => s.profile);
  const active = isActive(pathname, "/perfil");
  return (
    <Link
      href="/perfil"
      aria-label="Perfil"
      aria-current={active ? "page" : undefined}
      className="relative flex h-12 w-12 items-center justify-center transition-transform active:scale-90"
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full transition-all",
          active ? "ring-2 ring-[var(--text)] ring-offset-2 ring-offset-[var(--surface)]" : ""
        )}
      >
        <Avatar
          src={profile?.avatar_url}
          size={26}
          alt={profile?.display_name ?? profile?.username ?? "Perfil"}
        />
      </span>
    </Link>
  );
}

export function HudNav() {
  const pathname = usePathname();
  const restActive = useWorkoutStore((s) => s.restEndsAt !== null);

  // En un hilo de chat el contenido es pantalla completa; durante el descanso
  // la barra del RestTimer ocupa el fondo y tiene prioridad.
  const isChatThread = /^\/mensajes\/[^/]+$/.test(pathname);
  const hidden = isChatThread || (restActive && pathname.startsWith("/entrenar"));
  if (hidden) return null;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-12 max-w-lg items-center justify-around">
        {HUD_ITEMS.map((t) => (
          <TabItem key={t.href} href={t.href} label={t.label} icon={t.icon} />
        ))}
        <ProfileTab />
      </div>
    </nav>
  );
}
