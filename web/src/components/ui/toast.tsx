"use client";

import { create } from "zustand";
import { CheckCircle2, Info, X, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";
interface Toast {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (type: ToastType, title: string, description?: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (type, title, description) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, type, title, description }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4200);
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(type: ToastType, title: string, description?: string) {
  useToast.getState().push(type, title, description);
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="size-5 text-[var(--success)]" />,
  error: <XCircle className="size-5 text-[var(--danger)]" />,
  warning: <AlertTriangle className="size-5 text-[var(--warn)]" />,
  info: <Info className="size-5 text-[var(--info)]" />,
};

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "glass pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl p-4 animate-[fade-up_0.3s_cubic-bezier(0.16,1,0.3,1)_both]",
            "shadow-[var(--shadow-lg)]"
          )}
        >
          {icons[t.type]}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-2)]">
                {t.description}
              </p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="rounded-md p-1 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            aria-label="Cerrar notificación"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}