"use client";

import { useMemo, useState } from "react";
import { Calculator, Flame, Activity, Target, Save } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/providers";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const ACTIVITY = [
  { value: 1.2, label: "Sedentario", desc: "Poco o nada de ejercicio" },
  { value: 1.375, label: "Ligero", desc: "1-3 días por semana" },
  { value: 1.55, label: "Moderado", desc: "3-5 días por semana" },
  { value: 1.725, label: "Intenso", desc: "6-7 días por semana" },
  { value: 1.9, label: "Atleta", desc: "Entrenamiento diario intenso" },
] as const;

export default function CalculadoraPage() {
  const profile = useProfile((s) => s.profile);
  const [sex, setSex] = useState<"male" | "female">(
    ((profile?.sex as "male" | "female" | null) ?? "male")
  );
  const [age, setAge] = useState(
    typeof profile?.age_years === "number" ? String(profile.age_years) : ""
  );
  const [weight, setWeight] = useState(
    typeof profile?.weight_kg === "number" ? String(profile.weight_kg) : ""
  );
  const [height, setHeight] = useState(
    typeof profile?.height_cm === "number" ? String(profile.height_cm) : ""
  );
  const [activity, setActivity] = useState(1.55);
  const [goal, setGoal] = useState<"cut" | "maintain" | "bulk">("maintain");
  const [saving, setSaving] = useState(false);

  const result = useMemo(() => {
    const a = Number(age);
    const w = Number(weight);
    const h = Number(height);
    if (!a || !w || !h || a < 10 || a > 100 || w < 30 || w > 300 || h < 120 || h > 230) {
      return null;
    }
    const base = 10 * w + 6.25 * h - 5 * a;
    const bmr = sex === "male" ? base + 5 : base - 161;
    const tdee = Math.round(bmr * activity);
    const target =
      goal === "cut"
        ? { cal: tdee - 400, protein: 2.0, label: "Déficit (definición)" }
        : goal === "bulk"
          ? { cal: tdee + 350, protein: 1.8, label: "Superávit (volumen)" }
          : { cal: tdee, protein: 1.6, label: "Mantenimiento" };
    return {
      bmr: Math.round(bmr),
      tdee,
      target: Math.round(target.cal),
      protein: Math.round(w * target.protein),
      fat: Math.round((tdee * 0.25) / 9),
      carbs: Math.round((target.cal - target.protein * 4 - (tdee * 0.25)) / 4),
      goalLabel: target.label,
    };
  }, [sex, age, weight, height, activity, goal]);

  async function saveToProfile() {
    if (!result) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sin sesión");
      const { error } = await supabase
        .from("profiles")
        .update({
          sex,
          age_years: Number(age),
          weight_kg: Number(weight),
          height_cm: Number(height),
          bmr_kcal: result.bmr,
          tdee_kcal: result.tdee,
        })
        .eq("id", user.id);
      if (error) throw error;
      toast("success", "Guardado", "Tus datos quedaron actualizados en tu perfil");
    } catch (err) {
      toast("error", "No se pudo guardar", (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col items-center gap-1.5 pb-1 text-center">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Calculator className="size-5" />
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Calculadora de calorías
        </h1>
        <p className="text-xs text-[var(--text-2)]">
          Fórmula Mifflin-St Jeor: metabolismo basal y gasto diario estimado
        </p>
      </header>

      <div className="card flex flex-col gap-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sexo">
            <div className="flex gap-1.5">
              {(
                [
                  { id: "male", label: "Hombre" },
                  { id: "female", label: "Mujer" },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSex(s.id)}
                  className={cn(
                    "flex-1 rounded-xl border px-2 py-2.5 text-[13px] font-semibold transition-all",
                    sex === s.id
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Edad (años)">
            <Input
              type="number"
              inputMode="numeric"
              min={10}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="25"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso (kg)">
            <Input
              type="number"
              inputMode="decimal"
              min={30}
              max={300}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="75"
            />
          </Field>
          <Field label="Altura (cm)">
            <Input
              type="number"
              inputMode="numeric"
              min={120}
              max={230}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="175"
            />
          </Field>
        </div>

        <Field label="Nivel de actividad">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {ACTIVITY.map((a) => (
              <button
                key={a.value}
                onClick={() => setActivity(a.value)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-all",
                  activity === a.value
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border)] hover:border-[var(--accent)]/40"
                )}
              >
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-[13px] font-semibold",
                      activity === a.value ? "text-[var(--accent)]" : "text-[var(--text)]"
                    )}
                  >
                    {a.label}
                  </span>
                  <span className="block text-[11px] text-[var(--muted)]">{a.desc}</span>
                </span>
                <span className="shrink-0 text-xs font-bold text-[var(--muted)]">
                  ×{a.value}
                </span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Objetivo">
          <Select value={goal} onChange={(e) => setGoal(e.target.value as typeof goal)}>
            <option value="cut">Definición (déficit)</option>
            <option value="maintain">Mantenimiento</option>
            <option value="bulk">Volumen (superávit)</option>
          </Select>
        </Field>
      </div>

      {result ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="card flex flex-col items-center gap-1 p-4">
              <span className="flex size-8 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Flame className="size-4" />
              </span>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight">
                {result.bmr}
              </p>
              <p className="text-center text-[11px] font-medium text-[var(--muted)]">
                kcal metabolismo basal (BMR)
              </p>
            </div>
            <div className="card flex flex-col items-center gap-1 p-4">
              <span className="flex size-8 items-center justify-center rounded-xl bg-[#22c55e]/15 text-[#22c55e]">
                <Activity className="size-4" />
              </span>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight">
                {result.tdee}
              </p>
              <p className="text-center text-[11px] font-medium text-[var(--muted)]">
                kcal gasto diario total (TDEE)
              </p>
            </div>
          </div>

          <div className="card flex flex-col gap-2 p-5">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
              <Target className="size-3.5" />
              {result.goalLabel}
            </span>
            <p className="font-display text-3xl font-bold tracking-tight">
              {result.target} <span className="text-sm font-semibold text-[var(--muted)]">kcal/día</span>
            </p>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {[
                { label: "Proteína", value: `${result.protein} g` },
                { label: "Grasas", value: `${result.fat} g` },
                { label: "Carbos", value: `${result.carbs} g` },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl bg-[var(--surface-2)]/70 px-2 py-2 text-center"
                >
                  <p className="text-sm font-bold">{m.value}</p>
                  <p className="text-[10px] font-medium text-[var(--muted)]">{m.label}</p>
                </div>
              ))}
            </div>
            <Button onClick={saveToProfile} loading={saving} className="mt-1 w-full">
              <Save className="size-4" />
              Guardar en mi perfil
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center">
          <p className="text-sm font-semibold text-[var(--text-2)]">
            Completá edad, peso y altura para ver tus resultados
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            La fórmula Mifflin-St Jeor es la más precisa para estimar el metabolismo basal.
          </p>
        </div>
      )}
    </div>
  );
}