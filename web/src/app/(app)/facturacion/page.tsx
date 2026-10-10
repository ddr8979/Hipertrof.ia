"use client";

/**
 * Página de Facturación.
 * Muestra los planes disponibles (PLANS) y permite seleccionar uno.
 * La selección se guarda directamente en el campo `plan` del perfil
 * (la pasarela de pago real queda para más adelante).
 */
import { CreditCard, Check, Crown, Star, Lightning as Zap } from "@phosphor-icons/react";
import { useProfile } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/plan-badge";
import { PLANS, type Plan } from "@/lib/plans";
import { ComingSoon } from "@/components/coming-soon";
import { cn } from "@/lib/utils";

// Ícono asociado a cada plan según su id.
const PLAN_ICONS: Record<string, typeof Star> = {
  free: Zap,
  plus: Star,
  deluxe: Crown,
};

export default function FacturacionPage() {
  const profile = useProfile((s) => s.profile);
  const current = (profile?.plan as Plan | undefined) ?? "free";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col items-center gap-1.5 pb-1 text-center">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <CreditCard className="size-5" />
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight">Facturación</h1>
        <p className="flex items-center gap-2 text-xs text-[var(--text-2)]">
          Tu plan actual: <PlanBadge plan={current} />
        </p>
      </header>

      <p className="mx-auto max-w-md text-center text-sm leading-relaxed text-[var(--text-2)]">
        Para registrarte como <strong>personal trainer</strong> y acceder a la gestión de alumnos,
        necesitás el plan <strong>Plus</strong> (o Deluxe).
      </p>

      <ComingSoon
        title="Pasarela de pago en construcción"
        description="La facturación con pagos reales viene muy pronto. Por ahora los planes son una vista previa."
      />

      {/* Tarjetas de planes */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const Icon = PLAN_ICONS[p.id];
          const isCurrent = current === p.id;
          return (
            <div
              key={p.id}
              className={cn(
                "card relative flex flex-col p-5 transition-all",
                p.popular && "ring-2",
                isCurrent && "ring-[var(--accent)]"
              )}
              style={p.popular ? { ["--tw-ring-color" as string]: `${p.accent}66` } : undefined}
            >
              {p.popular && (
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ background: p.accent }}
                >
                  Popular
                </span>
              )}
              <div className="flex items-center gap-2">
                <span
                  className="flex size-9 items-center justify-center rounded-xl"
                  style={{ background: `${p.accent}1f`, color: p.accent }}
                >
                  <Icon className="size-4.5" />
                </span>
                <h3 className="font-display text-lg font-bold tracking-tight">{p.name}</h3>
                {isCurrent && (
                  <span className="ml-auto rounded-full bg-[var(--success-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--success)]">
                    Actual
                  </span>
                )}
              </div>

              <p className="mt-3 font-display text-2xl font-bold tracking-tight">
                {p.priceUyu === 0 ? (
                  "Gratis"
                ) : (
                  <>
                    ${p.priceUyu}
                    <span className="text-sm font-semibold text-[var(--muted)]"> /mes</span>
                  </>
                )}
              </p>

              <ul className="mt-4 flex flex-col gap-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-2)]">
                    <Check
                      className="mt-0.5 size-4 shrink-0"
                      style={{ color: p.accent }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={isCurrent ? "outline" : "accent"}
                className="mt-5"
                disabled
              >
                {isCurrent ? "Plan actual" : "Próximamente"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}