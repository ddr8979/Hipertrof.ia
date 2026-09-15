"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Store global (Zustand) del borrador de sesión de entrenamiento en curso.
 * Se persiste en localStorage para sobrevivir recargas y cierres de pestaña.
 */

/** Tipo de serie: Normal, Warm-up (calentamiento), Fallo o Drop. */
export type SetType = "N" | "W" | "F" | "D";

/** Serie individual dentro de un ejercicio del borrador. */
export type DraftSet = {
  key: string;
  type: SetType;
  weight: number;
  reps: number;
  rpe: number | null;
  completed: boolean;
};

/** Ejercicio del borrador con sus series y metadatos de descanso/notas. */
export type DraftExercise = {
  key: string;
  exerciseId: string | null;
  name: string;
  gifUrl: string | null;
  notes: string;
  restSec: number;
  sets: DraftSet[];
};

/** Borrador completo de una sesión de entrenamiento. */
export type WorkoutDraft = {
  id: string;
  name: string;
  notes: string;
  sourceRoutineId: string | null;
  startedAt: string | null;
  exercises: DraftExercise[];
};

/** Estado y acciones expuestos por el store. */
type WorkoutState = {
  draft: WorkoutDraft | null;
  restEndsAt: number | null;
  restExerciseKey: string | null;
  restTotal: number | null;
  startWorkout: (init?: Partial<WorkoutDraft>) => void;
  resumeWorkout: (draft: WorkoutDraft) => void;
  discardWorkout: () => void;
  startSession: () => void;
  setMeta: (patch: Partial<Pick<WorkoutDraft, "name" | "notes">>) => void;
  addExercise: (ex: {
    exerciseId: string | null;
    name: string;
    gifUrl: string | null;
    restSec?: number;
    sets?: number;
  }) => void;
  removeExercise: (key: string) => void;
  addSet: (exerciseKey: string) => void;
  removeSet: (exerciseKey: string, setKey: string) => void;
  updateSet: (
    exerciseKey: string,
    setKey: string,
    patch: Partial<DraftSet>
  ) => void;
  startRest: (exerciseKey: string, seconds: number) => void;
  stopRest: () => void;
  adjustRest: (deltaSeconds: number) => void;
};

/** Genera claves únicas para ejercicios y series. */
const uid = () => crypto.randomUUID();

/** Crea `count` series vacías (tipo normal, sin peso/reps, sin completar). */
function defaultSets(count: number): DraftSet[] {
  return Array.from({ length: count }, () => ({
    key: uid(),
    type: "N",
    weight: 0,
    reps: 0,
    rpe: null,
    completed: false,
  }));
}

/**
 * Hook del borrador de entrenamiento. Persiste SOLO `draft` en localStorage bajo
 * la clave "hypertrofia-workout-draft"; el estado de descanso (rest*) es efímero
 * y queda fuera de `partialize` a propósito.
 */
export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      draft: null,
      restEndsAt: null,
      restExerciseKey: null,
      restTotal: null,

      // Inicia un borrador nuevo (vacío) con los metadatos opcionales recibidos.
      startWorkout: (init) =>
        set({
          draft: {
            id: uid(),
            name: init?.name ?? "Entrenamiento",
            notes: init?.notes ?? "",
            sourceRoutineId: init?.sourceRoutineId ?? null,
            startedAt: init?.startedAt ?? null,
            exercises: [],
          },
          restEndsAt: null,
          restExerciseKey: null,
        }),

      resumeWorkout: (draft) => set({ draft, restEndsAt: null, restExerciseKey: null, restTotal: null }),

      // Marca el comienzo efectivo de la sesión (timestamp) solo si aún no empezó.
      startSession: () =>
        set((s) =>
          s.draft && !s.draft.startedAt
            ? {
                draft: { ...s.draft, startedAt: new Date().toISOString() },
              }
            : {}
        ),

      discardWorkout: () =>
        set({ draft: null, restEndsAt: null, restExerciseKey: null, restTotal: null }),

      setMeta: (patch) =>
        set((s) =>
          s.draft ? { draft: { ...s.draft, ...patch } } : {}
        ),

      addExercise: (ex) =>
        set((s) => {
          if (!s.draft) return {};
          const draft = {
            ...s.draft,
            exercises: [
              ...s.draft.exercises,
              {
                key: uid(),
                exerciseId: ex.exerciseId,
                name: ex.name,
                gifUrl: ex.gifUrl,
                notes: "",
                restSec: ex.restSec ?? 90,
                sets: defaultSets(ex.sets ?? 3),
              },
            ],
          };
          // NO tocar el descanso activo existente salvo que el ejercicio previo esté 100% completo
          // y NO haya un descanso ya corriendo
          const next: { draft: WorkoutDraft; restEndsAt: number | null; restExerciseKey: string | null; restTotal: number | null } = {
            draft,
            restEndsAt: s.restEndsAt,
            restExerciseKey: s.restExerciseKey,
            restTotal: s.restTotal,
          };
          const prev = s.draft.exercises[s.draft.exercises.length - 1];
          if (
            !s.restEndsAt &&
            prev &&
            prev.sets.length > 0 &&
            prev.sets.every((st) => st.completed)
          ) {
            next.restEndsAt = Date.now() + (ex.restSec ?? 90) * 1000;
            next.restExerciseKey = prev.key;
            next.restTotal = ex.restSec ?? 90;
          }
          return next;
        }),

      removeExercise: (key) =>
        set((s) => {
          if (!s.draft) return {};
          return {
            draft: {
              ...s.draft,
              exercises: s.draft.exercises.filter((e) => e.key !== key),
            },
            restEndsAt: null,
            restExerciseKey: null,
            restTotal: null,
          };
        }),

      // Agrega una serie vacía al final del ejercicio indicado.
      addSet: (exerciseKey) =>
        set((s) => ({
          draft: s.draft
            ? {
                ...s.draft,
                exercises: s.draft.exercises.map((e) =>
                  e.key === exerciseKey
                    ? {
                        ...e,
                        sets: [
                          ...e.sets,
                          { key: uid(), type: "N", weight: 0, reps: 0, rpe: null, completed: false },
                        ],
                      }
                    : e
                ),
              }
            : null,
        })),

      // Elimina una serie puntual del ejercicio.
      removeSet: (exerciseKey, setKey) =>
        set((s) => ({
          draft: s.draft
            ? {
                ...s.draft,
                exercises: s.draft.exercises.map((e) =>
                  e.key === exerciseKey
                    ? { ...e, sets: e.sets.filter((st) => st.key !== setKey) }
                    : e
                ),
              }
            : null,
        })),

      // Aplica un patch parcial a una serie (peso, reps, rpe, completado, etc.).
      updateSet: (exerciseKey, setKey, patch) =>
        set((s) => ({
          draft: s.draft
            ? {
                ...s.draft,
                exercises: s.draft.exercises.map((e) =>
                  e.key === exerciseKey
                    ? {
                        ...e,
                        sets: e.sets.map((st) =>
                          st.key === setKey ? { ...st, ...patch } : st
                        ),
                      }
                    : e
                ),
              }
            : null,
        })),

      // Inicia (o reinicia) el temporizador de descanso del ejercicio indicado.
      startRest: (exerciseKey, seconds) =>
        set({
          restEndsAt: Date.now() + seconds * 1000,
          restExerciseKey: exerciseKey,
          restTotal: seconds,
        }),

      stopRest: () => set({ restEndsAt: null, restExerciseKey: null, restTotal: null }),

      // Ajusta el descanso en curso (±segundos), con un mínimo de 10s.
      adjustRest: (deltaSeconds) =>
        set((s) => {
          if (s.restEndsAt === null || s.restTotal === null) return {};
          const next = Math.max(10, s.restTotal + deltaSeconds);
          return {
            restTotal: next,
            restEndsAt: Date.now() + next * 1000,
          };
        }),
    }),
    {
      name: "hypertrofia-workout-draft",
      // Solo se persiste el borrador; el estado de descanso se descarta al recargar.
      partialize: (s) => ({
        draft: s.draft,
      }),
    }
  )
);