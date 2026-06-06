"use client";
import { useMemo, useState } from "react";
import { activityOptions, harrisBenedict, type ActivityLevel, type Sex } from "@/lib/harrisBenedict";
import { Apple, Flame, Calculator, Sparkles } from "lucide-react";

type FormState = {
  email: string;
  sex: Sex;
  ageYears: string;
  heightCm: string;
  weightKg: string;
  activity: ActivityLevel;
};

function toPositiveNumber(s: string) {
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export default function CaloriasPage() {
  const [form, setForm] = useState<FormState>({
    email: "demo@hipertrof.ia",
    sex: "male",
    ageYears: "25",
    heightCm: "175",
    weightKg: "75",
    activity: "moderate",
  });

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

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

  async function saveToProfile() {
    if (!parsed.ok) return;
    if (!form.email.trim()) {
      setSaveState("error");
      return;
    }

    setSaveState("saving");
    try {
      const res = await fetch("/api/profile/calorias", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          sex: form.sex,
          ageYears: Number(form.ageYears),
          heightCm: Number(form.heightCm),
          weightKg: Number(form.weightKg),
          activity: form.activity,
        }),
      });

      if (!res.ok) throw new Error("save failed");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
    } catch {
      setSaveState("error");
    }
  }

  return (
    <main className="page anim-fade">
      <header style={{ marginBottom: 20 }}>
        <span className="badge badge-purple" style={{ marginBottom: 6 }}>Módulo Nutrición</span>
        <h1 className="page-title">Calculadora de Calorías</h1>
        <p className="page-sub" style={{ margin: 0 }}>Harris-Benedict: BMR (basal) y TDEE (gasto total diario)</p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <form className="glass card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="field">
            <label className="label">Email de referencia</label>
            <input
              className="input"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="tu@email.com"
            />
            <p style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>
              Vincula los resultados a este correo temporal.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label className="label">Sexo biológico</label>
              <select
                className="input"
                value={form.sex}
                onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value as Sex }))}
              >
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
              </select>
            </div>

            <div className="field">
              <label className="label">Edad (años)</label>
              <input
                inputMode="numeric"
                className="input"
                value={form.ageYears}
                onChange={(e) => setForm((f) => ({ ...f, ageYears: e.target.value }))}
                placeholder="Ej. 25"
              />
            </div>

            <div className="field">
              <label className="label">Altura (cm)</label>
              <input
                inputMode="numeric"
                className="input"
                value={form.heightCm}
                onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))}
                placeholder="Ej. 175"
              />
            </div>

            <div className="field">
              <label className="label">Peso actual (kg)</label>
              <input
                inputMode="numeric"
                className="input"
                value={form.weightKg}
                onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                placeholder="Ej. 75"
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Nivel de Actividad Diaria</label>
            <select
              className="input"
              value={form.activity}
              onChange={(e) => setForm((f) => ({ ...f, activity: e.target.value as ActivityLevel }))}
            >
              {activityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label} (x{o.factor})
                </option>
              ))}
            </select>
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
            {saveState === "saving"
              ? "Guardando..."
              : saveState === "saved"
                ? "¡Guardado con éxito! ✅"
                : "Guardar en Perfil"}
          </button>

          {saveState === "error" && (
            <p style={{ fontSize: "0.78rem", color: "var(--danger)", fontWeight: 600 }}>
              Ocurrió un error al guardar. Intentá nuevamente.
            </p>
          )}
        </form>

        <aside className="glass card" style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Calculator size={18} color="var(--brand)" />
            <p className="section-title" style={{ margin: 0 }}>Cálculos Harris-Benedict</p>
          </div>

          {result ? (
            <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="glass card-sm" style={{ display: "flex", alignItems: "center", justifyContent: "between", gap: 12, border: "1px solid var(--border)" }}>
                <div>
                  <span className="stat-label">TDEE (Mantenimiento)</span>
                  <p style={{ fontSize: "2.2rem", fontWeight: 900, color: "var(--brand)", margin: "4px 0 0", lineHeight: 1 }}>{result.tdeeKcal}</p>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Factor Act.</span>
                  <p style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text2)", margin: "2px 0 0" }}>x{result.activityFactor}</p>
                </div>
              </div>

              <div className="glass card-sm" style={{ border: "1px solid var(--border)" }}>
                <span className="stat-label">BMR (Metabolismo Basal)</span>
                <p style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--brand2)", margin: "4px 0 0", lineHeight: 1 }}>{result.bmrKcal} <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text2)" }}>kcal/día</span></p>
              </div>

              <p style={{ fontSize: "0.78rem", color: "var(--text2)", lineHeight: 1.4, margin: 0 }}>
                Este valor representa las calorías mínimas que tu cuerpo necesita en reposo absoluto para mantenerse con vida.
              </p>
            </div>
          ) : (
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0 }}>
              Ingresá tus datos arriba para ver el desglose calórico completo.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
