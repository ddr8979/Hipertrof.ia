"use client";

/**
 * Inicio del atleta: saludo + racha, CTA al último entrenamiento, stats
 * y las últimas rutinas. Sin atajos redundantes (la navegación vive en
 * la píldora y en el sheet "Más").
 */

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Flame,
  Trophy,
  Dumbbell,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Skeleton, Avatar } from "@/components/ui/primitives";
import { EmptyState, StatCard } from "@/components/ui/data";
import { cn, estimate1RM, formatDate, formatDuration, splitEmojiRuns } from "@/lib/utils";

/** Dashboard principal del atleta: resumen de actividad y accesos rápidos. */
export default function DashboardPage() {
  const profile = useProfile((s) => s.profile);

  // Consulta agregada del dashboard: últimas sesiones, rutinas, fechas para
  // la racha y series para estimar el 1RM. Todo en un único queryFn.
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const supabase = createClient();
      // Últimos 5 entrenamientos con conteo de ejercicios
      const { data: workouts } = await supabase
        .from("workouts")
        .select("id, name, started_at, ended_at, duration_sec, workout_exercises(count)")
        .order("started_at", { ascending: false })
        .limit(5);

      // Últimas 6 rutinas con conteo de ejercicios
      const { data: routines } = await supabase
        .from("routines")
        .select("id, name, routine_exercises(count)")
        .order("updated_at", { ascending: false })
        .limit(6);

      // Fechas de los últimos 90 entrenamientos (para calcular la racha)
      const { data: streakData } = await supabase
        .from("workouts")
        .select("started_at")
        .order("started_at", { ascending: false })
        .limit(90);

      // Sesiones recientes para estimar el 1RM máximo (sin calentamientos)
      const { data: rmData } = await supabase
        .from("workouts")
        .select("workout_exercises(workout_sets(type, weight_kg, reps, completed))")
        .order("started_at", { ascending: false })
        .limit(60);

      let max1rm = 0;
      for (const w of rmData ?? []) {
        for (const we of w.workout_exercises ?? []) {
          for (const st of we.workout_sets ?? []) {
            if (!st.completed || st.type === "W" || st.reps <= 0 || st.weight_kg <= 0) continue;
            max1rm = Math.max(max1rm, estimate1RM(st.weight_kg, st.reps));
          }
        }
      }

      return {
        max1rm: Math.round(max1rm),
        workouts: workouts ?? [],
        routines: routines ?? [],
        dates: streakData ?? [],
      };
    },
  });

  // Racha actual y las primeras 7 sesiones usadas como "volumen semanal" del CTA
  const days = profile?.streak_count ?? 0;
  const weeklyVolume = data?.workouts?.slice(0, 7);

  return (
    <div className="flex flex-col gap-6">
      {/* Widget de perfil */}
      <Link
        href="/perfil"
        className="flex items-center gap-3.5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]"
      >
        <Avatar
          src={profile?.avatar_url}
          size={52}
          alt={profile?.display_name ?? profile?.username ?? "Perfil"}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--muted)]">
            {new Date().toLocaleDateString("es-UY", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="truncate font-display text-xl font-bold tracking-tight">
            Hola,{" "}
            {splitEmojiRuns(profile?.display_name ?? "atleta").map((s, i) =>
              s.emoji ? (
                <span key={i} className="text-[var(--text)]">
                  {s.text}
                </span>
              ) : (
                <span key={i} className="text-[var(--accent)]">
                  {s.text}
                </span>
              )
            )}
          </h1>
          {profile?.username && (
            <p className="truncate text-xs text-[var(--muted)]">@{profile.username}</p>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-bold text-[var(--accent-ink)] shadow-[0_4px_12px_-4px_color-mix(in_srgb,var(--accent)_60%,transparent)]">
          <Flame className="size-3.5 fill-current" />
          {days}
        </span>
        <ChevronRight className="size-5 shrink-0 text-[var(--muted)]" />
      </Link>

      {/* CTA principal */}
      <Link
        href="/entrenar"
        className="group relative overflow-hidden rounded-3xl border border-[var(--border)] p-6 transition-colors hover:border-[var(--accent)] sm:p-8"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, var(--surface)), var(--surface))",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[var(--accent)]">
              {weeklyVolume?.length ? "Tu último entrenamiento" : "Listo para entrenar"}
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {weeklyVolume?.length
                ? weeklyVolume[0].name
                : "Arrancá tu primera sesión"}
            </h2>
            {weeklyVolume?.length && (
              <p className="mt-1 text-sm text-[var(--text-2)]">
                {formatDate(weeklyVolume[0].started_at)} ·{" "}
                {formatDuration(weeklyVolume[0].duration_sec ?? 0)}
              </p>
            )}
          </div>
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-ink)] transition-colors">
            <Play className="ml-0.5 size-6 fill-current" />
          </span>
        </div>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Sesiones"
          value={data?.workouts?.length ?? 0}
          sub="últimas"
          icon={<Dumbbell className="size-4" />}
        />
        <StatCard
          label="Rutinas"
          value={data?.routines?.length ?? 0}
          sub="guardadas"
          icon={<CalendarDays className="size-4" />}
        />
        <StatCard
          label="1RM"
          value={data?.max1rm ? `${data.max1rm} kg` : "—"}
          sub="máximo estimado"
          icon={<Trophy className="size-4" />}
        />
      </div>

      {/* Rutinas */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold tracking-tight">
            Tus rutinas
          </h3>
          <Link
            href="/rutinas"
            className="flex items-center gap-0.5 text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            Ver todas <ChevronRight className="size-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : data?.routines.length ? (
          <div className="grid grid-cols-2 gap-3">
            {data.routines.slice(0, 4).map((r: { id: string; name: string; routine_exercises: { count: number }[] }) => (
              <Link
                key={r.id}
                href="/rutinas"
                className="card card-hover flex flex-col justify-between p-4"
              >
                <p className="line-clamp-2 text-sm font-semibold leading-snug">
                  {r.name}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {r.routine_exercises[0]?.count ?? 0} ejercicios
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Dumbbell className="size-6" />}
            title="Todavía no tenés rutinas"
            description="Armá tu primera rutina o usá una plantilla de la biblioteca."
            action={
              <Link href="/rutinas">
                <Button variant="accent">
                  Crear rutina <ChevronRight className="size-4" />
                </Button>
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
