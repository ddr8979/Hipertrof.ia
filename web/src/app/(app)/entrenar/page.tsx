"use client";

/**
 * Menú de Entrenar.
 * Dos acciones: "Comenzar rutina" (despliega el selector "¿Qué rutina querés
 * iniciar?" con las rutinas del usuario + opción libre) y "Rutinas" (gestión).
 * Centrado, sin scroll de página; la lista crece con su propio scroll.
 */

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Plus,
  Spinner,
  CaretDown,
  ListDashes,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { MrMancuernas } from "@/components/mascot";
import { cn } from "@/lib/utils";

type RoutineLite = {
  id: string;
  name: string;
  routine_exercises: { id: string }[];
};

export default function EntrenarMenuPage() {
  const [picking, setPicking] = useState(false);

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
    enabled: picking,
  });

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 py-10">
      {/* Mascota saludando */}
      <MrMancuernas size={80} />

      <h1 className="font-display text-2xl font-bold tracking-tight">
        Entrenar
      </h1>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {/* Comenzar rutina: despliega el selector */}
        <button
          type="button"
          onClick={() => setPicking((v) => !v)}
          className="card flex w-full items-center gap-3 p-4 text-left transition-colors"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-2)]">
            <Play className="size-4.5 fill-current" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Comenzar rutina</span>
            <span className="block text-xs text-[var(--muted)]">
              Elegí una rutina para iniciar
            </span>
          </span>
          <CaretDown
            className={cn(
              "size-4.5 shrink-0 text-[var(--muted)] transition-transform",
              picking && "rotate-180"
            )}
          />
        </button>

        {/* Selector desplegado: ¿Qué rutina? + lista + libre */}
        {picking && (
          <div className="card flex flex-col gap-2 p-3">
            <p className="px-1 text-center text-sm font-semibold text-[var(--text-2)]">
              ¿Qué rutina querés iniciar?
            </p>

            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-[var(--muted)]">
                <Spinner className="size-4 animate-spin" />
                Cargando…
              </div>
            )}

            {!isLoading && routines?.length === 0 && (
              <Link
                href="/rutinas"
                className="rounded-xl border border-dashed border-[var(--border)] px-3 py-4 text-center text-sm text-[var(--muted)] transition-colors hover:border-[var(--accent)]"
              >
                Creá tu primera rutina
              </Link>
            )}

            <div className="flex max-h-[40vh] flex-col gap-1 overflow-y-auto">
              {routines?.map((r) => (
                <Link
                  key={r.id}
                  href={`/entrenar/sesion?routine=${r.id}`}
                  className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]"
                >
                  <span className="min-w-0 truncate font-medium">{r.name}</span>
                  <span className="shrink-0 text-xs text-[var(--muted)]">
                    {r.routine_exercises.length} ejercicios
                  </span>
                </Link>
              ))}
            </div>

            {/* Sesión libre */}
            <Link
              href="/entrenar/sesion"
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]"
            >
              <Plus className="size-4 text-[var(--muted)]" />
              <span className="font-medium">Entrenamiento libre</span>
            </Link>
          </div>
        )}

        {/* Rutinas: gestión */}
        <Link
          href="/rutinas"
          className="card flex w-full items-center gap-3 p-4 transition-colors"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-2)]">
            <ListDashes className="size-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Rutinas</span>
            <span className="block text-xs text-[var(--muted)]">
              Creá y editá tus rutinas
            </span>
          </span>
        </Link>
      </div>
    </main>
  );
}
