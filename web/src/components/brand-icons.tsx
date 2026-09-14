"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/controls";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";
const THEME_ORDER: Theme[] = ["light", "dark", "system"];

function themeIcon(theme: Theme) {
  switch (theme) {
    case "light":
      return <Sun className="size-4" />;
    case "dark":
      return <Moon className="size-4" />;
    case "system":
      return <Monitor className="size-4" />;
    default:
      return <Sun className="size-4" />;
  }
}

export function ThemeToggle({
  variant = "list",
  label,
  className,
  onThemeChange,
}: {
  variant?: "list" | "compact";
  label?: string;
  className?: string;
  onThemeChange?: (theme: Theme) => void;
}) {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme();

  function toggleCompact() {
    const current = theme === "system" ? (resolvedTheme as Theme) : (theme as Theme);
    const next = THEME_ORDER[(THEME_ORDER.indexOf(current ?? "light") + 1) % THEME_ORDER.length];
    setTheme(next);
    onThemeChange?.(next);
  }

  if (variant === "compact") {
    const current = theme === "system" ? (resolvedTheme as Theme) : (theme as Theme);
    return (
      <button
        type="button"
        aria-label="Cambiar tema"
        title="Cambiar tema"
        onClick={toggleCompact}
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-2xl text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
          className
        )}
      >
        {current === "dark" ? <Moon className="size-5" /> : <Sun className="size-5" />}
      </button>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <span className="text-xs font-semibold text-[var(--muted)]">{label}</span>}
      <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-1">
        {THEME_ORDER.map((t) => (
          <button
            key={t}
            type="button"
            aria-label={`Tema ${t}`}
            title={t === "system" ? `Sistema (${systemTheme ?? "?"})` : t}
            onClick={() => {
              setTheme(t);
              onThemeChange?.(t);
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all sm:text-sm",
              theme === t
                ? "bg-[var(--accent)] text-[var(--accent-ink)] shadow"
                : "text-[var(--text-2)] hover:bg-[var(--surface)]/80 hover:text-[var(--text)]"
            )}
          >
            {themeIcon(t)}
            <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThemeSwitch({
  label = "Modo oscuro",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <span className="text-sm font-semibold text-[var(--text)]">{label}</span>
      <Switch
        checked={isDark}
        onChange={(checked) => setTheme(checked ? "dark" : "light")}
        label={label}
      />
    </div>
  );
}

type IconComponentProps = React.SVGProps<SVGSVGElement> & { size?: number };

const SPOTIFY_ICON_PATH =
  "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z";
const SPOTIFY_ICON_HEX = "1ED760";

function SpotifyIcon({ size = 24, className }: IconComponentProps) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-label="Spotify"
      className={className}
      fill={`#${SPOTIFY_ICON_HEX}`}
    >
      <title>Spotify</title>
      <path d={SPOTIFY_ICON_PATH} />
    </svg>
  );
}

export { SpotifyIcon };

export const BrandIcons = {
  Spotify: SpotifyIcon,
};
