"use client";

/**
 * Menú de Entrenar.
 * Punto de entrada que agrupa las dos formas de entrenar: lanzar una sesión
 * (pantalla completa en /entrenar/sesion) y gestionar las rutinas (que antes
 * ocupaban un tab propio en la píldora inferior). Muestra un atajo para
 * reanudar un borrador en curso si existe.
 */

import Link from "next/link";
import {
  Play,
  Barbell as Dumbbell,
  CaretRight as ChevronRight,
  Plus,
} from "@phosphor-icons/react";
import { useWorkoutStore } from "@/lib/workout-store";
import { MrMancuernas } from "@/components/mascot";
import { cn } from "@/lib/utils";

/** Fila de navegación del menú: icono + textos + chevron. */
function MenuRow({
  href,
  icon: Icon,
  eyebrow,
  title,
  sub,
  accent = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--shadow-md)]",
        accent &&
          "border-[var(--accent)]/40 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_12%,var(--surface)),var(--surface))]"
      )}
    >
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
          accent
            ? "bg-[var(--accent)] text-[var(--accent-ink)]"
            : "bg-[var(--surface-2)] text-[var(--accent)]"
        )}
      >
        <Icon className={cn("size-5.5", accent && "fill-current")} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-[11px] font-semibold uppercase tracking-wider",
            accent ? "text-[var(--accent)]" : "text-[var(--muted)]"
          )}
        >
          {eyebrow}
        </span>
        <span className="mt-0.5 block truncate font-display text-lg font-bold tracking-tight">
          {title}
        </span>
        {sub && (
          <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">
            {sub}
          </span>
        )}
      </span>
      <ChevronRight className="size-5 shrink-0 text-[var(--muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
    </Link>
  );
}

export default function EntrenarMenuPage() {
  const draft = useWorkoutStore((s) => s.draft);
  const inProgress = !!draft && draft.exercises.length > 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-5 px-4 pb-24 pt-[max(1.5rem,env(safe-area-inset-top))]">
      {/* Encabezado con la mascota saludando */}
      <header className="flex items-center gap-3">
        <MrMancuernas size={56} />
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Entrenar
          </h1>
          <p className="text-sm text-[var(--text-2)]">
            {inProgress
              ? "Tenés una sesión en curso"
              : "Elegí por dónde arrancar"}
          </p>
        </div>
      </header>

      {/* Atajo a la sesión en curso (solo si hay borrador con ejercicios) */}
      {inProgress && (
        <Link
          href="/entrenar/sesion"
          className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-[var(--accent)] bg-[var(--accent)] p-5 text-[var(--accent-ink)] shadow-[0_8px_24px_-8px_color-mix(in_srgb,var(--accent)_60%,transparent)] transition-all hover:-translate-y-0.5"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-ink)]/15">
            <Play className="size-5.5 fill-current" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wider opacity-80">
              Reanudar
            </span>
            <span className="mt-0.5 block truncate font-display text-lg font-bold tracking-tight">
              {draft.name}
            </span>
            <span className="mt-0.5 block truncate text-xs opacity-80">
              {draft.exercises.length} ejercicios · continuá donde lo dejaste
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      {/* Opciones principales del menú */}
      <div className="flex flex-col gap-3">
        {!inProgress && (
          <MenuRow
            href="/entrenar/sesion"
            icon={Plus}
            eyebrow="Sesión"
            title="Empezar a entrenar"
            sub="Registro libre o repitiendo tu último entreno"
            accent
          />
        )}
        <MenuRow
          href="/rutinas"
          icon={Dumbbell}
          eyebrow="Planificación"
          title="Rutinas"
          sub="Creá, editá y lanzá tus rutinas"
        />
      </div>

      {/* Pie con consejo motivacional */}
      <p className="mt-auto text-center text-xs text-[var(--muted)]">
        La constancia gana. Volvé mañana.
      </p>
    </main>
  );
}
