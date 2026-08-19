"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="es">
      <body>
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-display text-5xl font-bold">Ups</p>
          <p className="max-w-sm text-sm text-neutral-400">
            Algo salió mal. {error.digest ? `Código: ${error.digest}` : ""}
          </p>
          <button
            onClick={reset}
            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black"
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}