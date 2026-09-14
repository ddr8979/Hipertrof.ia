"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/controls";

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
