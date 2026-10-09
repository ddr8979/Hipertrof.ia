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

        {/* Placa izquierda - rectángulo redondeado bold */}
        <g transform="translate(20, 40)">
          <rect x="-14" y="-26" width="28" height="52" rx="6" fill="var(--text)" />
          {/* Bisel interior sutil */}
          <rect x="-10" y="-22" width="20" height="44" rx="4" fill="var(--text)" opacity="0.7" />
          {/* Marca de peso */}
          <rect x="-6" y="-4" width="12" height="8" rx="2" fill="var(--accent)" />
        </g>

        {/* Barra central - limpia con knurling mínimo */}
        <g transform="translate(42, 40)">
          <rect x="0" y="-7" width="76" height="14" rx="0" fill="var(--text)" />
          {/* Knurling: 3 líneas finas */}
          <line x1="8" y1="0" x2="68" y2="0" stroke="var(--surface)" strokeWidth="1.5" opacity="0.3" />
          <line x1="12" y1="-3" x2="64" y2="-3" stroke="var(--surface)" strokeWidth="1" opacity="0.15" />
          <line x1="12" y1="3" x2="64" y2="3" stroke="var(--surface)" strokeWidth="1" opacity="0.15" />
        </g>

        {/* Placa derecha - rectángulo redondeado bold */}
        <g transform="translate(140, 40)">
          <rect x="-14" y="-26" width="28" height="52" rx="6" fill="var(--text)" />
          <rect x="-10" y="-22" width="20" height="44" rx="4" fill="var(--text)" opacity="0.7" />
          <rect x="-6" y="-4" width="12" height="8" rx="2" fill="var(--accent)" />
        </g>
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
      <g transform="translate(20, 40)">
        <rect x="-14" y="-26" width="28" height="52" rx="6" fill="currentColor" />
        <rect x="-10" y="-22" width="20" height="44" rx="4" fill="currentColor" opacity="0.7" />
        <rect x="-6" y="-4" width="12" height="8" rx="2" fill="var(--accent)" />
      </g>

      {/* Barra */}
      <g transform="translate(42, 40)">
        <rect x="0" y="-7" width="76" height="14" fill="currentColor" />
        <line x1="8" y1="0" x2="68" y2="0" stroke="var(--surface)" strokeWidth="1.5" opacity="0.3" />
        <line x1="12" y1="-3" x2="64" y2="-3" stroke="var(--surface)" strokeWidth="1" opacity="0.15" />
        <line x1="12" y1="3" x2="64" y2="3" stroke="var(--surface)" strokeWidth="1" opacity="0.15" />
      </g>

      {/* Placa derecha */}
      <g transform="translate(140, 40)">
        <rect x="-14" y="-26" width="28" height="52" rx="6" fill="currentColor" />
        <rect x="-10" y="-22" width="20" height="44" rx="4" fill="currentColor" opacity="0.7" />
        <rect x="-6" y="-4" width="12" height="8" rx="2" fill="var(--accent)" />
      </g>
    </svg>
  );
}