"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Toast } from "@/components/toast";
import { Mascota } from "@/components/mascota";
import { 
  Play, Eye, ArrowUp, ArrowDown, Scale, Info, Sparkles, Plus, Trash2, Search, Dumbbell, Award, Edit3, ArrowLeftRight, GripVertical 
} from "lucide-react";

type ToastMsg = { msg: string; type: "success" | "error" };

type ExerciseData = {
  id: string;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
  instructions: string | null;
  gifUrl: string | null;
};

type WorkoutExerciseInput = {
  id: string;
  targetSets: number;
  targetReps: string;
  restSec: number;
  groupName: string | null;
  color: string | null;
  orderLabel: string | null;
  targetWeight?: number | null;
  weightUnit?: string | null;
  exercise: ExerciseData;
};

type WorkoutData = {
  id: string;
  name: string;
  exercises: WorkoutExerciseInput[];
};

type Program = {
  id: string;
  name: string;
  description: string | null;
  workouts: WorkoutData[];
};

type Log = {
  id: string;
  sets: number;
  reps: number;
  weightKg: number;
  volumeKg: number;
  exercise: { name: string };
  performedAt: string;
};

const MUSCLE_GROUPS = [
  "Abdomen/Cintura", "Espalda", "Pecho", "Hombros", 
  "Brazos (Bíceps/Tríceps)", "Antebrazos", 
  "Piernas (Muslos)", "Piernas (Pantorrillas)", "Cardio"
];

const EQUIPMENTS = [
  "Peso Corporal", "Barra", "Mancuernas", "Polea", 
  "Discos", "Bandas Elásticas", "Máquina", "Multipower (Smith)"
];

function Stepper({ value, onChange, min = 0, step = 1, unit }: { value: number; onChange: (v: number) => void; min?: number; step?: number; unit?: string }) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(value + step);
  return (
    <div className="stepper">
      <button type="button" className="stepper-btn" onClick={dec} onTouchStart={dec}>−</button>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span className="stepper-val">{value}</span>
        {unit && <span style={{ fontSize: "0.6rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{unit}</span>}
      </div>
      <button type="button" className="stepper-btn" onClick={inc} onTouchStart={inc}>+</button>
    </div>
  );
}

function Loader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80dvh" }}>
      <div className="spinner" />
    </div>
  );
}

export default function RutinasPage() {
  const { user, loading } = useAuth();
  const router = useNextRouter();
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [tab, setTab] = useState<"log" | "rutinas" | "ejercicios">("log");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [weeklyVol, setWeeklyVol] = useState(0);
  const [busy, setBusy] = useState(false);

  // Kg / Lbs Toggle
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");

  // Log form
  const [exName, setExName] = useState("");
  const [sets, setSets] = useState(4);
  const [reps, setReps] = useState(8);
  const [weight, setWeight] = useState(60); // weight inputted matches active unit (kg or lbs)
  const [showSug, setShowSug] = useState(false);
  const [suggestions, setSuggestions] = useState<ExerciseData[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search/Filter catalogs
  const [dbExercises, setDbExercises] = useState<ExerciseData[]>([]);
  const [filterMuscle, setFilterMuscle] = useState("");
  const [filterEquip, setFilterEquip] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Reorder state
  const [reorderWorkoutId, setReorderWorkoutId] = useState<string | null>(null);
  const [reorderExercises, setReorderExercises] = useState<WorkoutExerciseInput[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Preview Gif Modal
  const [previewGif, setPreviewGif] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  // Custom Exercise creator modal
  const [showCreator, setShowCreator] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState(MUSCLE_GROUPS[0]);
  const [newEquip, setNewEquip] = useState(EQUIPMENTS[0]);
  const [newInstructions, setNewInstructions] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  const load = async () => {
    const [lr, pr, er] = await Promise.all([
      fetch("/api/rutinas/logs").then(r => r.json()),
      fetch("/api/rutinas/programas").then(r => r.json()),
      fetch("/api/exercises").then(r => r.json())
    ]);
    setLogs(lr.logs ?? []);
    setWeeklyVol(lr.weeklyVolumeKg ?? 0);
    setPrograms(pr.programs ?? []);
    setDbExercises(er.exercises ?? []);
  };

  useEffect(() => { if (user) load(); }, [user]);

  // Autocomplete search handler
  useEffect(() => {
    if (!exName) {
      setSuggestions([]);
      return;
    }
    const delay = setTimeout(() => {
      fetch(`/api/exercises?search=${encodeURIComponent(exName)}`)
        .then(r => r.json())
        .then(d => {
          setSuggestions(d.exercises ?? []);
        });
    }, 150);
    return () => clearTimeout(delay);
  }, [exName]);

  const toggleUnit = () => {
    setUnit(prev => {
      const next = prev === "kg" ? "lbs" : "kg";
      // Convert current input weight
      if (next === "lbs") {
        setWeight(w => Math.round(w * 2.20462262));
      } else {
        setWeight(w => Math.round(w / 2.20462262));
      }
      return next;
    });
  };

  const convertWeight = (wInKg: number) => {
    return unit === "lbs" ? Math.round(wInKg * 2.20462262) : Math.round(wInKg);
  };

  const convertWeightFromUnit = (weightVal: number, fromUnit: string) => {
    if (fromUnit === unit) return Math.round(weightVal);
    if (unit === "lbs") {
      return Math.round(weightVal * 2.20462262);
    } else {
      return Math.round(weightVal / 2.20462262);
    }
  };

  const convertVolume = (volInKg: number) => {
    return unit === "lbs" ? Math.round(volInKg * 2.20462262) : Math.round(volInKg);
  };

  const logSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exName) { setToast({ msg: "Escribí el ejercicio", type: "error" }); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/rutinas/logs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ exerciseName: exName, sets, reps, weightKg: weight, unit }),
      });
      if (res.ok) {
        setToast({ msg: `✅ ${exName} ${sets}×${reps} @ ${weight}${unit}`, type: "success" });
        setExName("");
        await load();
      } else {
        const d = await res.json();
        setToast({ msg: d.error, type: "error" });
      }
    } finally { setBusy(false); }
  };

  // Custom exercise save
  const saveCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    setBusy(true);
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: newName,
          muscleGroup: newMuscle,
          equipment: newEquip,
          instructions: newInstructions
        })
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ msg: "Ejercicio creado", type: "success" });
        setExName(data.exercise.name);
        setShowCreator(false);
        setNewName("");
        setNewInstructions("");
        await load();
      } else {
        setToast({ msg: data.error ?? "Error al crear", type: "error" });
      }
    } finally {
      setBusy(false);
    }
  };

  // Reordering functions
  const startReorder = (workout: WorkoutData) => {
    setReorderWorkoutId(workout.id);
    setReorderExercises([...workout.exercises]);
  };

  const moveExercise = (index: number, direction: "up" | "down") => {
    const nextIdx = direction === "up" ? index - 1 : index + 1;
    if (nextIdx < 0 || nextIdx >= reorderExercises.length) return;

    const list = [...reorderExercises];
    const temp = list[index];
    list[index] = list[nextIdx];
    list[nextIdx] = temp;
    setReorderExercises(list);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    setDragOverIdx(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    
    const list = [...reorderExercises];
    const item = list[draggedIdx];
    list.splice(draggedIdx, 1);
    list.splice(index, 0, item);
    
    setReorderExercises(list);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const saveOrder = async () => {
    if (!reorderWorkoutId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/rutinas/programas", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workoutId: reorderWorkoutId,
          exerciseIds: reorderExercises.map(e => e.exercise.id)
        })
      });
      if (res.ok) {
        setToast({ msg: "Orden guardado ✅", type: "success" });
        setReorderWorkoutId(null);
        await load();
      } else {
        const d = await res.json();
        setToast({ msg: d.error ?? "Error al guardar orden", type: "error" });
      }
    } finally {
      setBusy(false);
    }
  };

  // Tonnage math helper
  const getEstimatedTonnage = (workout: WorkoutData) => {
    // Parse target reps range to average number
    const parseReps = (repsStr: string): number => {
      const clean = repsStr.replace(/[^\d-]/g, "");
      if (clean.includes("-")) {
        const parts = clean.split("-").map(Number);
        return Math.round((parts[0] + parts[1]) / 2);
      }
      return Number(clean) || 10;
    };

    let totalKg = 0;
    workout.exercises.forEach(ex => {
      // Find user's last logged weight for this exercise to compute a realistic tonnage, default to 20kg
      const lastLog = logs.find(l => l.exercise.name.toLowerCase() === ex.exercise.name.toLowerCase());
      const weightUsed = lastLog ? lastLog.weightKg : 20;
      const reps = parseReps(ex.targetReps);
      totalKg += ex.targetSets * reps * weightUsed;
    });

    return convertVolume(totalKg);
  };

  if (loading || !user) return <Loader />;

  if (user.role !== "ATHLETE") {
    return (
      <main className="page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70dvh", textAlign: "center" }}>
        <div className="empty-state">
          <div className="empty-state-icon"><Dumbbell size={28} color="var(--brand)" /></div>
          <p className="empty-title">Sección para Atletas</p>
          <p className="empty-sub">Esta sección es para que los atletas registren sus sesiones.</p>
          <button onClick={() => router.push("/trainer")} className="btn btn-primary" style={{ marginTop: 8 }}>
            Ir a mi Panel Trainer →
          </button>
        </div>
      </main>
    );
  }

  // Calculate local tonnage of logging form
  const currentVolume = sets * reps * weight;

  return (
    <main className="page">
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* Header with KG/LBS toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Entrenamiento</h1>
          <p className="page-sub" style={{ margin: 0 }}>Registrá tus series y consultá tu plan</p>
        </div>
        <button 
          onClick={toggleUnit} 
          className="btn btn-ghost btn-sm" 
          style={{ display: "flex", alignItems: "center", gap: 6, border: "1.5px solid var(--brand)", color: "var(--brand)" }}
        >
          <ArrowLeftRight size={14} />
          {unit.toUpperCase()}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
        <div className="stat-card glass">
          <span className="stat-label">Vol. sem.</span>
          <span className="stat-value" style={{ color: "var(--brand)", fontSize: "1.4rem" }}>
            {convertVolume(weeklyVol)}
            <span style={{ fontSize: "0.65rem" }}> {unit}</span>
          </span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Rutinas</span>
          <span className="stat-value" style={{ fontSize: "1.6rem" }}>{programs.length}</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Sesiones</span>
          <span className="stat-value" style={{ fontSize: "1.6rem" }}>{logs.length}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-btn${tab === "log" ? " active" : ""}`} onClick={() => setTab("log")}>
          Registrar
        </button>
        <button className={`tab-btn${tab === "rutinas" ? " active" : ""}`} onClick={() => setTab("rutinas")}>
          Mis rutinas
        </button>
        <button className={`tab-btn${tab === "ejercicios" ? " active" : ""}`} onClick={() => setTab("ejercicios")}>
          Biblioteca
        </button>
      </div>

      {/* ── LOG TAB ── */}
      {tab === "log" && (
        <div className="anim-fade">
          <form onSubmit={logSet}>
            {/* Exercise Input with Autocomplete & Filters */}
            <div style={{ position: "relative", marginBottom: 16 }}>
              <label className="label">Ejercicio</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  ref={inputRef}
                  className="input"
                  value={exName}
                  onChange={e => { setExName(e.target.value); setShowSug(true); }}
                  onFocus={() => setShowSug(true)}
                  placeholder="¿Qué ejercicio vas a registrar?"
                  style={{ fontSize: "1rem", fontWeight: 600, flex: 1 }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowCreator(true)} 
                  className="btn btn-ghost" 
                  style={{ width: 56, minHeight: 56, padding: 0 }}
                  title="Crear ejercicio"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {showSug && (
                <div className="autocomplete" style={{ maxHeight: 260, overflowY: "auto" }}>
                  {(exName ? suggestions : dbExercises.slice(0, 15)).map(s => (
                    <div 
                      key={s.id} 
                      className="autocomplete-item"
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                      onMouseDown={() => { setExName(s.name); setShowSug(false); }}
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: 700 }}>{s.name}</p>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)" }}>{s.muscleGroup} · {s.equipment}</p>
                      </div>
                      {s.gifUrl && (
                        <button 
                          type="button"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setPreviewGif(s.gifUrl);
                            setPreviewName(s.name);
                          }}
                          style={{ background: "rgba(0,255,135,0.1)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <Eye size={14} color="var(--brand)" />
                        </button>
                      )}
                    </div>
                  ))}
                  {exName && suggestions.length === 0 && (
                    <div 
                      className="autocomplete-item"
                      style={{ textAlign: "center", color: "var(--brand2)", fontWeight: 700 }}
                      onMouseDown={() => {
                        setShowCreator(true);
                        setShowSug(false);
                      }}
                    >
                      + Crear ejercicio "{exName}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Filter Exercise chips when no input */}
            {!exName && (
              <div style={{ marginBottom: 20 }}>
                <p className="label" style={{ fontSize: "0.7rem", marginBottom: 6 }}>Filtrar ejercicios rápidos</p>
                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
                  <select 
                    className="input" 
                    style={{ minHeight: 38, height: 38, padding: "0 10px", fontSize: "0.8rem", width: "auto", flexShrink: 0 }}
                    value={filterMuscle}
                    onChange={e => setFilterMuscle(e.target.value)}
                  >
                    <option value="">Todos los músculos</option>
                    {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select 
                    className="input" 
                    style={{ minHeight: 38, height: 38, padding: "0 10px", fontSize: "0.8rem", width: "auto", flexShrink: 0 }}
                    value={filterEquip}
                    onChange={e => setFilterEquip(e.target.value)}
                  >
                    <option value="">Todo equipamiento</option>
                    {EQUIPMENTS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                  </select>
                </div>
                
                {/* Filtered quick exercises */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  {dbExercises
                    .filter(ex => (!filterMuscle || ex.muscleGroup === filterMuscle) && (!filterEquip || ex.equipment === filterEquip))
                    .slice(0, 10)
                    .map(ex => (
                      <button 
                        key={ex.id} 
                        type="button" 
                        className="chip"
                        onClick={() => setExName(ex.name)}
                      >
                        {ex.name}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Steppers */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
              <div>
                <label className="label">Series</label>
                <Stepper value={sets} onChange={setSets} min={1} unit="series" />
              </div>
              <div>
                <label className="label">Repeticiones</label>
                <Stepper value={reps} onChange={setReps} min={1} unit="reps" />
              </div>
              <div>
                <label className="label">Peso ({unit.toUpperCase()})</label>
                <Stepper value={weight} onChange={setWeight} min={0} step={unit === "lbs" ? 5 : 2.5} unit={unit} />
              </div>
            </div>

            {/* Volume Tonnage preview */}
            {exName && weight > 0 && (
              <div style={{
                padding: "14px 18px", borderRadius: "var(--radius-sm)",
                background: "linear-gradient(135deg, rgba(0,255,135,0.08), rgba(0,198,255,0.04))",
                border: "1px solid rgba(0,255,135,0.15)",
                marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>Tonelaje estimado</p>
                  <p style={{ margin: "4px 0 0", fontSize: "1.6rem", fontWeight: 900, color: "var(--brand)", letterSpacing: "-0.03em" }}>
                    {currentVolume.toLocaleString()}<span style={{ fontSize: "0.9rem", fontWeight: 700 }}> {unit}</span>
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)", fontWeight: 700 }}>{sets} × {reps} × {weight} {unit}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--text2)", fontWeight: 600 }}>{exName.slice(0, 20)}</p>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={busy || !exName} style={{ fontSize: "1.05rem" }}>
              {busy ? "Guardando…" : "Registrar serie"}
            </button>
          </form>

          {/* Recent logs */}
          {logs.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <p className="section-title">Historial reciente</p>
              {logs.slice(0, 10).map(l => (
                <div key={l.id} className="log-card">
                  <div style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                    background: "rgba(0,255,135,0.1)", display: "flex", alignItems: "center", justifyContent: "center"
                  }}><Dumbbell size={18} color="var(--brand)" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="log-ex-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.exercise.name}
                    </p>
                    <p className="log-detail">{l.sets}×{l.reps} · {convertWeight(l.weightKg)}{unit}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span className="badge badge-green">{convertVolume(l.volumeKg)}{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── RUTINAS TAB ── */}
      {tab === "rutinas" && (
        <div className="anim-fade">
          {programs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="empty-title">Sin rutinas asignadas</p>
              <p className="empty-sub">Pedile a tu trainer que te asigne una rutina personalizada.</p>
            </div>
          ) : programs.map(p => (
            <div key={p.id} className="glass card" style={{ marginBottom: 16, padding: "20px" }}>
              <p style={{ margin: 0, fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>{p.name}</p>
              {p.description && <p style={{ margin: "6px 0 16px", fontSize: "0.85rem", color: "var(--text2)", lineHeight: 1.4 }}>{p.description}</p>}

              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: p.description ? 0 : 16 }}>
                {p.workouts?.map(w => {
                  const isReordering = reorderWorkoutId === w.id;
                  const estimatedTonnage = getEstimatedTonnage(w);

                  return (
                    <div key={w.id} style={{
                      padding: 16,
                      borderRadius: "var(--radius-sm)",
                      border: `1.5px solid #7c3aed28`,
                      background: `linear-gradient(135deg, rgba(124,58,237,0.03) 0%, rgba(255,255,255,0.015) 100%)`,
                      boxShadow: `0 8px 24px -4px rgba(0,0,0,0.2)`,
                      marginBottom: 12
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 900, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {w.name}
                        </p>

                        {/* Estimated Tonnage Badge */}
                        <span className="badge badge-blue" style={{ textTransform: "none" }} title="Tonelaje estimado con tus pesos anteriores">
                          Estimado: {estimatedTonnage} {unit}
                        </span>
                      </div>

                      {/* Reordering Controls / Actions */}
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                        {isReordering ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setReorderWorkoutId(null)} className="btn btn-ghost btn-xs">Cancelar</button>
                            <button onClick={saveOrder} className="btn btn-primary btn-xs" style={{ background: "var(--brand)" }}>Guardar orden</button>
                          </div>
                        ) : (
                          <button onClick={() => startReorder(w)} className="btn btn-ghost btn-xs">
                            <Plus size={10} /> Ordenar ejercicios
                          </button>
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(isReordering ? reorderExercises : w.exercises).map((ex, i) => (
                          <div 
                            key={ex.id} 
                            draggable={isReordering}
                            onDragStart={(e) => handleDragStart(e, i)}
                            onDragOver={(e) => handleDragOver(e, i)}
                            onDrop={(e) => handleDrop(e, i)}
                            onDragEnd={handleDragEnd}
                            onClick={() => {
                              if (isReordering) return;
                              setExName(ex.exercise.name);
                              setSets(ex.targetSets);
                              
                              const parseReps = (repsStr: string): number => {
                                const clean = repsStr.replace(/[^\d-]/g, "");
                                if (clean.includes("-")) {
                                  const parts = clean.split("-").map(Number);
                                  return parts[1] || parts[0] || 10;
                                }
                                return Number(clean) || 10;
                              };
                              setReps(parseReps(ex.targetReps));

                              if (ex.targetWeight) {
                                setWeight(convertWeightFromUnit(ex.targetWeight, ex.weightUnit || "kg"));
                              } else {
                                setWeight(20);
                              }
                              
                              setTab("log");
                              setToast({ msg: `Cargado: ${ex.exercise.name}`, type: "success" });
                            }}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "12px 14px", borderRadius: "var(--radius-xs)",
                              background: (isReordering && draggedIdx === i) 
                                ? "rgba(255,255,255,0.02)" 
                                : "rgba(8,10,20,0.4)",
                              border: (isReordering && dragOverIdx === i)
                                ? "1.5px solid var(--brand)"
                                : (isReordering && draggedIdx === i)
                                  ? "1.5px dashed var(--border2)"
                                  : "1.5px solid var(--border)",
                              borderLeft: `4.5px solid ${ex.color || "#7c3aed"}`,
                              opacity: (isReordering && draggedIdx === i) ? 0.4 : 1,
                              transform: (isReordering && dragOverIdx === i) 
                                ? "translateY(2px)" 
                                : (isReordering && draggedIdx === i) 
                                  ? "scale(0.98)" 
                                  : "none",
                              cursor: isReordering ? "grab" : "pointer",
                              transition: "all 140ms ease"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                              {/* Drag Reorder Arrow Handles & Grip */}
                              {isReordering ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <GripVertical size={16} style={{ color: "var(--muted)", cursor: "grab" }} />
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <button 
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); moveExercise(i, "up"); }}
                                      style={{ background: "none", border: "none", color: i === 0 ? "var(--muted)" : "var(--text)", padding: 2, cursor: "pointer" }}
                                      disabled={i === 0}
                                    >
                                      <ArrowUp size={10} />
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); moveExercise(i, "down"); }}
                                      style={{ background: "none", border: "none", color: i === reorderExercises.length - 1 ? "var(--muted)" : "var(--text)", padding: 2, cursor: "pointer" }}
                                      disabled={i === reorderExercises.length - 1}
                                    >
                                      <ArrowDown size={10} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                ex.orderLabel && (
                                  <span style={{
                                    background: ex.color || "#7c3aed",
                                    color: "#000", fontSize: "0.72rem", fontWeight: 900,
                                    padding: "3px 7px", borderRadius: 5, minWidth: 22, textAlign: "center"
                                  }}>{ex.orderLabel}</span>
                                )
                              )}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {ex.exercise.name}
                                  </p>
                                  {ex.exercise.gifUrl && (
                                    <button 
                                      type="button" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewGif(ex.exercise.gifUrl);
                                        setPreviewName(ex.exercise.name);
                                      }}
                                      style={{ background: "none", border: "none", color: "var(--brand)", cursor: "pointer", display: "flex", padding: 0 }}
                                    >
                                      <Eye size={14} />
                                    </button>
                                  )}
                                </div>
                                {ex.groupName && <p style={{ margin: 0, fontSize: "0.72rem", color: ex.color || "#7c3aed", fontWeight: 600 }}>{ex.groupName}</p>}
                              </div>
                            </div>
                            <div style={{ textAlign: "right", marginLeft: 8 }}>
                              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 800 }}>{ex.targetSets}×{ex.targetReps}</p>
                              <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--muted)", fontWeight: 600 }}>
                                {ex.targetWeight ? `${convertWeightFromUnit(ex.targetWeight, ex.weightUnit || "kg")}${unit} · ` : ""}
                                {ex.restSec}s desc.
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── EJERCICIOS (BIBLIOTECA) TAB ── */}
      {tab === "ejercicios" && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Controles de Búsqueda y Filtro */}
          <div className="glass card" style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                style={{ minHeight: 44, height: 44, fontSize: "0.9rem", flex: 1 }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar ejercicio..."
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select 
                className="input" 
                style={{ minHeight: 38, height: 38, padding: "0 10px", fontSize: "0.8rem", width: "auto", flex: 1 }}
                value={filterMuscle}
                onChange={e => setFilterMuscle(e.target.value)}
              >
                <option value="">Todos los músculos</option>
                {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select 
                className="input" 
                style={{ minHeight: 38, height: 38, padding: "0 10px", fontSize: "0.8rem", width: "auto", flex: 1 }}
                value={filterEquip}
                onChange={e => setFilterEquip(e.target.value)}
              >
                <option value="">Todo equipamiento</option>
                {EQUIPMENTS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
              </select>
            </div>
          </div>

          {/* Listado de ejercicios en la base de datos */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "50dvh", overflowY: "auto", paddingBottom: 16 }}>
            {dbExercises
              .filter(ex => {
                const matchesSearch = !searchQuery || ex.name.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesMuscle = !filterMuscle || ex.muscleGroup === filterMuscle;
                const matchesEquip = !filterEquip || ex.equipment === filterEquip;
                return matchesSearch && matchesMuscle && matchesEquip;
              })
              .map(ex => (
                <div 
                  key={ex.id}
                  className="list-item"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", margin: 0 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.92rem" }}>{ex.name}</p>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)" }}>{ex.muscleGroup} · {ex.equipment}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {ex.gifUrl && (
                      <button 
                        type="button"
                        onClick={() => {
                          setPreviewGif(ex.gifUrl);
                          setPreviewName(ex.name);
                        }}
                        style={{ background: "rgba(0,255,135,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      >
                        <Eye size={16} color="var(--brand)" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setExName(ex.name);
                        setTab("log");
                      }}
                      style={{ background: "rgba(0,198,255,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      title="Registrar"
                    >
                      <Plus size={16} color="var(--brand2)" />
                    </button>
                  </div>
                </div>
              ))}
            {dbExercises.filter(ex => {
              const matchesSearch = !searchQuery || ex.name.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesMuscle = !filterMuscle || ex.muscleGroup === filterMuscle;
              const matchesEquip = !filterEquip || ex.equipment === filterEquip;
              return matchesSearch && matchesMuscle && matchesEquip;
            }).length === 0 && (
              <div className="empty-state glass">
                <p className="empty-title">No se encontraron ejercicios</p>
                <p className="empty-sub">Probá cambiando los términos de búsqueda o filtros.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PREVIEW GIF MODAL ── */}
      {previewGif && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={() => setPreviewGif(null)}>
          <div className="glass card" style={{
            width: "100%", maxWidth: 360, textAlign: "center", background: "#0c0f1d", border: "1px solid var(--border2)"
          }} onClick={e => e.stopPropagation()}>
            <p style={{ fontWeight: 800, fontSize: "1.1rem", margin: "0 0 12px", color: "var(--brand)" }}>{previewName}</p>
            
            {/* The Image/GIF */}
            <div style={{ background: "#000", borderRadius: 14, overflow: "hidden", minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img 
                src={previewGif} 
                alt={previewName} 
                style={{ width: "100%", height: "auto", display: "block" }}
                onError={(e) => {
                  // Fallback fallback if gif link fails
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400";
                }}
              />
            </div>

            <button onClick={() => setPreviewGif(null)} className="btn btn-ghost btn-sm btn-full" style={{ marginTop: 14 }}>
              Cerrar Vista
            </button>
          </div>
        </div>
      )}

      {/* ── CUSTOM EXERCISE CREATOR MODAL ── */}
      {showCreator && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9990,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={() => setShowCreator(false)}>
          <form onSubmit={saveCustomExercise} className="glass card" style={{
            width: "100%", maxWidth: 400, background: "#0c0f1d", display: "flex", flexDirection: "column", gap: 14
          }} onClick={e => e.stopPropagation()}>
            <p style={{ fontWeight: 900, fontSize: "1.15rem", margin: 0, display: "flex", alignItems: "center", gap: 6, color: "var(--brand)" }}>
              <Sparkles size={18} /> Crear Ejercicio Personalizado
            </p>

            <div className="field">
              <label className="label">Nombre del Ejercicio</label>
              <input className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Flexión declinada" required />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label className="label">Grupo Muscular</label>
                <select className="input" value={newMuscle} onChange={e => setNewMuscle(e.target.value)}>
                  {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Equipamiento</label>
                <select className="input" value={newEquip} onChange={e => setNewEquip(e.target.value)}>
                  {EQUIPMENTS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                </select>
              </div>
            </div>

            <div className="field">
              <label className="label">Instrucciones de ejecución (opcional)</label>
              <textarea className="input" rows={2} value={newInstructions} onChange={e => setNewInstructions(e.target.value)} placeholder="Ej. Mantener codos a 45 grados..." />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="button" onClick={() => setShowCreator(false)} className="btn btn-ghost btn-full" style={{ flex: 1 }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-full" style={{ flex: 1 }} disabled={busy || !newName}>
                {busy ? "Creando..." : "Crear Ejercicio"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Mascota flotante ── */}
      <Mascota context="rutinas" />
    </main>
  );
}
