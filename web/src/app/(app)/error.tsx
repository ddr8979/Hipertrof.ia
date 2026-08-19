"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-5xl font-bold">Ups</p>
      <p className="max-w-sm text-sm text-[var(--text-2)]">
        Algo salió mal al cargar esta sección.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}