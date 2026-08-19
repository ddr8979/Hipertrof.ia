"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  startOfWeek,
  addDays,
  subMonths,
  format,
  eachDayOfInterval,
  startOfYear,
  endOfYear,
} from "date-fns";
import {
  Flame,
  Dumbbell,
  Clock,
  Trophy,
  ChevronDown,
  ChartLine,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/data";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/components/providers";
import { formatDuration, estimate1RM } from "@/lib/utils";
import { cn } from "@/lib/utils";

type WorkoutRow = {
  id: string;
  name: string;
  started_at: string;
  duration_sec: number | null;
  workout_exercises: {
    name: string;
    exercise: { id: string; name: string }[] | null;
    workout_sets: {
      type: string;
      weight_kg: number;
      reps: number;
      completed: boolean;
    }[];
  }[];
};

function Heatmap({ dates }: { dates: string[] }) {
  const dayCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of dates) {
      const key = d.slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [dates]);

  const year = new Date().getFullYear();
  const days = useMemo(
    () => eachDayOfInterval({ start: startOfYear(new Date(year, 0, 1)), end: endOfYear(new Date(year, 11, 31)) }),
    [year]
  );

  // Grid de semanas (53 columnas)
  const weeks: Date[][] = useMemo(() => {
    const first = startOfYear(new Date(year, 0, 1));
    const offset = first.getDay(); // 0 = domingo
    const cols: Date[][] = [];
    let col: Date[] = [];
    for (let i = 0; i < offset; i++) col.push(addDays(first, i - offset));
    for (let i = 0; i < days.length; i++) {
      col.push(days[i]);
      if (col.length === 7) {
        cols.push(col);
        col = [];
      }
    }
    if (col.length) cols.push(col);
    return cols;
  }, [days, year]);

  const max = Math.max(1, ...dayCount.values());

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-1.5" style={{ minWidth: 720 }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1.5">
            {week.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const count = dayCount.get(key) ?? 0;
              const isFuture = day > new Date();
              const inYear = day.getFullYear() === year;
              return (
                <div
                  key={key}
                  title={inYear && !isFuture ? `${format(day, "d MMM")}: ${count} sesión${count === 1 ? "" : "es"}` : undefined}
                  className={cn(
                    "size-3 rounded-[3px]",
                    isFuture || !inYear
                      ? "bg-transparent"
                      : count === 0
                        ? "bg-[var(--surface-3)]"
                        : "bg-[var(--accent)]",
                    count > 0 && count >= max * 0.5 && "brightness-125"
                  )}
                  style={
                    count > 0
                      ? { opacity: 0.35 + (count / max) * 0.65 }
                      : undefined
                  }
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
        <span>Menos</span>
        {[0.2, 0.45, 0.7, 0.95].map((o) => (
          <span
            key={o}
            className="size-3 rounded-[3px] bg-[var(--accent)]"
            style={{ opacity: o }}
          />
        ))}
        <span>Más</span>
      </div>
    </div>
  );
}

export default function ProgresoPage() {
  const profile = useProfile((s) => s.profile);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["progreso"],
    queryFn: async () => {
      const supabase = createClient();
      const since = subMonths(new Date(), 12).toISOString();
      const { data: workouts } = await supabase
        .from("workouts")
        .select(
          "id, name, started_at, duration_sec, workout_exercises(name, exercise:exercises(id, name), workout_sets(type, weight_kg, reps, completed))"
        )
        .gte("started_at", since)
        .order("started_at", { ascending: true });
      return (workouts ?? []) as WorkoutRow[];
    },
  });

  const stats = useMemo(() => {
    const sessions = data?.length ?? 0;
    let volume = 0;
    let minutes = 0;
    for (const w of data ?? []) {
      minutes += w.duration_sec ?? 0;
      for (const e of w.workout_exercises) {
        for (const s of e.workout_sets) {
          if (s.completed && s.type !== "W") volume += s.weight_kg * s.reps;
        }
      }
    }
    return { sessions, volume, minutes };
  }, [data]);

  const weeklyVolume = useMemo(() => {
    const map = new Map<string, { week: string; kg: number }>();
    for (const w of data ?? []) {
      const weekStart = startOfWeek(new Date(w.started_at), { weekStartsOn: 1 });
      const key = weekStart.toISOString().slice(0, 10);
      let entry = map.get(key);
      if (!entry) {
        entry = { week: format(weekStart, "d MMM"), kg: 0 };
        map.set(key, entry);
      }
      for (const e of w.workout_exercises) {
        for (const s of e.workout_sets) {
          if (s.completed && s.type !== "W") entry.kg += s.weight_kg * s.reps;
        }
      }
    }
    return [...map.values()].slice(-12);
  }, [data]);

  const exerciseOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sessions: number }>();
    for (const w of data ?? []) {
      for (const e of w.workout_exercises) {
        const id = e.exercise?.[0]?.id ?? e.name;
        const name = e.exercise?.[0]?.name ?? e.name;
        const entry = map.get(id) ?? { id, name, sessions: 0 };
        entry.sessions++;
        map.set(id, entry);
      }
    }
    return [...map.values()].filter((e) => e.sessions >= 2).sort((a, b) => b.sessions - a.sessions);
  }, [data]);

  const activeExercise = selectedExercise ?? exerciseOptions[0]?.id ?? null;

  const prSeries = useMemo(() => {
    if (!activeExercise) return [];
    const series: { date: string; rm: number }[] = [];
    for (const w of data ?? []) {
      let best = 0;
      for (const e of w.workout_exercises) {
        const id = e.exercise?.[0]?.id ?? e.name;
        if (id !== activeExercise) continue;
        for (const s of e.workout_sets) {
          if (!s.completed || s.type === "W" || s.reps <= 0 || s.weight_kg <= 0) continue;
          best = Math.max(best, estimate1RM(s.weight_kg, s.reps));
        }
      }
      if (best > 0) {
        const last = series[series.length - 1];
        if (last && last.rm >= best) continue; // solo PRs y cambios
        series.push({
          date: format(new Date(w.started_at), "d MMM"),
          rm: Math.round(best),
        });
      }
    }
    return series;
  }, [data, activeExercise]);

  const topPRs = useMemo(() => {
    const map = new Map<string, { name: string; rm: number; date: string }>();
    for (const w of data ?? []) {
      for (const e of w.workout_exercises) {
        const name = e.exercise?.[0]?.name ?? e.name;
        let best = 0;
        for (const s of e.workout_sets) {
          if (!s.completed || s.type === "W" || s.reps <= 0 || s.weight_kg <= 0) continue;
          best = Math.max(best, estimate1RM(s.weight_kg, s.reps));
        }
        if (best > 0) {
          const prev = map.get(name);
          if (!prev || best > prev.rm) {
            map.set(name, {
              name,
              rm: Math.round(best),
              date: format(new Date(w.started_at), "d MMM yyyy"),
            });
          }
        }
      }
    }
    return [...map.values()].sort((a, b) => b.rm - a.rm).slice(0, 5);
  }, [data]);

  const heatDates = useMemo(
    () => (data ?? []).map((w) => w.started_at),
    [data]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-4 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="font-display text-3xl font-bold tracking-tight">Progreso</h1>
        <EmptyState
          icon={<ChartLine className="size-6" />}
          title="Todavía no hay datos"
          description="Completá entrenamientos y acá vas a ver tu evolución: volumen, 1RM y rachas."
          action={
            <a href="/entrenar">
              <Button variant="accent">Empezar a entrenar</Button>
            </a>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Progreso</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">Datos de los últimos 12 meses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card flex flex-col gap-1 p-4">
          <Flame className="size-4 text-[var(--accent)]" />
          <span className="font-display text-2xl font-bold">{profile?.streak_count ?? 0}</span>
          <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
            días de racha
          </span>
        </div>
        <div className="card flex flex-col gap-1 p-4">
          <Dumbbell className="size-4 text-[var(--accent)]" />
          <span className="font-display text-2xl font-bold">{stats.sessions}</span>
          <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
            sesiones (12 meses)
          </span>
        </div>
        <div className="card flex flex-col gap-1 p-4">
          <ChartLine className="size-4 text-[var(--accent)]" />
          <span className="font-display text-2xl font-bold">
            {(stats.volume / 1000).toLocaleString("es-UY", { maximumFractionDigits: 0 })}
            <span className="text-sm text-[var(--text-2)]"> t</span>
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
            volumen total
          </span>
        </div>
        <div className="card flex flex-col gap-1 p-4">
          <Clock className="size-4 text-[var(--accent)]" />
          <span className="font-display text-2xl font-bold">
            {formatDuration(Math.round(stats.minutes / 60) * 60)}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
            tiempo entrenado
          </span>
        </div>
      </div>

      {/* Volumen semanal */}
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Volumen semanal
          </h2>
          <span className="text-xs text-[var(--muted)]">kg levantados</span>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyVolume} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 13,
                }}
                labelStyle={{ color: "var(--text-2)", fontWeight: 600 }}
                formatter={(v) => [
                  `${Number(v).toLocaleString("es-UY")} kg`,
                  "Volumen",
                ]}
              />
              <Area
                type="monotone"
                dataKey="kg"
                stroke="var(--accent)"
                strokeWidth={2.5}
                fill="url(#volGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 1RM por ejercicio */}
      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Tu 1RM estimado
          </h2>
          <div className="relative">
            <select
              value={activeExercise ?? ""}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] pr-8 pl-3 text-sm font-semibold focus:border-[var(--accent)] focus:outline-none"
            >
              {exerciseOptions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.sessions}×)
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
          </div>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={prSeries} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 13,
                }}
                labelStyle={{ color: "var(--text-2)", fontWeight: 600 }}
                formatter={(v) => [`${v} kg`, "1RM estimado"]}
              />
              <Area
                type="monotone"
                dataKey="rm"
                stroke="var(--accent)"
                strokeWidth={2.5}
                fill="url(#prGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Récords */}
      <section className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="size-5 text-[var(--accent)]" />
          <h2 className="font-display text-lg font-bold tracking-tight">
            Récords personales
          </h2>
        </div>
        {topPRs.length ? (
          <div className="flex flex-col">
            {topPRs.map((pr, i) => (
              <div
                key={pr.name}
                className={cn(
                  "flex items-center gap-3 py-3",
                  i > 0 && "border-t border-[var(--border)]"
                )}
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--surface-2)] font-display text-sm font-bold text-[var(--accent)]">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{pr.name}</p>
                  <p className="text-xs text-[var(--muted)]">{pr.date}</p>
                </div>
                <span className="font-display text-lg font-bold tabular-nums">
                  {pr.rm} <span className="text-xs font-semibold text-[var(--text-2)]">kg</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            Completá series con peso y repeticiones para batir récords.
          </p>
        )}
      </section>

      {/* Heatmap */}
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight">
            {new Date().getFullYear()} en un vistazo
          </h2>
          <span className="text-xs text-[var(--muted)]">sesiones por día</span>
        </div>
        <Heatmap dates={heatDates} />
      </section>
    </div>
  );
}