// Componentes de visualización de datos: tarjeta de estadística,
// anillo de progreso SVG y estado vacío.
import { cn } from "@/lib/utils";

/**
 * Tarjeta compacta que muestra una métrica con etiqueta, valor y detalle opcional.
 */
export function StatCard({
  label,
  value,
  sub,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card flex min-w-0 flex-col items-center overflow-hidden p-3 text-center", className)}>
      {icon && <span className="shrink-0 text-[var(--accent)]">{icon}</span>}
      <p className="mt-1.5 min-w-0 text-[10px] font-semibold leading-tight text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 min-w-0 font-display text-2xl font-bold tracking-tight">
        {value}
      </p>
      {sub && <p className="mt-0.5 min-w-0 text-xs text-[var(--text-2)]">{sub}</p>}
    </div>
  );
}

/**
 * Anillo de progreso circular dibujado con SVG.
 * Calcula el perímetro y usa `strokeDashoffset` para representar el avance.
 * @param value     Valor actual.
 * @param max       Valor máximo (100%).
 * @param size      Tamaño en píxeles.
 * @param stroke    Grosor del trazo.
 * @param label     Texto central; si se omite muestra el porcentaje.
 */
export function ProgressRing({
  value,
  max,
  size = 72,
  stroke = 6,
  label,
  className,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
}) {
  // Geometría del anillo: radio, circunferencia y fracción completada (0..1).
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Círculo de fondo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={stroke}
        />
        {/* Arco de progreso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <span className="absolute font-display font-bold" style={{ fontSize: size * 0.22 }}>
        {label ?? `${Math.round(pct * 100)}%`}
      </span>
    </div>
  );
}

/**
 * Estado vacío con icono, título, descripción y acción opcional.
 * Se usa cuando una lista o sección no tiene contenido.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[var(--border)] px-6 py-14 text-center",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </div>
      <div>
        <h3 className="font-display text-lg font-bold tracking-tight">{title}</h3>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--text-2)]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}