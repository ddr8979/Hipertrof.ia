"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  X,
  Check,
  Play,
  Timer,
  Pencil,
  Square,
  Dumbbell,
  Trash2,
  Music4,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  useWorkoutStore,
  type DraftExercise,
  type SetType,
  type WorkoutDraft,
} from "@/lib/workout-store";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ExercisePicker } from "@/components/exercise-picker";
import { RestTimer } from "@/components/rest-timer";
import { toast } from "@/components/ui/toast";
import { formatDuration } from "@/lib/utils";
import { cn, vibrate } from "@/lib/utils";
import { ExerciseMedia } from "@/components/exercise-media";

const SET_TYPES: { id: SetType; label: string }[] = [
  { id: "N", label: "Normal" },
  { id: "W", label: "Warmup" },
  { id: "F", label: "Fallo" },
  { id: "D", label: "Drop" },
];

const TYPE_COLORS: Record<SetType, string> = {
  N: "bg-[var(--surface-3)] text-[var(--text)]",
  W: "bg-[var(--info-soft)] text-[var(--info)]",
  F: "bg-[var(--warn-soft)] text-[var(--warn)]",
  D: "bg-[var(--danger-soft)] text-[var(--danger)]",
};
const getTypeColor = (type: string) => TYPE_COLORS[type as SetType] ?? TYPE_COLORS.N;


function ExerciseCard({
  exercise,
  routineRest,
  onRemove,
}: {
  exercise: DraftExercise;
  routineRest: number;
  onRemove: () => void;
}) {
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const startRest = useWorkoutStore((s) => s.startRest);
  const stopRest = useWorkoutStore((s) => s.stopRest);
  const restEndsAt = useWorkoutStore((s) => s.restEndsAt);
  const [typeMenu, setTypeMenu] = useState<number | null>(null);

  const totalKg = exercise.sets.reduce(
    (a, s) => a + (s.completed ? s.weight * s.reps : 0),
    0
  );

  function toggleSet(index: number) {
    const set = exercise.sets[index];
    const completed = !set.completed;
    vibrate(completed ? 14 : 6);
    updateSet(exercise.key, set.key, { completed });
    if (completed) {
      stopRest();
      startRest(exercise.key, routineRest);
    }
  }

  return (
    <div className="card">
      <div className="flex items-start gap-3 p-4">
        <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-2)]">
          <ExerciseMedia url={exercise.gifUrl} alt={exercise.name} className="size-14 rounded-xl" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold leading-snug tracking-tight">
            {exercise.name}
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {exercise.sets.length} series · {totalKg.toLocaleString("es-UY")} kg
            totales
          </p>
        </div>
        <button
          onClick={onRemove}
          aria-label="Quitar ejercicio"
          className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--danger)]"
        >
          <X className="size-4.5" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 px-4 pb-4">
        {exercise.sets.map((set, i) => {
          const lastCompleted =
            i === exercise.sets.length - 1 && set.completed;
          return (
            <div
              key={set.key}
              className={cn(
                "flex flex-wrap items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors",
                set.completed
                  ? "border-[var(--accent)]/50 bg-[var(--accent-soft)]/60"
                  : "border-[var(--border)]"
              )}
            >
              <button
                onClick={() => toggleSet(i)}
                aria-label={set.completed ? "Desmarcar serie" : "Completar serie"}
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all",
                  set.completed
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "border-[var(--border)] text-transparent hover:border-[var(--accent)]"
                )}
              >
                <Check className="size-4" strokeWidth={3} />
              </button>

              <div className="relative">
                <button
                  onClick={() => setTypeMenu(typeMenu === i ? null : i)}
                  className={cn(
                    "flex h-8 w-9 items-center justify-center rounded-lg text-[11px] font-bold",
                    getTypeColor(set.type)
                  )}
                >
                  {set.type}
                </button>
                {typeMenu === i && (
                  <div className="absolute left-0 top-9 z-30 w-36 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
                    {SET_TYPES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          updateSet(exercise.key, set.key, { type: t.id });
                          setTypeMenu(null);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2 text-sm font-semibold hover:bg-[var(--surface-2)]",
                          set.type === t.id && "text-[var(--accent)]"
                        )}
                      >
                        {t.label}
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold",
                            getTypeColor(t.id)
                          )}
                        >
                          {t.id}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={set.weight || ""}
                placeholder="kg"
                onChange={(e) =>
                  updateSet(exercise.key, set.key, {
                    weight: Math.max(0, Number(e.target.value)),
                  })
                }
                className="h-9 w-16 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-center text-sm font-semibold tabular-nums focus:border-[var(--accent)] focus:outline-none"
              />
              <span className="text-xs text-[var(--muted)]">×</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={set.reps || ""}
                placeholder="reps"
                onChange={(e) =>
                  updateSet(exercise.key, set.key, {
                    reps: Math.max(0, Math.round(Number(e.target.value))),
                  })
                }
                className="h-9 w-16 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-center text-sm font-semibold tabular-nums focus:border-[var(--accent)] focus:outline-none"
              />

              {lastCompleted && restEndsAt && (
                <span className="flex items-center gap-1 text-xs font-bold text-[var(--accent)]">
                  <Timer className="size-3.5" />
                  Descansando
                </span>
              )}

              <button
                onClick={() => removeSet(exercise.key, set.key)}
                aria-label="Eliminar serie"
                className="ml-auto rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:text-[var(--danger)]"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}

        <button
          onClick={() => addSet(exercise.key)}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--border)] py-2 text-xs font-semibold text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <Plus className="size-3.5" />
          Agregar serie
        </button>
      </div>
    </div>
  );
}

function SpotifyMini() {
  const { data } = useQuery({
    queryKey: ["spotify_mini"],
    queryFn: async () => {
      const r = await fetch("/api/spotify/data");
      if (!r.ok) return null;
      return (await r.json()) as {
        connected: boolean;
        playing?: { name: string; artists: string; cover: string | null; is_playing: boolean } | null;
      };
    },
    refetchInterval: 20000,
  });

  if (!data || !data.connected) {
    return (
      <a
        href="/api/spotify/auth"
        className="flex w-full max-w-sm items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#1DB954]/15 text-[#1DB954]">
            <Music4 className="size-4.5" />
          </span>
          <span className="text-sm font-semibold">Conectá tu Spotify</span>
        </span>
        <span className="text-sm font-semibold text-[#1DB954]">Conectar</span>
      </a>
    );
  }

  if (!data.playing || !data.playing.is_playing) {
    return (
      <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-[#1DB954]/15 text-[#1DB954]">
          <Music4 className="size-4.5" />
        </span>
        <span className="text-sm font-semibold text-[var(--text-2)]">
          Nada sonando ahora en Spotify
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <img
        src={data.playing.cover ?? "/icons/icon-192.png"}
        alt=""
        className="size-10 rounded-xl object-cover"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{data.playing.name}</p>
        <p className="truncate text-xs text-[var(--muted)]">{data.playing.artists}</p>
      </div>
      <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-[#1DB954]">
        <Music4 className="size-3.5" />
        Sonando
      </span>
    </div>
  );
}

export default function EntrenarPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const draft = useWorkoutStore((s) => s.draft);
  const existingDraft = useWorkoutStore.getState().draft;
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const resumeWorkout = useWorkoutStore((s) => s.resumeWorkout);
  const discardWorkout = useWorkoutStore((s) => s.discardWorkout);
  const startSession = useWorkoutStore((s) => s.startSession);
  const setMeta = useWorkoutStore((s) => s.setMeta);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);

  const [elapsed, setElapsed] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editName, setEditName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [routineConfirm, setRoutineConfirm] = useState<{
    routine: { id: string; name: string };
    existingDraft: WorkoutDraft;
  } | null>(null);
  const [exitConfirm, setExitConfirm] = useState(false);
  const bootRef = useRef(false);

  const routineId = searchParams.get("routine");

  // Cargar rutina si venimos de una
  const { data: routine } = useQuery({
    queryKey: ["routine", routineId],
    queryFn: async () => {
      if (!routineId) return null;
      const supabase = createClient();
      const { data } = await supabase
        .from("routines")
        .select(
          "id, name, routine_exercises(id, exercise_id, target_sets, target_reps, rest_sec, order_index, exercise:exercises(id, name, gif_url))"
        )
        .eq("id", routineId)
        .order("order_index", { referencedTable: "routine_exercises", ascending: true })
        .single();
      return data as unknown as {
        id: string;
        name: string;
        routine_exercises: {
          id: string;
          exercise_id: string | null;
          target_sets: number;
          target_reps: number;
          rest_sec: number;
          order_index: number;
          exercise: { id: string; name: string; gif_url: string | null } | null;
        }[];
      };
    },
    enabled: !!routineId,
  });

  // Boot: rutina nueva, sesión previa o esperar decisión
  useEffect(() => {
    if (bootRef.current) return;

    // Esperar a que la query de rutina resuelva (éxito o error)
    if (routineId && routine === undefined) return;

    bootRef.current = true;

    if (routine) {
      // Hay rutina cargada: si ya hay draft, preguntar antes de sobrescribir
      if (existingDraft) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- boot de sesión desde query async
        setRoutineConfirm({ routine: { id: routine.id, name: routine.name }, existingDraft });
        return;
      }
      applyRoutine(routine);
      return;
    }

    if (routineId && !routine) {
      // La query falló o la rutina no existe: fallback a draft existente o vacío
      if (existingDraft) {
        resumeWorkout(existingDraft);
      }
      return;
    }

    // Sin rutina en URL: reanudar draft si existe
    if (existingDraft) {
      resumeWorkout(existingDraft);
    }
  }, [routine, routineId, existingDraft, startWorkout, resumeWorkout, addExercise]);

  function applyRoutine(r: NonNullable<typeof routine>) {
    startWorkout({
      name: r.name,
      sourceRoutineId: r.id,
      exercises: [],
    });
    type RoutineExRow = {
      exercise_id: string | null;
      target_sets: number;
      rest_sec: number;
      exercise: { id: string; name: string; gif_url: string | null } | null;
    };
    const unmatched = r.routine_exercises?.filter((re) => !re.exercise_id) ?? [];
    r.routine_exercises?.forEach((re: RoutineExRow) => {
      addExercise({
        exerciseId: re.exercise_id,
        name: re.exercise?.name ?? "Ejercicio",
        gifUrl: re.exercise?.gif_url ?? null,
        restSec: re.rest_sec ?? 90,
        sets: re.target_sets ?? 3,
      });
    });
    if (unmatched.length > 0) {
      toast("warning", "Ejercicios sin video/músculo", `${unmatched.map((u) => u.exercise?.name ?? "Desconocido").join(", ")} no están en la base de datos`);
    }

    // Cargas predeterminadas: pesos del último entrenamiento del usuario
    void (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
const { data: lastW } = await supabase
        .from("workouts")
        .select(
          "workout_exercises(exercise_id, workout_sets(weight_kg))"
        )
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const weights = new Map<string, number>();
      for (const we of lastW?.workout_exercises ?? []) {
        const w = we.workout_sets?.find((s) => s.weight_kg > 0)?.weight_kg;
        if (w) weights.set(we.exercise_id, w);
      }
      if (weights.size === 0) return;
      const st = useWorkoutStore.getState();
      for (const ex of st.draft?.exercises ?? []) {
        const w = weights.get(ex.exerciseId ?? "");
        if (!w) continue;
        for (const set of ex.sets) {
          st.updateSet(ex.key, set.key, { weight: w });
        }
      }
    })();
  }

  function confirmRoutineReplace(replace: boolean) {
    if (replace && routine) {
      applyRoutine(routine);
    } else if (!replace && routineConfirm) {
      resumeWorkout(routineConfirm.existingDraft);
    }
    setRoutineConfirm(null);
  }

  const { data: lastWorkout, isLoading: loadingLast } = useQuery({
    queryKey: ["last_workout"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("workouts")
        .select(
          "id, name, workout_exercises(exercise_id, name, order_index, exercise:exercises(id, gif_url), workout_sets(set_index, type, weight_kg, reps, rpe))"
        )
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as unknown as {
        id: string;
        name: string;
        workout_exercises: {
          exercise_id: string | null;
          name: string;
          order_index: number;
          exercise: { id: string; gif_url: string | null } | null;
          workout_sets: {
            set_index: number;
            type: string;
            weight_kg: number;
            reps: number;
            rpe: number | null;
          }[];
        }[];
      } | null;
    },
    enabled: !draft && !routineId,
  });

  async function repeatLast() {
    if (!lastWorkout) return;
    const draft: WorkoutDraft = {
      id: crypto.randomUUID(),
      name: `${lastWorkout.name} (repetida)`,
      notes: "",
      sourceRoutineId: null,
      startedAt: null,
      exercises: [...lastWorkout.workout_exercises]
        .sort((a, b) => a.order_index - b.order_index)
        .map((we) => ({
          key: crypto.randomUUID(),
          exerciseId: we.exercise_id,
          name: we.name,
          gifUrl: we.exercise?.gif_url ?? null,
          notes: "",
          restSec: 90,
          sets: [...we.workout_sets]
            .sort((a, b) => a.set_index - b.set_index)
            .map((s) => ({
              key: crypto.randomUUID(),
              type: s.type as SetType,
              weight: s.weight_kg,
              reps: s.reps,
              rpe: s.rpe,
              completed: false,
            })),
        })),
    };
    resumeWorkout(draft);
  }

  // Timer de duración (solo cuando la sesión arrancó)
  useEffect(() => {
    if (!draft?.startedAt) return;
    const t = setInterval(
      () =>
        setElapsed(
          Math.floor(
            (Date.now() - new Date(draft.startedAt!).getTime()) / 1000
          )
        ),
      1000
    );
    return () => clearInterval(t);
  }, [draft?.startedAt]);

  const totalSets = useMemo(
    () =>
      (draft?.exercises ?? []).reduce((a, e) => a + e.sets.length, 0),
    [draft?.exercises]
  );
  const completedSets = useMemo(
    () =>
      (draft?.exercises ?? []).reduce(
        (a, e) => a + e.sets.filter((s) => s.completed).length,
        0
      ),
    [draft?.exercises]
  );

  async function finish() {
    if (!draft || saving) return;
    if (!draft.startedAt) {
      toast("warning", "Presioná Comenzar Entrenamiento primero");
      return;
    }
    if (!draft.exercises.length) {
      toast("warning", "No hay ejercicios en la sesión");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sin sesión");

      const endedAt = new Date().toISOString();
      const durationSec = Math.max(
        1,
        Math.floor((Date.now() - new Date(draft.startedAt).getTime()) / 1000)
      );

      // Idempotent: usar draft.id como workout_id (generado al startWorkout)
      const workoutId = draft.id;

      // 1. Insert workout con ID determinístico
      const { error: we } = await supabase.from("workouts").upsert({
        id: workoutId,
        user_id: user.id,
        name: draft.name,
        notes: draft.notes || null,
        source_routine_id: draft.sourceRoutineId,
        started_at: draft.startedAt,
        ended_at: endedAt,
        duration_sec: durationSec,
      });
      if (we) throw we;

      // 2. Insert workout_exercises uno por uno para mapear IDs correctamente
      const wEId = new Map<string, string>();
      for (const e of draft.exercises) {
        const { data: wE, error: we2 } = await supabase
          .from("workout_exercises")
          .insert({
            workout_id: workoutId,
            exercise_id: e.exerciseId,
            name: e.name,
            order_index: draft.exercises.indexOf(e),
            notes: e.notes || null,
          })
          .select("id")
          .single();
        if (we2 || !wE) throw we2 ?? new Error("No se creó workout_exercise");
        wEId.set(e.key, wE.id);
      }

      // 3. Insert sets en batch (ya tenemos los workout_exercise_id correctos)
      const sets: {
        workout_exercise_id: string;
        set_index: number;
        type: string;
        weight_kg: number;
        reps: number;
        rpe: number | null;
        completed: boolean;
      }[] = [];
      draft.exercises.forEach((e) =>
        e.sets.forEach((s, i) => {
          const weId = wEId.get(e.key);
          if (!weId) throw new Error("Missing workout_exercise_id for " + e.key);
          sets.push({
            workout_exercise_id: weId,
            set_index: i,
            type: s.type,
            weight_kg: s.weight,
            reps: s.reps,
            rpe: s.rpe,
            completed: s.completed,
          });
        })
      );
      const { error: we3 } = await supabase.from("workout_sets").insert(sets);
      if (we3) throw we3;

      const { data: unlocked } = await supabase.rpc("unlock_achievements");
      discardWorkout();
      qc.invalidateQueries();
      toast(
        "success",
        "Entrenamiento guardado",
        unlocked && unlocked.length
          ? `${(unlocked as { name: string }[]).map((u) => u.name).join(", ")} desbloqueado`
          : `${formatDuration(durationSec)} · ${draft.exercises.length} ejercicios`
      );
      setConfirmOpen(false);
      router.push("/dashboard");
    } catch (err) {
      toast("error", "No se pudo guardar", (err as Error).message);
      setSaving(false);
    }
  }

  if (!draft) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
        <SpotifyMini />
        <div className="flex flex-col items-center gap-2 text-center">
          <Dumbbell className="size-10 text-[var(--accent)]" />
          <h1 className="font-display text-2xl font-bold tracking-tight">Entrenar</h1>
          <p className="max-w-xs text-sm text-[var(--text-2)]">
            Elegí cómo arrancar la sesión
          </p>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-3">
          {lastWorkout && (
            <button
              onClick={() => void repeatLast()}
              disabled={loadingLast}
              className="card group flex flex-col gap-1 p-5 text-left transition-transform hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2 text-[var(--accent)]">
                <Play className="size-4" />
                Repetir último entrenamiento
              </span>
              <span className="text-sm font-semibold">{lastWorkout.name}</span>
              <span className="text-xs text-[var(--muted)]">
                {lastWorkout.workout_exercises.length} ejercicios · cargas del historial
              </span>
            </button>
          )}
          <button
            onClick={() => startWorkout({})}
            className="card group flex flex-col gap-1 border border-[var(--border)] p-5 text-left transition-transform hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-2 text-[var(--accent)]">
              <Plus className="size-4" />
              Entrenamiento nuevo
            </span>
            <span className="text-sm font-semibold">Desde cero</span>
            <span className="text-xs text-[var(--muted)]">
              Agregás los ejercicios vos
            </span>
          </button>
        </div>

        <Link
          href="/dashboard"
          className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)]"
        >
          Volver al inicio
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-dvh pb-40">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => {
              if (draft.exercises.length > 0) {
                setExitConfirm(true);
              } else {
                router.push("/dashboard");
              }
            }}
            aria-label="Salir de la sesión"
            className="rounded-xl p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <X className="size-5" />
          </button>

          <div className="min-w-0 flex-1">
            {editName ? (
              <Input
                value={draft.name}
                onChange={(e) => setMeta({ name: e.target.value })}
                onBlur={() => setEditName(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditName(false)}
                autoFocus
                className="h-8 text-sm font-bold"
              />
            ) : (
              <button
                onClick={() => setEditName(true)}
                className="group flex max-w-full items-center gap-1.5 text-left"
              >
                <span className="truncate font-display text-base font-bold tracking-tight">
                  {draft.name}
                </span>
                <Pencil className="size-3.5 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
            <p className="text-xs font-semibold tabular-nums text-[var(--accent)]">
              {formatDuration(elapsed)}
              <span className="text-[var(--muted)]">
                {" "}
                · {completedSets}/{totalSets} series
              </span>
            </p>
          </div>

          {!draft.startedAt ? (
            <Button variant="accent" size="sm" onClick={startSession}>
              <Play className="size-3.5" />
              Comenzar
            </Button>
          ) : (
            <Button variant="accent" size="sm" onClick={() => setConfirmOpen(true)}>
              <Square className="size-3.5" />
              Finalizar
            </Button>
          )}
        </div>
      </header>

      {/* Ejercicios */}
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pt-4">
        <SpotifyMini />
        {draft.exercises.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-10 text-center">
            <Dumbbell className="size-8 text-[var(--accent)]" />
            <div>
              <p className="font-display text-lg font-bold tracking-tight">
                Arrancá con un ejercicio
              </p>
              <p className="mt-1 text-sm text-[var(--text-2)]">
                Buscá en la biblioteca de 246 ejercicios con video
              </p>
            </div>
            <Button onClick={() => setPickerOpen(true)}>
              <Plus className="size-4" />
              Agregar ejercicio
            </Button>
          </div>
        ) : (
          <>
            {draft.exercises.map((e) => (
              <ExerciseCard
                key={e.key}
                exercise={e}
                routineRest={e.restSec}
                onRemove={() => removeExercise(e.key)}
              />
            ))}
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] py-4 text-sm font-semibold text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <Plus className="size-4.5" />
              Agregar ejercicio
            </button>
          </>
        )}
      </div>

      {/* Confirmar finalización */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Finalizar entrenamiento"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={saving}
            >
              Seguir entrenando
            </Button>
            <Button variant="accent" onClick={finish} loading={saving}>
              <Check className="size-4" />
              Guardar sesión
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--text-2)]">
              Duración
            </span>
            <span className="font-display text-lg font-bold tabular-nums">
              {formatDuration(elapsed)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--text-2)]">
              Ejercicios
            </span>
            <span className="font-display text-lg font-bold tabular-nums">
              {draft.exercises.length}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--text-2)]">
              Series completadas
            </span>
            <span className="font-display text-lg font-bold tabular-nums text-[var(--accent)]">
              {completedSets}/{totalSets}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--text-2)]">
              Volumen total
            </span>
            <span className="font-display text-lg font-bold tabular-nums">
              {(draft.exercises.reduce(
                (a, e) =>
                  a +
                  e.sets.reduce(
                    (x, s) => x + (s.completed ? s.weight * s.reps : 0),
                    0
                  ),
                0
              ) / 1000).toLocaleString("es-UY", { maximumFractionDigits: 1 })}{" "}
              t
            </span>
          </div>
          {completedSets < totalSets && (
            <p className="text-xs text-[var(--muted)]">
              Hay {totalSets - completedSets} series sin completar. Se
              guardarán igual.
            </p>
          )}
        </div>
      </Dialog>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(ex) => {
          addExercise({
            exerciseId: ex.id,
            name: ex.name,
            gifUrl: ex.gifUrl,
          });
          setPickerOpen(false);
          toast("success", `${ex.name} agregado`);
        }}
        onRemove={(exerciseId) => {
          const ex = draft.exercises.find((e) => e.exerciseId === exerciseId);
          if (ex) {
            removeExercise(ex.key);
            toast("success", `${ex.name} quitado`);
          }
        }}
        selectedIds={
          draft.exercises
            .map((e) => e.exerciseId)
            .filter(Boolean) as string[]
        }
      />

      <RestTimer />

      {routineConfirm && (
        <Dialog
          open
          onClose={() => confirmRoutineReplace(false)}
          title="¿Reemplazar sesión actual?"
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[var(--text-2)]">
              Tenés una sesión en curso con <strong>{routineConfirm.existingDraft.exercises.length} ejercicios</strong>.
              Al cargar la rutina &laquo;{routineConfirm.routine.name}&raquo; se perderá el progreso no guardado.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => confirmRoutineReplace(false)} className="flex-1">
                Conservar mi sesión
              </Button>
              <Button variant="accent" onClick={() => confirmRoutineReplace(true)} className="flex-1">
                Cargar rutina
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {exitConfirm && (
        <Dialog
          open
          onClose={() => setExitConfirm(false)}
          title="¿Salir de la sesión?"
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[var(--text-2)]">
              Tenés <strong>{draft.exercises.length} ejercicios</strong> con series completadas.
              Si salís ahora, la sesión queda guardada para continuar luego.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setExitConfirm(false)} className="flex-1">
                Seguir entrenando
              </Button>
              <Button variant="accent" onClick={() => { router.push("/dashboard"); setExitConfirm(false); }} className="flex-1">
                Salir y guardar
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </main>
  );
}