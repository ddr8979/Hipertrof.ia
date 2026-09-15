import { Flame, Dumbbell, Cpu, Rocket, Zap, CalendarCheck, Medal, Weight } from "lucide-react";

/**
 * Mapa de iconos de lucide disponibles para elegir en el perfil.
 * La clave es el nombre guardado en la BD y el valor el componente a renderizar.
 */
export const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Flame,
  Dumbbell,
  Cpu,
  Rocket,
  Zap,
  CalendarCheck,
  Medal,
  Weight,
};

/** Proveedores de música soportados para vincular la cuenta, con su color de marca. */
export const PROVIDERS = [
  { id: "spotify", label: "Spotify", color: "#1DB954" },
  { id: "apple_music", label: "Apple Music", color: "#FA243C" },
  { id: "youtube_music", label: "YouTube Music", color: "#FF0000" },
];