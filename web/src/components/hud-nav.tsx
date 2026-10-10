"use client";

/**
 * hud-nav.tsx
 * HUD inferior de navegación móvil: píldora flotante con estética glass
 * (estilo WhatsApp/Reddit) que reacciona al dedo en pantallas touch con un
 * glow que sigue el puntero, escala al presionar y una vibración sutil.
 * Iconos Phosphor en peso bold; el activo pasa a fill. Se auto-oculta en
 * hilos de chat y durante el descanso en /entrenar (el RestTimer tiene
 * prioridad sobre el HUD).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Barbell, Play, Compass, User, ForkKnife } from "@phosphor-icons/react";
import {
  memo,
  useRef,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";
import { useWorkoutStore } from "@/lib/workout-store";

/**
 * Destinos de la píldora inferior (móvil).
 * /entrenar vive en el centro como acción primaria; el resto de rutas
 * (herramientas, ajustes) cuelgan del header y del sheet "Más".
 */
export const HUD_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: House },
  { href: "/rutinas", label: "Rutinas", icon: Barbell },
  { href: "/entrenar", label: "Entrenar", icon: Play, emphasis: true },
  { href: "/explorar", label: "Social", icon: Compass },
  { href: "/nutricion", label: "Nutrición", icon: ForkKnife },
  { href: "/perfil", label: "Perfil", icon: User },
] as const;

/** Determina si un href corresponde a la ruta actual (o a una subruta). */
export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/** Ítem de la píldora: icono + label (el label se oculta en pantallas <360px). */
const HudItem = memo(function HudItem({
  href,
  label,
  icon: Icon,
  badge,
  emphasis,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; weight?: "bold" | "fill" }>;
  badge?: number;
  emphasis?: boolean;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1.5 transition-all duration-200 active:scale-[0.95]",
        active
          ? "bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_4px_16px_-4px_color-mix(in_srgb,var(--accent)_50%,transparent)]"
          : emphasis
            ? "text-[var(--accent)] hover:bg-[var(--accent-soft)]"
            : "text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
      )}
    >
      <Icon
        className="size-5"
        weight={active ? "fill" : "bold"}
      />
      <span className="hidden text-[9px] font-bold leading-none min-[360px]:block">
        {label}
      </span>
      {badge ? (
        <span className="absolute -right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-bold text-white animate-pop">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
});

export function HudNav() {
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
    <>
      {/* Velo inferior: el contenido se desvanece bajo la píldora en vez de
          pasar por debajo de forma cruda. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-20 bg-gradient-to-t from-[var(--bg)] via-[color-mix(in_srgb,var(--bg)_75%,transparent)] to-transparent lg:hidden"
      />
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2 lg:hidden animate-slide-up"
    >
      <div
        className="glass relative flex items-center gap-0.5 overflow-hidden rounded-full p-1 shadow-[var(--shadow-lg)]"
        onPointerDown={(e) => {
          holdRef.current = true;
          paint(e);
          // Táctil: vibración sutil como feedback del dedo.
          if (e.pointerType === "touch") navigator.vibrate?.(6);
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
          className="pointer-events-none absolute left-0 top-0 size-28 rounded-full opacity-0 transition-opacity duration-200"
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
              icon={t.icon}
              emphasis={"emphasis" in t ? t.emphasis : undefined}
            />
          ))}
        </div>
      </div>
    </nav>
    </>
  );
}
