import exerciseManifest from "./exercise-manifest.json";

/**
 * Utilidades de formato, detección de emojis y resolución de URLs de ejercicios.
 */

/** Une clases condicionales descartando valores falsy (mini utilidad estilo clsx). */
export function cn(...inputs: (string | false | null | undefined)[]) {
  return inputs.filter(Boolean).join(" ");
}

/** Vibra el dispositivo en navegadores compatibles; no-op si no está soportado. */
export function vibrate(ms = 8) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* no soportado */
    }
  }
}

// Detecta pictogramas emoji (incluye banderas/indicadores regionales).
const EMOJI_CLUSTER = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

/**
 * Divide un nombre en tramos contiguos de texto o emoji, preservando clusters
 * grafémicos (emojis compuestos, banderas) para no partirlos a la mitad.
 * Se usa para renderizar emojis con estilos distintos al texto.
 */
export function splitEmojiRuns(name: string): { text: string; emoji: boolean }[] {
  const out: { text: string; emoji: boolean }[] = [];
  let clusters: string[];
  try {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    clusters = [];
    for (const seg of segmenter.segment(name)) clusters.push(seg.segment);
  } catch {
    // Fallback para navegadores sin Intl.Segmenter: separar por caracter
    clusters = [...name];
  }
  let buf = "";
  let bufEmoji = false;
  let started = false;
  for (const cluster of clusters) {
    const isEmoji = EMOJI_CLUSTER.test(cluster);
    if (!started) {
      started = true;
      bufEmoji = isEmoji;
    } else if (isEmoji !== bufEmoji) {
      out.push({ text: buf, emoji: bufEmoji });
      buf = "";
      bufEmoji = isEmoji;
    }
    buf += cluster;
  }
  if (started) out.push({ text: buf, emoji: bufEmoji });
  return out;
}

// Extrae la clave estable del ejercicio desde la URL remota (media/<code>.gif)
// o desde el nombre de archivo local (<id>-<code>.<ext>).
function exerciseCode(url: string | null | undefined): string | null {
  if (!url) return null;
  const remote = url.match(/media\/([A-Za-z0-9]+)\.gif$/);
  if (remote) return remote[1];
  const local = url.match(/\d+-([A-Za-z0-9]+)\.(?:webm|gif|mp4)$/);
  if (local) return local[1];
  return null;
}

/** Resuelve el .webm local del ejercicio usando el manifiesto, o null si no existe. */
export function exerciseLocalWebm(url: string | null | undefined): string | null {
  const code = exerciseCode(url);
  if (!code) return null;
  const local = (exerciseManifest as Record<string, string>)[code];
  return local ?? null;
}

/**
 * URL de la imagen del ejercicio en ExerciseDB: `.jpg` si es miniatura,
 * `.gif` por defecto. Si la URL ya es absoluta se devuelve tal cual.
 */
export function exerciseGif(
  url: string | null | undefined,
  opts?: { thumb?: boolean }
): string | null {
  if (!url) return null;
  const code = exerciseCode(url);
  if (code) return `https://static.exercisedb.dev/media/${code}${opts?.thumb ? ".jpg" : ".gif"}`;
  if (url.startsWith("http")) return url;
  return null;
}

/** Formatea kilogramos como texto, convirtiendo a libras si `unit === "lb"`. */
export function formatKg(kg: number, unit: "kg" | "lb" = "kg"): string {
  if (unit === "lb") return `${(kg * 2.20462).toFixed(1)} lb`;
  return `${Number(kg.toFixed(1))} kg`;
}

/** Formatea una duración en segundos como "1h 5m", "5m 30s" o "30s". */
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Fecha corta localizada (es-UY) para una cadena ISO, p. ej. "lun 1 sep". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-UY", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Fecha y hora localizada (es-UY) para una cadena ISO, p. ej. "1 sep 14:30". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-UY", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Estima el 1RM con la fórmula de Epley; devuelve 0 para entradas inválidas. */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  // Epley
  return weight * (1 + reps / 30);
}

/** Normaliza URLs de imagen de Spotify (CDN varios) a `i.scdn.co`; el resto pasa igual. */
export function playlistThumb(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/image-cdn-(?:ak|fa)\.spotifycdn\.com\/image\/([\w-]+)/);
  if (m) return `https://i.scdn.co/image/${m[1]}`;
  return url;
}

/** Genera iniciales (máx. 2 palabras) para avatares; "?" si no hay nombre. */
export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}