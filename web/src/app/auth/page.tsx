"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Toast } from "@/components/toast";
import { Dumbbell, User, Users, ChevronLeft } from "lucide-react";

type ToastType = { msg: string; type: "success" | "error" };

function AuthForm() {
  const params = useSearchParams();
  const [step, setStep] = useState<"role" | "auth">(
    params.get("mode") === "register" ? "role" : "auth"
  );
  const [mode, setMode] = useState<"login" | "register">(
    params.get("mode") === "register" ? "register" : "login"
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("ATHLETE");
  const [trainers, setTrainers] = useState<any[]>([]);
  const [trainerId, setTrainerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastType | null>(null);
  const { user, refresh, loading } = useAuth();
  const router = useRouter();

  // Fetch approved trainers for athlete registration
  useEffect(() => {
    if (mode === "register" && role === "ATHLETE") {
      fetch("/api/auth/trainers")
        .then((r) => r.json())
        .then((data) => {
          setTrainers(data.trainers ?? []);
          if (data.trainers && data.trainers.length > 0) {
            setTrainerId(data.trainers[0].id);
          }
        })
        .catch((err) => console.error("Error al cargar trainers:", err));
    }
  }, [mode, role]);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (user.role === "TRAINER" || user.role === "ADMIN") {
        router.replace("/trainer");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, router, mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email, password }
        : { email, password, name, role, phone, trainerId: (role === "ATHLETE" && trainerId) ? trainerId : undefined };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setToast({ msg: data.error ?? "Error", type: "error" });
        return;
      }

      await refresh();
      if (role === "TRAINER") {
        router.replace("/trainer");
      } else {
        router.replace("/dashboard");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectRole = (r: string) => {
    setRole(r);
    setStep("auth");
  };

  if (loading) return null;

  return (
    <div className="auth-page anim-fade">
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="auth-card glass" style={{ position: "relative", border: "1.5px solid var(--border2)" }}>
        
        {/* Minimalist Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: "12px",
            background: "linear-gradient(135deg, var(--brand) 0%, var(--brand2) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000"
          }}>
            <Dumbbell size={20} />
          </div>
          <span style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text)" }}>
            hypertrof<span style={{ color: "var(--brand)" }}>.</span>ia
          </span>
        </div>

        {step === "role" && (
          <div className="anim-fade">
            <p style={{ textAlign: "center", fontSize: "1.15rem", fontWeight: 800, marginBottom: 20, color: "var(--text)" }}>
              ¿Cómo querés ingresar?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={() => selectRole("ATHLETE")} className="glass card-sm" style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                cursor: "pointer",
                textAlign: "left",
                background: "rgba(255,255,255,0.02)",
                border: "1.5px solid var(--border)",
                width: "100%",
                transition: "all 150ms"
              }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,255,135,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", flexShrink: 0 }}>
                  <User size={20} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "1.05rem", color: "var(--text)" }}>Soy Alumno</p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--text2)", lineHeight: 1.3 }}>Quiero registrar mis rutinas y ver mi progreso semanal.</p>
                </div>
              </button>

              <button onClick={() => selectRole("TRAINER")} className="glass card-sm" style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                cursor: "pointer",
                textAlign: "left",
                background: "rgba(255,255,255,0.02)",
                border: "1.5px solid var(--border)",
                width: "100%",
                transition: "all 150ms"
              }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,198,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand2)", flexShrink: 0 }}>
                  <Users size={20} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "1.05rem", color: "var(--text)" }}>Soy Personal Trainer</p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--text2)", lineHeight: 1.3 }}>Quiero gestionar a mis alumnos y armar rutinas.</p>
                </div>
              </button>
            </div>
            
            <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.88rem", color: "var(--text2)", fontWeight: 500 }}>
              ¿Ya tenés una cuenta?{" "}
              <button onClick={() => { setStep("auth"); setMode("login"); }}
                style={{ background: "none", border: "none", color: "var(--brand)", fontWeight: 800, cursor: "pointer", padding: 0 }}>
                Iniciá sesión
              </button>
            </p>
          </div>
        )}

        {step === "auth" && (
          <div className="anim-fade">
            <button onClick={() => setStep("role")} style={{
              position: "absolute", top: 28, left: 24, background: "transparent", border: "none",
              color: "var(--text2)", cursor: "pointer", padding: 4, display: "flex", alignItems: "center"
            }}>
              <ChevronLeft size={20} />
            </button>

            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <p style={{ margin: "0", fontSize: "1.35rem", fontWeight: 900 }}>
                {mode === "login" ? "Bienvenido de vuelta 👋" : "Crear cuenta"}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--muted)", fontWeight: 600 }}>
                {mode === "login" ? "Iniciá sesión para continuar" : `Ingresá tus datos como ${role === "ATHLETE" ? "Alumno" : "Personal Trainer"}`}
              </p>
            </div>

            <div className="tab-bar" style={{ marginBottom: 20 }}>
              <button className={`tab-btn ${mode === "login" ? "active" : ""}`}
                onClick={() => setMode("login")}>Entrar</button>
              <button className={`tab-btn ${mode === "register" ? "active" : ""}`}
                onClick={() => setMode("register")}>Registrarse</button>
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {mode === "register" && (
                <div className="field">
                  <label className="label">Nombre completo</label>
                  <input className="input" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ej. Juan García" required />
                </div>
              )}

              <div className="field">
                <label className="label">Email o Teléfono</label>
                <input className="input" type="text" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="Email o Teléfono" required />
              </div>

              <div className="field">
                <label className="label">Contraseña</label>
                <input className="input" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
              </div>

              {mode === "register" && (
                <div className="field">
                  <label className="label">Número de WhatsApp</label>
                  <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="Ej. +59899123456" required />
                </div>
              )}

              {mode === "register" && role === "ATHLETE" && (
                <div className="field">
                  <label className="label">Tu Personal Trainer (Opcional)</label>
                  <select className="input" value={trainerId}
                    onChange={e => setTrainerId(e.target.value)}>
                    <option value="">Sin Personal Trainer (Entrenar solo)</option>
                    {trainers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full"
                style={{ marginTop: 8 }} disabled={isSubmitting}>
                {isSubmitting ? "Procesando..." : mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="spinner" /></div>}>
      <AuthForm />
    </Suspense>
  );
}
