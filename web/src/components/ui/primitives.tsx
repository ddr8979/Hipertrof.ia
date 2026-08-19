import { useState } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  hover,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div className={cn("card", hover && "card-hover", className)} {...props} />
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "accent" | "success" | "warn" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-[var(--surface-2)] text-[var(--text-2)]",
    accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
    success: "bg-[var(--success-soft)] text-[var(--success)]",
    warn: "bg-[var(--warn-soft)] text-[var(--warn)]",
    danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
    info: "bg-[var(--info-soft)] text-[var(--info)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export function Avatar({
  src,
  alt,
  size = 40,
  className,
  initialsText,
}: {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  initialsText?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const initialsValue = initialsText ?? alt;
  const showInitials = !src || failed;
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-3)] font-display font-bold text-[var(--text-2)]",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {showInitials ? (
        (initialsValue ?? "?")
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase() ?? "")
          .join("")
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={alt ?? ""}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[var(--surface-2)]",
        className
      )}
    />
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]",
        className
      )}
    />
  );
}