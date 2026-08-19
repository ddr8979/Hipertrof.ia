import { Flame, Dumbbell, Cpu, Rocket, Zap, CalendarCheck, Medal, Weight } from "lucide-react";

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

export const PROVIDERS = [
  { id: "spotify", label: "Spotify", color: "#1DB954" },
  { id: "apple_music", label: "Apple Music", color: "#FA243C" },
  { id: "youtube_music", label: "YouTube Music", color: "#FF0000" },
];