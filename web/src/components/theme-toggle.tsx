// Controles de tema: selector list/compact (ThemeToggle) y switch simple (ThemeSwitch).
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/controls";

// Tema soportado.
type Theme = "light" | "dark" | "system";

// Orden de ciclo de los temas.
const THEME_ORDER: Theme[] = ["light", "dark", "system"];

// Etiqueta en español de cada tema.
const THEME_LABEL: Record<Theme, string> = {
  light: "Claro",
  dark: "Oscuro",
  system: "Sistema",
};

// Devuelve el icono correspondiente al tema.
function themeIcon(theme: Theme, cls = "size-4") {
  switch (theme) {
    case "light":
      return <Sun className={cls} />;
    case "dark":
      return <Moon className={cls} />;
    default:
      return <Monitor className={cls} />;
  }
}

// Hook auxiliar para saber si ya se montó en cliente (evita hydration mismatch).
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * Selector de tema.
 * @param variant       "list" muestra tres botones; "compact" un único botón cíclico.
 * @param label         Etiqueta visible (solo en variante list).
 * @param onThemeChange Callback opcional al cambiar de tema.
 */
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
  const mounted = useMounted();

  // Usamos el tema elegido (no el resuelto): "Sistema" es una opción real y
  // el ciclo del botón compacto siempre avanza, sin quedar pegado.
  const selected =
    mounted && THEME_ORDER.includes(theme as Theme) ? (theme as Theme) : undefined;

  // Ciclo: Claro -> Oscuro -> Sistema. Al salir de "Sistema" vamos al modo
  // OPUESTO al que se ve ahora, para que el cambio siempre sea visible.
  function cycle() {
    if (selected === "light") {
      setTheme("dark");
      onThemeChange?.("dark");
    } else if (selected === "dark") {
      setTheme("system");
      onThemeChange?.("system");
    } else {
      const next: Theme = resolvedTheme === "dark" ? "light" : "dark";
      setTheme(next);
      onThemeChange?.(next);
    }
  }

  if (variant === "compact") {
    // Botón único que cicla entre los temas.
    return (
      <button
        type="button"
        aria-label={`Cambiar tema (${selected ? THEME_LABEL[selected] : "cargando"})`}
        title={
          selected === "system"
            ? `Sistema (${systemTheme ?? "?"})`
            : THEME_LABEL[selected ?? "system"]
        }
        onClick={cycle}
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-2xl text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
          className
        )}
      >
        {themeIcon(selected ?? "system", "size-5")}
      </button>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <span className="text-xs font-semibold text-[var(--muted)]">{label}</span>}
      {/* Grupo de opciones de tema con semántica de radiogroup */}
      <div
        role="radiogroup"
        aria-label={label ?? "Tema"}
        className="flex items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-1"
      >
        {THEME_ORDER.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={selected === t}
            aria-label={`Tema ${THEME_LABEL[t]}`}
            title={t === "system" ? `Sistema (${systemTheme ?? "?"})` : THEME_LABEL[t]}
            onClick={() => {
              setTheme(t);
              onThemeChange?.(t);
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all sm:text-sm",
              selected === t
                ? "bg-[var(--accent)] text-[var(--accent-ink)] shadow"
                : "text-[var(--text-2)] hover:bg-[var(--surface)]/80 hover:text-[var(--text)]"
            )}
          >
            {themeIcon(t)}
            <span>{THEME_LABEL[t]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Interruptor simple claro/oscuro con etiqueta. */
export function ThemeSwitch({
  label = "Modo oscuro",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();
  // Solo considerar oscuro tras el montaje para evitar mismatch SSR.
  const isDark = mounted && resolvedTheme === "dark";

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