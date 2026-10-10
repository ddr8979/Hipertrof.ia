import { cn } from "@/lib/utils";

/**
 * Wordmark de Hipertrof.ia — vectorial (paths), sin dependencia de fuentes.
 * Trazado en Italiana con tracking de firma; el punto es el acento de marca.
 * Se tiñe con currentColor y el punto con var(--accent), así se adapta a
 * claro/oscuro automáticamente.
 */

const LEFT =
  "M13.30-36.80L13.30 0L5 0L5-70L13.30-70L13.30-37.80L45.80-37.80L45.80-70L54.10-70L54.10 0L45.80 0L45.80-36.80L13.30-36.80Z M84.70-69L80.10-69L80.10-70L97.90-70L97.90-69L93-69L93-1L97.90-1L97.90 0L80.10 0L80.10-1L84.70-1L84.70-69Z M125.90 0L125.90-69.20Q137.50-70 146.30-70L146.30-70Q171.10-70 171.10-52.50L171.10-52.50Q171.10-44.40 166.90-38.30L166.90-38.30Q164.70-35 160.10-33.05Q155.50-31.10 149-31.10L149-31.10L134.20-31.10L134.20 0L125.90 0ZM146.40-69L146.40-69Q140.60-69 134.20-68.30L134.20-68.30L134.20-32.10L149-32.10Q163.10-32.70 163.10-52.30L163.10-52.30Q163.10-60.30 158.90-64.65Q154.70-69 146.40-69Z M197.10-70L236.90-70L236.90-69L205.40-69L205.40-39L234.60-39L234.60-38L205.40-38L205.40-1L239.10-1L239.10 0L197.10 0L197.10-70Z M263.60 0L263.60-69.20Q275.20-70 284.10-70L284.10-70Q308.80-70 308.80-53.50L308.80-53.50Q308.80-46.50 305.40-41Q302-35.50 293.70-33.70L293.70-33.70L313.70 0L304.40 0L284.80-33.10L271.90-33.10L271.90 0L263.60 0ZM284.10-69L284.10-69Q278.30-69 271.90-68.30L271.90-68.30L271.90-34.10L286.70-34.10Q300.80-34.70 300.80-53.30L300.80-53.30Q300.80-60.90 296.60-64.95Q292.40-69 284.10-69Z M359.30-69L359.30 0L351.00 0L351.00-69L333.70-69L333.70-70L376.70-70L376.70-69L359.30-69Z M400.70 0L400.70-69.20Q412.30-70 421.20-70L421.20-70Q445.90-70 445.90-53.50L445.90-53.50Q445.90-46.50 442.50-41Q439.10-35.50 430.80-33.70L430.80-33.70L450.80 0L441.50 0L421.90-33.10L409.00-33.10L409.00 0L400.70 0ZM421.20-69L421.20-69Q415.40-69 409.00-68.30L409.00-68.30L409.00-34.10L423.80-34.10Q437.90-34.70 437.90-53.30L437.90-53.30Q437.90-60.90 433.70-64.95Q429.50-69 421.20-69Z M472.80-33.30L472.80-33.30Q472.80-51.50 481.65-60.95Q490.50-70.40 504.40-70.40Q518.30-70.40 526.55-62.20Q534.80-54 534.80-36Q534.80-18 526.00-8.80Q517.20 0.40 502.50 0.40L502.50 0.40Q489.80 0.40 481.70-6.90L481.70-6.90Q477.50-10.70 475.15-17.45Q472.80-24.20 472.80-33.30ZM504.10-69.40Q494.00-69.40 487.55-60.40Q481.10-51.40 481.10-34Q481.10-16.60 487.20-8.60Q493.30-0.60 503.45-0.60Q513.60-0.60 520.05-9.65Q526.50-18.70 526.50-35.95Q526.50-53.20 520.35-61.30Q514.20-69.40 504.10-69.40Z M560.80-70L600.60-70L600.60-69L569.10-69L569.10-37L598.30-37L598.30-36L569.10-36L569.10 0L560.80 0L560.80-70Z";
const RIGHT =
  "M645.70-69L641.10-69L641.10-70L658.90-70L658.90-69L654-69L654-1L658.90-1L658.90 0L641.10 0L641.10-1L645.70-1L645.70-69Z M693.60-22L684.10 0L682.90 0L712.80-70L713.90-70.50L739.10 0L730.60 0L722.80-22L693.60-22ZM722.50-23L709.70-59.20L694-23L722.50-23Z";

export function Logo({
  className,
  monochrome = false,
}: {
  className?: string;
  /** Si es true, el punto también usa currentColor (para usos monocromos). */
  monochrome?: boolean;
}) {
  return (
    <svg
      viewBox="-3 -79 751 92"
      className={cn("block", className)}
      role="img"
      aria-label="Hipertrof.ia"
    >
      <title>Hipertrof.ia</title>
      <g fill="currentColor">
        <path d={LEFT} />
        <path d={RIGHT} />
      </g>
      <circle
        cx={619.1}
        cy={-1.5}
        r={6.2}
        fill={monochrome ? "currentColor" : "var(--accent, #0077d6)"}
      />
    </svg>
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
