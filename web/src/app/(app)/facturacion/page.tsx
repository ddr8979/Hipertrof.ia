"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Check, Crown, Star, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { PlanBadge } from "@/components/plan-badge";
import { PLANS, type Plan } from "@/lib/plans";
import { cn } from "@/lib/utils";

const PLAN_ICONS: Record<string, typeof Star> = {
  free: Zap,
  plus: Star,
  deluxe: Crown,
};

export default function FacturacionPage() {
  const profile = useProfile((s) => s.profile);
  const qc = useQueryClient();
  const current = (profile?.plan as Plan | undefined) ?? "free";
  const [pending, setPending] = useState<Plan | null>(null);

  const selectPlan = useMutation({
    mutationFn: async (plan: Plan) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ plan })
        .eq("id", profile!.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast("success", "Plan actualizado", "Ya podés usar las funciones de tu plan");
    },
    onError: (e) => toast("error", "No se pudo actualizar el plan", e.message),
  });

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
        necesitás el plan <strong>Plus</strong> (o Deluxe). Elegí tu plan y listo.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const Icon = PLAN_ICONS[p.id];
          const isCurrent = current === p.id;
          const isPending = pending === p.id;
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
                disabled={isCurrent || selectPlan.isPending}
                onClick={() => {
                  setPending(p.id);
                  selectPlan.mutate(p.id, {
                    onSettled: () => setPending(null),
                  });
                }}
              >
                {isPending ? "Procesando…" : isCurrent ? "Plan actual" : `Elegir ${p.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mx-auto max-w-md text-center text-xs text-[var(--muted)]">
        Por ahora la selección de plan se registra directo en tu perfil. La pasarela de pago real se
        conecta cuando quieras activarla.
      </p>
    </div>
  );
}