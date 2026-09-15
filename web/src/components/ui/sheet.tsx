"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

let sheetOpenCount = 0;

function lockBodyScroll(enabled: boolean) {
  if (typeof document === "undefined") return;
  if (enabled) {
    sheetOpenCount++;
    if (sheetOpenCount === 1) document.body.style.overflow = "hidden";
  } else {
    sheetOpenCount = Math.max(0, sheetOpenCount - 1);
    if (sheetOpenCount === 0) document.body.style.overflow = "";
  }
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    lockBodyScroll(true);
    return () => {
      document.removeEventListener("keydown", onKey);
      lockBodyScroll(false);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex flex-col justify-end lg:hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-[fade-in_0.2s_ease]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]",
          "animate-[slide-up_0.3s_cubic-bezier(0.16,1,0.3,1)_both]",
          "pb-[calc(env(safe-area-inset-bottom)+0.5rem)]",
          className
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)]/95 px-5 py-3.5 backdrop-blur">
          <span className="mx-auto h-1.5 w-10 rounded-full bg-[var(--border)]" aria-hidden />
          {title && (
            <h2 className="absolute left-5 font-display text-base font-bold tracking-tight">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}