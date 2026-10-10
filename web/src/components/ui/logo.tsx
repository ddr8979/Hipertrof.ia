import { cn } from "@/lib/utils";

/**
 * Wordmark de Hipertrof.ia — firma manuscrita raster.
 * Dos PNG en /public/assets/logo: negro (modo claro) y blanco (modo oscuro).
 * Se alternan con CSS puro sobre la clase `.dark` del <html> (next-themes),
 * así funciona igual en servidor y cliente sin JS. `LogoMark` (monograma H)
 * se mantiene vectorial para tamaños chicos (favicon/espacios reducidos).
 */

const FIRMA_NEGRA = "/assets/logo/hipertrofia-firma-negra.png";
const FIRMA_BLANCA = "/assets/logo/hipertrofia-firma-blanca.png";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative block", className)}
      role="img"
      aria-label="Hipertrof.ia"
    >
      {/* Negra — visible en modo claro, oculta en oscuro. */}
      <img
        src={FIRMA_NEGRA}
        alt=""
        aria-hidden
        className="block h-full w-auto dark:hidden"
      />
      {/* Blanca — oculta en claro, visible en oscuro. */}
      <img
        src={FIRMA_BLANCA}
        alt=""
        aria-hidden
        className="hidden h-full w-auto dark:block"
      />
    </span>
  );
}

/** Monograma "H" con las barras de mancuerna — para favicon / espacios chicos. */
export function LogoMark({
  className,
  bg,
}: {
  className?: string;
  /** Color del contenedor squircle; si se omite, no dibuja fondo. */
  bg?: string;
}) {
  return (
    <svg viewBox="0 0 120 120" className={cn("block", className)} role="img" aria-label="Hipertrof.ia">
      <title>Hipertrof.ia</title>
      {bg ? <rect width="120" height="120" rx="27" fill={bg} /> : null}
      <path
        d="M36 24h17v32h14V24h17v72H67V64H53v32H36z"
        fill={bg ? "#f5f5f3" : "currentColor"}
      />
      <g fill="var(--accent, #0077d6)">
        <rect x="27.5" y="58" width="10" height="4" rx="2" />
        <rect x="82.5" y="58" width="10" height="4" rx="2" />
      </g>
    </svg>
  );
}
