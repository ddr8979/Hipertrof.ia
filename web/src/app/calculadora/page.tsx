"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter as useNextRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Toast } from "@/components/toast";
import { Apple, Dumbbell, Beef, Flame, Target, Scale, History, Search } from "lucide-react";

type ToastType = { msg: string; type: "success" | "error" };

type CalResult = {
  bmrKcal: number;
  tdeeKcal: number;
  bulk: number;
  cut: number;
  proteinG: number;
};

type RMHistoryItem = {
  id: string;
  createdAt: string;
  weight: number;
  reps: number;
  oneRM: number;
  unit: string;
};

type RMResult = {
  oneRM: number;
  table: { reps: number; percent: number; weight: number }[];
  history: RMHistoryItem[];
};

type ExerciseData = {
  id: string;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
};

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentario (poco/nada)" },
  { value: "light",     label: "Ligero (1–3 días/sem)" },
  { value: "moderate",  label: "Moderado (3–5 días/sem)" },
  { value: "very",      label: "Alto (6–7 días/sem)" },
  { value: "extra",     label: "Muy alto (atletas/doble)" },
];

const MUSCLE_GROUPS = [
  "Abdomen/Cintura", "Espalda", "Pecho", "Hombros", 
  "Brazos (Bíceps/Tríceps)", "Antebrazos", 
  "Piernas (Muslos)", "Piernas (Pantorrillas)", "Cardio"
];

const EQUIPMENTS = [
  "Peso Corporal", "Barra", "Mancuernas", "Polea", 
  "Discos", "Bandas Elásticas", "Máquina", "Multipower (Smith)"
];

function CalcContent() {
  const params = useSearchParams();
  const [tab, setTab] = useState<"calorias" | "1rm">(
    params.get("tab") === "1rm" ? "1rm" : "calorias"
  );
  const { user, loading } = useAuth();
  const router = useNextRouter();
  const [toast, setToast] = useState<ToastType | null>(null);

  // Calories form
  const [sex, setSex] = useState("male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState("moderate");
  const [calResult, setCalResult] = useState<CalResult | null>(null);

  // 1RM Form
  const [rmWeight, setRmWeight] = useState("");
  const [rmReps, setRmReps] = useState("");
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [rmResult, setRmResult] = useState<RMResult | null>(null);

  // Exercise Search in 1RM
  const [exSearch, setExSearch] = useState("");
  const [selectedEx, setSelectedEx] = useState<ExerciseData | null>(null);
  const [suggestions, setSuggestions] = useState<ExerciseData[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [filterMuscle, setFilterMuscle] = useState("");
  const [filterEquip, setFilterEquip] = useState("");
  const [dbExercises, setDbExercises] = useState<ExerciseData[]>([]);

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  // Cargar ejercicios para filtros rápidos
  useEffect(() => {
    fetch("/api/exercises")
      .then(r => r.json())
      .then(d => {
        setDbExercises(d.exercises ?? []);
      });
  }, []);

  // Suggestion fetcher
  useEffect(() => {
    if (!exSearch || selectedEx) {
      setSuggestions([]);
      return;
    }
    const delay = setTimeout(() => {
      fetch(`/api/exercises?search=${encodeURIComponent(exSearch)}&muscle=${encodeURIComponent(filterMuscle)}&equipment=${encodeURIComponent(filterEquip)}`)
        .then(r => r.json())
        .then(d => {
          setSuggestions(d.exercises ?? []);
        });
    }, 150);
    return () => clearTimeout(delay);
  }, [exSearch, selectedEx, filterMuscle, filterEquip]);

  async function calcCalories(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/calculadora", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "calories",
          sex,
          ageYears: Number(age),
          heightCm: Number(height),
          weightKg: Number(weight),
          activity
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error, type: "error" });
        return;
      }
      setCalResult(data);
    } finally {
      setBusy(false);
    }
  }

  const handleUnitToggle = () => {
    setUnit(prev => {
      const next = prev === "kg" ? "lbs" : "kg";
      if (rmWeight) {
        if (next === "lbs") {
          setRmWeight(w => String(Math.round(Number(w) * 2.20462262)));
        } else {
          setRmWeight(w => String(Math.round(Number(w) / 2.20462262)));
        }
      }
      // Reset calculations on toggle to ensure fresh state
      setRmResult(null);
      return next;
    });
  };

  async function calc1RM(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEx) {
      setToast({ msg: "Seleccioná un ejercicio de la lista", type: "error" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/calculadora", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "1rm",
          weightKg: Number(rmWeight),
          reps: Number(rmReps),
          exerciseId: selectedEx.id,
          unit
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error, type: "error" });
        return;
      }
      setRmResult(data);
    } finally {
      setBusy(false);
    }
  }

  // Load selected exercise history directly when exercise is changed
  const handleSelectExercise = async (ex: ExerciseData) => {
    setSelectedEx(ex);
    setExSearch(ex.name);
    setShowSug(false);
    setRmResult(null); // Clear previous results

    // Fetch initial history for this exercise using 1RM records or similar
    // We can simulate it by calculating or let the user hit calculate first to fetch
  };

  return (
    <main className="page anim-fade">
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <h1 className="page-title">Calculadora</h1>
      <p className="page-sub">Calculá tus calorías diarias y estimá tu fuerza máxima (1RM)</p>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === "calorias" ? "active" : ""}`} onClick={() => setTab("calorias")}>
          <Apple size={18} /> Nutrición
        </button>
        <button className={`tab-btn ${tab === "1rm" ? "active" : ""}`} onClick={() => setTab("1rm")}>
          <Dumbbell size={18} /> Fuerza (1RM)
        </button>
      </div>

      {/* ── CALORIES ── */}
      {tab === "calorias" && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <form onSubmit={calcCalories} className="glass card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label className="label">Sexo</label>
                <select className="input" value={sex} onChange={e => setSex(e.target.value)}>
                  <option value="male">Hombre</option>
                  <option value="female">Mujer</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Edad (años)</label>
                <input className="input" type="number" min="10" max="100"
                  value={age} onChange={e => setAge(e.target.value)} placeholder="Ej. 25" required />
              </div>
              <div className="field">
                <label className="label">Altura (cm)</label>
                <input className="input" type="number" min="100" max="250"
                  value={height} onChange={e => setHeight(e.target.value)} placeholder="Ej. 175" required />
              </div>
              <div className="field">
                <label className="label">Peso (kg)</label>
                <input className="input" type="number" min="30" max="300" step="0.1"
                  value={weight} onChange={e => setWeight(e.target.value)} placeholder="Ej. 75.5" required />
              </div>
            </div>
            <div className="field">
              <label className="label">Nivel de Actividad Diaria</label>
              <select className="input" value={activity} onChange={e => setActivity(e.target.value)}>
                {ACTIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
              {busy ? "Calculando macros..." : "Calcular Plan Nutricional"}
            </button>
          </form>

          {calResult && (
            <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="glass card" style={{
                background: "linear-gradient(135deg, rgba(0,255,135,0.06) 0%, rgba(0,198,255,0.04) 100%)",
                border: "1.5px solid rgba(0,255,135,0.2)",
                textAlign: "center",
                position: "relative",
                overflow: "hidden"
              }}>
                <div style={{ position: "absolute", right: -12, top: -12, opacity: 0.08, color: "var(--brand)" }}>
                  <Flame size={90} />
                </div>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 800 }}>
                  Mantenimiento Estimado (TDEE)
                </p>
                <p style={{ margin: "6px 0", fontSize: "3.2rem", fontWeight: 900, color: "var(--brand)", lineHeight: 1, letterSpacing: "-0.04em" }}>
                  {calResult.tdeeKcal.toLocaleString()}
                </p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text2)", fontWeight: 600 }}>kcal / día</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <MacroCard label="BMR Basal" value={`${calResult.bmrKcal}`} unit="kcal" color="var(--text)" />
                <MacroCard label="Pérdida (Def)" value={`${calResult.cut}`} unit="kcal" color="var(--danger)" />
                <MacroCard label="Volumen (Sur)" value={`${calResult.bulk}`} unit="kcal" color="var(--brand2)" />
              </div>

              <div className="glass card" style={{ display: "flex", alignItems: "center", gap: 16, border: "1px solid var(--border)" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(0,198,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Beef size={24} color="var(--brand2)" />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "1.15rem", color: "var(--text)" }}>
                    {calResult.proteinG}g <span style={{ color: "var(--text2)", fontWeight: 500, fontSize: "0.85rem" }}>de proteína diaria</span>
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.76rem", color: "var(--muted)", fontWeight: 600 }}>
                    Recomendado: 2.2g por kg para preservar y crear músculo.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 1RM ── */}
      {tab === "1rm" && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <form onSubmit={calc1RM} className="glass card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            
            {/* Fluid KG/LBS toggler inside strength calc */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text2)", fontWeight: 700 }}>EPLEY 1RM CALCULATOR</p>
              <button 
                type="button" 
                onClick={handleUnitToggle} 
                className="btn btn-ghost btn-xs" 
                style={{ border: "1.5px solid var(--brand)", color: "var(--brand)" }}
              >
                UNIDAD: {unit.toUpperCase()}
              </button>
            </div>

            {/* Exercise Selector Autocomplete */}
            <div className="field" style={{ position: "relative" }}>
              <label className="label">Ejercicio Asociado</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input 
                  className="input" 
                  value={exSearch} 
                  onChange={e => { setExSearch(e.target.value); setSelectedEx(null); setShowSug(true); }}
                  onFocus={() => setShowSug(true)}
                  placeholder="Buscá el ejercicio..."
                  style={{ flex: 1 }}
                  required
                />
                {selectedEx && (
                  <button 
                    type="button" 
                    onClick={() => { setSelectedEx(null); setExSearch(""); }}
                    className="btn btn-ghost" 
                    style={{ minHeight: 56, width: 56, padding: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Filters */}
              {!selectedEx && (
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
                  <select 
                    className="input" 
                    style={{ minHeight: 38, height: 38, padding: "0 10px", fontSize: "0.8rem", width: "auto", flexShrink: 0 }}
                    value={filterMuscle}
                    onChange={e => { setFilterMuscle(e.target.value); }}
                  >
                    <option value="">Todos los músculos</option>
                    {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select 
                    className="input" 
                    style={{ minHeight: 38, height: 38, padding: "0 10px", fontSize: "0.8rem", width: "auto", flexShrink: 0 }}
                    value={filterEquip}
                    onChange={e => { setFilterEquip(e.target.value); }}
                  >
                    <option value="">Todo equipamiento</option>
                    {EQUIPMENTS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                  </select>
                </div>
              )}

              {/* Quick exercise chips when input is empty */}
              {!exSearch && !selectedEx && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {dbExercises
                    .filter(ex => (!filterMuscle || ex.muscleGroup === filterMuscle) && (!filterEquip || ex.equipment === filterEquip))
                    .slice(0, 10)
                    .map(ex => (
                      <button 
                        key={ex.id} 
                        type="button" 
                        className="chip"
                        onClick={() => handleSelectExercise(ex)}
                        style={{ fontSize: "0.76rem", height: 30, padding: "0 10px" }}
                      >
                        {ex.name}
                      </button>
                    ))}
                </div>
              )}
              
              {showSug && suggestions.length > 0 && (
                <div className="autocomplete" style={{ maxHeight: 200, overflowY: "auto" }}>
                  {suggestions.map(s => (
                    <div 
                      key={s.id} 
                      className="autocomplete-item"
                      onMouseDown={() => handleSelectExercise(s)}
                    >
                      🏋️ {s.name} <span style={{ fontSize: "0.72rem", color: "var(--muted)", marginLeft: 6 }}>({s.muscleGroup})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label className="label">Peso Levantado ({unit})</label>
                <input className="input" type="number" min="1" step="0.5"
                  value={rmWeight} onChange={e => setRmWeight(e.target.value)} placeholder="Ej. 100" required />
              </div>
              <div className="field">
                <label className="label">Repeticiones (Reps)</label>
                <input className="input" type="number" min="1" max="30"
                  value={rmReps} onChange={e => setRmReps(e.target.value)} placeholder="Ej. 5" required />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary btn-full" disabled={busy || !selectedEx}>
              {busy ? "Estimando 1RM..." : "Calcular y Registrar Fuerza"}
            </button>
          </form>

          {rmResult && (
            <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* 1RM display */}
              <div className="glass card" style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(0,198,255,0.04) 100%)",
                border: "1.5px solid rgba(124,58,237,0.25)",
                textAlign: "center",
                position: "relative",
                overflow: "hidden"
              }}>
                <div style={{ position: "absolute", right: -10, top: -10, opacity: 0.08, color: "var(--brand3)" }}>
                  <Target size={85} />
                </div>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 800 }}>
                  1 Repetición Máxima Estimada (1RM)
                </p>
                <p style={{ margin: "6px 0", fontSize: "3.2rem", fontWeight: 900, color: "#a78bfa", lineHeight: 1, letterSpacing: "-0.04em" }}>
                  {rmResult.oneRM}
                </p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text2)", fontWeight: 600 }}>{unit} teóricos</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
                {/* Percentage table */}
                <div className="glass card" style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Scale size={16} color="var(--brand2)" />
                    <p className="section-title" style={{ margin: 0 }}>Porcentajes de Carga Estimados</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {rmResult.table.map(row => (
                      <div key={row.reps} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 0",
                        borderBottom: "1px solid var(--border)"
                      }}>
                        <span style={{ width: 34, fontSize: "0.85rem", color: "var(--text2)", fontWeight: 700 }}>
                          {row.reps} rep{row.reps > 1 ? "s" : ""}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div className="progress-bar" style={{ height: 6 }}>
                            <div className="progress-fill" style={{ width: `${row.percent}%`, background: "linear-gradient(90deg, #7c3aed, var(--brand2))" }} />
                          </div>
                        </div>
                        <span style={{ width: 55, textAlign: "right", fontWeight: 800, fontSize: "0.92rem", color: "var(--text)" }}>
                          {row.weight} {unit}
                        </span>
                        <span style={{ width: 38, textAlign: "right", fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>
                          {row.percent}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* History list for this specific exercise */}
                {rmResult.history && rmResult.history.length > 0 && (
                  <div className="glass card" style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <History size={16} color="var(--brand)" />
                      <p className="section-title" style={{ margin: 0 }}>Historial 1RM de {selectedEx?.name}</p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {rmResult.history.map(item => (
                        <div key={item.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          paddingBottom: 8, borderBottom: "1px solid var(--border)"
                        }}>
                          <div>
                            <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700 }}>{item.weight}{item.unit} × {item.reps} reps</p>
                            <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--muted)" }}>
                              {new Date(item.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span className="badge badge-purple" style={{ fontSize: "0.78rem", height: 26, fontWeight: 900 }}>
                              {item.oneRM} {item.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function MacroCard({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="stat-card glass" style={{ textAlign: "center", padding: "14px 8px", border: "1px solid var(--border)" }}>
      <span className="stat-label" style={{ fontSize: "0.65rem" }}>{label}</span>
      <span style={{ fontSize: "1.45rem", fontWeight: 900, color, letterSpacing: "-0.02em", margin: "4px 0" }}>{value}</span>
      <span style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>{unit}</span>
    </div>
  );
}

export default function CalculadoraPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80dvh" }}><div className="spinner" /></div>}>
      <CalcContent />
    </Suspense>
  );
}
