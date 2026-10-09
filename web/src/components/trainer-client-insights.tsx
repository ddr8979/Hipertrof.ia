// Panel para el entrenador: progreso de entrenamiento y nutrición de un alumno.
// Lee workouts + workout_sets y meal_logs del alumno (RLS: entrenador activo).
"use client";

import { useQuery } from "@tanstack/react-query";
import { Dumbbell, Flame, Clock, Trophy, Utensils, ChartLine } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/primitives";
import { estimate1RM, formatDate, formatDuration } from "@/lib/utils";

type WorkoutRow = {
  id: string;
  name: string;
  started_at: string;
  duration_sec: number | null;
  workout_exercises: {
    name: string;
    exercise: { id: string; name: string }[] | null;
    workout_sets: { type: string; weight_kg: number; reps: number; completed: boolean }[];
  }[];
};

type MealRow = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  eaten_at: string;
};

/** Tarjeta compacta de métrica. */
function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card flex flex-col gap-1 p-3.5">
      <span className="text-[var(--accent)]">{icon}</span>
      <span className="font-display text-xl font-bold tabular-nums">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
        {label}
      </span>
    </div>
  );
}

export function TrainerClientInsights({ athleteId }: { athleteId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["client_insights", athleteId],
    queryFn: async () => {
      const supabase = createClient();
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const [w, m] = await Promise.all([
        supabase
          .from("workouts")
          .select(
            "id, name, started_at, duration_sec, workout_exercises(name, exercise:exercises(id,name), workout_sets(type, weight_kg, reps, completed))"
          )
          .eq("user_id", athleteId)
          .gte("started_at", since)
          .order("started_at", { ascending: false }),
        supabase
          .from("meal_logs")
          .select("calories, protein_g, carbs_g, fats_g, eaten_at")
          .eq("user_id", athleteId)
          .gte("eaten_at", since)
          .order("eaten_at", { ascending: false }),
      ]);
      return {
        workouts: (w.data ?? []) as WorkoutRow[],
        meals: (m.data ?? []) as MealRow[],
        workoutsDenied: !!w.error,
        mealsDenied: !!m.error,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  const workouts = data?.workouts ?? [];
  const meals = data?.meals ?? [];

  let volume = 0;
  let minutes = 0;
  const prMap = new Map<string, number>();
  for (const w of workouts) {
    minutes += Math.round((w.duration_sec ?? 0) / 60);
    for (const e of w.workout_exercises) {
      const name = e.exercise?.[0]?.name ?? e.name;
      for (const s of e.workout_sets) {
        if (!s.completed || s.type === "W" || s.reps <= 0 || s.weight_kg <= 0) continue;
        volume += s.weight_kg * s.reps;
        const rm = estimate1RM(s.weight_kg, s.reps);
        if (rm > (prMap.get(name) ?? 0)) prMap.set(name, rm);
      }
    }
  }
  const topPRs = [...prMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Nutrición: promedios diarios de los últimos 30 días.
  const daySet = new Set(meals.map((m) => m.eaten_at.slice(0, 10)));
  const days = Math.max(1, daySet.size);
  const totalKcal = meals.reduce((a, m) => a + (m.calories ?? 0), 0);
  const totalProtein = meals.reduce((a, m) => a + (m.protein_g ?? 0), 0);
  const totalCarbs = meals.reduce((a, m) => a + (m.carbs_g ?? 0), 0);
  const totalFats = meals.reduce((a, m) => a + (m.fats_g ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Progreso de entrenamiento */}
      <section className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Entrenamiento · últimos 30 días
        </p>
        {data?.workoutsDenied ? (
          <p className="text-sm text-[var(--muted)]">
            Sin permiso para ver los entrenamientos del alumno. Aplicá la migración de
            visibilidad del entrenador.
          </p>
        ) : workouts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            El alumno todavía no registró entrenamientos este mes.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Metric
                icon={<Dumbbell className="size-4" />}
                label="Sesiones"
                value={String(workouts.length)}
              />
              <Metric
                icon={<ChartLine className="size-4" />}
                label="Volumen"
                value={`${(volume / 1000).toLocaleString("es-UY", { maximumFractionDigits: 1 })} t`}
              />
              <Metric
                icon={<Clock className="size-4" />}
                label="Tiempo"
                value={formatDuration(minutes * 60)}
              />
              <Metric
                icon={<Flame className="size-4" />}
                label="Racha"
                value={`${daySet.size} d`}
              />
            </div>

            <div className="card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Trophy className="size-4 text-[var(--accent)]" />
                <h3 className="text-sm font-bold">Récords del alumno</h3>
              </div>
              {topPRs.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  Sin series con peso registradas.
                </p>
              ) : (
                <div className="flex flex-col">
                  {topPRs.map(([name, rm], i) => (
                    <div
                      key={name}
                      className={
                        "flex items-center justify-between gap-3 py-1.5 " +
                        (i > 0 ? "border-t border-[var(--border)]" : "")
                      }
                    >
                      <span className="truncate text-sm font-semibold">{name}</span>
                      <span className="shrink-0 font-display text-sm font-bold tabular-nums">
                        {Math.round(rm)}{" "}
                        <span className="text-xs text-[var(--text-2)]">kg</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-4">
              <h3 className="mb-2 text-sm font-bold">Últimas sesiones</h3>
              <div className="flex flex-col gap-1.5">
                {workouts.slice(0, 6).map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-[var(--surface-2)]/60 px-3 py-2"
                  >
                    <span className="truncate text-sm font-semibold">{w.name}</span>
                    <span className="shrink-0 text-xs text-[var(--muted)]">
                      {formatDate(w.started_at)} ·{" "}
                      {formatDuration(w.duration_sec ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Nutrición */}
      <section className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Nutrición · últimos 30 días
        </p>
        {data?.mealsDenied ? (
          <p className="text-sm text-[var(--muted)]">
            Sin permiso para ver la nutrición del alumno. Aplicá la migración de
            visibilidad del entrenador.
          </p>
        ) : meals.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            El alumno todavía no registró comidas este mes.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Metric
              icon={<Utensils className="size-4" />}
              label="kcal / día"
              value={String(Math.round(totalKcal / days))}
            />
            <Metric
              icon={<Utensils className="size-4" />}
              label="proteína / día"
              value={`${Math.round(totalProtein / days)} g`}
            />
            <Metric
              icon={<Utensils className="size-4" />}
              label="carbos / día"
              value={`${Math.round(totalCarbs / days)} g`}
            />
            <Metric
              icon={<Utensils className="size-4" />}
              label="grasas / día"
              value={`${Math.round(totalFats / days)} g`}
            />
          </div>
        )}
      </section>
    </div>
  );
}
