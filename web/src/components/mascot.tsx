// Mascota de Hipertrof.ia: mancuerna moderna estilo Hevy/Fitia.
// Geometría limpia, bold, sin ruido visual. SVG 100% original.
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

/**
 * Mancuerna moderna estilo Hevy/Fitia:
 * - Formas geométricas limpies y bold
 * - Placas = rectángulos redondeados (no círculos)
 * - Barra = rectángulo con separadores (knurling mínimo)
 * - Sin partículas, sin brillos excesivos
 * - Un solo acento de color (accent) para dar vida
 */
function DumbbellMascot() {
  return (
    <div className="relative size-28 sm:size-32 animate-db-float">
      <svg viewBox="0 0 160 80" className="size-full" role="img" aria-label="Mancuerna de Hipertrof.ia">
        <title>Mancuerna de Hipertrof.ia</title>

        {/* Placa izquierda */}
        <rect x="6" y="14" width="28" height="52" rx="6" fill="var(--text)" />
        <rect x="12" y="18" width="16" height="44" rx="4" fill="var(--surface-2)" />
        <rect x="16" y="36" width="8" height="8" rx="2" fill="var(--accent)" />

        {/* Barra */}
        <rect x="42" y="33" width="76" height="14" rx="0" fill="var(--text)" />
        <line x1="50" y1="40" x2="110" y2="40" stroke="var(--surface-2)" strokeWidth="2" strokeLinecap="round" />

        {/* Placa derecha */}
        <rect x="126" y="14" width="28" height="52" rx="6" fill="var(--text)" />
        <rect x="132" y="18" width="16" height="44" rx="4" fill="var(--surface-2)" />
        <rect x="136" y="36" width="8" height="8" rx="2" fill="var(--accent)" />
      </svg>
    </div>
  );
}

/** Icono limpio para header, empty states, etc. */
export function DumbbellIcon({ size = 40, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 80"
      className={className + (animated ? " animate-db-float" : "")}
      role="img"
      aria-hidden="true"
    >
      <title>Mancuerna</title>

      {/* Placa izquierda */}
      <rect x="6" y="14" width="28" height="52" rx="6" fill="currentColor" />
      <rect x="12" y="18" width="16" height="44" rx="4" fill="var(--surface-2)" />
      <rect x="16" y="36" width="8" height="8" rx="2" fill="var(--accent)" />

      {/* Barra */}
      <rect x="42" y="33" width="76" height="14" fill="currentColor" />
      <line x1="50" y1="40" x2="110" y2="40" stroke="var(--surface-2)" strokeWidth="2" strokeLinecap="round" />

      {/* Placa derecha */}
      <rect x="126" y="14" width="28" height="52" rx="6" fill="currentColor" />
      <rect x="132" y="18" width="16" height="44" rx="4" fill="var(--surface-2)" />
      <rect x="136" y="36" width="8" height="8" rx="2" fill="var(--accent)" />
    </svg>
  );
}