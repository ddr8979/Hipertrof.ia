"use client";
import { useEffect, useMemo, useState } from "react";
import { activityOptions, harrisBenedict, type ActivityLevel, type Sex } from "@/lib/harrisBenedict";
import { Flame, Calculator } from "lucide-react";
import { Mascota } from "@/components/mascota";

type FormState = {
  sex: Sex;
  ageYears: string;
  heightCm: string;
  weightKg: string;
  activity: ActivityLevel;
  goal: "deficit" | "maintain" | "surplus";
};

type Recipe = {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  description?: string | null;
};

const FALLBACK_RECIPES: Recipe[] = [
  { id: "1", name: "Arroz con pollo y brócoli", calories: 580, proteinG: 42, carbsG: 65, fatsG: 12, description: "Clásico de volumen limpio" },
  { id: "2", name: "Avena con banana y miel", calories: 380, proteinG: 12, carbsG: 68, fatsG: 6, description: "Desayuno energético" },
  { id: "3", name: "Ensalada de atún con huevo", calories: 320, proteinG: 38, carbsG: 8, fatsG: 14, description: "Alto en proteína, bajo en calorías" },
  { id: "4", name: "Pasta integral con carne magra", calories: 650, proteinG: 40, carbsG: 82, fatsG: 14, description: "Para días de entrenamiento intenso" },
  { id: "5", name: "Batido proteico con frutas", calories: 420, proteinG: 35, carbsG: 52, fatsG: 8, description: "Post-entreno ideal" },
];

function toPositiveNumber(s: string) {
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Casi no me muevo",
  light: "Entreno 1-3 días/semana",
  moderate: "Entreno 3-5 días/semana",
  active: "Entreno 6-7 días/semana",
  very_active: "Entreno 2 veces por día",
};

export default function CaloriasPage() {
  const [form, setForm] = useState<FormState>({
    sex: "male",
    ageYears: "25",
    heightCm: "175",
    weightKg: "75",
    activity: "moderate",
    goal: "maintain",
  });

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const parsed = useMemo(() => {
    const ageYears = toPositiveNumber(form.ageYears);
    const heightCm = toPositiveNumber(form.heightCm);
    const weightKg = toPositiveNumber(form.weightKg);
    const ok = ageYears !== null && heightCm !== null && weightKg !== null;
    return { ok, ageYears, heightCm, weightKg };
  }, [form.ageYears, form.heightCm, form.weightKg]);

  const result = useMemo(() => {
    if (!parsed.ok) return null;
    try {
      return harrisBenedict({
        sex: form.sex,
        ageYears: parsed.ageYears!,
        heightCm: parsed.heightCm!,
        weightKg: parsed.weightKg!,
        activity: form.activity,
      });
    } catch {
      return null;
    }
  }, [form.activity, form.sex, parsed]);

  const targetKcal = useMemo(() => {
    if (!result) return null;
    if (form.goal === "deficit") return result.tdeeKcal - 300;
    if (form.goal === "surplus") return result.tdeeKcal + 300;
    return result.tdeeKcal;
  }, [result, form.goal]);

  // Fetch recipes when targetKcal changes
  useEffect(() => {
    if (!targetKcal) return;
    fetch(`/api/nutricion/recetas?targetKcal=${targetKcal}&range=300`)
      .then(r => r.json())
      .then(data => setRecipes(data.recipes?.length ? data.recipes : FALLBACK_RECIPES))
      .catch(() => setRecipes(FALLBACK_RECIPES));
  }, [targetKcal]);

  async function saveToProfile() {
    if (!parsed.ok) return;
    setSaveState("saving");
    try {
      const res = await fetch("/api/profile/calorias", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sex: form.sex,
          ageYears: Number(form.ageYears),
          heightCm: Number(form.heightCm),
          weightKg: Number(form.weightKg),
          activity: form.activity,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setSaveState("error");
    }
  }

  const goalOptions = [
    { value: "deficit", label: "Perder peso", emoji: "📉", kcalDelta: "−300 kcal/día" },
    { value: "maintain", label: "Mantenerme", emoji: "⚖️", kcalDelta: "Mantenimiento" },
    { value: "surplus", label: "Ganar músculo", emoji: "📈", kcalDelta: "+300 kcal/día" },
  ] as const;

  return (
    <main className="page anim-fade">
      <header style={{ marginBottom: 20 }}>
        <span className="badge badge-purple" style={{ marginBottom: 6 }}>Nutrición</span>
        <h1 className="page-title">¿Cuánto debo comer?</h1>
        <p className="page-sub" style={{ margin: 0 }}>Calculá tus calorías personalizadas</p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Form */}
        <form className="glass card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label className="label">Sexo biológico</label>
              <select className="input" value={form.sex} onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value as Sex }))}>
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
              </select>
            </div>

            <div className="field">
              <label className="label">Edad</label>
              <input inputMode="numeric" className="input" value={form.ageYears}
                onChange={(e) => setForm((f) => ({ ...f, ageYears: e.target.value }))} placeholder="Ej. 25" />
            </div>

            <div className="field">
              <label className="label">Altura (cm)</label>
              <input inputMode="numeric" className="input" value={form.heightCm}
                onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))} placeholder="Ej. 175" />
            </div>

            <div className="field">
              <label className="label">Peso actual (kg)</label>
              <input inputMode="numeric" className="input" value={form.weightKg}
                onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))} placeholder="Ej. 75" />
            </div>
          </div>

          <div className="field">
            <label className="label">¿Qué tan activo/a sos?</label>
            <select className="input" value={form.activity}
              onChange={(e) => setForm((f) => ({ ...f, activity: e.target.value as ActivityLevel }))}>
              {activityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {ACTIVITY_LABELS[o.value] ?? o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Objetivo */}
          <div className="field">
            <label className="label">Tu objetivo</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {goalOptions.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, goal: g.value }))}
                  style={{
                    padding: "10px 6px",
                    borderRadius: "var(--radius-sm)",
                    border: form.goal === g.value ? "2px solid var(--brand)" : "1px solid var(--border)",
                    background: form.goal === g.value ? "rgba(0,255,135,0.08)" : "var(--surface)",
                    color: "var(--text)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    transition: "all 150ms",
                    boxShadow: form.goal === g.value ? "0 0 12px rgba(0,255,135,0.2)" : "none",
                  }}
                >
                  <span style={{ fontSize: "1.3rem" }}>{g.emoji}</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>{g.label}</span>
                  <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>{g.kcalDelta}</span>
                </button>
              ))}
            </div>
          </div>

          {!parsed.ok && (
            <p style={{ fontSize: "0.78rem", color: "var(--warn)", fontWeight: 600 }}>
              Ingresá edad, altura y peso válidos para ver los cálculos.
            </p>
          )}

          <button
            type="button"
            disabled={!parsed.ok || saveState === "saving"}
            onClick={saveToProfile}
            className="btn btn-primary btn-full"
            style={{ marginTop: 6 }}
          >
            {saveState === "saving" ? "Guardando..." : saveState === "saved" ? "¡Guardado!" : "Guardar en mi perfil"}
          </button>
        </form>

        {/* Results */}
        {result && targetKcal && (
          <aside className="glass card anim-fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calculator size={18} color="var(--brand)" />
              <p className="section-title" style={{ margin: 0 }}>Tus números</p>
            </div>

            {/* TDEE highlight */}
            <div className="glass card-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, border: "1px solid var(--border)", background: "linear-gradient(135deg, rgba(0,255,135,0.06), rgba(0,198,255,0.04))" }}>
              <div>
                <span className="stat-label">Lo que necesitás comer por día</span>
                <p style={{ fontSize: "2.4rem", fontWeight: 900, color: "var(--brand)", margin: "4px 0 0", lineHeight: 1 }}>
                  {targetKcal} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text2)" }}>kcal</span>
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Obj.</span>
                <p style={{ fontSize: "1rem", fontWeight: 800, color: "var(--brand2)", margin: "2px 0 0" }}>
                  {goalOptions.find(g => g.value === form.goal)?.emoji}
                </p>
              </div>
            </div>

            <div className="glass card-sm" style={{ border: "1px solid var(--border)" }}>
              <span className="stat-label">Lo que tu cuerpo quema sin hacer nada</span>
              <p style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--brand2)", margin: "4px 0 0", lineHeight: 1 }}>
                {result.bmrKcal} <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text2)" }}>kcal/día</span>
              </p>
            </div>

            <p style={{ fontSize: "0.78rem", color: "var(--text2)", lineHeight: 1.5, margin: 0 }}>
              Factor de actividad: <strong style={{ color: "var(--brand)" }}>×{result.activityFactor}</strong>
            </p>
          </aside>
        )}

        {/* Recipe suggestions */}
        {result && recipes.length > 0 && (
          <section className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Flame size={18} color="var(--brand)" />
              <p className="section-title" style={{ margin: 0 }}>¿Qué comer hoy?</p>
            </div>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text2)" }}>
              Recetas según tu objetivo de <strong>{targetKcal} kcal</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recipes.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  className="glass card-sm"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    border: "1px solid var(--border)",
                    padding: "12px 14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem", flex: 1, lineHeight: 1.3 }}>{r.name}</p>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 900,
                        color: "var(--brand)",
                        background: "rgba(0,255,135,0.1)",
                        border: "1px solid rgba(0,255,135,0.25)",
                        borderRadius: 6,
                        padding: "2px 8px",
                        flexShrink: 0,
                        marginLeft: 8,
                      }}
                    >
                      {r.calories} kcal
                    </span>
                  </div>
                  {r.description && (
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>{r.description}</p>
                  )}
                  <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
                    {[
                      { label: "Proteína", value: `${r.proteinG}g`, color: "var(--brand2)" },
                      { label: "Carbos", value: `${r.carbsG}g`, color: "#ffb300" },
                      { label: "Grasas", value: `${r.fatsG}g`, color: "#ff5e3a" },
                    ].map((m) => (
                      <div key={m.label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: m.color }}>{m.value}</span>
                        <span style={{ fontSize: "0.62rem", color: "var(--muted)", textTransform: "uppercase" }}>{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      {/* ── Mascota flotante ── */}
      <Mascota context="calorias" />
    </main>
  );
}
