"use client";
// Generic toast notification
import { useEffect } from "react";

type Props = { message: string; type?: "success" | "error"; onDone: () => void };

export function Toast({ message, type = "success", onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`toast toast-${type}`}>{message}</div>
  );
}
