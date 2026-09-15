// Controles de formulario reutilizables: Switch (interruptor) y Tabs (pestañas).
"use client";

import { cn } from "@/lib/utils";

/**
 * Interruptor tipo switch accesible (`role="switch"`).
 * @param checked   Estado actual.
 * @param onChange  Callback al alternar el estado.
 * @param label     Etiqueta accesible (aria-label).
 * @param disabled  Deshabilita la interacción.
 */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6.5 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
        checked ? "bg-[var(--accent)]" : "bg-[var(--surface-3)]",
        disabled && "opacity-50"
      )}
    >
      <span
        className={cn(
          "inline-block size-5 transform rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-[22px]" : "translate-x-[3px]"
        )}
      />
    </button>
  );
}

/**
 * Barra de pestañas controlada, con scroll horizontal si desbordan.
 * @param tabs      Lista de pestañas con id, label e icono opcional.
 * @param value     Id de la pestaña activa.
 * @param onChange  Callback al seleccionar una pestaña.
 * @param className Clases extra para el contenedor.
 */
export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1",
        className
      )}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-all",
            value === t.id
              ? "bg-[var(--text)] text-[var(--bg)]"
              : "text-[var(--text-2)] hover:text-[var(--text)]"
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}