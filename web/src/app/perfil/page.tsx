"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Toast } from "@/components/toast";
import { LogOut, Activity, Award, Flame, Camera, Calendar, Star, ChevronRight, ChevronDown } from "lucide-react";

type ToastType = { msg: string; type: "success" | "error" };
type Profile = {
  sex?: string; ageYears?: number; heightCm?: number; weightKg?: number;
  activity?: string; bmrKcal?: number; tdeeKcal?: number; avatarUrl?: string;
  grade?: string; medals?: string; streak?: number; maxStreak?: number;
  dietType?: string; dietGoal?: string; foodLikes?: string;
  foodDislikes?: string; favoriteMeals?: string;
};
type Attendance = { date: string };

const ACTIVITIES = [
  { value: "sedentary", label: "🛋️ Poco o nada", desc: "Trabajo de escritorio, sin deporte" },
  { value: "light",     label: "🚶 1-3 veces por semana", desc: "Caminatas o ejercicio liviano" },
  { value: "moderate",  label: "🏃 3-5 veces por semana", desc: "Entreno regular moderado" },
  { value: "very",      label: "⚡ 6-7 veces por semana", desc: "Entreno intenso casi todos los días" },
  { value: "extra",     label: "🔥 Doble sesión / físico duro", desc: "Atleta o trabajo físico intenso" },
];

const DIET_TYPES = [
  { value: "omnivoro",    emoji: "🥩", label: "Como de todo" },
  { value: "vegetariano", emoji: "🥗", label: "Vegetariano" },
  { value: "vegano",      emoji: "🌱", label: "Vegano" },
  { value: "sin_gluten",  emoji: "🌾", label: "Sin gluten" },
];

const DIET_GOALS = [
  { value: "volumen",        emoji: "💪", label: "Ganar músculo" },
  { value: "definicion",     emoji: "🔥", label: "Bajar peso / definir" },
  { value: "mantenimiento",  emoji: "⚖️", label: "Mantenerme" },
  { value: "salud",          emoji: "❤️", label: "Estar más saludable" },
];

const FOOD_OPTIONS = [
  "Pollo", "Carne vacuna", "Cerdo", "Pescado", "Atún", "Salmón",
  "Huevo", "Arroz", "Pasta", "Papa", "Batata", "Pan integral",
  "Brócoli", "Espinaca", "Zanahoria", "Tomate", "Palta", "Banana",
  "Manzana", "Naranja", "Yogur", "Queso", "Leche", "Legumbres",
  "Lentejas", "Garbanzos", "Quinoa", "Avena", "Nueces", "Maní",
];

const MEDALS_LIST = [
  { id: "Novato",        title: "Novato",        desc: "Registró su primera serie", icon: "🌱", color: "#2ed573" },
  { id: "Constante",     title: "Constante",     desc: "Racha de 5+ días",          icon: "⚡", color: "#00c6ff" },
  { id: "Fuerza Brutal", title: "Fuerza Brutal", desc: "1RM estimado > 100 kg",     icon: "💪", color: "#ffa502" },
  { id: "Superacion",    title: "Superación",    desc: "Otorgada por el entrenador", icon: "👑", color: "#7c3aed" },
];

export default function PerfilPage() {
  const { user, loading, refresh, logout } = useAuth();
  const router = useRouter();
  const [toast, setToast] = useState<ToastType | null>(null);
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<"fisica" | "comida">("comida");

  // Datos físicos
  const [name, setName] = useState("");
  const [sex, setSex] = useState("male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState("moderate");

  // Preferencias alimentarias
  const [dietType, setDietType] = useState("");
  const [dietGoal, setDietGoal] = useState("");
  const [foodLikes, setFoodLikes] = useState<string[]>([]);
  const [foodDislikes, setFoodDislikes] = useState<string[]>([]);
  const [favMeal, setFavMeal] = useState("");

  const [profile, setProfile] = useState<Profile>({});
  const [attendances, setAttendances] = useState<Attendance[]>([]);

  useEffect(() => { if (!loading && !user) router.replace("/auth"); }, [user, loading, router]);

  const loadProfile = async () => {
    const res = await fetch("/api/profile");
    const d = await res.json();
    const p: Profile = d.user?.profile ?? {};
    setProfile(p);
    setAttendances(d.user?.attendances ?? []);
    if (p.sex) setSex(p.sex);
    if (p.ageYears) setAge(String(p.ageYears));
    if (p.heightCm) setHeight(String(p.heightCm));
    if (p.weightKg) setWeight(String(p.weightKg));
    if (p.activity) setActivity(p.activity);
    if (p.dietType) setDietType(p.dietType);
    if (p.dietGoal) setDietGoal(p.dietGoal);
    if (p.foodLikes) { try { setFoodLikes(JSON.parse(p.foodLikes)); } catch {} }
    if (p.foodDislikes) { try { setFoodDislikes(JSON.parse(p.foodDislikes)); } catch {} }
    if (p.favoriteMeals) { try { const fm = JSON.parse(p.favoriteMeals); setFavMeal(fm[0] ?? ""); } catch {} }
  };

  useEffect(() => { if (!user) return; setName(user.name ?? ""); loadProfile(); }, [user]);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name, sex,
          ageYears: Number(age),
          heightCm: Number(height),
          weightKg: Number(weight),
          activity,
          dietType, dietGoal,
          foodLikes: JSON.stringify(foodLikes),
          foodDislikes: JSON.stringify(foodDislikes),
          favoriteMeals: JSON.stringify(favMeal ? [favMeal] : []),
        }),
      });
      if (res.ok) {
        setToast({ msg: "✅ Perfil guardado", type: "success" });
        await refresh();
        await loadProfile();
      } else {
        const d = await res.json();
        setToast({ msg: d.error ?? "Error", type: "error" });
      }
    } finally { setBusy(false); }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 150;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          uploadAvatar(canvas.toDataURL("image/jpeg", 0.7));
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
      if (res.ok) {
        setToast({ msg: "📸 Foto actualizada", type: "success" });
        await refresh(); await loadProfile();
      } else { setToast({ msg: "Error al subir foto", type: "error" }); }
    } catch { setToast({ msg: "Error de conexión", type: "error" }); }
    finally { setBusy(false); }
  };

  const toggleChip = (list: string[], setList: (l: string[]) => void, val: string) => {
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  };

  if (loading || !user) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80dvh" }}><div className="spinner" /></div>;

  const attendanceDates = new Set(attendances.map(a => a.date));
  const today = new Date();
  const monthName = today.toLocaleString("es-ES", { month: "long" });
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDayOffset = (() => { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1; })();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const activeMedals = new Set(profile.medals ? profile.medals.split(",").map(m => m.trim()) : []);

  return (
    <main className="page anim-fade">
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* Header avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ position: "relative" }}>
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", border: "2.5px solid var(--brand)" }} />
          ) : (
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg,var(--brand3),var(--brand2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: 900, color: "#fff" }}>
              {(user.name ?? user.email)[0].toUpperCase()}
            </div>
          )}
          <label style={{ position: "absolute", bottom: -4, right: -4, background: "#111", border: "1px solid var(--border2)", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Camera size={13} color="#fff" />
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} disabled={busy} />
          </label>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 900, fontSize: "1.2rem" }}>{user.name ?? "Usuario"}</p>
          <p style={{ margin: "2px 0", fontSize: "0.78rem", color: "var(--muted)" }}>{user.email}</p>
          {user.role === "ATHLETE" && profile.streak ? (
            <span style={{ fontSize: "0.75rem", color: "var(--warn)", fontWeight: 800 }}>🔥 {profile.streak} días de racha</span>
          ) : null}
        </div>
        <button onClick={() => { logout(); router.replace("/auth"); }} className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", borderColor: "rgba(255,71,87,0.2)", height: 36, minHeight: 36 }}>
          <LogOut size={15} /> Salir
        </button>
      </div>

      {/* Tab selector */}
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        <button className={`tab-btn${section === "comida" ? " active" : ""}`} onClick={() => setSection("comida")}>
          🍽️ Mis preferencias
        </button>
        <button className={`tab-btn${section === "fisica" ? " active" : ""}`} onClick={() => setSection("fisica")}>
          📏 Datos físicos
        </button>
      </div>

      {/* ── SECCIÓN PREFERENCIAS ALIMENTARIAS ─────────────────────────────── */}
      {section === "comida" && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Tipo de dieta */}
          <div className="glass card">
            <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: "1rem" }}>¿Cómo te alimentás?</p>
            <p style={{ margin: "0 0 14px", fontSize: "0.82rem", color: "var(--muted)" }}>Seleccioná lo que mejor te describe</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {DIET_TYPES.map(d => (
                <button key={d.value} type="button" onClick={() => setDietType(d.value)} style={{
                  padding: "14px 10px", borderRadius: "var(--radius-sm)", border: dietType === d.value ? "2px solid var(--brand)" : "1.5px solid var(--border2)",
                  background: dietType === d.value ? "rgba(0,255,135,0.1)" : "rgba(255,255,255,0.03)", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 150ms",
                  transform: dietType === d.value ? "scale(1.02)" : "scale(1)",
                }}>
                  <span style={{ fontSize: "1.8rem" }}>{d.emoji}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: dietType === d.value ? "var(--brand)" : "var(--text)" }}>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Objetivo nutricional */}
          <div className="glass card">
            <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: "1rem" }}>¿Cuál es tu objetivo?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DIET_GOALS.map(g => (
                <button key={g.value} type="button" onClick={() => setDietGoal(g.value)} style={{
                  padding: "14px 16px", borderRadius: "var(--radius-sm)", border: dietGoal === g.value ? "2px solid var(--brand2)" : "1.5px solid var(--border2)",
                  background: dietGoal === g.value ? "rgba(0,198,255,0.08)" : "rgba(255,255,255,0.02)",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 150ms",
                  textAlign: "left",
                }}>
                  <span style={{ fontSize: "1.6rem" }}>{g.emoji}</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: dietGoal === g.value ? "var(--brand2)" : "var(--text)" }}>{g.label}</span>
                  {dietGoal === g.value && <span style={{ marginLeft: "auto", color: "var(--brand2)", fontSize: "1.1rem" }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Alimentos que TE GUSTAN */}
          <div className="glass card">
            <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "1rem" }}>¿Qué te gusta comer? 👍</p>
            <p style={{ margin: "0 0 14px", fontSize: "0.8rem", color: "var(--muted)" }}>Tocá los alimentos que disfrutás</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {FOOD_OPTIONS.map(f => (
                <button key={f} type="button" onClick={() => toggleChip(foodLikes, setFoodLikes, f)} style={{
                  padding: "8px 14px", borderRadius: 99, fontSize: "0.82rem", fontWeight: 700,
                  border: foodLikes.includes(f) ? "2px solid var(--brand)" : "1.5px solid var(--border2)",
                  background: foodLikes.includes(f) ? "rgba(0,255,135,0.15)" : "rgba(255,255,255,0.03)",
                  color: foodLikes.includes(f) ? "var(--brand)" : "var(--text2)",
                  cursor: "pointer", transition: "all 130ms",
                  transform: foodLikes.includes(f) ? "scale(1.05)" : "scale(1)",
                }}>
                  {foodLikes.includes(f) ? "✓ " : ""}{f}
                </button>
              ))}
            </div>
          </div>

          {/* Alimentos que NO te gustan */}
          <div className="glass card">
            <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "1rem" }}>¿Qué NO te gusta? 👎</p>
            <p style={{ margin: "0 0 14px", fontSize: "0.8rem", color: "var(--muted)" }}>Así no te sugerimos recetas con esos ingredientes</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {FOOD_OPTIONS.map(f => (
                <button key={f} type="button" onClick={() => toggleChip(foodDislikes, setFoodDislikes, f)} style={{
                  padding: "8px 14px", borderRadius: 99, fontSize: "0.82rem", fontWeight: 700,
                  border: foodDislikes.includes(f) ? "2px solid var(--danger)" : "1.5px solid var(--border2)",
                  background: foodDislikes.includes(f) ? "rgba(255,71,87,0.12)" : "rgba(255,255,255,0.03)",
                  color: foodDislikes.includes(f) ? "var(--danger)" : "var(--text2)",
                  cursor: "pointer", transition: "all 130ms",
                }}>
                  {foodDislikes.includes(f) ? "✗ " : ""}{f}
                </button>
              ))}
            </div>
          </div>

          {/* Comida favorita */}
          <div className="glass card">
            <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: "1rem" }}>¿Cuál es tu comida favorita? 🍽️</p>
            <p style={{ margin: "0 0 12px", fontSize: "0.8rem", color: "var(--muted)" }}>Opcional — para hacerte recomendaciones personalizadas</p>
            <input className="input" value={favMeal} onChange={e => setFavMeal(e.target.value)} placeholder="Ej: pizza, asado, milanesas..." style={{ minHeight: 52 }} />
          </div>

          <button onClick={save} className="btn btn-primary btn-full" disabled={busy} style={{ minHeight: 60, fontSize: "1.05rem", fontWeight: 800 }}>
            {busy ? "Guardando..." : "Guardar preferencias"}
          </button>
        </div>
      )}

      {/* ── SECCIÓN DATOS FÍSICOS ─────────────────────────────────────────── */}
      {section === "fisica" && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Medallas (athlete only) */}
          {user.role === "ATHLETE" && (
            <div className="glass card">
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, textAlign: "center", padding: "12px 8px", borderRadius: "var(--radius-sm)", background: "rgba(255,94,58,0.08)", border: "1px solid rgba(255,94,58,0.2)" }}>
                  <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, color: "var(--warn)" }}>🔥 {profile.streak ?? 0}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Racha actual</p>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: "12px 8px", borderRadius: "var(--radius-sm)", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
                  <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900 }}>{profile.grade ? `⭐ ${profile.grade}` : "—"}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Calificación</p>
                </div>
              </div>
              <p style={{ margin: "0 0 10px", fontSize: "0.72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Medallas</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {MEDALS_LIST.map(medal => {
                  const active = activeMedals.has(medal.id);
                  return (
                    <div key={medal.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 10px", borderRadius: "var(--radius-xs)", background: active ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)", border: active ? `1px solid ${medal.color}44` : "1px solid var(--border)", opacity: active ? 1 : 0.35, transition: "all 200ms" }}>
                      <span style={{ fontSize: "1.4rem" }}>{medal.icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: "0.78rem", color: active ? medal.color : "var(--text)" }}>{medal.title}</p>
                        <p style={{ margin: 0, fontSize: "0.62rem", color: "var(--muted)", lineHeight: 1.2 }}>{medal.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Calendario asistencia */}
          {user.role === "ATHLETE" && (
            <div className="glass card">
              <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={16} color="var(--brand)" />
                Asistencia — <span style={{ textTransform: "capitalize" }}>{monthName}</span>
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5, textAlign: "center" }}>
                {["L","M","M","J","V","S","D"].map((d, i) => (
                  <span key={i} style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--muted)" }}>{d}</span>
                ))}
                {[...Array(firstDayOffset)].map((_, i) => <div key={`e-${i}`} />)}
                {[...Array(totalDays)].map((_, i) => {
                  const day = i + 1;
                  const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const attended = attendanceDates.has(dayStr);
                  const isToday = today.getDate() === day;
                  return (
                    <div key={day} style={{ aspectRatio: "1", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, background: attended ? "linear-gradient(135deg,var(--brand),var(--brand2))" : isToday ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)", color: attended ? "#030508" : isToday ? "var(--brand)" : "var(--text2)", border: attended ? "none" : isToday ? "1.5px dashed var(--brand)" : "1px solid var(--border)", boxShadow: attended ? "0 0 8px rgba(0,255,135,0.3)" : "none" }}>
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Formulario de datos físicos */}
          <div className="glass card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={16} color="var(--brand)" /> Tus datos físicos
            </p>
            <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: "var(--muted)" }}>Con estos datos calculamos cuánto necesitás comer</p>

            <div className="field">
              <label className="label">Tu nombre</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Juan Pérez" style={{ minHeight: 56 }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {["male", "female"].map(s => (
                <button key={s} type="button" onClick={() => setSex(s)} style={{ flex: 1, padding: "14px 8px", borderRadius: "var(--radius-sm)", border: sex === s ? "2px solid var(--brand)" : "1.5px solid var(--border2)", background: sex === s ? "rgba(0,255,135,0.08)" : "rgba(255,255,255,0.02)", cursor: "pointer", fontWeight: 800, fontSize: "0.9rem", color: sex === s ? "var(--brand)" : "var(--text2)", transition: "all 150ms" }}>
                  {s === "male" ? "👨 Hombre" : "👩 Mujer"}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Edad", placeholder: "25", value: age, set: setAge, min: "10", max: "100" },
                { label: "Altura (cm)", placeholder: "175", value: height, set: setHeight, min: "100", max: "250" },
                { label: "Peso (kg)", placeholder: "75", value: weight, set: setWeight, min: "30", max: "300" },
              ].map(f => (
                <div key={f.label} className="field">
                  <label className="label" style={{ fontSize: "0.65rem" }}>{f.label}</label>
                  <input className="input" type="number" min={f.min} max={f.max} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={{ minHeight: 52, textAlign: "center", fontSize: "1.1rem", fontWeight: 800 }} />
                </div>
              ))}
            </div>

            <div className="field">
              <label className="label">¿Cuánto te movés en la semana?</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ACTIVITIES.map(a => (
                  <button key={a.value} type="button" onClick={() => setActivity(a.value)} style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", border: activity === a.value ? "2px solid var(--brand)" : "1.5px solid var(--border2)", background: activity === a.value ? "rgba(0,255,135,0.08)" : "rgba(255,255,255,0.02)", cursor: "pointer", textAlign: "left", transition: "all 150ms" }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: "0.88rem", color: activity === a.value ? "var(--brand)" : "var(--text)" }}>{a.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "var(--muted)" }}>{a.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {profile.tdeeKcal && (
              <div style={{ padding: "14px", borderRadius: "var(--radius-sm)", background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.2)", textAlign: "center" }}>
                <p style={{ margin: "0 0 4px", fontSize: "0.72rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Tu consumo diario estimado</p>
                <p style={{ margin: 0, fontSize: "2.2rem", fontWeight: 900, color: "var(--brand)", letterSpacing: "-0.03em" }}>{profile.tdeeKcal.toLocaleString()} <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>kcal/día</span></p>
              </div>
            )}
          </div>

          <button onClick={save} className="btn btn-primary btn-full" disabled={busy} style={{ minHeight: 60, fontSize: "1.05rem", fontWeight: 800 }}>
            {busy ? "Guardando..." : "Guardar datos"}
          </button>
        </div>
      )}
    </main>
  );
}
