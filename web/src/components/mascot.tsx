// Mascota de Hipertrof.ia: mancuerna elegante y animada.
// Diseño premium, minimalista, con personalidad — no un personaje cartoon.
// SVG 100% original, animado con CSS global, sin assets externos.
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
    <div className="mb-4 flex flex-col items-center gap-2" aria-hidden="true">
      <DumbbellMascot />
      <div
        key={i}
        className="relative max-w-[14rem] animate-fade-up rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center text-sm font-semibold leading-snug text-[var(--text-2)] shadow-[var(--shadow-md)]"
      >
        <span className="absolute left-1/2 bottom-[-6px] size-3 -translate-x-1/2 rotate-45 border-b border-r border-[var(--border)] bg-[var(--surface)]" />
        {phrases[i]}
      </div>
    </div>
  );
}

/** Mancuerna animada: flotación sutil, pulso de brillo, rotación ocasional. */
function DumbbellMascot() {
  return (
    <div className="relative size-28 sm:size-32 animate-db-float">
      <svg viewBox="0 0 160 100" className="size-full" role="img" aria-label="Mancuerna de Hipertrof.ia">
        <title>Mancuerna de Hipertrof.ia</title>

        {/* Sombra proyectada en el suelo */}
        <ellipse cx="80" cy="94" rx="38" ry="6" fill="var(--surface-3)" opacity="0.6" />

        {/* Disco izquierdo */}
        <g className="animate-db-plate-glow">
          {/* Disco exterior */}
          <ellipse cx="32" cy="50" rx="22" ry="28" fill="var(--accent)" />
          {/* Bisel interior */}
          <ellipse cx="32" cy="48" rx="18" ry="24" fill="color-mix(in srgb, var(--accent) 75%, white)" />
          {/* Agujero central */}
          <ellipse cx="32" cy="50" rx="8" ry="10" fill="var(--surface)" />
          {/* Borde del agujero */}
          <ellipse cx="32" cy="50" rx="8" ry="10" fill="none" stroke="var(--border)" strokeWidth="1.5" />
          {/* Reflejo superior */}
          <ellipse cx="32" cy="36" rx="12" ry="6" fill="white" opacity="0.15" />
        </g>

        {/* Barra central (manija) */}
        <g>
          {/* Cuerpo de la barra */}
          <rect x="54" y="38" width="52" height="24" rx="12" fill="var(--text)" opacity="0.9" />
          {/* Brillo superior de la barra */}
          <rect x="54" y="38" width="52" height="10" rx="12" fill="white" opacity="0.08" />
          {/* Knurling (rayado de agarre) sugerido */}
          <g stroke="white" strokeWidth="0.8" opacity="0.12">
            <line x1="58" y1="42" x2="102" y2="42" />
            <line x1="58" y1="48" x2="102" y2="48" />
            <line x1="58" y1="54" x2="102" y2="54" />
          </g>
          {/* Anillo decorativo central */}
          <circle cx="80" cy="50" r="8" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.6" />
        </g>

        {/* Disco derecho */}
        <g className="animate-db-plate-glow" style={{ animationDelay: "0.3s" }}>
          {/* Disco exterior */}
          <ellipse cx="128" cy="50" rx="22" ry="28" fill="var(--accent)" />
          {/* Bisel interior */}
          <ellipse cx="128" cy="48" rx="18" ry="24" fill="color-mix(in srgb, var(--accent) 75%, white)" />
          {/* Agujero central */}
          <ellipse cx="128" cy="50" rx="8" ry="10" fill="var(--surface)" />
          {/* Borde del agujero */}
          <ellipse cx="128" cy="50" rx="8" ry="10" fill="none" stroke="var(--border)" strokeWidth="1.5" />
          {/* Reflejo superior */}
          <ellipse cx="128" cy="36" rx="12" ry="6" fill="white" opacity="0.15" />
        </g>

        {/* Partículas de energía alrededor */}
        <g className="db-sparkle-container" style={{ transformOrigin: "80px 50px" }}>
          <circle className="animate-db-sparkle" cx="15" cy="20" r="2.5" fill="var(--accent)" />
          <circle className="animate-db-sparkle" cx="145" cy="18" r="2" fill="var(--accent)" style={{ animationDelay: "0.4s" }} />
          <circle className="animate-db-sparkle" cx="80" cy="10" r="3" fill="var(--accent)" style={{ animationDelay: "0.8s" }} />
          <circle className="animate-db-sparkle" cx="25" cy="75" r="2" fill="var(--warn)" style={{ animationDelay: "1.2s" }} />
          <circle className="animate-db-sparkle" cx="135" cy="78" r="2.5" fill="var(--warn)" style={{ animationDelay: "1.6s" }} />
        </g>
      </svg>
    </div>
  );
}

// Variante simplificada para usar en otros lugares (header, empty states, etc.)
export function DumbbellIcon({ size = 40, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 100"
      className={className + (animated ? " animate-db-float" : "")}
      role="img"
      aria-hidden="true"
    >
      <title>Mancuerna</title>
      {/* Sombra */}
      <ellipse cx="80" cy="94" rx="38" ry="6" fill="var(--surface-3)" opacity="0.5" />
      {/* Disco izquierdo */}
      <ellipse cx="32" cy="50" rx="22" ry="28" fill="var(--accent)" />
      <ellipse cx="32" cy="48" rx="18" ry="24" fill="color-mix(in srgb, var(--accent) 75%, white)" />
      <ellipse cx="32" cy="50" rx="8" ry="10" fill="var(--surface)" />
      <ellipse cx="32" cy="50" rx="8" ry="10" fill="none" stroke="var(--border)" strokeWidth="1.5" />
      {/* Barra */}
      <rect x="54" y="38" width="52" height="24" rx="12" fill="var(--text)" opacity="0.9" />
      <rect x="54" y="38" width="52" height="10" rx="12" fill="white" opacity="0.08" />
      <circle cx="80" cy="50" r="8" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.5" />
      {/* Disco derecho */}
      <ellipse cx="128" cy="50" rx="22" ry="28" fill="var(--accent)" />
      <ellipse cx="128" cy="48" rx="18" ry="24" fill="color-mix(in srgb, var(--accent) 75%, white)" />
      <ellipse cx="128" cy="50" rx="8" ry="10" fill="var(--surface)" />
      <ellipse cx="128" cy="50" rx="8" ry="10" fill="none" stroke="var(--border)" strokeWidth="1.5" />
    </svg>
  );
}