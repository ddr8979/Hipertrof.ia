"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function PendientePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        textAlign: "center",
        background: "var(--bg)",
      }}
    >
      {/* Ícono animado */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(0,198,255,0.12))",
          border: "2px solid rgba(124,58,237,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          fontSize: "2.8rem",
          animation: "pulse-glow 2.5s ease-in-out infinite",
        }}
      >
        ⏳
      </div>

      <h1
        style={{
          fontSize: "1.6rem",
          fontWeight: 900,
          color: "var(--text)",
          margin: "0 0 12px",
          lineHeight: 1.2,
        }}
      >
        Tu acceso está siendo revisado
      </h1>

      <p
        style={{
          fontSize: "0.95rem",
          color: "var(--text2)",
          lineHeight: 1.6,
          maxWidth: 320,
          margin: "0 0 32px",
        }}
      >
        El trainer confirmará tu cuenta a la brevedad.
        Te avisará por <strong style={{ color: "var(--brand)" }}>WhatsApp</strong> cuando estés listo para entrenar 💪
      </p>

      <div
        className="glass card"
        style={{
          width: "100%",
          maxWidth: 340,
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "var(--brand)" }}>
          Mientras tanto podés:
        </p>
        {[
          "📋 Completar tu perfil cuando se te habilite",
          "💧 Hidratarte bien (2L de agua/día mínimo)",
          "😴 Descansar 7-9h por noche para mejores resultados",
          "🥗 Empezar a pensar en tu alimentación",
        ].map((tip) => (
          <p key={tip} style={{ margin: 0, fontSize: "0.85rem", color: "var(--text2)", lineHeight: 1.4 }}>
            {tip}
          </p>
        ))}
      </div>

      <button
        onClick={logout}
        className="btn btn-ghost"
        style={{ width: "100%", maxWidth: 340 }}
      >
        Cerrar sesión
      </button>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(124,58,237,0.2); transform: scale(1); }
          50% { box-shadow: 0 0 40px rgba(124,58,237,0.45); transform: scale(1.05); }
        }
      `}</style>
    </main>
  );
}
