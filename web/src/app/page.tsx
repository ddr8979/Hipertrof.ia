"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Dumbbell, ArrowRight } from "lucide-react";

export default function Landing() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading) return <Loader />;

  if (user) return null;

  return (
    <main className="page anim-fade" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "85dvh", textAlign: "center", position: "relative" }}>
      {/* Background glow strip */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 320,
        height: 320,
        borderRadius: "50%",
        pointerEvents: "none",
        background: "radial-gradient(circle, rgba(0,255,135,0.12) 0%, transparent 70%)",
        filter: "blur(40px)",
        zIndex: -1
      }} />

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <span className="badge badge-purple" style={{ textTransform: "none", height: 26, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand2)", display: "inline-block" }} /> Beta v1.0 · 2026
        </span>
      </div>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: "12px",
          background: "linear-gradient(135deg, var(--brand) 0%, var(--brand2) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#000"
        }}>
          <Dumbbell size={22} />
        </div>
        <span style={{ fontSize: "1.8rem", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text)" }}>
          hypertrof<span style={{ color: "var(--brand)" }}>.</span>ia
        </span>
      </div>

      <h1 style={{
        fontSize: "clamp(2.4rem, 8vw, 3.4rem)",
        fontWeight: 900,
        lineHeight: 1.1,
        margin: "0 0 16px",
        letterSpacing: "-0.04em",
        color: "var(--text)"
      }}>
        Tu rendimiento, <br />
        <span style={{
          background: "linear-gradient(135deg, var(--brand) 0%, var(--brand2) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          potenciado al máximo.
        </span>
      </h1>

      <p style={{
        fontSize: "0.98rem",
        color: "var(--text2)",
        maxWidth: 400,
        lineHeight: 1.5,
        margin: "0 auto 36px",
        fontWeight: 500
      }}>
        Rutinas premium con registro intuitivo, calculadora de 1RM, control de macros y panel para personal trainers. Todo en una app nativa para tu celular.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320, width: "100%", margin: "0 auto" }}>
        <Link href="/auth?mode=register" className="btn btn-primary btn-full">
          Empezar Ahora <ArrowRight size={18} />
        </Link>
        <Link href="/auth" className="btn btn-ghost btn-full">
          Iniciar Sesión
        </Link>
      </div>

      {/* Feature list tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 44, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
        {["Rutinas Inteligentes", "Macros & Calorías", "Estimación de 1RM", "Gestión de Alumnos", "Progreso Semanal"].map(f => (
          <span key={f} style={{
            padding: "6px 14px",
            borderRadius: 99,
            border: "1.5px solid var(--border)",
            fontSize: "0.78rem",
            color: "var(--text2)",
            background: "rgba(255,255,255,0.02)",
            fontWeight: 600
          }}>
            {f}
          </span>
        ))}
      </div>
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
