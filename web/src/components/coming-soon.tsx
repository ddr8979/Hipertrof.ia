// Cartel animado "Próximamente" para funcionalidades aún no disponibles.
// Muestra una mancuerna haciendo curl, chispas y un badge con punto pulsante.
"use client";

import type { ReactNode } from "react";

export function ComingSoon({
  title = "Nos encontramos trabajando",
  description = "Esta función ya está en desarrollo: muy pronto la vas a poder usar.",
  compact = false,
  children,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={
        compact
          ? "flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
          : "flex flex-col items-center gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center sm:flex-row sm:gap-6 sm:p-7 sm:text-left"
      }
    >
      <DumbbellArt compact={compact} />
      <div className={compact ? "min-w-0 flex-1" : "flex max-w-lg flex-col items-center gap-1.5 sm:items-start"}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[var(--accent)]">
          <span className="size-1.5 rounded-full bg-[var(--accent)] animate-[cs-dot_1.3s_ease-in-out_infinite]" />
          Próximamente
        </span>
        <h3 className="mt-1 font-display text-lg font-bold tracking-tight sm:text-xl">{title}</h3>
        <p className="text-sm leading-relaxed text-[var(--text-2)]">{description}</p>
        {children}
      </div>
    </div>
  );
}

/** Ilustración animada: mancuerna haciendo curl con chispas alrededor. */
function DumbbellArt({ compact }: { compact?: boolean }) {
  const w = compact ? "size-16 shrink-0" : "size-24 shrink-0 sm:size-28";
  return (
    <div className={`${w} animate-[cs-bob_2.4s_ease-in-out_infinite]`}>
      <svg viewBox="0 0 112 96" className="size-full" aria-hidden="true">
        {/* Resplandor */}
        <circle cx="56" cy="48" r="40" fill="var(--accent-soft)" opacity="0.6" />
        {/* Mancuerna (gira como curl) */}
        <g
          style={{ transformOrigin: "56px 48px" }}
          className="animate-[cs-curl_2.4s_ease-in-out_infinite]"
        >
          <rect x="48" y="44" width="16" height="8" rx="4" fill="var(--text-2)" />
          <rect x="34" y="38" width="10" height="20" rx="3.5" fill="var(--accent)" />
          <rect x="24" y="32" width="10" height="32" rx="4" fill="var(--accent)" />
          <rect x="68" y="38" width="10" height="20" rx="3.5" fill="var(--accent)" />
          <rect x="78" y="32" width="10" height="32" rx="4" fill="var(--accent)" />
        </g>
        {/* Chispas */}
        <g className="animate-[cs-spark_1.6s_ease-in-out_infinite]" style={{ transformOrigin: "18px 20px" }}>
          <path d="M18 13l1.8 5.2L25 20l-5.2 1.8L18 27l-1.8-5.2L11 20l5.2-1.8z" fill="var(--accent)" />
        </g>
        <g
          className="animate-[cs-spark_1.6s_ease-in-out_infinite]"
          style={{ transformOrigin: "92px 26px", animationDelay: "0.5s" }}
        >
          <path d="M92 20l1.5 4.5L98 26l-4.5 1.5L92 32l-1.5-4.5L86 26l4.5-1.5z" fill="var(--text-2)" />
        </g>
        <g
          className="animate-[cs-spark_1.6s_ease-in-out_infinite]"
          style={{ transformOrigin: "86px 72px", animationDelay: "1s" }}
        >
          <path d="M86 67l1.3 3.7L91 72l-3.7 1.3L86 77l-1.3-3.7L81 72l3.7-1.3z" fill="var(--accent)" />
        </g>
      </svg>
    </div>
  );
}
