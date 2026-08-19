"use client";

import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  Flame,
  Palette,
  Utensils,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useProfile } from "@/components/providers";
import { cn } from "@/lib/utils";

const STEPS = ["Tu identidad", "Tu cuerpo", "Tu objetivo", "Tu estilo", "Tu comida"];

const ACCENTS = [
  "#b8f34a",
  "#ff5d8f",
  "#ffb020",
  "#5cc8ff",
  "#c792ff",
  "#ff6b35",
  "#4ade80",
  "#f72585",
  "#3d9fff",
];

const SEX = [
  { id: "male", label: "Masculino" },
  { id: "female", label: "Femenino" },
  { id: "other", label: "Otro" },
];

const ACTIVITY = [
  { id: "sedentary", label: "Sedentario", factor: 1.2, desc: "Poco o nada de ejercicio" },
  { id: "light", label: "Ligero", factor: 1.375, desc: "1-3 días por semana" },
  { id: "moderate", label: "Moderado", factor: 1.55, desc: "3-5 días por semana" },
  { id: "very", label: "Intenso", factor: 1.725, desc: "6-7 días por semana" },
  { id: "extra", label: "Extremo", factor: 1.9, desc: "Trabajo físico + doble sesión" },
];

const GOALS = [
  { id: "volumen", label: "Volumen", desc: "Ganar masa muscular" },
  { id: "definicion", label: "Definición", desc: "Perder grasa, marcar" },
  { id: "mantenimiento", label: "Mantenimiento", desc: "Mantener mi estado" },
];

const DIETS = [
  { id: "omnivoro", label: "Omnívoro" },
  { id: "vegetariano", label: "Vegetariano" },
  { id: "vegano", label: "Vegano" },
  { id: "sin_gluten", label: "Sin gluten" },
];

const FOOD_PREFS = [
  { id: "proteico", label: "Alto en proteína" },
  { id: "rapido", label: "Rápido de preparar" },
  { id: "bajo-carbohidrato", label: "Bajo en carbohidratos" },
  { id: "dulce", label: "Dulces" },
  { id: "salado", label: "Salados" },
  { id: "grasas-buenas", label: "Grasas buenas" },
  { id: "vegetal", label: "Vegetal / liviano" },
  { id: "clasico", label: "Clásicos de siempre" },
];

const FOOD_RESTRICTIONS = [
  { id: "gluten", label: "Gluten" },
  { id: "lactosa", label: "Lactosa" },
  { id: "huevo", label: "Huevo" },
  { id: "mani", label: "Maní" },
  { id: "frutos_secos", label: "Frutos secos" },
  { id: "mariscos", label: "Pescado y mariscos" },
  { id: "carne", label: "Carne roja" },
  { id: "cerdo", label: "Cerdo" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const setProfile = useProfile((s) => s.setProfile);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    displayName: "",
    username: "",
    sex: "male",
    age: 25,
    height: 175,
    weight: 75,
    activity: "moderate",
    goal: "volumen",
    diet: "omnivoro",
    accent: "#b8f34a",
    foodPrefs: [] as string[],
    foodRestrictions: [] as string[],
  });

  const kcal = (() => {
    const { sex, age, height, weight, activity } = form;
    const act = ACTIVITY.find((a) => a.id === activity)!;
    const bmr =
      sex === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;
    return { bmr: Math.round(bmr), tdee: Math.round(bmr * act.factor) };
  })();

  function next() {
    if (step === 0) {
      const nameOk = z
        .string()
        .trim()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(60, "El nombre es muy largo")
        .safeParse(form.displayName);
      if (!nameOk.success) {
        toast("warning", nameOk.error.issues[0]?.message ?? "Revisá el nombre");
        return;
      }
      const userOk = z
        .string()
        .regex(/^[a-z0-9_]{3,20}$/, "Username: 3 a 20 caracteres, minúsculas, números o _")
        .safeParse(form.username);
      if (form.username.trim() && !userOk.success) {
        toast("warning", userOk.error.issues[0]?.message ?? "Revisá el username");
        return;
      }
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  }

  async function finish() {
    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sin sesión");

      const patch = {
        display_name: form.displayName.trim(),
        username: form.username.trim() || undefined,
        sex: form.sex,
        age_years: form.age,
        height_cm: form.height,
        weight_kg: form.weight,
        activity_level: form.activity,
        diet_goal: form.goal,
        diet_type: form.diet,
        accent_color: form.accent,
        food_preferences: form.foodPrefs,
        food_restrictions: form.foodRestrictions,
        bmr_kcal: kcal.bmr,
        tdee_kcal: kcal.tdee,
        onboarded: true,
      };

      const { data, error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        if (/username/i.test(error.message)) {
          toast("error", "Ese nombre de usuario ya está en uso", "Elegí otro para tu perfil público");
        } else {
          throw error;
        }
        setBusy(false);
        return;
      }

      // Aplicar acento al instante
      document.documentElement.style.setProperty("--user-accent", form.accent);
      setProfile(data);
      toast("success", "¡Perfil listo!", "Ya podés empezar a entrenar");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast("error", "No se pudo guardar el perfil", (err as Error).message);
      setBusy(false);
    }
  }

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative w-full max-w-lg">
        {/* Stepper */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col gap-1.5">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors duration-300",
                  i <= step ? "bg-[var(--accent)]" : "bg-[var(--surface-3)]"
                )}
              />
              <span
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wider",
                  i === step ? "text-[var(--accent)]" : "text-[var(--muted)]"
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="card p-6 sm:p-8" key={step}>
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Dumbbell className="size-6" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">
                    ¿Quién sos?
                  </h1>
                  <p className="text-sm text-[var(--text-2)]">
                    Tu perfil es tu identidad en la comunidad
                  </p>
                </div>
              </div>
              <Field label="Nombre">
                <Input
                  value={form.displayName}
                  onChange={(e) => set("displayName", e.target.value)}
                  placeholder="Ej: María Fernández"
                  autoFocus
                />
              </Field>
              <Field
                label="Nombre de usuario"
                hint="Así te van a encontrar en la comunidad"
              >
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                    @
                  </span>
                  <Input
                    value={form.username}
                    onChange={(e) =>
                      set(
                        "username",
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, "")
                          .slice(0, 20)
                      )
                    }
                    placeholder="mariafit"
                    className="pl-8"
                  />
                </div>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Flame className="size-6" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">
                    Tu cuerpo
                  </h1>
                  <p className="text-sm text-[var(--text-2)]">
                    Con esto calculamos tu metabolismo basal (BMR)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {SEX.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => set("sex", s.id)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all",
                      form.sex === s.id
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "border-[var(--border)] hover:border-[var(--muted)]"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Edad">
                  <Input
                    type="number"
                    min={10}
                    max={100}
                    value={form.age}
                    onChange={(e) => set("age", Number(e.target.value))}
                  />
                </Field>
                <Field label="Altura (cm)">
                  <Input
                    type="number"
                    min={100}
                    max={250}
                    value={form.height}
                    onChange={(e) => set("height", Number(e.target.value))}
                  />
                </Field>
                <Field label="Peso (kg)">
                  <Input
                    type="number"
                    step={0.5}
                    min={20}
                    max={300}
                    value={form.weight}
                    onChange={(e) => set("weight", Number(e.target.value))}
                  />
                </Field>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Tu estimación
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <p className="font-display text-3xl font-bold tracking-tight">
                      {kcal.tdee.toLocaleString("es-UY")}
                    </p>
                    <p className="text-xs text-[var(--text-2)]">
                      kcal/día de mantenimiento (TDEE)
                    </p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    BMR: {kcal.bmr.toLocaleString("es-UY")} kcal
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Check className="size-6" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">
                    ¿Cuál es tu objetivo?
                  </h1>
                  <p className="text-sm text-[var(--text-2)]">
                    Ajustamos tus metas de calorías y entrenamiento
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => set("goal", g.id)}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-all",
                      form.goal === g.id
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--border)] hover:border-[var(--muted)]"
                    )}
                  >
                    <div>
                      <p className="font-semibold">{g.label}</p>
                      <p className="text-sm text-[var(--text-2)]">{g.desc}</p>
                    </div>
                    {form.goal === g.id && (
                      <Check className="size-5 text-[var(--accent)]" />
                    )}
                  </button>
                ))}
              </div>

              <Field label="Nivel de actividad">
                <Select
                  value={form.activity}
                  onChange={(e) => set("activity", e.target.value)}
                >
                  {ACTIVITY.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} — {a.desc}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Palette className="size-6" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">
                    Tu estilo
                  </h1>
                  <p className="text-sm text-[var(--text-2)]">
                    Tu acento de color: lo verás en toda la app y en tu perfil
                    público
                  </p>
                </div>
              </div>

              <Field label="Color de acento">
                <div className="flex flex-wrap gap-2.5">
                  {ACCENTS.map((c) => (
                    <button
                      key={c}
                      onClick={() => set("accent", c)}
                      aria-label={`Acento ${c}`}
                      className={cn(
                        "size-10 rounded-xl border-2 transition-transform hover:scale-110",
                        form.accent === c
                          ? "border-[var(--text)] scale-110"
                          : "border-transparent"
                      )}
                      style={{ background: c }}
                    >
                      {form.accent === c && (
                        <Check className="mx-auto size-5 text-black" />
                      )}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Preferencia alimentaria">
                <div className="grid grid-cols-2 gap-2">
                  {DIETS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => set("diet", d.id)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all",
                        form.diet === d.id
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "border-[var(--border)] hover:border-[var(--muted)]"
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Utensils className="size-6" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">
                    Tu comida
                  </h1>
                  <p className="text-sm text-[var(--text-2)]">
                    Usamos esto para recomendarte recetas y filtrar lo que no
                    podés comer
                  </p>
                </div>
              </div>

              <Field label="¿Qué te gusta? (elegí todas las que apliquen)">
                <div className="grid grid-cols-2 gap-2">
                  {FOOD_PREFS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() =>
                        set(
                          "foodPrefs",
                          form.foodPrefs.includes(p.id)
                            ? form.foodPrefs.filter((x) => x !== p.id)
                            : [...form.foodPrefs, p.id]
                        )
                      }
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all",
                        form.foodPrefs.includes(p.id)
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "border-[var(--border)] hover:border-[var(--muted)]"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="¿Qué evitás? (alergias, intolerancias, elección)">
                <div className="grid grid-cols-2 gap-2">
                  {FOOD_RESTRICTIONS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() =>
                        set(
                          "foodRestrictions",
                          form.foodRestrictions.includes(r.id)
                            ? form.foodRestrictions.filter((x) => x !== r.id)
                            : [...form.foodRestrictions, r.id]
                        )
                      }
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all",
                        form.foodRestrictions.includes(r.id)
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "border-[var(--border)] hover:border-[var(--muted)]"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 0 || busy}
            >
              <ArrowLeft className="size-4" />
              Volver
            </Button>
            <Button size="lg" onClick={next} loading={busy}>
              {step === STEPS.length - 1 ? "Empezar a entrenar" : "Continuar"}
              {!busy && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}