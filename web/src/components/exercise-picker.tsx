"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ExerciseMedia } from "@/components/exercise-media";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/primitives";

type ExerciseRow = {
  id: string;
  name: string;
  muscle_group: string | null;
  primary_muscle: string | null;
  equipment: string | null;
  gif_url: string | null;
};

const MUSCLES = [
  "Todos",
  "Pecho",
  "Espalda",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Abdomen",
  "Cuádriceps",
  "Isquiotibiales",
  "Glúteos",
  "Pantorrillas",
  "Antebrazo",
];

export function ExercisePicker({
  open,
  onClose,
  onPick,
  selectedIds,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: {
    id: string;
    name: string;
    gifUrl: string | null;
    muscleGroup: string | null;
  }) => void;
  selectedIds: string[];
}) {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("Todos");
  const [hovered, setHovered] = useState<string | null>(null);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("exercises")
        .select("id, name, muscle_group, primary_muscle, gif_url, instructions, equipment")
        .order("name");
      return data ?? [];
    },
    staleTime: Infinity,
  });

  const filtered = useMemo(() => {
    if (!exercises) return [];
    const q = search.toLowerCase().trim();
    return exercises.filter(
      (e: ExerciseRow) =>
        (muscle === "Todos" || e.primary_muscle === muscle || e.muscle_group === muscle) &&
        (!q ||
          e.name.toLowerCase().includes(q) ||
          (e.primary_muscle ?? "").toLowerCase().includes(q) ||
          (e.muscle_group ?? "").toLowerCase().includes(q) ||
          (e.equipment ?? "").toLowerCase().includes(q))
    );
  }, [exercises, search, muscle]);

  return (
    <Dialog open={open} onClose={onClose} title="Agregar ejercicio" size="full">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ejercicio o músculo…"
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {MUSCLES.map((m) => (
            <button
              key={m}
              onClick={() => setMuscle(m)}
              className={cn(
                "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                muscle === m
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
              )}
            >
              {m}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((e: ExerciseRow) => {
              const selected = selectedIds.includes(e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => {
                    onPick({
                      id: e.id,
                      name: e.name,
                      gifUrl: e.gif_url,
                      muscleGroup: e.muscle_group,
                    });
                    setSearch("");
                    setMuscle("Todos");
                  }}
                  onMouseEnter={() => setHovered(e.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border text-left transition-all",
                    selected
                      ? "border-[var(--accent)] ring-2 ring-[var(--accent-soft)]"
                      : "border-[var(--border)] hover:border-[var(--accent)]"
                  )}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--surface-2)]">
                    <ExerciseMedia url={e.gif_url} alt={e.name} className="object-cover" />
                    {selected && (
                      <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-[var(--accent-ink)]">
                        <X className="size-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="line-clamp-1 text-[13px] font-semibold leading-tight">
                      {e.name}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--muted)]">
                      {e.primary_muscle ?? e.muscle_group}
                      {e.equipment ? ` · ${e.equipment}` : ""}
                    </p>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-[var(--muted)]">
                Sin resultados para «{search}»
              </p>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}