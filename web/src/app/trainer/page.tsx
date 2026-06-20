"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Toast } from "@/components/toast";
import {
  Users,
  ClipboardList,
  Plus,
  Trash2,
  Dumbbell,
  Search,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Star,
  Award,
  Flame,
  Eye
} from "lucide-react";

type ToastType = { msg: string; type: "success" | "error" };

type AthleteProfile = {
  sex: string | null;
  ageYears: number | null;
  heightCm: number | null;
  weightKg: number | null;
  activity: string | null;
  tdeeKcal: number | null;
  avatarUrl: string | null;
  grade: string | null;
  medals: string | null;
  streak: number;
  maxStreak: number;
};

type Athlete = {
  id: string;
  name: string | null;
  email: string;
  profile: AthleteProfile | null;
  assignedPrograms: { program: { id: string; name: string } }[];
};

type Program = {
  id: string;
  name: string;
  description: string | null;
  workouts: {
    id: string;
    name: string;
    exercises: {
      id: string;
      targetSets: number;
      targetReps: string;
      restSec: number;
      groupName: string | null;
      color: string | null;
      orderLabel: string | null;
      targetWeight?: number | null;
      weightUnit?: string | null;
      exercise: { name: string };
      isSuperSet?: boolean;
    }[];
  }[];
};

type ExInput = {
  name: string;
  sets: number;
  reps: string;
  rest: number;
  groupName: string;
  color: string;
  orderLabel: string;
  targetWeight?: number;
  weightUnit?: string;
  isSuperSet?: boolean;
};
type WorkoutInput = { name: string; exercises: ExInput[] };

const parseWorkoutName = (fullName: string) => {
  const match = fullName.match(/^\[(#[0-9a-fA-F]{6})\]\s*(.*)$/);
  if (match) {
    return { color: match[1], cleanName: match[2] };
  }
  return { color: null, cleanName: fullName };
};



const MEDALS_TYPES = [
  { id: "Novato", title: "Novato" },
  { id: "Constante", title: "Constante" },
  { id: "Fuerza Brutal", title: "Fuerza Brutal" },
  { id: "Superacion", title: "Superación" },
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

type PendingUser = { id: string; name: string | null; email: string; role: string; createdAt: string };

export default function TrainerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [toast, setToast] = useState<ToastType | null>(null);
  const [tab, setTab] = useState<"alumnos" | "rutinas">("alumnos");

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

  // assign form
  const [selAthlete, setSelAthlete] = useState("");
  const [selProgram, setSelProgram] = useState("");

  // advanced create routine form
  const [progName, setProgName] = useState("");
  const [progDesc, setProgDesc] = useState("");
  const [workouts, setWorkouts] = useState<WorkoutInput[]>([]);
  const [busy, setBusy] = useState(false);
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedDays, setSelectedDays] = useState<Record<string, string[]>>({});

  // expanded routines state for preview
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});

  // Student details modal / evaluation form
  const [activeAthlete, setActiveAthlete] = useState<Athlete | null>(null);
  const [grade, setGrade] = useState("");
  const [medals, setMedals] = useState<string[]>([]);

  // Creador de rutinas: exercise selector modal
  const [searchExModal, setSearchExModal] = useState<{ wIdx: number; eIdx: number } | null>(null);
  const [activeInput, setActiveInput] = useState<{ wIdx: number; eIdx: number } | null>(null);
  const [exerciseDb, setExerciseDb] = useState<any[]>([]);
  const [trainerSearchQuery, setTrainerSearchQuery] = useState("");
  const [trainerFilterMuscle, setTrainerFilterMuscle] = useState("");
  const [trainerFilterEquip, setTrainerFilterEquip] = useState("");
  const [previewGif, setPreviewGif] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  const toggleProgramExpand = (id: string) => {
    setExpandedPrograms(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  const load = async () => {
    if (user?.role === "ATHLETE") return;
    const [ar, pr, er, pu] = await Promise.all([
      fetch("/api/trainer/alumnos").then(r => r.json()),
      fetch("/api/trainer/programas").then(r => r.json()),
      fetch("/api/exercises").then(r => r.json()),
      fetch("/api/admin/users?pending=true").then(r => r.json()),
    ]);
    setAthletes(ar.athletes ?? []);
    setPrograms(pr.programs ?? []);
    setExerciseDb(er.exercises ?? []);
    setPendingUsers(pu.users ?? []);
    if (!selProgram && pr.programs?.[0]) setSelProgram(pr.programs[0].id);
    if (!selAthlete && ar.athletes?.[0]) setSelAthlete(ar.athletes[0].id);
  };

  const approveUser = async (userId: string, approved: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, approved }),
      });
      if (res.ok) {
        setToast({ msg: approved ? "Acceso aprobado ✅" : "Usuario rechazado", type: approved ? "success" : "error" });
        await load();
      }
    } catch {
      setToast({ msg: "Error de red", type: "error" });
    }
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // create athlete form state
  const [showCreateAthlete, setShowCreateAthlete] = useState(false);
  const [newAthleteName, setNewAthleteName] = useState("");
  const [newAthleteEmail, setNewAthleteEmail] = useState("");
  const [newAthletePassword, setNewAthletePassword] = useState("");

  const createAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAthleteName || !newAthleteEmail) return;
    setBusy(true);
    try {
      const res = await fetch("/api/trainer/alumnos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: newAthleteName,
          email: newAthleteEmail,
          password: newAthletePassword || undefined
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setToast({ msg: `Alumno ${newAthleteName} creado ✅`, type: "success" });
        setNewAthleteName("");
        setNewAthleteEmail("");
        setNewAthletePassword("");
        setShowCreateAthlete(false);
        await load();
        if (data.athlete?.id) {
          setSelAthlete(data.athlete.id);
        }
      } else {
        const d = await res.json();
        setToast({ msg: d.error || "Error al crear alumno", type: "error" });
      }
    } catch {
      setToast({ msg: "Error de red", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selAthlete || !selProgram) return;
    setBusy(true);
    try {
      const res = await fetch("/api/trainer/alumnos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ athleteId: selAthlete, programId: selProgram }),
      });
      if (res.ok) {
        setToast({ msg: "Rutina asignada ✅", type: "success" });
        await load();
      } else {
        const d = await res.json();
        setToast({ msg: d.error, type: "error" });
      }
    } finally {
      setBusy(false);
    }
  };

  const createRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progName) return;
    setBusy(true);
    try {
      const res = await fetch("/api/trainer/programas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: progName, description: progDesc, workouts }),
      });
      if (res.ok) {
        setToast({ msg: "Rutina creada ✅", type: "success" });
        setProgName("");
        setProgDesc("");
        setWorkouts([]);
        setSelectedDays({});
        setWizardStep(1);
        await load();
      } else {
        const d = await res.json();
        setToast({ msg: d.error, type: "error" });
      }
    } finally {
      setBusy(false);
    }
  };

  const saveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAthlete) return;
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          athleteId: activeAthlete.id,
          grade,
          medals: medals.join(",")
        })
      });
      if (res.ok) {
        setToast({ msg: "Evaluación del alumno guardada ✅", type: "success" });
        setActiveAthlete(null);
        await load();
      } else {
        const d = await res.json();
        setToast({ msg: d.error ?? "Error al evaluar", type: "error" });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSelectAthlete = (athlete: Athlete) => {
    setActiveAthlete(athlete);
    setGrade(athlete.profile?.grade ?? "");
    setMedals(athlete.profile?.medals ? athlete.profile.medals.split(",").map(m => m.trim()) : []);
  };

  const toggleMedal = (medalId: string) => {
    setMedals(prev => 
      prev.includes(medalId) ? prev.filter(m => m !== medalId) : [...prev, medalId]
    );
  };

  const addEx = (wIdx: number) => {
    const ws = [...workouts];
    ws[wIdx].exercises.push({
      name: "",
      sets: 3,
      reps: "10",
      rest: 60,
      groupName: "",
      color: "#3b82f6",
      orderLabel: String(ws[wIdx].exercises.length + 1),
      targetWeight: 20,
      weightUnit: "kg"
    });
    setWorkouts(ws);
  };
  const updateEx = (wIdx: number, eIdx: number, field: keyof ExInput, val: any) => {
    const ws = [...workouts];
    ws[wIdx].exercises[eIdx] = { ...ws[wIdx].exercises[eIdx], [field]: val };
    setWorkouts(ws);
  };
  const removeEx = (wIdx: number, eIdx: number) => {
    const ws = [...workouts];
    ws[wIdx].exercises = ws[wIdx].exercises.filter((_, i) => i !== eIdx);
    setWorkouts(ws);
  };
  const moveExInWorkout = (wIdx: number, eIdx: number, direction: "up" | "down") => {
    const ws = [...workouts];
    const targetIdx = direction === "up" ? eIdx - 1 : eIdx + 1;
    if (targetIdx < 0 || targetIdx >= ws[wIdx].exercises.length) return;
    const temp = ws[wIdx].exercises[eIdx];
    ws[wIdx].exercises[eIdx] = ws[wIdx].exercises[targetIdx];
    ws[wIdx].exercises[targetIdx] = temp;
    // Update order labels automatically
    ws[wIdx].exercises = ws[wIdx].exercises.map((ex, idx) => ({
      ...ex,
      orderLabel: String(idx + 1)
    }));
    setWorkouts(ws);
  };

  if (loading || !user) return <Loader />;

  if (user.role === "ATHLETE") {
    return (
      <main className="page anim-fade" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "80dvh" }}>
        <div className="empty-state glass">
          <div className="empty-state-icon" style={{ background: "rgba(255,71,87,0.1)", color: "var(--danger)" }}>
            <ShieldAlert size={36} />
          </div>
          <h1 className="empty-title">Acceso Denegado</h1>
          <p className="empty-sub">
            Esta sección es exclusiva para Personal Trainers autorizados.
          </p>
          <button onClick={() => router.push("/dashboard")} className="btn btn-ghost btn-full" style={{ marginTop: 12 }}>
            Volver a mi panel
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page anim-fade">
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Panel Trainer</h1>
          <p className="page-sub" style={{ margin: 0 }}>Gestioná tus alumnos y armá sus rutinas</p>
        </div>
        <span className="badge badge-purple">{user.role}</span>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div className="stat-card glass" style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -10, bottom: -10, opacity: 0.1, color: "var(--brand)" }}>
            <Users size={72} />
          </div>
          <span className="stat-label">Alumnos</span>
          <span className="stat-value" style={{ color: "var(--brand)" }}>{athletes.length}</span>
        </div>
        <div className="stat-card glass" style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -10, bottom: -10, opacity: 0.1, color: "var(--brand2)" }}>
            <ClipboardList size={72} />
          </div>
          <span className="stat-label">Rutinas</span>
          <span className="stat-value" style={{ color: "var(--brand2)" }}>{programs.length}</span>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === "alumnos" ? "active" : ""}`} onClick={() => setTab("alumnos")}>
          <Users size={16} /> Alumnos
        </button>
        <button className={`tab-btn ${tab === "rutinas" ? "active" : ""}`} onClick={() => setTab("rutinas")}>
          <ClipboardList size={16} /> Rutinas
        </button>
      </div>

      {/* ── ALUMNOS ── */}
      {tab === "alumnos" && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Accesos pendientes */}
          {pendingUsers.length > 0 && (
            <div className="glass card" style={{ display: "flex", flexDirection: "column", gap: 12, border: "1.5px solid rgba(255,179,0,0.3)", background: "rgba(255,179,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1.1rem" }}>⏳</span>
                <p className="section-title" style={{ margin: 0, color: "#ffb300" }}>Accesos Pendientes ({pendingUsers.length})</p>
              </div>
              {pendingUsers.map(u => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border)" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #ffb300, #ff5e3a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#111", flexShrink: 0, fontSize: "0.95rem" }}>
                    {(u.name ?? u.email)[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name ?? u.email}</p>
                      <span className={`badge ${u.role === "TRAINER" ? "badge-blue" : "badge-purple"}`} style={{ fontSize: "0.6rem", padding: "0 6px", height: 16 }}>
                        {u.role === "TRAINER" ? "Trainer" : "Alumno"}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text2)" }}>{u.email}</p>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => approveUser(u.id, true)} className="btn btn-xs" style={{ background: "rgba(0,255,135,0.15)", border: "1px solid rgba(0,255,135,0.4)", color: "var(--brand)", minWidth: 70 }}>✓ Aprobar</button>
                    <button onClick={() => approveUser(u.id, false)} className="btn btn-xs" style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", color: "var(--danger)", minWidth: 70 }}>✗ Rechazar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Create/Assign panel */}
          <div className="glass card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p className="section-title" style={{ margin: 0 }}>Asignar plan de entrenamiento</p>
              <button
                type="button"
                onClick={() => setShowCreateAthlete(!showCreateAthlete)}
                className={`btn btn-xs ${showCreateAthlete ? "btn-danger" : "btn-ghost"}`}
              >
                {showCreateAthlete ? "Cancelar" : "+ Nuevo Alumno"}
              </button>
            </div>

            {showCreateAthlete ? (
              <form onSubmit={createAthlete} className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="field">
                  <label className="label">Nombre completo</label>
                  <input
                    className="input"
                    value={newAthleteName}
                    onChange={e => setNewAthleteName(e.target.value)}
                    placeholder="Ej. Pedro Pérez"
                    required
                  />
                </div>
                <div className="field">
                  <label className="label">Email</label>
                  <input
                    className="input"
                    type="email"
                    value={newAthleteEmail}
                    onChange={e => setNewAthleteEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    required
                  />
                </div>
                <div className="field">
                  <label className="label">Contraseña (por defecto: 123456)</label>
                  <input
                    className="input"
                    type="password"
                    value={newAthletePassword}
                    onChange={e => setNewAthletePassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={busy || !newAthleteName || !newAthleteEmail}>
                  {busy ? "Creando…" : "Registrar alumno"}
                </button>
              </form>
            ) : (
              <form onSubmit={assign} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="field">
                  <label className="label">Alumno</label>
                  <select className="input" value={selAthlete} onChange={e => setSelAthlete(e.target.value)} required>
                    <option value="">Seleccioná un alumno…</option>
                    {athletes.map(a => (
                      <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="label">Rutina a asignar</label>
                  <select className="input" value={selProgram} onChange={e => setSelProgram(e.target.value)} required>
                    <option value="">Seleccioná una rutina…</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={busy || !selAthlete || !selProgram}>
                  {busy ? "Asignando plan..." : "Asignar rutina →"}
                </button>
              </form>
            )}
          </div>

          {/* Listado de alumnos */}
          <div>
            <p className="section-title">Listado de atletas (hacé clic para evaluar y calificar)</p>
            {athletes.length === 0 ? (
              <div className="empty-state glass">
                <div className="empty-state-icon">
                  <Search size={28} />
                </div>
                <p className="empty-title">Aún no hay atletas registrados</p>
                <p className="empty-sub">Hacé clic en "+ Nuevo Alumno" arriba para agregar el primero.</p>
              </div>
            ) : (
              athletes.map(a => (
                <div key={a.id} className="list-item" onClick={() => handleSelectAthlete(a)} style={{ cursor: "pointer" }}>
                  {a.profile?.avatarUrl ? (
                    <img 
                      src={a.profile.avatarUrl} 
                      alt="Avatar" 
                      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} 
                    />
                  ) : (
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: "linear-gradient(135deg, var(--brand3), var(--brand2))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      color: "#fff"
                    }}>
                      {(a.name ?? a.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.name ?? a.email}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--text2)" }}>
                      {a.profile?.streak ? `Racha: ${a.profile.streak} d | ` : ""}
                      {a.profile?.grade ? `Nota: ${a.profile.grade}` : "Sin evaluar"}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {a.assignedPrograms.length > 0 ? (
                      <span className="badge badge-green" style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {a.assignedPrograms[0].program.name}
                      </span>
                    ) : (
                      <span className="badge badge-gray">Sin rutina</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── RUTINAS ── */}
      {tab === "rutinas" && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Create routine wizard form */}
          <form onSubmit={createRoutine} className="glass card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p className="section-title" style={{ margin: 0 }}>Diseñador de rutinas</p>

            {/* Wizard Steps indicator */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
              {[
                { step: 1, title: "📋 Datos" },
                { step: 2, title: "📅 Días" },
                { step: 3, title: "🏋️ Ejercicios" }
              ].map(s => (
                <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 900, fontSize: "0.85rem",
                    background: wizardStep === s.step ? "linear-gradient(135deg, var(--brand), var(--brand2))" : wizardStep > s.step ? "var(--brand)" : "rgba(255,255,255,0.05)",
                    color: wizardStep >= s.step ? "#000" : "var(--text2)",
                    transition: "all 200ms"
                  }}>
                    {s.step}
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: wizardStep === s.step ? 800 : 500, color: wizardStep === s.step ? "var(--brand)" : "var(--muted)" }}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>

            {/* STEP 1: GENERAL INFO */}
            {wizardStep === 1 && (
              <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="field">
                  <label className="label" style={{ fontSize: "0.9rem", fontWeight: 800 }}>Nombre de la rutina</label>
                  <input className="input" value={progName} onChange={e => setProgName(e.target.value)}
                    placeholder="Ej. Mi rutina de fuerza / Arnold Split..." style={{ minHeight: 52 }} required />
                </div>
                <div className="field">
                  <label className="label" style={{ fontSize: "0.9rem", fontWeight: 800 }}>Descripción (opcional)</label>
                  <textarea className="input" value={progDesc} onChange={e => setProgDesc(e.target.value)}
                    placeholder="Objetivo principal del plan, semanas recomendadas..." rows={3} />
                </div>
                
                {/* Splits pre-hechos (quick sets) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.08em" }}>SPLITS PRE-HECHOS (PLANTILLAS DE DÍAS):</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => {
                      setSelectedDays({
                        "Lunes": ["Pecho", "Brazos"],
                        "Miércoles": ["Piernas"],
                        "Viernes": ["Espalda", "Hombros"]
                      });
                      setToast({ msg: "Plantilla 3 días cargada (Tirón/Empuje/Pierna)", type: "success" });
                    }}>3 días (Pecho+Brazos / Piernas / Espalda+Hombros)</button>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => {
                      setSelectedDays({
                        "Lunes": ["Pecho", "Hombros", "Tríceps"],
                        "Martes": ["Espalda", "Bíceps"],
                        "Jueves": ["Piernas"],
                        "Viernes": ["Cardio", "Abdomen"]
                      });
                      setToast({ msg: "Plantilla 4 días cargada", type: "success" });
                    }}>4 días (Torso / Pierna / Cardio)</button>
                  </div>
                </div>

                <button type="button" onClick={() => {
                  if (!progName.trim()) {
                    setToast({ msg: "Ingresá un nombre para la rutina", type: "error" });
                    return;
                  }
                  setWizardStep(2);
                }} className="btn btn-primary btn-full" style={{ minHeight: 56, fontSize: "1rem", fontWeight: 800 }}>
                  Elegir días de entrenamiento ➔
                </button>
              </div>
            )}

            {/* STEP 2: DAYS & MUSCLES SELECTION */}
            {wizardStep === 2 && (
              <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>Seleccioná qué días se entrena y qué se trabaja cada día</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map(day => {
                    const isDaySelected = selectedDays[day] !== undefined;
                    const muscles = selectedDays[day] || [];
                    
                    return (
                      <div key={day} className="glass" style={{
                        borderRadius: "var(--radius-sm)",
                        padding: 14,
                        border: isDaySelected ? "1.5px solid var(--brand)" : "1px solid var(--border)",
                        background: isDaySelected ? "rgba(0, 255, 135, 0.02)" : "rgba(255,255,255,0.01)",
                        transition: "all 150ms"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isDaySelected ? 10 : 0 }}>
                          <button
                            type="button"
                            onClick={() => {
                              const newDays = { ...selectedDays };
                              if (isDaySelected) {
                                delete newDays[day];
                              } else {
                                newDays[day] = [];
                              }
                              setSelectedDays(newDays);
                            }}
                            style={{
                              padding: "10px 14px",
                              borderRadius: "var(--radius-xs)",
                              border: isDaySelected ? "2px solid var(--brand)" : "1.5px solid var(--border2)",
                              background: isDaySelected ? "rgba(0, 255, 135, 0.1)" : "transparent",
                              color: isDaySelected ? "var(--brand)" : "var(--text)",
                              fontWeight: 800,
                              fontSize: "0.88rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              transition: "all 120ms"
                            }}
                          >
                            <span>{isDaySelected ? "✓" : "+"}</span> {day}
                          </button>
                          
                          {isDaySelected && (
                            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--brand2)" }}>
                              {muscles.length > 0 ? muscles.join(" + ") : "Sin músculos asignados"}
                            </span>
                          )}
                        </div>
                        
                        {isDaySelected && (
                          <div className="anim-fade" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, paddingTop: 8, borderTop: "1px dashed var(--border)" }}>
                            {["💪 Pecho", "🦴 Espalda", "🦵 Piernas", "🏋️ Hombros", "💪 Brazos", "🔥 Cardio", "🧘 Abdomen", "🦵 Piernas+Glúteos"].map(mItem => {
                              const mName = mItem.substring(2); // "Pecho", etc.
                              const isMuscleSelected = muscles.includes(mName);
                              return (
                                <button
                                  key={mItem}
                                  type="button"
                                  onClick={() => {
                                    const newDays = { ...selectedDays };
                                    const dayMuscles = newDays[day];
                                    if (dayMuscles.includes(mName)) {
                                      newDays[day] = dayMuscles.filter(x => x !== mName);
                                    } else {
                                      newDays[day] = [...dayMuscles, mName];
                                    }
                                    setSelectedDays(newDays);
                                  }}
                                  className={`chip ${isMuscleSelected ? "active" : ""}`}
                                  style={{
                                    padding: "6px 12px",
                                    fontSize: "0.75rem",
                                    border: isMuscleSelected ? "2px solid var(--brand2)" : "1px solid var(--border2)",
                                    background: isMuscleSelected ? "rgba(0, 198, 255, 0.15)" : "rgba(255,255,255,0.02)",
                                    color: isMuscleSelected ? "var(--brand2)" : "var(--text2)",
                                    borderRadius: 99,
                                    cursor: "pointer",
                                    fontWeight: 700,
                                    transition: "all 100ms"
                                  }}
                                >
                                  {mItem}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button type="button" onClick={() => setWizardStep(1)} className="btn btn-ghost" style={{ flex: 1, minHeight: 52 }}>
                    Atrás
                  </button>
                  <button type="button" onClick={() => {
                    const activeDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].filter(d => selectedDays[d] !== undefined);
                    if (activeDays.length === 0) {
                      setToast({ msg: "Elegí al menos 1 día de entrenamiento", type: "error" });
                      return;
                    }
                    
                    // Sincronizar workouts conservando ejercicios si ya existían
                    const newWorkouts = activeDays.map(day => {
                      const muscles = selectedDays[day];
                      const cleanName = muscles.length > 0 ? `${day} — ${muscles.join(" + ")}` : day;
                      const fullName = `[#7c3aed] ${cleanName}`;
                      
                      const existing = workouts.find(w => w.name.includes(day));
                      return {
                        name: fullName,
                        exercises: existing ? existing.exercises : []
                      };
                    });
                    
                    setWorkouts(newWorkouts);
                    setWizardStep(3);
                  }} className="btn btn-primary" style={{ flex: 2, minHeight: 52, fontWeight: 800 }}>
                    Asignar ejercicios ➔
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: EXERCISES ASSIGNMENT */}
            {wizardStep === 3 && (
              <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>Asigná los ejercicios, series, repeticiones y descansos para cada día</p>
                
                {workouts.map((w, wIdx) => {
                  const { cleanName: dayCleanName } = parseWorkoutName(w.name);
                  return (
                    <div key={wIdx} className="glass" style={{
                      borderRadius: "var(--radius-sm)",
                      padding: 16,
                      border: "1.5px solid rgba(124, 58, 237, 0.25)",
                      background: "linear-gradient(135deg, rgba(124,58,237,0.03) 0%, rgba(255,255,255,0.01) 100%)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                        <span style={{ fontSize: "1.1rem" }}>📅</span>
                        <h4 style={{ margin: 0, fontWeight: 900, fontSize: "1rem", color: "var(--brand)" }}>{dayCleanName}</h4>
                      </div>
                      
                      {/* Exercises list */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {w.exercises.map((ex, eIdx) => (
                          <div key={eIdx} style={{
                            background: "rgba(255,255,255,0.015)",
                            borderLeft: `4px solid ${ex.isSuperSet ? "var(--brand3)" : "var(--brand2)"}`,
                            borderTop: "1px solid var(--border)",
                            borderRight: "1px solid var(--border)",
                            borderBottom: "1px solid var(--border)",
                            padding: 12,
                            borderRadius: "var(--radius-xs)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12
                          }}>
                            {/* Row 1: Move arrows, Name search, SuperSet switch and delete */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <button type="button" onClick={() => moveExInWorkout(wIdx, eIdx, "up")} disabled={eIdx === 0} style={{ padding: "2px 4px", fontSize: "0.7rem", borderRadius: 4, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", color: eIdx === 0 ? "var(--muted)" : "#fff" }}>▲</button>
                                <button type="button" onClick={() => moveExInWorkout(wIdx, eIdx, "down")} disabled={eIdx === w.exercises.length - 1} style={{ padding: "2px 4px", fontSize: "0.7rem", borderRadius: 4, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", color: eIdx === w.exercises.length - 1 ? "var(--muted)" : "#fff" }}>▼</button>
                              </div>
                              
                              <div style={{ flex: 1, minWidth: 150, position: "relative" }}>
                                <input
                                  className="input"
                                  value={ex.name}
                                  onChange={e => {
                                    updateEx(wIdx, eIdx, "name", e.target.value);
                                    setActiveInput({ wIdx, eIdx });
                                  }}
                                  onFocus={() => setActiveInput({ wIdx, eIdx })}
                                  onBlur={() => setTimeout(() => setActiveInput(null), 250)}
                                  placeholder="Buscá o escribí ejercicio..."
                                  style={{ minHeight: 40, height: 40, fontSize: "0.85rem" }}
                                  required
                                />
                                {activeInput?.wIdx === wIdx && activeInput?.eIdx === eIdx && (
                                  <div style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    background: "#0c0f1d",
                                    border: "1.5px solid var(--border)",
                                    borderRadius: 12,
                                    maxHeight: 180,
                                    overflowY: "auto",
                                    zIndex: 1000,
                                    boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
                                    marginTop: 4
                                  }}>
                                    {(() => {
                                      const query = ex.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                                      const suggestions = exerciseDb.filter(item => {
                                        if (!query) return true;
                                        const nameNorm = item.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                                        return nameNorm.includes(query);
                                      }).slice(0, 8);

                                      if (suggestions.length === 0) {
                                        return (
                                          <div style={{ padding: "10px 12px", fontSize: "0.75rem", color: "var(--muted)" }}>
                                            Crear "{ex.name}"
                                          </div>
                                        );
                                      }

                                      return suggestions.map(item => (
                                        <button
                                          key={item.id}
                                          type="button"
                                          onMouseDown={() => {
                                            updateEx(wIdx, eIdx, "name", item.name);
                                            setActiveInput(null);
                                          }}
                                          style={{
                                            width: "100%",
                                            textAlign: "left",
                                            padding: "10px 12px",
                                            background: "transparent",
                                            border: "none",
                                            color: "var(--text)",
                                            fontSize: "0.78rem",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center"
                                          }}
                                        >
                                          <span>{item.name}</span>
                                          <span style={{ fontSize: "0.62rem", color: "var(--brand2)", background: "rgba(0,198,255,0.08)", padding: "2px 6px", borderRadius: 6 }}>
                                            {item.muscleGroup}
                                          </span>
                                        </button>
                                      ));
                                    })()}
                                  </div>
                                )}
                              </div>
                              
                              <button type="button" onClick={() => {
                                setSearchExModal({ wIdx, eIdx });
                                setTrainerSearchQuery(ex.name);
                              }} className="btn btn-ghost btn-sm" style={{ width: 40, height: 40, padding: 0 }} title="Buscar en biblioteca">
                                <Search size={16} />
                              </button>
                              
                              {/* SuperSet Switch */}
                              <button
                                type="button"
                                onClick={() => updateEx(wIdx, eIdx, "isSuperSet", !ex.isSuperSet)}
                                className={`btn btn-xs ${ex.isSuperSet ? "active" : ""}`}
                                style={{
                                  height: 32,
                                  fontSize: "0.7rem",
                                  fontWeight: 800,
                                  background: ex.isSuperSet ? "rgba(124, 58, 237, 0.2)" : "rgba(255,255,255,0.03)",
                                  border: ex.isSuperSet ? "1.5px solid var(--brand)" : "1px solid var(--border2)",
                                  color: ex.isSuperSet ? "var(--brand)" : "var(--text2)",
                                  borderRadius: 8
                                }}
                              >
                                {ex.isSuperSet ? "💥 Súper Serie" : "Normal"}
                              </button>
                              
                              <button type="button" onClick={() => removeEx(wIdx, eIdx)} className="btn btn-ghost btn-icon-sm" style={{ color: "var(--danger)", background: "transparent", border: "none" }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                            
                            {/* Row 2: Tactile steppers for Sets, Reps, Weight, Rest */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                              {/* Sets */}
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ color: "var(--text2)", fontSize: "0.72rem", fontWeight: 800 }}>SERIES</span>
                                <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.4)", borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden", height: 32 }}>
                                  <button type="button" onClick={() => updateEx(wIdx, eIdx, "sets", Math.max(1, ex.sets - 1))} style={{ width: 26, height: "100%", background: "none", border: "none", color: "#fff", fontWeight: 800, fontSize: "1.1rem", cursor: "pointer" }}>-</button>
                                  <span style={{ width: 22, textAlign: "center", fontSize: "0.82rem", fontWeight: 900 }}>{ex.sets}</span>
                                  <button type="button" onClick={() => updateEx(wIdx, eIdx, "sets", ex.sets + 1)} style={{ width: 26, height: "100%", background: "none", border: "none", color: "#fff", fontWeight: 800, fontSize: "1.1rem", cursor: "pointer" }}>+</button>
                                </div>
                              </div>
                              
                              {/* Reps */}
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ color: "var(--text2)", fontSize: "0.72rem", fontWeight: 800 }}>REPS</span>
                                <input className="input" value={ex.reps} onChange={e => updateEx(wIdx, eIdx, "reps", e.target.value)} placeholder="Ej: 10 o 8-12" style={{ width: 64, minHeight: 32, height: 32, fontSize: "0.8rem", textAlign: "center", borderRadius: 8 }} required />
                              </div>
                              
                              {/* Weight */}
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ color: "var(--text2)", fontSize: "0.72rem", fontWeight: 800 }}>PESO</span>
                                <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.4)", borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden", height: 32 }}>
                                  <button type="button" onClick={() => updateEx(wIdx, eIdx, "targetWeight", Math.max(0, (ex.targetWeight ?? 20) - 2.5))} style={{ width: 26, height: "100%", background: "none", border: "none", color: "#fff", fontWeight: 800, cursor: "pointer" }}>-</button>
                                  <input className="input" type="number" step="0.5" value={ex.targetWeight ?? 20} onChange={e => updateEx(wIdx, eIdx, "targetWeight", Number(e.target.value))} style={{ width: 50, height: "100%", background: "transparent", border: "none", textAlign: "center", fontSize: "0.82rem", fontWeight: 900, padding: 0 }} />
                                  <button type="button" onClick={() => updateEx(wIdx, eIdx, "targetWeight", (ex.targetWeight ?? 20) + 2.5)} style={{ width: 26, height: "100%", background: "none", border: "none", color: "#fff", fontWeight: 800, cursor: "pointer" }}>+</button>
                                </div>
                                <select className="input" value={ex.weightUnit ?? "kg"} onChange={e => updateEx(wIdx, eIdx, "weightUnit", e.target.value)} style={{ width: 52, minHeight: 32, height: 32, fontSize: "0.75rem", borderRadius: 8, background: "rgba(0,0,0,0.5)", padding: "0 2px" }}>
                                  <option value="kg">kg</option>
                                  <option value="lbs">lbs</option>
                                </select>
                              </div>
                              
                              {/* Rest */}
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ color: "var(--text2)", fontSize: "0.72rem", fontWeight: 800 }}>PAUSA</span>
                                <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.4)", borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden", height: 32 }}>
                                  <button type="button" onClick={() => updateEx(wIdx, eIdx, "rest", Math.max(0, ex.rest - 15))} style={{ width: 32, height: "100%", background: "none", border: "none", color: "#fff", fontSize: "0.72rem", cursor: "pointer" }}>-15s</button>
                                  <span style={{ width: 34, textAlign: "center", fontSize: "0.8rem", fontWeight: 900 }}>{ex.rest}s</span>
                                  <button type="button" onClick={() => updateEx(wIdx, eIdx, "rest", ex.rest + 15)} style={{ width: 32, height: "100%", background: "none", border: "none", color: "#fff", fontSize: "0.72rem", cursor: "pointer" }}>+15s</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <button type="button" onClick={() => addEx(wIdx)} className="btn btn-ghost" style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: "var(--radius-xs)" }}>
                          <Plus size={16} /> Agregar ejercicio
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {/* Step 3 buttons */}
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button type="button" onClick={() => setWizardStep(2)} className="btn btn-ghost" style={{ flex: 1, minHeight: 56 }}>
                    Atrás
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2, minHeight: 56, fontWeight: 900, fontSize: "1.05rem" }} disabled={busy}>
                    {busy ? "Guardando rutina..." : "Crear rutina"}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Programs list */}
          <div>
            <p className="section-title">Biblioteca de rutinas creadas</p>
            {programs.length === 0 ? (
              <div className="empty-state glass">
                <div className="empty-state-icon">
                  <Dumbbell size={28} />
                </div>
                <p className="empty-title">Aún no creaste rutinas</p>
                <p className="empty-sub">Usá el Diseñador arriba para crear plantillas reutilizables.</p>
              </div>
            ) : (
              programs.map(p => {
                const isExpanded = expandedPrograms[p.id];
                return (
                  <div key={p.id} className="glass card" style={{ marginBottom: 12, padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: "1rem", color: "var(--text)" }}>{p.name}</p>
                        {p.description && <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--text2)" }}>{p.description}</p>}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                        <button
                          onClick={() => toggleProgramExpand(p.id)}
                          className="btn btn-ghost btn-xs"
                          style={{ height: 32, padding: "0 10px" }}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <button
                          onClick={async () => {
                            setSelProgram(p.id);
                            setTab("alumnos");
                            setToast({ msg: "Rutina elegida, ahora seleccioná el alumno", type: "success" });
                          }}
                          className="btn btn-primary btn-xs"
                          style={{ height: 32, padding: "0 12px" }}
                        >
                          Asignar
                        </button>
                        {deletingProgramId === p.id ? (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              onClick={async () => {
                                setBusy(true);
                                try {
                                  const res = await fetch("/api/trainer/programas", {
                                    method: "DELETE",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ programId: p.id })
                                  });
                                  if (res.ok) {
                                    setPrograms(prev => prev.filter(x => x.id !== p.id));
                                    setToast({ msg: "Rutina eliminada", type: "success" });
                                  } else {
                                    setToast({ msg: "Error al eliminar", type: "error" });
                                  }
                                } finally {
                                  setBusy(false);
                                  setDeletingProgramId(null);
                                }
                              }}
                              style={{ background: "var(--danger)", border: "none", borderRadius: 8, padding: "4px 8px", color: "#fff", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", height: 32 }}
                            >
                              Eliminar
                            </button>
                            <button
                              onClick={() => setDeletingProgramId(null)}
                              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px", color: "var(--text2)", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", height: 32 }}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingProgramId(p.id)}
                            style={{ background: "rgba(255,59,92,0.06)", border: "1px solid rgba(255,59,92,0.15)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)", cursor: "pointer" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && p.workouts && (
                      <div style={{ marginTop: 14, borderTop: "1.5px solid var(--border)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                        {p.workouts.map(w => {
                          const { color: dayColor, cleanName: dayCleanName } = parseWorkoutName(w.name);
                          const displayColor = dayColor || "var(--brand2)";
                          return (
                            <div key={w.id} style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              padding: 12,
                              borderRadius: "var(--radius-sm)",
                              border: `1px solid ${displayColor}24`,
                              background: `${displayColor}04`,
                              marginBottom: 4
                            }}>
                              <p style={{ margin: "0 0 4px", fontSize: "0.78rem", fontWeight: 800, color: displayColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {dayCleanName}
                              </p>
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {w.exercises?.map((ex, i) => (
                                <div key={i} style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "8px 12px",
                                  borderRadius: "var(--radius-xs)",
                                  background: "rgba(255,255,255,0.02)",
                                  borderLeft: `4px solid ${ex.color || "var(--brand)"}`,
                                  border: "1px solid var(--border)"
                                }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                    {ex.orderLabel && (
                                      <span style={{
                                        background: ex.color || "var(--brand)",
                                        color: "#000",
                                        fontSize: "0.7rem",
                                        fontWeight: 900,
                                        padding: "1px 5px",
                                        borderRadius: 4,
                                        minWidth: 18,
                                        textAlign: "center"
                                      }}>
                                        {ex.orderLabel}
                                      </span>
                                    )}
                                     <span style={{ fontSize: "0.85rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                       {ex.exercise.name}
                                     </span>
                                     {ex.isSuperSet && (
                                       <span className="anim-pulse" style={{
                                         background: "linear-gradient(135deg, #ff007f 0%, #7c3aed 100%)",
                                         color: "#fff",
                                         fontSize: "0.58rem",
                                         fontWeight: 900,
                                         padding: "2px 6px",
                                         borderRadius: 6,
                                         textTransform: "uppercase",
                                         letterSpacing: "0.05em",
                                         boxShadow: "0 0 8px rgba(255, 0, 127, 0.7)",
                                         flexShrink: 0
                                       }}>
                                         Súper Serie
                                       </span>
                                     )}
                                   </div>
                                  <span style={{ fontSize: "0.78rem", color: "var(--text2)", fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                                    {ex.targetSets}×{ex.targetReps} · {ex.restSec}s {ex.targetWeight ? `· ${ex.targetWeight}${ex.weightUnit ?? "kg"}` : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── ALUMNO DETALLES & EVALUACIÓN MODAL ── */}
      {activeAthlete && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={() => setActiveAthlete(null)}>
          <form onSubmit={saveEvaluation} className="glass card" style={{
            width: "100%", maxWidth: 420, background: "#0c0f1d", display: "flex", flexDirection: "column", gap: 14
          }} onClick={e => e.stopPropagation()}>
            
            {/* Header info */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
              {activeAthlete.profile?.avatarUrl ? (
                <img 
                  src={activeAthlete.profile.avatarUrl} 
                  alt="Avatar" 
                  style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--brand2)" }} 
                />
              ) : (
                <div style={{
                  width: 50, height: 50, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--brand3), var(--brand2))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.2rem", fontWeight: 900, color: "#fff"
                }}>
                  {(activeAthlete.name ?? activeAthlete.email)[0].toUpperCase()}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 900, fontSize: "1.1rem" }}>{activeAthlete.name ?? "Alumno"}</p>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>{activeAthlete.email}</p>
              </div>
            </div>

            {/* Físico & Racha stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: "8px 4px", borderRadius: 8, border: "1px solid var(--border)" }}>
                <p style={{ margin: 0, fontSize: "0.6rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Peso Actual</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.95rem", fontWeight: 800 }}>{activeAthlete.profile?.weightKg ? `${activeAthlete.profile.weightKg} kg` : "N/D"}</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: "8px 4px", borderRadius: 8, border: "1px solid var(--border)" }}>
                <p style={{ margin: 0, fontSize: "0.6rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>TDEE Diario</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.95rem", fontWeight: 800 }}>{activeAthlete.profile?.tdeeKcal ? `${activeAthlete.profile.tdeeKcal} kcal` : "N/D"}</p>
              </div>
              <div style={{ background: "rgba(255,94,58,0.05)", padding: "8px 4px", borderRadius: 8, border: "1px solid rgba(255,94,58,0.25)", color: "var(--warn)" }}>
                <p style={{ margin: 0, fontSize: "0.6rem", color: "rgba(255,94,58,0.7)", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}><Flame size={10} /> Racha</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.95rem", fontWeight: 900 }}>{activeAthlete.profile?.streak ?? 0}d</p>
              </div>
            </div>

            {/* Grading Form */}
            <div className="field">
              <label className="label" style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={12} color="#f59e0b" /> Calificación del Alumno</label>
              <select className="input" value={grade} onChange={e => setGrade(e.target.value)}>
                <option value="">Sin calificar / Quitar nota</option>
                <option value="Excelente">Excelente</option>
                <option value="Muy Bueno">Muy Bueno</option>
                <option value="Bueno">Bueno</option>
                <option value="Constante">Constante</option>
                <option value="En Progreso">En Progreso</option>
                <option value="Requiere Atención">Requiere Atención</option>
              </select>
            </div>

            {/* Medals Checklist */}
            <div className="field">
              <label className="label" style={{ display: "flex", alignItems: "center", gap: 4 }}><Award size={12} color="var(--brand2)" /> Otorgar Medallas de Progreso</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                {MEDALS_TYPES.map(m => {
                  const hasMedal = medals.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMedal(m.id)}
                      className={`btn btn-xs ${hasMedal ? "btn-primary" : "btn-ghost"}`}
                      style={{
                        justifyContent: "flex-start",
                        minHeight: 36,
                        height: 36,
                        padding: "0 10px",
                        fontSize: "0.78rem",
                        background: hasMedal ? "linear-gradient(135deg, var(--brand), var(--brand2))" : "transparent",
                        borderColor: hasMedal ? "transparent" : "var(--border2)"
                      }}
                    >
                      {m.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setActiveAthlete(null)} className="btn btn-ghost btn-full" style={{ flex: 1 }}>
                Cerrar
              </button>
              <button type="submit" className="btn btn-primary btn-full" style={{ flex: 1 }} disabled={busy}>
                {busy ? "Guardando..." : "Guardar Evaluación"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── SELECTOR DE EJERCICIOS DESDE BD MODAL ── */}
      {searchExModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={() => setSearchExModal(null)}>
          <div className="glass card" style={{
            width: "100%", maxWidth: 440, background: "#0c0f1d", display: "flex", flexDirection: "column", gap: 14, maxHeight: "90dvh"
          }} onClick={e => e.stopPropagation()}>
            <p style={{ fontWeight: 900, fontSize: "1.15rem", margin: 0, color: "var(--brand)" }}>
              Seleccionar Ejercicio de Biblioteca
            </p>

            <div className="field">
              <input 
                className="input" 
                value={trainerSearchQuery} 
                onChange={e => setTrainerSearchQuery(e.target.value)} 
                placeholder="Ej. Press o Sentadilla..." 
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <select className="input" style={{ minHeight: 38, height: 38, fontSize: "0.8rem" }}
                value={trainerFilterMuscle} onChange={e => setTrainerFilterMuscle(e.target.value)}>
                <option value="">Todos los músculos</option>
                {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select className="input" style={{ minHeight: 38, height: 38, fontSize: "0.8rem" }}
                value={trainerFilterEquip} onChange={e => setTrainerFilterEquip(e.target.value)}>
                <option value="">Todo equipamiento</option>
                {EQUIPMENTS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
              </select>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }}>
              {exerciseDb
                .filter(ex => {
                  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                  if (trainerSearchQuery && !normalize(ex.name).includes(normalize(trainerSearchQuery))) return false;
                  if (trainerFilterMuscle && ex.muscleGroup !== trainerFilterMuscle) return false;
                  if (trainerFilterEquip && ex.equipment !== trainerFilterEquip) return false;
                  return true;
                })
                .slice(0, 30)
                .map(ex => (
                  <div key={ex.id} className="list-item" style={{ padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div 
                      style={{ flex: 1, cursor: "pointer" }}
                      onClick={() => {
                        const ws = [...workouts];
                        ws[searchExModal.wIdx].exercises[searchExModal.eIdx].name = ex.name;
                        setWorkouts(ws);
                        setSearchExModal(null);
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem" }}>{ex.name}</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)" }}>{ex.muscleGroup} · {ex.equipment}</p>
                    </div>
                    {ex.gifUrl && (
                      <button 
                        type="button"
                        onClick={() => {
                          setPreviewGif(ex.gifUrl);
                          setPreviewName(ex.name);
                        }}
                        style={{ background: "rgba(0,255,135,0.1)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      >
                        <Eye size={14} color="var(--brand)" />
                      </button>
                    )}
                  </div>
                ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setSearchExModal(null)} className="btn btn-ghost btn-full">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW GIF MODAL ── */}
      {previewGif && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 10000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={() => setPreviewGif(null)}>
          <div className="glass card" style={{
            width: "100%", maxWidth: 360, textAlign: "center", background: "#0c0f1d", border: "1px solid var(--border2)"
          }} onClick={e => e.stopPropagation()}>
            <p style={{ fontWeight: 800, fontSize: "1.1rem", margin: "0 0 12px", color: "var(--brand)" }}>{previewName}</p>
            
            <div style={{ background: "#000", borderRadius: 14, overflow: "hidden", minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img 
                src={previewGif} 
                alt={previewName} 
                style={{ width: "100%", height: "auto", display: "block" }}
                onError={(e) => {
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

    </main>
  );
}

function Loader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80dvh" }}>
      <div className="spinner" />
    </div>
  );
}
