"use client";

/**
 * Calculadora de calorías profesional con cámara IA.
 * - Mifflin-St Jeor para BMR/TDEE
 * - Macros por objetivo (definición/mantenimiento/volumen)
 * - Cámara con TensorFlow.js para reconocimiento de alimentos (local, privado)
 * - Registro de alimentos detectados con totales automáticos
 * - Persistencia en perfil de Supabase
 */

import { useMemo, useState, useCallback } from "react";
import { Calculator, Flame, Pulse as Activity, Target, FloppyDisk as Save, ForkKnife as Utensils, Trash as Trash2, Sparkle as Sparkles } from "@phosphor-icons/react";

type Sex = "male" | "female";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/providers";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { FoodCamera, useFoodLog, type DetectedFood } from "@/components/food-camera";
import { DumbbellIcon } from "@/components/mascot";

// Factores de actividad multiplicadores del TDEE.
const ACTIVITY = [
  { value: 1.2, label: "Sedentario", desc: "Poco o nada de ejercicio" },
  { value: 1.375, label: "Ligero", desc: "1-3 días por semana" },
  { value: 1.55, label: "Moderado", desc: "3-5 días por semana" },
  { value: 1.725, label: "Intenso", desc: "6-7 días por semana" },
  { value: 1.9, label: "Atleta", desc: "Entrenamiento diario intenso" },
] as const;

const MACRO_RATIOS = {
  cut: { protein: 2.2, fat: 0.7, carbs: "rest" },
  maintain: { protein: 1.8, fat: 0.8, carbs: "rest" },
  bulk: { protein: 1.8, fat: 0.9, carbs: "rest" },
} as const;

export default function CalculadoraPage() {
  const profile = useProfile((s) => s.profile);
  
  // Estado del formulario principal
  const [sex, setSex] = useState<Sex>(
    ((profile?.sex as Sex | null) ?? "male")
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
  
  // UI state
  const [activeTab, setActiveTab] = useState<"calc" | "food">("calc");
  
  // Food logging
  const { foods, addFood, removeFood, clearFoods, totals } = useFoodLog();

  // Cálculo reactivo principal
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
    
    const ratios = MACRO_RATIOS[goal];
    const protein_g = Math.round(w * ratios.protein);
    const fat_g = Math.round(w * ratios.fat);
    const protein_cal = protein_g * 4;
    const fat_cal = fat_g * 9;
    
    let targetCal: number;
    let label: string;
    
    if (goal === "cut") {
      targetCal = Math.round(tdee * 0.85);
      label = "Déficit moderado (definición)";
    } else if (goal === "bulk") {
      targetCal = Math.round(tdee * 1.12);
      label = "Superávit controlado (volumen)";
    } else {
      targetCal = tdee;
      label = "Mantenimiento";
    }
    
    const carbs_g = Math.max(0, Math.round((targetCal - protein_cal - fat_cal) / 4));
    
    return {
      bmr: Math.round(bmr),
      tdee,
      target: targetCal,
      protein: protein_g,
      fat: fat_g,
      carbs: carbs_g,
      goalLabel: label,
      deficit: targetCal - tdee,
    };
  }, [sex, age, weight, height, activity, goal]);

  // Combinar macros calculados + alimentos detectados
  const combinedMacros = useMemo(() => {
    if (!result) return null;
    return {
      protein: result.protein + Math.round(totals.protein),
      fat: result.fat + Math.round(totals.fat),
      carbs: result.carbs + Math.round(totals.carbs),
      calories: result.target + totals.calories,
    };
  }, [result, totals]);

  // Persiste datos en perfil
  const saveToProfile = useCallback(async () => {
    if (!result) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
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
  }, [result, sex, age, weight, height]);

  const handleFoodDetected = useCallback((food: DetectedFood) => {
    addFood(food);
    toast("success", "Alimento agregado", `${food.class}: ~${food.calories} kcal`);
  }, [addFood]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header con mascota */}
      <header className="flex flex-col items-center gap-2 pb-2 text-center">
        <DumbbellIcon size={48} animated className="text-[var(--accent)]" />
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Calculadora inteligente
        </h1>
        <p className="text-xs text-[var(--text-2)] max-w-xs">
          Mifflin-St Jeor + IA local para tus alimentos. Privado, rápido, sin servidor.
        </p>
      </header>

      {/* Tabs principales */}
      <div className="flex gap-1 rounded-xl bg-[var(--surface-2)] p-1" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "calc"}
          onClick={() => setActiveTab("calc")}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
            activeTab === "calc"
              ? "bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-sm)]"
              : "text-[var(--text-2)] hover:text-[var(--text)]"
          )}
        >
          <Calculator className="size-4 mx-auto" />
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "food"}
          onClick={() => setActiveTab("food")}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
            activeTab === "food"
              ? "bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-sm)]"
              : "text-[var(--text-2)] hover:text-[var(--text)]"
          )}
        >
          <Utensils className="size-4 mx-auto" />
        </button>
      </div>

      {/* Panel Calculadora */}
      {activeTab === "calc" && (
        <div className="card flex flex-col gap-4 p-5 animate-[fade-up_0.3s_ease-out]">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sexo">
              <div className="flex gap-1.5">
                {([
                  { id: "male", label: "Hombre" },
                  { id: "female", label: "Mujer" },
                ] as const).map((s) => (
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
              <option value="cut">Definición (déficit moderado)</option>
              <option value="maintain">Mantenimiento</option>
              <option value="bulk">Volumen (superávit controlado)</option>
            </Select>
          </Field>
        </div>
      )}

      {/* Panel Alimentos con Cámara */}
      {activeTab === "food" && (
        <div className="animate-[fade-up_0.3s_ease-out]">
          <FoodCamera onDetect={handleFoodDetected} compact />
          
          {foods.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold text-[var(--text)] flex items-center gap-2">
                <Sparkles className="size-4 text-[var(--accent)]" />
                Alimentos registrados
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {foods.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                        <Utensils className="size-4" />
                      </span>
                      <div>
                        <p className="font-medium capitalize">{f.class}</p>
                        <p className="text-xs text-[var(--muted)]">
                          ~{f.portion_g}g · {f.confidence > 0.7 ? "Alta" : f.confidence > 0.4 ? "Media" : "Baja"} confianza
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--accent)]">{f.calories} kcal</span>
                      <Button variant="ghost" size="icon" onClick={() => removeFood(i)} aria-label="Eliminar">
                        <Trash2 className="size-4 text-[var(--muted)] hover:text-[var(--danger)]" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] p-3">
                <span className="font-medium text-[var(--text-2)]">Total detectado</span>
                <span className="font-display text-xl font-bold text-[var(--accent)]">{totals.calories} kcal</span>
              </div>
              <Button variant="outline" fullWidth onClick={clearFoods}>
                <Trash2 className="size-4" /> Limpiar todo
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Resultados combinados */}
      {result && (
        <div className="flex flex-col gap-3 animate-[fade-up_0.4s_ease-out]">
          {/* Tarjetas principales: BMR, TDEE, Objetivo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card flex flex-col items-center gap-1 p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 to-transparent" />
              <span className="relative flex size-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Flame className="size-4.5" />
              </span>
              <p className="relative mt-1.5 font-display text-2xl font-bold tracking-tight">
                {result.bmr}
              </p>
              <p className="relative text-center text-[11px] font-medium text-[var(--muted)]">
                BMR
              </p>
              <p className="relative text-center text-[10px] text-[var(--text-2)]">
                kcal/día en reposo
              </p>
            </div>
            
            <div className="card flex flex-col items-center gap-1 p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--info)]/10 to-transparent" />
              <span className="relative flex size-9 items-center justify-center rounded-xl bg-[#22c55e]/15 text-[#22c55e]">
                <Activity className="size-4.5" />
              </span>
              <p className="relative mt-1.5 font-display text-2xl font-bold tracking-tight">
                {result.tdee}
              </p>
              <p className="relative text-center text-[11px] font-medium text-[var(--muted)]">
                TDEE
              </p>
              <p className="relative text-center text-[10px] text-[var(--text-2)]">
                gasto total estimado
              </p>
            </div>
            
            <div className="card flex flex-col items-center gap-1 p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--warn)]/10 to-transparent" />
              <span className="relative flex size-9 items-center justify-center rounded-xl bg-[var(--warn-soft)] text-[var(--warn)]">
                <Target className="size-4.5" />
              </span>
              <p className="relative mt-1.5 font-display text-2xl font-bold tracking-tight">
                {result.target}
              </p>
              <p className="relative text-center text-[11px] font-medium text-[var(--muted)]">
                Objetivo
              </p>
              <p className="relative text-center text-[10px] text-[var(--text-2)]">
                {result.deficit > 0 ? `+${result.deficit}` : result.deficit} kcal vs TDEE
              </p>
            </div>
          </div>

          {/* Macros principales + detectados */}
          <div className="card flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                <Target className="size-3.5" />
                {result.goalLabel}
              </span>
              {foods.length > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent)]">
                  <Sparkles className="size-3" />
                  +{foods.length} alimento{foods.length > 1 ? "s" : ""} IA
                </span>
              )}
            </div>
            
            <p className="font-display text-3xl font-bold tracking-tight text-center">
              {combinedMacros?.calories ?? result.target}{" "}
              <span className="text-lg font-semibold text-[var(--muted)]">kcal/día</span>
            </p>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Proteína", value: combinedMacros?.protein ?? result.protein, unit: "g", color: "var(--accent)" },
                { label: "Grasas", value: combinedMacros?.fat ?? result.fat, unit: "g", color: "var(--warn)" },
                { label: "Carbos", value: combinedMacros?.carbs ?? result.carbs, unit: "g", color: "var(--info)" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="relative rounded-xl bg-[var(--surface-2)]/70 px-2 py-3 text-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-2)] to-transparent opacity-50" />
                  <p className="relative text-sm font-bold" style={{ color: m.color }}>
                    {m.value} {m.unit}
                  </p>
                  <p className="relative text-[10px] font-medium text-[var(--muted)]">
                    {m.label}
                  </p>
                  {foods.length > 0 && combinedMacros && (
                    <p className="relative text-[9px] font-semibold" style={{ color: m.color }}>
                      +{Math.round(totals[m.label.toLowerCase() as keyof typeof totals] || 0)}{m.unit}
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            <Button onClick={saveToProfile} loading={saving} className="mt-1 w-full gap-2">
              <Save className="size-4" />
              Guardar en mi perfil
            </Button>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!result && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center animate-[fade-in_0.3s_ease-out]">
          <DumbbellIcon size={48} className="mx-auto text-[var(--muted)]" />
          <p className="mt-3 text-sm font-semibold text-[var(--text-2)]">
            Completá tus datos arriba
          </p>
          <p className="mt-1 text-xs text-[var(--muted)] max-w-xs mx-auto">
            La fórmula Mifflin-St Jeor es la más precisa para estimar el metabolismo basal.
            Después podés escanear tus comidas con la cámara.
          </p>
        </div>
      )}
    </div>
  );
}