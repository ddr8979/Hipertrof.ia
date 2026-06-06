"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Toast } from "@/components/toast";
import { LogOut, Activity, Award, Flame, Camera, Calendar, Star, Sparkles } from "lucide-react";

type ToastType = { msg: string; type: "success" | "error" };
type Profile = {
  sex?: string;
  ageYears?: number;
  heightCm?: number;
  weightKg?: number;
  activity?: string;
  bmrKcal?: number;
  tdeeKcal?: number;
  avatarUrl?: string;
  grade?: string;
  medals?: string;
  streak?: number;
  maxStreak?: number;
};
type Attendance = { date: string };

const ACTIVITIES = [
  { value: "sedentary", label: "Sedentario (poco/nada)" },
  { value: "light",     label: "Ligero (1-3 días/sem)" },
  { value: "moderate",  label: "Moderado (3-5 días/sem)" },
  { value: "very",      label: "Alto (6-7 días/sem)" },
  { value: "extra",     label: "Muy alto / doble sesión" },
];

const MEDALS_LIST = [
  { id: "Novato", title: "Novato", desc: "Registró su primera serie", icon: "🌱", color: "#2ed573" },
  { id: "Constante", title: "Constante", desc: "Racha de 5+ días", icon: "⚡", color: "#00c6ff" },
  { id: "Fuerza Brutal", title: "Fuerza Brutal", desc: "1RM estimado > 100 kg", icon: "💪", color: "#ffa502" },
  { id: "Superacion", title: "Superación", desc: "Otorgada por el entrenador", icon: "👑", color: "#7c3aed" },
];

export default function PerfilPage() {
  const { user, loading, refresh, logout } = useAuth();
  const router = useRouter();
  const [toast, setToast] = useState<ToastType | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [sex, setSex] = useState("male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState("moderate");
  
  const [profile, setProfile] = useState<Profile>({});
  const [attendances, setAttendances] = useState<Attendance[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  const loadProfile = async () => {
    const res = await fetch("/api/profile");
    const d = await res.json();
    const p = d.user?.profile ?? {};
    setProfile(p);
    setAttendances(d.user?.attendances ?? []);
    if (p.sex) setSex(p.sex);
    if (p.ageYears) setAge(String(p.ageYears));
    if (p.heightCm) setHeight(String(p.heightCm));
    if (p.weightKg) setWeight(String(p.weightKg));
    if (p.activity) setActivity(p.activity);
  };

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    loadProfile();
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          sex,
          ageYears: Number(age),
          heightCm: Number(height),
          weightKg: Number(weight),
          activity,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ msg: "Perfil actualizado ✅", type: "success" });
        await refresh();
        await loadProfile();
      } else {
        setToast({ msg: data.error ?? "Error", type: "error" });
      }
    } finally {
      setBusy(false);
    }
  };

  // Compresión y redimensionamiento en lado cliente
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 150; // Redimensionamos a 150x150 para optimizar almacenamiento
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          // Recortar cuadrado central
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7); // 70% de calidad JPEG
          uploadAvatar(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (base64Image: string) => {
    try {
      const res = await fetch("/api/profile/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ msg: "Foto de perfil actualizada ✅", type: "success" });
        await refresh();
        await loadProfile();
      } else {
        setToast({ msg: data.error ?? "Error al subir avatar", type: "error" });
      }
    } catch {
      setToast({ msg: "Error de conexión", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) return <Loader />;

  const roleLabel: Record<string, string> = {
    ATHLETE: "Atleta",
    TRAINER: "Personal Trainer",
    GYM_OWNER: "Gimnasio",
    ADMIN: "Administrador",
  };

  const handleLogout = () => {
    logout();
    router.replace("/auth");
  };

  // Obtener días del mes actual para el calendario de asistencia
  const getCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Ajustar para empezar en Lunes (0 = Lunes, ..., 6 = Domingo)
    const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days = [];
    // Espacios vacíos de relleno
    for (let i = 0; i < offset; i++) {
      days.push(null);
    }
    // Días del mes
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  };

  const attendanceDates = new Set(attendances.map(a => a.date));
  const currentMonthDays = getCalendarDays();
  const monthName = new Date().toLocaleString("es-ES", { month: "long" });

  const activeMedals = new Set(profile.medals ? profile.medals.split(",").map(m => m.trim()) : []);

  return (
    <main className="page anim-fade">
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <h1 className="page-title">Mi Perfil</h1>
      <p className="page-sub">Ajustá tus datos físicos y configurá tu cuenta</p>

      {/* Racha y Calificación Destacada */}
      {user.role === "ATHLETE" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {/* Racha TikTok */}
          <div className="glass card" style={{
            background: "linear-gradient(135deg, rgba(255,94,58,0.08) 0%, rgba(255,165,2,0.03) 100%)",
            border: "1.5px solid rgba(255,94,58,0.25)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 12px"
          }}>
            <div style={{ position: "relative" }}>
              <Flame size={44} color="var(--warn)" style={{ fill: "var(--warn)", filter: "drop-shadow(0 0 8px var(--warn))" }} className="anim-pulse" />
              <span style={{ position: "absolute", bottom: -2, right: -4, background: "rgba(0,0,0,0.6)", borderRadius: 99, padding: "2px 6px", fontSize: "0.62rem", fontWeight: 800 }}>🔥</span>
            </div>
            <p style={{ margin: "8px 0 2px", fontSize: "1.3rem", fontWeight: 900, color: "var(--text)" }}>
              {profile.streak ?? 0} <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)" }}>DÍAS</span>
            </p>
            <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Racha Máx: {profile.maxStreak ?? 0}
            </p>
          </div>

          {/* Calificación */}
          <div className="glass card" style={{
            background: profile.grade 
              ? "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(0,198,255,0.03) 100%)" 
              : "rgba(255,255,255,0.02)",
            border: profile.grade ? "1.5px solid rgba(124,58,237,0.25)" : "1px solid var(--border)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 12px"
          }}>
            <Star size={34} color={profile.grade ? "#f59e0b" : "var(--muted)"} style={{ fill: profile.grade ? "#f59e0b" : "none" }} />
            <p style={{ margin: "8px 0 2px", fontSize: "1.05rem", fontWeight: 800, color: "var(--text)" }}>
              {profile.grade ? profile.grade : "Sin calificar"}
            </p>
            <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>
              Evaluación Trainer
            </p>
          </div>
        </div>
      )}

      {/* Account info card with upload */}
      <div className="glass card section" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Profile photo upload container */}
          <div style={{ position: "relative" }}>
            {profile.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt="Avatar" 
                style={{ width: 62, height: 62, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--brand2)" }} 
              />
            ) : (
              <div style={{
                width: 62,
                height: 62,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--brand3) 0%, var(--brand2) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: 900,
                color: "#fff"
              }}>
                {(user.name ?? user.email)[0].toUpperCase()}
              </div>
            )}
            <label style={{
              position: "absolute",
              bottom: -4,
              right: -4,
              background: "rgba(0,0,0,0.85)",
              border: "1px solid var(--border2)",
              borderRadius: "50%",
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}>
              <Camera size={12} color="#fff" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} disabled={busy} />
            </label>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "1.1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name ?? "Usuario"}
            </p>
            <p style={{ margin: "2px 0 6px", fontSize: "0.82rem", color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </p>
            <span className="badge badge-purple">{roleLabel[user.role] ?? user.role}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ flexShrink: 0, color: "var(--danger)", borderColor: "rgba(255,71,87,0.2)", height: 38, minHeight: 38, padding: "0 12px" }}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </div>

      {/* Calendario de Asistencia */}
      {user.role === "ATHLETE" && (
        <div className="glass card section" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Calendar size={18} color="var(--brand)" />
            <p className="section-title" style={{ margin: 0 }}>Asistencia - <span style={{ textTransform: "capitalize" }}>{monthName}</span></p>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, textAlign: "center" }}>
            {["L", "M", "M", "J", "V", "S", "D"].map(d => (
              <span key={d} style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--muted)" }}>{d}</span>
            ))}
            {currentMonthDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              
              const dayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const attended = attendanceDates.has(dayStr);
              
              return (
                <div key={day} style={{
                  aspectRatio: "1",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  position: "relative",
                  background: attended ? "linear-gradient(135deg, var(--brand) 0%, var(--brand2) 100%)" : "rgba(255,255,255,0.02)",
                  color: attended ? "#030508" : "var(--text2)",
                  border: attended ? "none" : "1px solid var(--border)",
                  boxShadow: attended ? "0 0 10px rgba(0,255,135,0.2)" : "none"
                }}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gamificación y Medallas */}
      {user.role === "ATHLETE" && (
        <div className="glass card section" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Award size={18} color="var(--brand2)" />
            <p className="section-title" style={{ margin: 0 }}>Medallas de Progreso</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {MEDALS_LIST.map(medal => {
              const active = activeMedals.has(medal.id);
              return (
                <div key={medal.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 10,
                  borderRadius: "var(--radius-xs)",
                  background: active ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)",
                  border: active ? `1px solid ${medal.color}33` : "1px solid var(--border)",
                  opacity: active ? 1 : 0.4,
                  filter: active ? "none" : "grayscale(80%)",
                  transition: "all 200ms"
                }}>
                  <span style={{ fontSize: "1.8rem" }}>{medal.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: active ? medal.color : "var(--text)" }}>{medal.title}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.68rem", color: "var(--muted)", lineHeight: 1.2 }}>{medal.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Physical data form */}
      <form onSubmit={save} className="glass card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={18} color="var(--brand)" />
          <p className="section-title" style={{ margin: 0 }}>Parámetros Físicos</p>
        </div>

        <div className="field">
          <label className="label">Nombre completo</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Juan Pérez" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="field">
            <label className="label">Sexo biológico</label>
            <select className="input" value={sex} onChange={e => setSex(e.target.value)}>
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Edad (años)</label>
            <input className="input" type="number" min="10" max="100"
              value={age} onChange={e => setAge(e.target.value)} placeholder="Ej. 25" />
          </div>
          <div className="field">
            <label className="label">Altura (cm)</label>
            <input className="input" type="number" min="100" max="250"
              value={height} onChange={e => setHeight(e.target.value)} placeholder="Ej. 175" />
          </div>
          <div className="field">
            <label className="label">Peso corporal (kg)</label>
            <input className="input" type="number" min="30" max="300" step="0.1"
              value={weight} onChange={e => setWeight(e.target.value)} placeholder="Ej. 75.5" />
          </div>
        </div>

        <div className="field">
          <label className="label">Nivel de Actividad Diaria</label>
          <select className="input" value={activity} onChange={e => setActivity(e.target.value)}>
            {ACTIVITIES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
          {busy ? "Guardando datos..." : "Actualizar Datos Físicos"}
        </button>
      </form>
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
