"use client";

/**
 * hud-nav.tsx
 * HUD inferior de navegación móvil: píldora flotante con estética glass
 * (estilo WhatsApp/Reddit) que reacciona al dedo en pantallas touch con un
 * glow que sigue el puntero, escala al presionar y una vibración sutil.
 * Se auto-oculta en hilos de chat y durante el descanso en /entrenar
 * (la barra del RestTimer tiene prioridad sobre el HUD).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Dumbbell,
  MessageCircle,
  Calculator,
  BicepsFlexed,
  Menu,
} from "lucide-react";
import {
  memo,
  useRef,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";
import { useWorkoutStore } from "@/lib/workout-store";

/** Destinos que viven dentro de la píldora del HUD (móvil). */
export const HUD_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/rutinas", label: "Rutinas", icon: Dumbbell },
  { href: "/ejercicios", label: "Ejercicios", icon: BicepsFlexed },
  { href: "/calculadora", label: "Calc", ariaLabel: "Calculadora", icon: Calculator },
  { href: "/mensajes", label: "Mensajes", icon: MessageCircle },
] as const;

/** Determina si un href corresponde a la ruta actual (o a una subruta). */
export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/** Ítem de la píldora: icono + label (el label se oculta en pantallas <360px). */
const HudItem = memo(function HudItem({
  href,
  label,
  ariaLabel,
  icon: Icon,
  badge,
}: {
  href: string;
  label: string;
  ariaLabel?: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5 rounded-full px-2.5 py-1.5 transition-transform duration-150 active:scale-90",
        active
          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
          : "text-[var(--muted)] hover:text-[var(--text-2)]"
      )}
    >
      <Icon className="size-5.5" strokeWidth={active ? 2.4 : 2} />
      <span className="hidden text-[9.5px] font-bold leading-none min-[360px]:block">
        {label}
      </span>
      {badge ? (
        <span className="absolute -right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
});

export function HudNav({
  moreActive,
  onMore,
  unread = 0,
  avatarUrl,
  avatarName,
}: {
  /** Resalta el botón "Más" si la ruta activa está en el sheet secundario. */
  moreActive: boolean;
  onMore: () => void;
  unread?: number;
  avatarUrl?: string | null;
  avatarName?: string | null;
}) {
  const pathname = usePathname();
  const restActive = useWorkoutStore((s) => s.restEndsAt !== null);

  // Glow que sigue al dedo: se pinta por mutación directa de estilos
  // (sin re-renders) mientras el puntero está presionado sobre la píldora.
  const holdRef = useRef(false);
  const glowRef = useRef<HTMLDivElement>(null);

  const paint = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = glowRef.current;
    if (!g) return;
    const r = e.currentTarget.getBoundingClientRect();
    g.style.opacity = "1";
    g.style.transform = `translate(${e.clientX - r.left}px, ${
      e.clientY - r.top
    }px) translate(-50%, -50%)`;
  };

  const release = () => {
    holdRef.current = false;
    if (glowRef.current) glowRef.current.style.opacity = "0";
  };

  // En un hilo de chat el contenido es pantalla completa; durante el descanso
  // la barra del RestTimer ocupa el fondo y tiene prioridad.
  const isChatThread = /^\/mensajes\/[^/]+$/.test(pathname);
  const hidden = isChatThread || (restActive && pathname.startsWith("/entrenar"));
  if (hidden) return null;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2 lg:hidden"
    >
      <div
        className="glass relative flex items-center gap-0.5 overflow-hidden rounded-full p-1.5 shadow-[var(--shadow-lg)]"
        onPointerDown={(e) => {
          holdRef.current = true;
          paint(e);
          // Táctil: vibración sutil como feedback del dedo.
          if (e.pointerType === "touch") navigator.vibrate?.(8);
        }}
        onPointerMove={(e) => {
          if (holdRef.current) paint(e);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
      >
        {/* Halo bajo el dedo (recortado por el overflow de la píldora) */}
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 size-28 rounded-full opacity-0 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--accent) 35%, transparent) 0%, transparent 70%)",
            filter: "blur(14px)",
          }}
        />

        <div className="relative flex items-center gap-0.5">
          {HUD_ITEMS.map((t) => (
            <HudItem
              key={t.href}
              href={t.href}
              label={t.label}
              ariaLabel={"ariaLabel" in t ? t.ariaLabel : undefined}
              icon={t.icon}
              badge={t.href === "/mensajes" ? unread : undefined}
            />
          ))}
          <Link
            href="/perfil"
            aria-label="Perfil"
            aria-current={isActive(pathname, "/perfil") ? "page" : undefined}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 rounded-full px-2.5 py-1.5 transition-transform duration-150 active:scale-90",
              isActive(pathname, "/perfil")
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--text-2)]"
            )}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="size-5.5 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex size-5.5 items-center justify-center rounded-full bg-[var(--accent-soft)] font-display text-[11px] font-bold text-[var(--accent)]">
                {(avatarName ?? "U").trim().charAt(0).toUpperCase()}
              </span>
            )}
            <span className="hidden text-[9.5px] font-bold leading-none min-[360px]:block">
              Perfil
            </span>
          </Link>
          <button
            type="button"
            onClick={onMore}
            aria-label="Más opciones"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 rounded-full px-2.5 py-1.5 transition-transform duration-150 active:scale-90",
              moreActive
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--text-2)]"
            )}
          >
            <Menu className="size-5.5" strokeWidth={2} />
            <span className="hidden text-[9.5px] font-bold leading-none min-[360px]:block">
              Más
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
