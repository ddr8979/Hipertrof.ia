import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  rpe?: number;
}

export interface ActiveExercise {
  exerciseId: string;
  name: string;
  sets: WorkoutSet[];
}

export interface WorkoutState {
  isActive: boolean;
  startTime: string | null;
  exercises: ActiveExercise[];
  startWorkout: () => void;
  addExercise: (exercise: Omit<ActiveExercise, 'sets'>) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  toggleSet: (exerciseId: string, setId: string) => void;
  updateSet: (exerciseId: string, setId: string, fields: Partial<Omit<WorkoutSet, 'id'>>) => void;
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
      addExercise: (exercise) => set((state) => ({
        exercises: [...state.exercises, { ...exercise, sets: [{ id: generateId(), weight: 0, reps: 0, completed: false }] }]
      })),
      removeExercise: (exerciseId) => set((state) => ({
        exercises: state.exercises.filter((ex) => ex.exerciseId !== exerciseId)
      })),
      addSet: (exerciseId) => set((state) => ({
        exercises: state.exercises.map((ex) => {
          if (ex.exerciseId !== exerciseId) return ex;
          const lastSet = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [...ex.sets, {
              id: generateId(),
              weight: lastSet ? lastSet.weight : 0,
              reps: lastSet ? lastSet.reps : 0,
              completed: false
            }]
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
      updateSet: (exerciseId, setId, fields) => set((state) => ({
        exercises: state.exercises.map((ex) => {
          if (ex.exerciseId !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...fields } : s))
          };
        })
      })),
      endWorkout: async () => {
        // Enviar payload al backend en el futuro
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
