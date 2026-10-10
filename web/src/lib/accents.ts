/**
 * accents.ts
 * Paleta acotada de acentos. Cada entrada trae tres valores que garantizan
 * legibilidad (WCAG AA) en los tres roles que `--accent` puede ocupar:
 *   - fill: color de relleno (botones, badges, nav activa, tintes)
 *   - ink:  texto/iconos SOBRE el relleno  (ratio >= 4.5 contra fill)
 *   - text: color de acento SOBRE fondo blanco (ratio >= 4.5 contra #fff)
 * El picker del perfil solo ofrece estas opciones: no hay color libre, para
 * que un acento nunca vuelva ilegible el texto.
 */

export type Accent = {
  slug: string;
  label: string;
  fill: string;
  ink: string;
  text: string;
};

export const ACCENTS: Accent[] = [
  { slug: "blue",     label: "Azul",     fill: "#0077D6", ink: "#ffffff", text: "#00376B" },
  { slug: "indigo",   label: "Índigo",   fill: "#405DE6", ink: "#ffffff", text: "#3526C4" },
  { slug: "violet",   label: "Violeta",  fill: "#833AB4", ink: "#ffffff", text: "#6D2E93" },
  { slug: "magenta",  label: "Magenta",  fill: "#D62976", ink: "#ffffff", text: "#A8215B" },
  { slug: "pink",     label: "Rosa",     fill: "#D63350", ink: "#ffffff", text: "#C13515" },
  { slug: "red",      label: "Rojo",     fill: "#D62939", ink: "#ffffff", text: "#B02A37" },
  { slug: "orange",   label: "Naranja",  fill: "#C2410C", ink: "#ffffff", text: "#9A3412" },
  { slug: "amber",    label: "Ámbar",    fill: "#CC8420", ink: "#262626", text: "#7A5000" },
  { slug: "green",    label: "Verde",    fill: "#00A868", ink: "#262626", text: "#006B45" },
  { slug: "forest",   label: "Bosque",   fill: "#2E7D32", ink: "#ffffff", text: "#1B5E20" },
  { slug: "teal",     label: "Teal",     fill: "#00796B", ink: "#ffffff", text: "#005B52" },
  { slug: "graphite", label: "Grafito",  fill: "#262626", ink: "#ffffff", text: "#262626" },
];

/** Acento por defecto: el azul de la paleta. */
export const DEFAULT_ACCENT = ACCENTS[0];

/** Acentos "fluor" de versiones anteriores → el de la paleta más cercano. */
const LEGACY: Record<string, string> = {
  "#a0c499": "green",
  "#9fd6c8": "teal",
  "#f2b8c6": "pink",
  "#eeb79b": "orange",
  "#f5cfa0": "amber",
  "#a9cbee": "blue",
  "#c9b6ea": "violet",
  "#b8f34a": "green",
  "#a3e635": "green",
  "#4ade80": "green",
  "#22c55e": "green",
  "#ff5d8f": "pink",
  "#f72585": "magenta",
  "#ff6b35": "orange",
  "#ffb020": "amber",
  "#5cc8ff": "blue",
  "#3d9fff": "blue",
  "#c792ff": "violet",
};

/**
 * Normaliza cualquier color guardado (legacy, hex libre o slug) a la entrada
 * de la paleta. Si no hay match, cae al azul por defecto para no romper
 * legibilidad.
 */
export function resolveAccent(input: string | null | undefined): Accent {
  if (!input) return DEFAULT_ACCENT;
  const v = input.trim().toLowerCase();

  // Ya es un slug de la paleta.
  const bySlug = ACCENTS.find((a) => a.slug === v);
  if (bySlug) return bySlug;

  // Es un hex: mapea legacy → slug.
  const slug = LEGACY[v];
  if (slug) {
    const hit = ACCENTS.find((a) => a.slug === slug);
    if (hit) return hit;
  }

  // Hex desconocido o libre: mapea por cercanía de tono a la paleta.
  if (v.startsWith("#")) return nearestAccent(v);
  return DEFAULT_ACCENT;
}

/** Distancia euclidiana en espacio RGB (suficiente para elegir el más cercano). */
function nearestAccent(hex: string): Accent {
  const rgb = hexToRgb(hex);
  if (!rgb) return DEFAULT_ACCENT;
  let best = ACCENTS[0];
  let bestD = Infinity;
  for (const a of ACCENTS) {
    const c = hexToRgb(a.fill);
    if (!c) continue;
    const d = (rgb[0] - c[0]) ** 2 + (rgb[1] - c[1]) ** 2 + (rgb[2] - c[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Color plano (hex) o slug → sus tres variables CSS. */
export function accentVars(a: Accent): Record<string, string> {
  return {
    "--user-accent": a.fill,
    "--user-accent-ink": a.ink,
    "--user-accent-text": a.text,
  };
}
