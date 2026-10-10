"use client";

/**
 * Menú de Entrenar.
 * Selector de rutinas: pregunta "¿Qué rutina querés iniciar?" y lista las
 * rutinas del usuario para lanzar una sesión directa (o entrenar libre).
 * Diseño centrado, sin scroll de página; la lista crece con su propio scroll.
 */

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Play, Plus, Spinner } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { MrMancuernas } from "@/components/mascot";

type RoutineLite = {
  id: string;
  name: string;
  routine_exercises: { id: string }[];
};

export default function EntrenarMenuPage() {
  const { data: routines, isLoading } = useQuery({
    queryKey: ["routines", "picker"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [] as RoutineLite[];
      const { data } = await supabase
        .from("routines")
        .select("id, name, routine_exercises(id)")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      return (data ?? []) as unknown as RoutineLite[];
    },
  });

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-10">
      {/* Mascota saludando */}
      <MrMancuernas size={80} />

      {/* Encabezado: la pregunta */}
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          ¿Qué rutina querés iniciar?
        </h1>
        <p className="text-sm text-[var(--text-2)]">
          Elegí una rutina o arrancá una sesión libre
        </p>
      </div>

      {/* Lista de rutinas + opción libre */}
      <div className="flex w-full max-w-sm flex-col gap-3">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--muted)]">
            <Spinner className="size-4 animate-spin" />
            Cargando rutinas…
          </div>
        )}

        {!isLoading && routines?.length === 0 && (
          <Link
            href="/rutinas"
            className="card flex flex-col items-center gap-1 border border-dashed border-[var(--border)] p-6 text-center transition-colors hover:border-[var(--accent)]"
          >
            <span className="font-semibold">Todavía no tenés rutinas</span>
            <span className="text-xs text-[var(--muted)]">
              Creá tu primera rutina para lanzarla desde acá
            </span>
          </Link>
        )}

        {routines?.map((r) => (
          <Link
            key={r.id}
            href={`/entrenar/sesion?routine=${r.id}`}
            className="card group flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-2)] transition-colors group-hover:text-[var(--accent)]">
              <Play className="size-4.5 fill-current" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{r.name}</span>
              <span className="block text-xs text-[var(--muted)]">
                {r.routine_exercises.length} ejercicios
              </span>
            </span>
          </Link>
        ))}

        {/* Sesión libre: desde cero */}
        <Link
          href="/entrenar/sesion"
          className="card group flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-2)] transition-colors group-hover:text-[var(--accent)]">
            <Plus className="size-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Entrenamiento libre</span>
            <span className="block text-xs text-[var(--muted)]">
              Armá la sesión a tu manera
            </span>
          </span>
        </Link>
      </div>
    </main>
  );
}
