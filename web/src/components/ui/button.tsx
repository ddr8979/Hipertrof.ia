// Botón base reutilizable con variantes visuales y tamaños.
// Reenvía la ref al <button> nativo y admite estado de carga y ancho completo.
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Variante visual del botón (jerarquía / intención).
type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "accent" | "subtle";
// Tamaño del botón; "icon" genera un cuadrado para iconos.
type Size = "sm" | "md" | "lg" | "xl" | "icon";

/** Props del botón: extiende las del <button> nativo y añade variantes propias. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

// Mapeo de cada variante a sus clases Tailwind - sombras refinadas, elegantes.
const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--text)] text-[var(--bg)] hover:opacity-90 disabled:hover:opacity-100 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_1px_1px_rgba(0,0,0,0.2)]",
  accent:
    "bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)] disabled:hover:bg-[var(--accent)] shadow-[0_2px_8px_-2px_color-mix(in_srgb,var(--accent)_40%,transparent),0_1px_2px_color-mix(in_srgb,var(--accent)_20%,transparent)] dark:shadow-[0_2px_8px_-2px_rgba(168,201,162,0.3),0_1px_2px_rgba(168,201,162,0.15)]",
  subtle:
    "bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-ink)] shadow-none",
  secondary: "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-3)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]",
  ghost: "bg-transparent text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] shadow-none",
  outline:
    "border border-[var(--border)] bg-transparent text-[var(--text)] hover:border-[var(--muted)] hover:bg-[var(--surface-2)] shadow-none",
  danger: "bg-[var(--danger)] text-white hover:brightness-110 shadow-[0_2px_4px_rgba(215,106,112,0.25)] dark:shadow-[0_2px_4px_rgba(233,138,143,0.3)]",
};

// Mapeo de cada tamaño a sus clases Tailwind.
const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-[15px] rounded-xl gap-2",
  xl: "h-14 px-8 text-base rounded-2xl gap-2.5",
  icon: "h-10 w-10 rounded-xl",
};

/**
 * Botón accesible con estilos predefinidos.
 * - Se deshabilita automáticamente cuando `loading` es true.
 * - Muestra un spinner junto al contenido mientras carga.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, fullWidth, disabled, children, ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center font-semibold tracking-tight transition-all duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
        "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";