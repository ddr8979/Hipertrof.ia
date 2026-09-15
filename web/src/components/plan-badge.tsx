// Insignia que muestra el plan de suscripción del usuario.
"use client";

import { PLANS, type Plan } from "@/lib/plans";
import { cn } from "@/lib/utils";

/**
 * Badge del plan con color de acento según su definición en PLANS.
 * Devuelve null si el plan no existe en la configuración.
 * @param size "sm" | "md" para el tamaño de la píldora.
 */
export function PlanBadge({
  plan,
  size = "sm",
  className,
}: {
  plan?: Plan | string | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const p = (plan ?? "free") as Plan;
  // Metadatos del plan (color, nombre); si no existe, no se renderiza.
  const meta = PLANS.find((x) => x.id === p);
  if (!meta) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full font-bold uppercase tracking-wider",
        size === "sm" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]",
        className
      )}
      style={{
        background: `${meta.accent}1f`,
        color: meta.accent,
        border: `1px solid ${meta.accent}55`,
      }}
      title={`Plan ${meta.name}`}
    >
      {/* Punto indicador para el plan deluxe */}
      {p === "deluxe" && <span className="size-1.5 rounded-full bg-current" />}
      {meta.name}
    </span>
  );
}