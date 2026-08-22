"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

let dialogOpenCount = 0;

function setBodyScroll(enabled: boolean) {
  if (typeof document === "undefined") return;
  if (enabled) {
    dialogOpenCount++;
    if (dialogOpenCount === 1) {
      document.body.style.overflow = "hidden";
    }
  } else {
    dialogOpenCount = Math.max(0, dialogOpenCount - 1);
    if (dialogOpenCount === 0) {
      document.body.style.overflow = "";
    }
  }
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
  size = "md",
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    setBodyScroll(true);
    return () => {
      document.removeEventListener("keydown", onKey);
      setBodyScroll(false);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    full: "max-w-full sm:max-w-2xl",
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]",
          "animate-[fade-up_0.25s_cubic-bezier(0.16,1,0.3,1)_both]",
          "max-h-[90dvh] overflow-y-auto",
          sizes[size],
          className
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)]/95 px-5 py-4 backdrop-blur">
          <h2 className="font-display text-lg font-bold tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--surface)]/95 px-5 py-4 backdrop-blur">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}