import exerciseManifest from "./exercise-manifest.json";

export function cn(...inputs: (string | false | null | undefined)[]) {
  return inputs.filter(Boolean).join(" ");
}

export function vibrate(ms = 8) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* no soportado */
    }
  }
}

const EMOJI_CHAR = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\uFE0F|\u200D/u;

export function splitEmojiRuns(name: string): { text: string; emoji: boolean }[] {
  const out: { text: string; emoji: boolean }[] = [];
  let buf = "";
  let bufEmoji = false;
  let started = false;
  for (const ch of name) {
    const isEmoji = EMOJI_CHAR.test(ch);
    if (!started) {
      started = true;
      bufEmoji = isEmoji;
    } else if (isEmoji !== bufEmoji) {
      out.push({ text: buf, emoji: bufEmoji });
      buf = "";
      bufEmoji = isEmoji;
    }
    buf += ch;
  }
  if (started) out.push({ text: buf, emoji: bufEmoji });
  return out;
}

function exerciseCode(url: string | null | undefined): string | null {
  if (!url) return null;
  const remote = url.match(/media\/([A-Za-z0-9]+)\.gif$/);
  if (remote) return remote[1];
  const local = url.match(/\d+-([A-Za-z0-9]+)\.(?:webm|gif|mp4)$/);
  if (local) return local[1];
  return null;
}

export function exerciseLocalWebm(url: string | null | undefined): string | null {
  const code = exerciseCode(url);
  if (!code) return null;
  const local = (exerciseManifest as Record<string, string>)[code];
  return local ?? null;
}

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

export function formatKg(kg: number, unit: "kg" | "lb" = "kg"): string {
  if (unit === "lb") return `${(kg * 2.20462).toFixed(1)} lb`;
  return `${Number(kg.toFixed(1))} kg`;
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-UY", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-UY", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  // Epley
  return weight * (1 + reps / 30);
}

export function playlistThumb(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/image-cdn-(?:ak|fa)\.spotifycdn\.com\/image\/([\w-]+)/);
  if (m) return `https://i.scdn.co/image/${m[1]}`;
  return url;
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}