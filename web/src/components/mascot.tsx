// Mascota de Hipertrof.ia: mancuerna realista, minimalista y animada.
// SVG 100% original, sin assets externos. Estilo "gym real" no cartoon.
"use client";

import { useEffect, useState } from "react";

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

/** Mancuerna realista: placas circulares, barra recta, knurling sutil. */
function DumbbellMascot() {
  return (
    <div className="relative size-28 sm:size-32 animate-db-float">
      <svg viewBox="0 0 140 80" className="size-full" role="img" aria-label="Mancuerna de Hipertrof.ia">
        <title>Mancuerna de Hipertrof.ia</title>

        <ellipse cx="70" cy="72" rx="36" ry="4" fill="var(--surface-3)" opacity="0.5" />

        <g className="animate-db-plate-glow" transform="translate(20, 40)">
          <circle r="18" fill="var(--text)" opacity="0.85" />
          <circle r="14" fill="var(--text)" opacity="0.6" />
          <circle r="6" fill="var(--surface)" />
          <circle r="6" fill="none" stroke="var(--border)" strokeWidth="1" />
          <ellipse cx="0" cy="-10" rx="9" ry="3" fill="white" opacity="0.1" />
        </g>

        <g transform="translate(38, 40)">
          <rect x="0" y="-8" width="64" height="16" rx="0" fill="var(--text)" opacity="0.95" />
          <g stroke="white" strokeWidth="0.6" opacity="0.08">
            <line x1="4" y1="-6" x2="60" y2="-6" />
            <line x1="4" y1="0" x2="60" y2="0" />
            <line x1="4" y1="6" x2="60" y2="6" />
            <line x1="4" y1="-2" x2="60" y2="-2" strokeWidth="0.4" opacity="0.05" />
            <line x1="4" y1="2" x2="60" y2="2" strokeWidth="0.4" opacity="0.05" />
          </g>
          <circle cx="16" cy="0" r="6" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.5" />
          <circle cx="48" cy="0" r="6" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.5" />
        </g>

        <g className="animate-db-plate-glow" style={{ animationDelay: "0.3s" }} transform="translate(120, 40)">
          <circle r="18" fill="var(--text)" opacity="0.85" />
          <circle r="14" fill="var(--text)" opacity="0.6" />
          <circle r="6" fill="var(--surface)" />
          <circle r="6" fill="none" stroke="var(--border)" strokeWidth="1" />
          <ellipse cx="0" cy="-10" rx="9" ry="3" fill="white" opacity="0.1" />
        </g>

        <g className="db-sparkle-container" style={{ transformOrigin: "70px 40px" }}>
          <circle className="animate-db-sparkle" cx="70" cy="12" r="1.5" fill="var(--accent)" />
          <circle className="animate-db-sparkle" cx="15" cy="30" r="1" fill="var(--accent)" style={{ animationDelay: "0.5s" }} />
          <circle className="animate-db-sparkle" cx="125" cy="30" r="1" fill="var(--accent)" style={{ animationDelay: "1s" }} />
          <circle className="animate-db-sparkle" cx="35" cy="55" r="1" fill="var(--warn)" style={{ animationDelay: "1.5s" }} />
          <circle className="animate-db-sparkle" cx="105" cy="55" r="1" fill="var(--warn)" style={{ animationDelay: "2s" }} />
        </g>
      </svg>
    </div>
  );
}

/** Icono simplificado para header, empty states, etc. */
export function DumbbellIcon({ size = 40, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 80"
      className={className + (animated ? " animate-db-float" : "")}
      role="img"
      aria-hidden="true"
    >
      <title>Mancuerna</title>
      <ellipse cx="70" cy="72" rx="36" ry="4" fill="var(--surface-3)" opacity="0.4" />
      <g transform="translate(20, 40)">
        <circle r="18" fill="var(--text)" opacity="0.85" />
        <circle r="14" fill="var(--text)" opacity="0.6" />
        <circle r="6" fill="var(--surface)" />
        <circle r="6" fill="none" stroke="var(--border)" strokeWidth="1" />
      </g>
      <g transform="translate(38, 40)">
        <rect x="0" y="-8" width="64" height="16" fill="var(--text)" opacity="0.95" />
        <g stroke="white" strokeWidth="0.6" opacity="0.08">
          <line x1="4" y1="-6" x2="60" y2="-6" />
          <line x1="4" y1="0" x2="60" y2="0" />
          <line x1="4" y1="6" x2="60" y2="6" />
        </g>
        <circle cx="16" cy="0" r="6" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.5" />
        <circle cx="48" cy="0" r="6" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.5" />
      </g>
      <g transform="translate(120, 40)">
        <circle r="18" fill="var(--text)" opacity="0.85" />
        <circle r="14" fill="var(--text)" opacity="0.6" />
        <circle r="6" fill="var(--surface)" />
        <circle r="6" fill="none" stroke="var(--border)" strokeWidth="1" />
      </g>
    </svg>
  );
}