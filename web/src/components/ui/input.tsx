// Campos de formulario reutilizables: Input, Textarea, Select y Field.
// Todos reenvían su ref al elemento nativo y comparten el estilo base.
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Estilos comunes a todos los campos.
const base =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 text-[15px] text-[var(--text)] placeholder:text-[var(--muted)] transition-all duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--muted)]/50";

/** Input de texto de una línea. */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(base, "h-11", className)} {...props} />
  )
);
Input.displayName = "Input";

/** Textarea de varias líneas. */
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  // Altura mínima para edición cómoda.
  <textarea ref={ref} className={cn(base, "min-h-24 py-2.5", className)} {...props} />
));
Textarea.displayName = "Textarea";

/** Select nativo con flecha personalizada. */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(base, "h-11 appearance-none pr-9 bg-[var(--surface)]", className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

/**
 * Envoltura de campo con etiqueta, texto de ayuda y mensaje de error.
 * El error reemplaza al hint cuando está presente.
 */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <span className="text-[13px] font-medium text-[var(--text-2)]">{label}</span>
      )}
      {children}
      {hint && !error && <span className="text-xs text-[var(--muted)]">{hint}</span>}
      {error && <span className="text-xs font-medium text-[var(--danger)] flex items-center gap-1">{error}</span>}
    </label>
  );
}

/** Input con icono a la izquierda */
export function InputWithIcon({
  icon: Icon,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-[var(--muted)] pointer-events-none" />
      <Input className={cn("pl-10", className)} {...props} />
    </div>
  );
}