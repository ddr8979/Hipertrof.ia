"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Clock,
  Dumbbell,
  ChevronDown,
  Check,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/data";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

type WorkoutRow = {
  id: string;
  name: string;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  workout_exercises: {
    id: string;
    name: string;
    order_index: number;
    workout_sets: {
      set_index: number;
      type: string;
      weight_kg: number;
      reps: number;
      completed: boolean;
    }[];
  }[];
};

const PAGE = 20;

export default function HistorialPage() {
  const [detail, setDetail] = useState<WorkoutRow | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["historial"],
      queryFn: async ({ pageParam = 0 }) => {
        const supabase = createClient();
        const from = pageParam;
        const to = from + PAGE - 1;
        const { data } = await supabase
          .from("workouts")
          .select(
            "id, name, started_at, ended_at, duration_sec, workout_exercises(id, name, order_index, workout_sets(set_index, type, weight_kg, reps, completed))"
          )
          .order("started_at", { ascending: false })
          .range(from, to);
        return (data ?? []) as WorkoutRow[];
      },
      initialPageParam: 0,
      getNextPageParam: (last, all) =>
        last.length === PAGE ? all.length : undefined,
    });

  // Agregados globales (todas las sesiones, no solo la página actual)
  const { data: totals } = useQuery({
    queryKey: ["historial_totals"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { sessions: 0, volumeKg: 0, sets: 0 };
      const { data: workouts } = await supabase
        .from("workouts")
        .select(
          "id, workout_exercises(workout_sets(weight_kg, reps, completed))"
        )
        .eq("user_id", user.id);
      if (!workouts) return { sessions: 0, volumeKg: 0, sets: 0 };
      let volumeKg = 0;
      let sets = 0;
      for (const w of workouts) {
        for (const we of w.workout_exercises ?? []) {
          for (const s of we.workout_sets ?? []) {
            if (s.completed) volumeKg += (s.weight_kg ?? 0) * (s.reps ?? 0);
            sets++;
          }
        }
      }
      return { sessions: workouts.length, volumeKg, sets };
    },
  });

  const all = useMemo(() => data?.pages?.flat() ?? [], [data]);

  const totalVolume = useMemo(
    () =>
      all.reduce(
        (a, w) =>
          a +
          w.workout_exercises.reduce(
            (x, e) =>
              x +
              e.workout_sets.reduce(
                (y, s) => y + (s.completed ? s.weight_kg * s.reps : 0),
                0
              ),
            0
          ),
        0
      ),
    [all]
  );

  const totalSets = useMemo(
    () =>
      all.reduce(
        (a, w) => a + w.workout_exercises.reduce((x, e) => x + e.workout_sets.length, 0),
        0
      ),
    [all]
  );

  function sessionStats(w: WorkoutRow) {
    const sets = w.workout_exercises.reduce((a, e) => a + e.workout_sets.length, 0);
    const volume = w.workout_exercises.reduce(
      (a, e) => a + e.workout_sets.reduce((y, s) => y + (s.completed ? s.weight_kg * s.reps : 0), 0),
      0
    );
    return { sets, volume };
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Historial</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">
          Tus sesiones, ejercicio por ejercicio
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card flex flex-col gap-1 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Sesiones
          </span>
          <span className="font-display text-2xl font-bold">
            {totals?.sessions ?? all.length}
          </span>
        </div>
        <div className="card flex flex-col gap-1 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Volumen
          </span>
          <span className="font-display text-2xl font-bold">
            {((totals?.volumeKg ?? totalVolume) / 1000).toLocaleString("es-UY", {
              maximumFractionDigits: 1,
            })}
            <span className="text-sm text-[var(--text-2)]"> t</span>
          </span>
        </div>
        <div className="card flex flex-col gap-1 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Series
          </span>
          <span className="font-display text-2xl font-bold">
            {totals?.sets ?? totalSets}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : all.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="size-6" />}
          title="Todavía no tenés sesiones"
          description="Completá tu primer entrenamiento y aparece acá, con todas las métricas."
          action={
            <Link href="/entrenar">
              <Button variant="accent">Empezar a entrenar</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {all.map((w) => {
            const stats = sessionStats(w);
            const isExpanded = expanded === w.id;
            return (
              <div key={w.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpanded(isExpanded ? null : w.id)}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-[var(--surface-2)]/40"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Dumbbell className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-bold tracking-tight">
                      {w.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {formatDateTime(w.started_at)} · {formatDuration(w.duration_sec ?? 0)}
                    </p>
                  </div>
                  <div className="hidden items-center gap-4 text-right sm:flex">
                    <div>
                      <p className="text-sm font-bold">
                        {w.workout_exercises.length}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        ejercicios
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{stats.sets}</p>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        series
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold">
                        {(stats.volume / 1000).toLocaleString("es-UY", {
                          maximumFractionDigits: 2,
                        })}
                        <span className="text-xs text-[var(--text-2)]">t</span>
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        volumen
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4.5 shrink-0 text-[var(--muted)] transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="flex flex-col gap-4 border-t border-[var(--border)] p-4">
                    {w.workout_exercises.map((e) => {
                      const done = e.workout_sets.filter((s) => s.completed).length;
                      return (
                        <div key={e.id}>
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-semibold">{e.name}</p>
                            <p className="text-xs text-[var(--muted)]">
                              {done}/{e.workout_sets.length} series
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            {e.workout_sets.map((s) => (
                              <div
                                key={s.set_index}
                                className={cn(
                                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm",
                                  s.completed
                                    ? "bg-[var(--accent-soft)]/50"
                                    : "bg-[var(--surface-2)]/50"
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex size-4 items-center justify-center rounded",
                                    s.completed
                                      ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                                      : "bg-[var(--surface-3)]"
                                  )}
                                >
                                  {s.completed && <Check className="size-3" strokeWidth={3} />}
                                </span>
                                <span className="w-6 text-xs font-bold text-[var(--muted)]">
                                  {s.type}
                                </span>
                                <span className="font-semibold tabular-nums">
                                  {s.weight_kg > 0 ? `${s.weight_kg} kg × ${s.reps}` : `${s.reps} reps`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => setDetail(w)}
                      className="self-start text-xs font-semibold text-[var(--accent)] hover:underline"
                    >
                      Ver resumen completo
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {hasNextPage && (
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              loading={isFetchingNextPage}
            >
              Cargar más sesiones
            </Button>
          )}
        </div>
      )}

      {detail && (
        <Dialog
          open
          onClose={() => setDetail(null)}
          title={detail.name}
          footer={
            <div className="flex w-full justify-end">
              <Button variant="ghost" onClick={() => setDetail(null)}>
                Cerrar
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3">
              <span className="text-sm font-semibold text-[var(--text-2)]">
                Fecha
              </span>
              <span className="text-sm font-bold">{formatDateTime(detail.started_at)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-2)]">
                <Clock className="size-4" /> Duración
              </span>
              <span className="text-sm font-bold">
                {formatDuration(detail.duration_sec ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3">
              <span className="text-sm font-semibold text-[var(--text-2)]">
                Volumen total
              </span>
              <span className="text-sm font-bold">
                {(sessionStats(detail).volume / 1000).toLocaleString("es-UY", {
                  maximumFractionDigits: 2,
                })}{" "}
                t
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3">
              <span className="text-sm font-semibold text-[var(--text-2)]">
                Ejercicios
              </span>
              <span className="text-sm font-bold">{detail.workout_exercises.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3">
              <span className="text-sm font-semibold text-[var(--text-2)]">
                Series
              </span>
              <span className="text-sm font-bold">{sessionStats(detail).sets}</span>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}