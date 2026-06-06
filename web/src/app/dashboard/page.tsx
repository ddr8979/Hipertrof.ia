"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Flame, Calendar, Dumbbell, Zap, Apple, Users, User, BarChart2, BookOpen } from "lucide-react";
import { Mascota } from "@/components/mascota";

type Profile = {
  bmrKcal: number | null;
  tdeeKcal: number | null;
  weightKg: number | null;
  streak?: number;
  maxStreak?: number;
};
type Stats = { routines: number; logs: number; weeklyVolumeKg: number };

function Loader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80dvh" }}>
      <div className="spinner" />
    </div>
  );
}

function GreetingTime() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attendances, setAttendances] = useState<{ date: string }[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);

  const isTrainer = user?.role === "TRAINER" || user?.role === "ADMIN" || user?.role === "OWNER";

  const loadData = async () => {
    if (!user) return;
    try {
      if (isTrainer) {
        const [pu, alumnos, progs] = await Promise.all([
          fetch("/api/admin/users?pending=true").then(r => r.json()),
          fetch("/api/trainer/alumnos").then(r => r.json()),
          fetch("/api/trainer/programas").then(r => r.json()),
        ]);
        setPendingUsers(pu.users ?? []);
        setStats({
          routines: progs.programs?.length ?? 0,
          logs: alumnos.athletes?.length ?? 0,
          weeklyVolumeKg: pu.users?.length ?? 0,
        });
      } else {
        const [p, logs, progs] = await Promise.all([
          fetch("/api/profile").then(r => r.json()),
          fetch("/api/rutinas/logs").then(r => r.json()),
          fetch("/api/rutinas/programas").then(r => r.json()),
        ]);
        setProfile(p.user?.profile ?? null);
        setAttendances(p.user?.attendances ?? []);
        setStats({
          routines: progs.programs?.length ?? 0,
          logs: logs.logs?.length ?? 0,
          weeklyVolumeKg: logs.weeklyVolumeKg ?? 0,
        });
      }
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err);
    }
  };

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) loadData();
  }, [user, isTrainer]);

  const toggleAttendance = async (dayStr: string) => {
    try {
      const res = await fetch("/api/profile/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dayStr }),
      });
      const data = await res.json();
      if (data.ok) {
        setAttendances(data.attendances ?? []);
        setProfile((prev) => prev ? { ...prev, streak: data.streak, maxStreak: data.maxStreak } : null);
      }
    } catch (err) {
      console.error("Error al registrar asistencia:", err);
    }
  };

  const approveUser = async (userId: string, approved: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, approved }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Error al aprobar/rechazar usuario:", err);
    }
  };

  if (loading || !user) return <Loader />;

  const firstName = user.name?.split(" ")[0] ?? (isTrainer ? "Trainer" : "Atleta");

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

  return (
    <main className="page" style={{ paddingTop: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: "0.82rem", color: "var(--muted)", fontWeight: 600, margin: "0 0 4px" }}>
            <GreetingTime />
          </p>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1, margin: 0 }}>
            {firstName}
          </h1>
          {isTrainer && (
            <span className="badge badge-blue" style={{ marginTop: 6 }}>
              {user.role === "OWNER" ? "Owner" : user.role === "ADMIN" ? "Admin" : "Trainer"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={logout}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid var(--border2)",
              borderRadius: 12, padding: "10px 14px", color: "var(--text2)",
              fontSize: "0.8rem", fontWeight: 700, cursor: "pointer",
              WebkitTapHighlightColor: "transparent"
            }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* ── Racha y Calendario de Bienvenida (Estilo TikTok) ── */}
      {!isTrainer && (
        <div className="glass card" style={{
          background: "linear-gradient(135deg, rgba(255,94,58,0.1) 0%, rgba(0,255,135,0.03) 100%)",
          border: "1.5px solid rgba(255,94,58,0.22)",
          padding: "16px 14px",
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 14
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ position: "relative" }}>
                <Flame size={32} color="var(--warn)" style={{ fill: "var(--warn)", filter: "drop-shadow(0 0 6px var(--warn))" }} className="anim-pulse" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: 900, color: "var(--text)" }}>
                  ¡Tu racha: {profile?.streak ?? 0} {profile?.streak === 1 ? "día" : "días"}!
                </p>
                <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--muted)", fontWeight: 600 }}>
                  Racha Máx: {profile?.maxStreak ?? 0} días
                </p>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", padding: "4px 8px", borderRadius: 8, border: "1px solid var(--border)" }}>
              <Calendar size={13} color="var(--brand)" />
              <span style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "capitalize", color: "var(--text)" }}>
                {monthName}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, textAlign: "center" }}>
            {["L", "M", "M", "J", "V", "S", "D"].map(d => (
              <span key={d} style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--muted)" }}>{d}</span>
            ))}
            {currentMonthDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              
              const dayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const attended = attendanceDates.has(dayStr);
              const isToday = new Date().getDate() === day && new Date().getMonth() === new Date().getMonth() && new Date().getFullYear() === new Date().getFullYear();
              
              return (
                <button 
                  key={day} 
                  type="button"
                  onClick={() => toggleAttendance(dayStr)}
                  style={{
                    aspectRatio: "1",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    position: "relative",
                    cursor: "pointer",
                    background: attended 
                      ? "linear-gradient(135deg, var(--brand) 0%, var(--brand2) 100%)" 
                      : isToday 
                        ? "rgba(255,255,255,0.08)" 
                        : "rgba(255,255,255,0.02)",
                    color: attended ? "#030508" : isToday ? "var(--brand)" : "var(--text2)",
                    border: attended 
                      ? "none" 
                      : isToday 
                        ? "1.5px dashed var(--brand)" 
                        : "1px solid var(--border)",
                    boxShadow: attended ? "0 0 10px rgba(0,255,135,0.35)" : "none",
                    outline: "none",
                    transition: "all 150ms ease",
                    padding: 0
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stats row ── */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
          <div className="stat-card glass">
            <span className="stat-label">{isTrainer ? "Alumnos" : "Rutinas"}</span>
            <span className="stat-value" style={{ color: "var(--brand)", fontSize: "1.7rem" }}>
              {isTrainer ? stats.logs : stats.routines}
            </span>
          </div>
          <div className="stat-card glass">
            <span className="stat-label">{isTrainer ? "Rutinas" : "Sesiones"}</span>
            <span className="stat-value" style={{ color: "var(--brand2)", fontSize: "1.7rem" }}>
              {isTrainer ? stats.routines : stats.logs}
            </span>
          </div>
          <div className="stat-card glass">
            <span className="stat-label">{isTrainer ? "Pendientes" : "Vol.sem."}</span>
            <span className="stat-value" style={{ color: "#a78bfa", fontSize: isTrainer ? "1.7rem" : "1.2rem" }}>
              {isTrainer ? (
                stats.weeklyVolumeKg
              ) : (
                <>
                  {stats.weeklyVolumeKg}
                  <span style={{ fontSize: "0.7rem", fontWeight: 700 }}>kg</span>
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* ── Accesos pendientes de aprobación (Solo para Trainers) ── */}
      {isTrainer && pendingUsers.length > 0 && (
        <div className="glass card" style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          border: "1.5px solid rgba(255,179,0,0.3)",
          background: "rgba(255,179,0,0.04)",
          marginBottom: 24
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "1.1rem" }}>⏳</span>
            <p className="section-title" style={{ margin: 0, color: "#ffb300" }}>
              Solicitudes de registro pendientes ({pendingUsers.length})
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingUsers.map(u => (
              <div key={u.id} style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--border)"
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #ffb300, #ff5e3a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  color: "#111",
                  flexShrink: 0,
                  fontSize: "0.85rem"
                }}>
                  {(u.name ?? u.email)[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.name ?? u.email}
                    </p>
                    <span className={`badge ${u.role === "TRAINER" ? "badge-blue" : "badge-purple"}`} style={{ fontSize: "0.6rem", padding: "0 6px", height: 16 }}>
                      {u.role === "TRAINER" ? "Trainer" : "Alumno"}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text2)" }}>{u.email}</p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => approveUser(u.id, true)}
                    className="btn btn-xs"
                    style={{ background: "rgba(0,255,135,0.15)", border: "1px solid rgba(0,255,135,0.4)", color: "var(--brand)", minWidth: 65, padding: "4px 8px", cursor: "pointer" }}
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => approveUser(u.id, false)}
                    className="btn btn-xs"
                    style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", color: "var(--danger)", minWidth: 65, padding: "4px 8px", cursor: "pointer" }}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Metabolismo card (Solo para Atletas) ── */}
      {!isTrainer && (
        profile?.tdeeKcal ? (
          <div className="glass card section" style={{ marginBottom: 24, background: "linear-gradient(135deg, rgba(0,255,135,0.07), rgba(0,198,255,0.04))", border: "1px solid rgba(0,255,135,0.15)" }}>
            <p className="section-title">Tu metabolismo diario</p>
            <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Lo que necesitás comer</p>
                <p style={{ margin: "6px 0 0", fontSize: "2.4rem", fontWeight: 900, color: "var(--brand)", lineHeight: 1, letterSpacing: "-0.04em" }}>
                  {profile.tdeeKcal.toLocaleString()}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600 }}>kcal / día</p>
              </div>
              <div style={{ width: 1, background: "var(--border)", margin: "0 16px" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Lo que quemás sin hacer nada</p>
                  <p style={{ margin: "2px 0 0", fontSize: "1.2rem", fontWeight: 800 }}>{profile.bmrKcal?.toLocaleString()}</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div style={{ textAlign: "center", padding: "6px 4px", borderRadius: 8, background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.15)" }}>
                    <p style={{ margin: 0, fontSize: "0.6rem", color: "var(--danger)", fontWeight: 700 }}>DÉFICIT</p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.88rem", fontWeight: 800, color: "var(--danger)" }}>{Math.round((profile.tdeeKcal ?? 0) * 0.85).toLocaleString()}</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "6px 4px", borderRadius: 8, background: "rgba(0,198,255,0.08)", border: "1px solid rgba(0,198,255,0.15)" }}>
                    <p style={{ margin: 0, fontSize: "0.6rem", color: "var(--brand2)", fontWeight: 700 }}>SUPERÁVIT</p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.88rem", fontWeight: 800, color: "var(--brand2)" }}>{Math.round((profile.tdeeKcal ?? 0) * 1.1).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Link href="/perfil" style={{ textDecoration: "none" }}>
            <div style={{
              marginBottom: 24, padding: "22px 20px",
              borderRadius: "var(--radius)", border: "2px dashed rgba(0,255,135,0.25)",
              display: "flex", alignItems: "center", gap: 16, cursor: "pointer",
              background: "rgba(0,255,135,0.03)"
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(0,255,135,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <BarChart2 size={24} color="var(--brand)" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: "1rem" }}>Completá tu perfil</p>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.4 }}>Calculamos tus calorías y macros automáticamente</p>
              </div>
              <div style={{ marginLeft: "auto", color: "var(--brand)", fontSize: "1.2rem" }}>→</div>
            </div>
          </Link>
        )
      )}

      {/* ── Quick Actions ── */}
      <p className="section-title">Acceso rápido</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {isTrainer ? (
          <>
            <Link href="/trainer" style={{ textDecoration: "none" }}>
              <div className="action-tile" style={{
                background: "linear-gradient(135deg, rgba(0,255,135,0.12), rgba(0,255,135,0.04))",
                border: "1px solid rgba(0,255,135,0.2)",
              }}>
                <div className="tile-icon" style={{ background: "rgba(0,255,135,0.15)" }}>
                  <Users size={20} color="var(--brand)" />
                </div>
                <p className="tile-label">Ver Alumnos</p>
                <p style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 500, margin: 0 }}>Gestionar clientes activos</p>
              </div>
            </Link>

            <Link href="/trainer?tab=rutinas" style={{ textDecoration: "none" }}>
              <div className="action-tile" style={{
                background: "linear-gradient(135deg, rgba(0,198,255,0.12), rgba(0,198,255,0.04))",
                border: "1px solid rgba(0,198,255,0.2)",
              }}>
                <div className="tile-icon" style={{ background: "rgba(0,198,255,0.15)" }}>
                  <Dumbbell size={20} color="var(--brand2)" />
                </div>
                <p className="tile-label">Crear Rutina</p>
                <p style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 500, margin: 0 }}>Diseñar rutinas y splits</p>
              </div>
            </Link>

            <Link href="/perfil" style={{ textDecoration: "none" }}>
              <div className="action-tile" style={{
                background: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(168,85,247,0.03))",
                border: "1px solid rgba(168,85,247,0.18)",
              }}>
                <div className="tile-icon" style={{ background: "rgba(168,85,247,0.12)" }}>
                  <User size={20} color="#a855f7" />
                </div>
                <p className="tile-label">Mi perfil</p>
                <p style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 500, margin: 0 }}>Detalles de mi cuenta</p>
              </div>
            </Link>

            <Link href="/ejercicios" style={{ textDecoration: "none" }}>
              <div className="action-tile" style={{
                background: "linear-gradient(135deg, rgba(255,165,2,0.1), rgba(255,165,2,0.03))",
                border: "1px solid rgba(255,165,2,0.18)",
              }}>
                <div className="tile-icon" style={{ background: "rgba(255,165,2,0.12)" }}>
                  <BookOpen size={20} color="var(--warn)" />
                </div>
                <p className="tile-label">Glosario Fit</p>
                <p style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 500, margin: 0 }}>Biblioteca de movimientos</p>
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link href="/rutinas" style={{ textDecoration: "none" }}>
              <div className="action-tile" style={{
                background: "linear-gradient(135deg, rgba(0,255,135,0.12), rgba(0,255,135,0.04))",
                border: "1px solid rgba(0,255,135,0.2)",
              }}>
                <div className="tile-icon" style={{ background: "rgba(0,255,135,0.15)" }}>
                  <Dumbbell size={20} color="var(--brand)" />
                </div>
                <p className="tile-label">Registrar sesión</p>
                <p style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 500, margin: 0 }}>Logueá tu entrenamiento</p>
              </div>
            </Link>

            <Link href="/calculadora?tab=1rm" style={{ textDecoration: "none" }}>
              <div className="action-tile" style={{
                background: "linear-gradient(135deg, rgba(0,198,255,0.12), rgba(0,198,255,0.04))",
                border: "1px solid rgba(0,198,255,0.2)",
              }}>
                <div className="tile-icon" style={{ background: "rgba(0,198,255,0.15)" }}>
                  <Zap size={20} color="var(--brand2)" />
                </div>
                <p className="tile-label">Calcular 1RM</p>
                <p style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 500, margin: 0 }}>Fuerza máxima</p>
              </div>
            </Link>

            <Link href="/calorias" style={{ textDecoration: "none" }}>
              <div className="action-tile" style={{
                background: "linear-gradient(135deg, rgba(255,165,2,0.1), rgba(255,165,2,0.03))",
                border: "1px solid rgba(255,165,2,0.18)",
              }}>
                <div className="tile-icon" style={{ background: "rgba(255,165,2,0.12)" }}>
                  <Apple size={20} color="var(--warn)" />
                </div>
                <p className="tile-label">¿Cuánto comer?</p>
                <p style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 500, margin: 0 }}>Tus calorías diarias</p>
              </div>
            </Link>

            <Link href="/perfil" style={{ textDecoration: "none" }}>
              <div className="action-tile" style={{
                background: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(168,85,247,0.03))",
                border: "1px solid rgba(168,85,247,0.18)",
              }}>
                <div className="tile-icon" style={{ background: "rgba(168,85,247,0.12)" }}>
                  <User size={20} color="#a855f7" />
                </div>
                <p className="tile-label">Mi perfil</p>
                <p style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 500, margin: 0 }}>Datos físicos</p>
              </div>
            </Link>
          </>
        )}

        <Link href="/ejercicios" style={{ textDecoration: "none", gridColumn: "span 2" }}>
          <div className="action-tile" style={{
            background: "linear-gradient(135deg, rgba(0, 255, 135, 0.08), rgba(0, 198, 255, 0.03))",
            border: "1px solid rgba(0, 255, 135, 0.18)",
            display: "flex", flexDirection: "row", alignItems: "center", gap: 14, minHeight: 72, height: 72
          }}>
            <div className="tile-icon" style={{ background: "rgba(0, 255, 135, 0.12)", marginTop: 0 }}>
              <BookOpen size={20} color="var(--brand)" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <p className="tile-label" style={{ marginTop: 0, fontSize: "0.95rem" }}>Manual de Ejercicios</p>
              <p style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 500, margin: 0 }}>Técnicas, GIFs e instrucciones</p>
            </div>
            <span style={{ marginLeft: "auto", color: "var(--brand)", fontSize: "1.2rem", fontWeight: 700 }}>→</span>
          </div>
        </Link>
      </div>

      {/* ── Mascota flotante ── */}
      <Mascota context="dashboard" />

      {/* ── Partículas animadas de fondo ── */}
      <Particles />
    </main>
  );
}

function Particles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes floatParticle {
          0% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0; }
          10% { opacity: 0.35; }
          90% { opacity: 0.35; }
          100% { transform: translateY(-120px) translateX(20px) scale(0.6); opacity: 0; }
        }
      `}</style>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {[...Array(10)].map((_, i) => {
          const left = `${(i * 11) % 100}%`;
          const top = `${(40 + (i * 7)) % 100}%`;
          const size = `${3 + (i % 3)}px`;
          const delay = `${i * 0.4}s`;
          const duration = `${7 + (i % 4)}s`;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left,
                top,
                width: size,
                height: size,
                borderRadius: "50%",
                background: i % 2 === 0 ? "var(--brand)" : "var(--brand2)",
                opacity: 0,
                filter: "blur(0.5px)",
                animation: `floatParticle ${duration} infinite linear`,
                animationDelay: delay,
              }}
            />
          );
        })}
      </div>
    </>
  );
}
