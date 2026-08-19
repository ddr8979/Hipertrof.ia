"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SetType = "N" | "W" | "F" | "D";

export type DraftSet = {
  key: string;
  type: SetType;
  weight: number;
  reps: number;
  rpe: number | null;
  completed: boolean;
};

export type DraftExercise = {
  key: string;
  exerciseId: string | null;
  name: string;
  gifUrl: string | null;
  notes: string;
  sets: DraftSet[];
};

export type WorkoutDraft = {
  id: string;
  name: string;
  notes: string;
  sourceRoutineId: string | null;
  startedAt: string | null;
  exercises: DraftExercise[];
};

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
};

const uid = () => crypto.randomUUID();

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

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      draft: null,
      restEndsAt: null,
      restExerciseKey: null,
      restTotal: null,

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

      resumeWorkout: (draft) => set({ draft }),

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
                sets: defaultSets(ex.sets ?? 3),
              },
            ],
          };
          // Auto-arrancar descanso del ejercicio previo, si es que hay
          const prev = s.draft.exercises[s.draft.exercises.length - 1];
          const next: { draft: WorkoutDraft; restEndsAt: number | null; restExerciseKey: string | null; restTotal: number | null } = {
            draft,
            restEndsAt: null,
            restExerciseKey: null,
            restTotal: null,
          };
          if (prev && prev.sets.length > 0 && prev.sets.every((st) => st.completed)) {
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

      startRest: (exerciseKey, seconds) =>
        set({
          restEndsAt: Date.now() + seconds * 1000,
          restExerciseKey: exerciseKey,
          restTotal: seconds,
        }),

      stopRest: () => set({ restEndsAt: null, restExerciseKey: null, restTotal: null }),
    }),
    { name: "hypertrofia-workout-draft" }
  )
);