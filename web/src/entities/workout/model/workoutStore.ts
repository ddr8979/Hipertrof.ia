import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SetType = "N" | "W" | "F" | "D"; // N = Normal (1, 2, 3...), W = Warmup (Aproximación), F = Fallo, D = Drop set

export interface WorkoutSet {
  id: string;
  type: SetType;
  weight: number;
  reps: number;
  completed: boolean;
  previous?: string;
  rpe?: number;
}

export interface ActiveExercise {
  exerciseId: string;
  name: string;
  gifUrl?: string | null;
  notes?: string;
  sets: WorkoutSet[];
}

export interface WorkoutState {
  isActive: boolean;
  startTime: string | null;
  exercises: ActiveExercise[];
  startWorkout: () => void;
  addExercise: (exercise: { exerciseId: string; name: string; gifUrl?: string | null }) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  toggleSet: (exerciseId: string, setId: string) => void;
  cycleSetType: (exerciseId: string, setId: string) => void;
  updateSet: (exerciseId: string, setId: string, fields: Partial<Omit<WorkoutSet, 'id'>>) => void;
  updateNotes: (exerciseId: string, notes: string) => void;
  endWorkout: () => Promise<void>;
  cancelWorkout: () => void;
}

const generateId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      isActive: false,
      startTime: null,
      exercises: [],
      startWorkout: () => set({ isActive: true, startTime: new Date().toISOString(), exercises: [] }),
      addExercise: (exercise) => set((state) => {
        // Prevent duplicate exercises or append
        if (state.exercises.some((e) => e.exerciseId === exercise.exerciseId)) return state;
        return {
          isActive: true,
          startTime: state.startTime || new Date().toISOString(),
          exercises: [
            ...state.exercises,
            {
              ...exercise,
              notes: "",
              sets: [{ id: generateId(), type: "N", weight: 0, reps: 0, completed: false }]
            }
          ]
        };
      }),
      removeExercise: (exerciseId) => set((state) => ({
        exercises: state.exercises.filter((ex) => ex.exerciseId !== exerciseId)
      })),
      addSet: (exerciseId) => set((state) => ({
        exercises: state.exercises.map((ex) => {
          if (ex.exerciseId !== exerciseId) return ex;
          const lastSet = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                id: generateId(),
                type: "N",
                weight: lastSet ? lastSet.weight : 0,
                reps: lastSet ? lastSet.reps : 0,
                completed: false,
                previous: lastSet ? `${lastSet.weight}kg x ${lastSet.reps}` : undefined
              }
            ]
          };
        })
      })),
      removeSet: (exerciseId, setId) => set((state) => ({
        exercises: state.exercises.map((ex) => {
          if (ex.exerciseId !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.filter((s) => s.id !== setId)
          };
        }).filter((ex) => ex.sets.length > 0)
      })),
      toggleSet: (exerciseId, setId) => set((state) => ({
        exercises: state.exercises.map((ex) => {
          if (ex.exerciseId !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s))
          };
        })
      })),
      cycleSetType: (exerciseId, setId) => set((state) => {
        const types: SetType[] = ["N", "W", "F", "D"];
        return {
          exercises: state.exercises.map((ex) => {
            if (ex.exerciseId !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) => {
                if (s.id !== setId) return s;
                const nextIdx = (types.indexOf(s.type) + 1) % types.length;
                return { ...s, type: types[nextIdx] };
              })
            };
          })
        };
      }),
      updateSet: (exerciseId, setId, fields) => set((state) => ({
        exercises: state.exercises.map((ex) => {
          if (ex.exerciseId !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...fields } : s))
          };
        })
      })),
      updateNotes: (exerciseId, notes) => set((state) => ({
        exercises: state.exercises.map((ex) => (ex.exerciseId === exerciseId ? { ...ex, notes } : ex))
      })),
      endWorkout: async () => {
        set({ isActive: false, startTime: null, exercises: [] });
      },
      cancelWorkout: () => set({ isActive: false, startTime: null, exercises: [] })
    }),
    {
      name: 'hypertrofia-active-session',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
