import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-6xl font-bold">404</p>
      <p className="max-w-sm text-sm text-[var(--text-2)]">
        Esta página no existe o fue movida.
      </p>
      <Link
        href="/dashboard"
        className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-ink)]"
      >
        Volver al inicio
      </Link>
    </main>
  );
}