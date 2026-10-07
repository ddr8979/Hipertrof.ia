// Mascota original de Hipertrof.ia para login/registro.
// Estilo cartoon "rubber hose": parpadeo, squash & stretch y globos de diálogo
// con frases que rotan. SVG 100% original (sin assets externos ni licencias).
"use client";

import { useEffect, useState } from "react";

// Frases del globo según el contexto (voseo, como el resto de la app).
const PHRASES: Record<"login" | "registro", string[]> = {
  login: [
    "¡Entrá! Tu PR te está esperando 💪",
    "Hoy se entrena, mañana se jacta 😎",
    "¿Seguimos esa racha?",
  ],
  registro: [
    "¡Bienvenido al equipo! 🎉",
    "Creá la cuenta y arrancamos",
    "Tu yo del futuro te va a agradecer",
  ],
};

/**
 * Mascota con globo de diálogo.
 * @param mode "login" o "registro": elige el set de frases.
 */
export function Mascot({ mode }: { mode: "login" | "registro" }) {
  const phrases = PHRASES[mode];
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % phrases.length), 4200);
    return () => clearInterval(t);
  }, [phrases.length]);

  return (
    <div className="mb-4 flex items-end justify-center gap-1.5" aria-hidden="true">
      <MascotArt />
      <div
        key={i}
        className="relative mb-7 max-w-[13.5rem] animate-[fade-up_0.45s_cubic-bezier(0.16,1,0.3,1)_both] rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-left text-sm font-semibold leading-snug text-[var(--text-2)] shadow-[var(--shadow-md)]"
      >
        <span className="absolute -left-1 bottom-4 size-3 rotate-45 rounded-[2px] border-b border-l border-[var(--border)] bg-[var(--surface)]" />
        {phrases[i]}
      </div>
    </div>
  );
}

/** Ilustración animada de la mascota (squash & stretch + parpadeo). */
function MascotArt() {
  const eye = (cx: number) => (
    <g key={cx}>
      {/* Blanco del ojo */}
      <ellipse cx={cx} cy={58} rx={8} ry={11} fill="#ffffff" />
      {/* Pupila con brillo */}
      <ellipse cx={cx + 1.5} cy={61} rx={3.6} ry={4.8} fill="#161a12" />
      <circle cx={cx - 1} cy={58.5} r={1.6} fill="#ffffff" />
      {/* Párpado (parpadeo): cubre el interior, el contorno va encima */}
      <ellipse
        cx={cx}
        cy={58}
        rx={8}
        ry={11}
        fill="var(--accent)"
        style={{
          transformBox: "fill-box",
          transformOrigin: "center top",
          animation: "hi-blink 4.6s ease-in-out infinite",
        }}
      />
      {/* Contorno del ojo */}
      <ellipse cx={cx} cy={58} rx={8} ry={11} fill="none" stroke="#161a12" strokeWidth={2} />
    </g>
  );

  return (
    <div className="size-24 shrink-0 animate-[hi-idle_2.8s_ease-in-out_infinite] sm:size-28">
      <svg viewBox="0 0 124 130" className="size-full" role="img">
        <title>Hipi, la mascota de Hipertrof.ia</title>

        {/* Sombra */}
        <ellipse cx="60" cy="120" rx="24" ry="5" fill="var(--surface-3)" />

        {/* Brazo izquierdo (manguera de goma con guante) */}
        <path
          d="M30 74 C20 78 14 86 13 93"
          fill="none"
          stroke="#161a12"
          strokeWidth={5}
          strokeLinecap="round"
        />
        <circle cx="11" cy="98" r="7.5" fill="#fff" stroke="#161a12" strokeWidth={2} />
        <path d="M7 96 q4 3 8 1" fill="none" stroke="#161a12" strokeWidth={1.4} strokeLinecap="round" />

        {/* Brazo derecho: flex + saludo periódico (gira desde el hombro) */}
        <g
          className="animate-[hi-wave_4.6s_ease-in-out_infinite]"
          style={{ transformOrigin: "90px 70px" }}
        >
          <path
            d="M90 70 C100 66 106 58 106 50"
            fill="none"
            stroke="#161a12"
            strokeWidth={5}
            strokeLinecap="round"
          />
          <circle cx="107" cy="45" r="7.5" fill="#fff" stroke="#161a12" strokeWidth={2} />
          <path d="M103 43 q4 3 8 1" fill="none" stroke="#161a12" strokeWidth={1.4} strokeLinecap="round" />
        </g>
        {/* Chispas del flex */}
        <g className="animate-[cs-spark_1.8s_ease-in-out_infinite]" style={{ transformOrigin: "116px 30px" }}>
          <path d="M116 24l1.5 4.5L122 30l-4.5 1.5L116 36l-1.5-4.5L110 30l4.5-1.5z" fill="var(--accent)" />
        </g>
        <g className="animate-[cs-spark_1.8s_ease-in-out_infinite]" style={{ transformOrigin: "96px 32px", animationDelay: "0.7s" }}>
          <path d="M96 28l1.1 3.2L100.3 32.3l-3.2 1.1L96 36.6l-1.1-3.2L91.7 32.3l3.2-1.1z" fill="var(--text-2)" />
        </g>

        {/* Cuerpo (huevo) */}
        <path
          d="M60 26 C80 26 96 44 96 68 C96 92 80 106 60 106 C40 106 24 92 24 68 C24 44 40 26 60 26 Z"
          fill="var(--accent)"
        />
        {/* Cara */}
        <ellipse cx="60" cy="66" rx="27" ry="28" fill="#f6f8f2" />
        {/* Rubor */}
        <ellipse cx="37" cy="76" rx="5.5" ry="3.5" fill="#ff9aa8" opacity="0.5" />
        <ellipse cx="83" cy="76" rx="5.5" ry="3.5" fill="#ff9aa8" opacity="0.5" />

        {/* Ojos */}
        {eye(51)}
        {eye(71)}

        {/* Sonrisa abierta estilo cartoon */}
        <path d="M45 78 Q60 97 75 78 Z" fill="#241512" />
        <ellipse cx="60" cy="90" rx="7" ry="4" fill="#ff8d9c" />
        <path d="M45 78 L75 78 L75 81 Q60 84.5 45 81 Z" fill="#ffffff" />
      </svg>
    </div>
  );
}
