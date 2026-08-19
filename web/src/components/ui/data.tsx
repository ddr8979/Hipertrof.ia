import { cn } from "@/lib/utils";

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
    <div className={cn("card min-w-0 overflow-hidden p-4", className)}>
      <div className="flex min-w-0 items-center justify-between gap-1.5">
        <p className="min-w-0 text-[10px] font-semibold uppercase leading-tight tracking-wide text-[var(--muted)]">
          {label}
        </p>
        {icon && <span className="shrink-0 text-[var(--accent)]">{icon}</span>}
      </div>
      <p className="mt-1.5 truncate font-display text-2xl font-bold tracking-tight">
        {value}
      </p>
      {sub && <p className="mt-0.5 truncate text-xs text-[var(--text-2)]">{sub}</p>}
    </div>
  );
}

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
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={stroke}
        />
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