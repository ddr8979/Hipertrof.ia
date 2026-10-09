// Mascarota de Hipertrof.ia: marca "H" bold dentro de un cuadro redondeado.
// Estilo Hevy/Fitia: geometría limpia, sin sombras, sin glow, sin ruido.
"use client";

import { useEffect, useState } from "react";
import { Dumbbell } from "lucide-react";

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
    <div className="mb-4 flex flex-col items-center gap-3" aria-hidden="true">
      <BrandMark />
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

/** Marca "H" bold estilo Hevy: cuadro redondeado con acento brand. */
function BrandMark() {
  return (
    <div className="size-24 sm:size-28 animate-db-float">
      <svg viewBox="0 0 96 96" className="size-full" role="img" aria-label="Hipertrof.ia">
        <title>Hipertrof.ia</title>
        {/* Fondo: cuadro redondeado con acento */}
        <rect x="4" y="4" width="88" height="88" rx="22" fill="var(--accent)" />
        {/* Sombra interna sutil (no negra, sino más oscura del acento) */}
        <rect x="4" y="4" width="88" height="88" rx="22" fill="white" opacity="0.08" />
        {/* Letra H bold */}
        <g fill="var(--accent-ink)" transform="translate(48,48)">
          {/* Barra izquierda */}
          <rect x="-22" y="-24" width="10" height="48" rx="3" />
          {/* Barra derecha */}
          <rect x="12" y="-24" width="10" height="48" rx="3" />
          {/* Barra central */}
          <rect x="-12" y="-5" width="24" height="10" rx="3" />
        </g>
        {/* Pequeño punto de acento */}
        <circle cx="76" cy="20" r="5" fill="white" opacity="0.3" />
      </svg>
    </div>
  );
}

/** Icono de mancuerna: usa el icono nativo de Lucide (limpio, consistente). */
export function DumbbellIcon({ size = 40, className = "", animated = false }: { size?: number; className?: string; animated?: boolean }) {
  return (
    <Dumbbell
      size={size}
      strokeWidth={1.8}
      className={className + (animated ? " animate-db-float" : "")}
    />
  );
}