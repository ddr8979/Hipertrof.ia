// Sistema de notificaciones toast basado en Zustand.
// Expone el store `useToast`, la función imperativa `toast` y el contenedor `Toaster`.
"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { CheckCircle2, Info, X, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Tipo semántico del toast.
type ToastType = "success" | "error" | "info" | "warning";
// Estructura de una notificación individual.
interface Toast {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

// Estado global de los toasts.
interface ToastState {
  toasts: Toast[];
  push: (type: ToastType, title: string, description?: string, duration?: number) => void;
  dismiss: (id: number) => void;
}

// Contador incremental para ids únicos.
let nextId = 1;

// Store de Zustand con la lista de toasts y sus acciones.
export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (type, title, description, duration = 4200) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, type, title, description, duration }] }));
    // Autocierre tras duration.
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Atajo imperativo para disparar un toast desde cualquier parte del código. */
export function toast(type: ToastType, title: string, description?: string, duration?: number) {
  useToast.getState().push(type, title, description, duration);
}

// Icono asociado a cada tipo de toast.
const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="size-5 text-[var(--success)]" />,
  error: <XCircle className="size-5 text-[var(--danger)]" />,
  warning: <AlertTriangle className="size-5 text-[var(--warn)]" />,
  info: <Info className="size-5 text-[var(--info)]" />,
};

/** Componente individual de toast con barra de progreso */
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    const duration = toast.duration || 4200;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [toast.duration]);
  
  return (
    <div
      className={cn(
        "glass pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl p-4 animate-[fade-up_0.3s_cubic-bezier(0.16,1,0.3,1)_both]",
        "shadow-[var(--shadow-lg)] border-l-4",
        toast.type === "success" && "border-[var(--success)]",
        toast.type === "error" && "border-[var(--danger)]",
        toast.type === "warning" && "border-[var(--warn)]",
        toast.type === "info" && "border-[var(--info)]",
      )}
    >
      {icons[toast.type]}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-2)]">
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="rounded-md p-1 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        aria-label="Cerrar notificación"
      >
        <X className="size-4" />
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-1 rounded-bl-2xl rounded-br-2xl bg-current opacity-30" style={{ width: `${progress}%` }} />
    </div>
  );
}

/** Contenedor de toasts: se monta una vez y renderiza las notificaciones activas. */
export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}