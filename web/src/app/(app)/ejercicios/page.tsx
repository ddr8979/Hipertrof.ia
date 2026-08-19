"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dumbbell, Search, X, SlidersHorizontal, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ExerciseMedia } from "@/components/exercise-media";
import { vibrate, cn } from "@/lib/utils";

type Exercise = {
  id: string;
  name: string;
  muscle_group: string | null;
  primary_muscle: string | null;
  equipment: string | null;
  gif_url: string | null;
  instructions: string | null;
};

export default function EjerciciosPage() {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [muscleOpen, setMuscleOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ["exercise_library"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, muscle_group, primary_muscle, equipment, gif_url, instructions")
        .order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as Exercise[];
    },
  });

  const muscles = useMemo(() => {
    const set = new Set<string>();
    (exercises ?? []).forEach((e) => {
      if (e.muscle_group) set.add(e.muscle_group);
    });
    return [...set].sort();
  }, [exercises]);

  const equipments = useMemo(() => {
    const set = new Set<string>();
    (exercises ?? []).forEach((e) => {
      if (e.equipment) set.add(e.equipment);
    });
    return [...set].sort();
  }, [exercises]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = (exercises ?? []).filter((e) => {
      if (muscle && e.muscle_group !== muscle) return false;
      if (equipment && e.equipment !== equipment) return false;
      if (!query) return true;
      return (
        e.name.toLowerCase().includes(query) ||
        (e.primary_muscle ?? "").toLowerCase().includes(query) ||
        (e.muscle_group ?? "").toLowerCase().includes(query) ||
        (e.equipment ?? "").toLowerCase().includes(query)
      );
    });
    const groups = new Map<string, Exercise[]>();
    for (const e of list) {
      const key = e.muscle_group ?? "Otros";
      groups.set(key, [...(groups.get(key) ?? []), e]);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [exercises, q, muscle, equipment]);

  const activeCount = (muscle ? 1 : 0) + (equipment ? 1 : 0);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col items-center gap-1.5 pb-1 text-center">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Dumbbell className="size-5" />
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Biblioteca de ejercicios
        </h1>
        <p className="text-xs text-[var(--text-2)]">
          {exercises?.length ?? "…"} ejercicios con demostración en video y técnica explicada
        </p>
      </header>

      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar ejercicios…"
          className="h-11 rounded-2xl pl-10 text-sm shadow-sm"
        />
      </div>

      <div className="flex w-full flex-wrap items-center gap-2">
        <button
          onClick={() => {
            vibrate(4);
            setMuscleOpen(true);
          }}
          className={cn(
            "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all",
            muscle
              ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_2px_8px_-2px_var(--accent-soft)]"
              : "border-[var(--border)] bg-[var(--surface-2)]/60 text-[var(--text-2)] hover:border-[var(--accent)]/40 hover:text-[var(--text)]"
          )}
        >
          <SlidersHorizontal className="size-3.5" />
          {muscle ? `Músculo: ${muscle}` : "Filtrar por músculo"}
          {muscle && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setMuscle(null);
              }}
              className="ml-0.5 rounded-full bg-[var(--accent-ink)]/15 p-0.5"
            >
              <X className="size-3" />
            </span>
          )}
        </button>
        <button
          onClick={() => {
            vibrate(4);
            setEquipmentOpen(true);
          }}
          className={cn(
            "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all",
            equipment
              ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_2px_8px_-2px_var(--accent-soft)]"
              : "border-[var(--border)] bg-[var(--surface-2)]/60 text-[var(--text-2)] hover:border-[var(--accent)]/40 hover:text-[var(--text)]"
          )}
        >
          <Wrench className="size-3.5" />
          {equipment ? `Equipo: ${equipment}` : "Filtrar por equipamiento"}
          {equipment && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setEquipment(null);
              }}
              className="ml-0.5 rounded-full bg-[var(--accent-ink)]/15 p-0.5"
            >
              <X className="size-3" />
            </span>
          )}
        </button>
      </div>

      {activeCount > 0 && (
        <button
          onClick={() => {
            setMuscle(null);
            setEquipment(null);
          }}
          className="mx-auto flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-3 py-1 text-[11px] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--text)]"
        >
          <X className="size-3" />
          Limpiar filtros ({activeCount})
        </button>
      )}

      <Dialog
        open={muscleOpen}
        onClose={() => setMuscleOpen(false)}
        title="Filtrar por músculo"
      >
        <div className="flex flex-wrap gap-2">
          {muscles.map((m) => (
            <button
              key={m}
              onClick={() => {
                vibrate(4);
                setMuscle(muscle === m ? null : m);
                setMuscleOpen(false);
              }}
              className={cn(
                "rounded-full border px-3.5 py-2 text-xs font-semibold transition-all",
                muscle === m
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "border-[var(--border)] bg-[var(--surface-2)]/60 text-[var(--text-2)] hover:border-[var(--accent)]/40"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </Dialog>

      <Dialog
        open={equipmentOpen}
        onClose={() => setEquipmentOpen(false)}
        title="Filtrar por equipamiento"
      >
        <div className="flex flex-wrap gap-2">
          {equipments.map((e) => (
            <button
              key={e}
              onClick={() => {
                vibrate(4);
                setEquipment(equipment === e ? null : e);
                setEquipmentOpen(false);
              }}
              className={cn(
                "rounded-full border px-3.5 py-2 text-xs font-semibold transition-all",
                equipment === e
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "border-[var(--border)] bg-[var(--surface-2)]/60 text-[var(--text-2)] hover:border-[var(--accent)]/40"
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </Dialog>

      {isLoading ? (
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm font-semibold text-[var(--text-2)]">
            No hay ejercicios con esos filtros
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Probá con otra búsqueda o limpiá los filtros.
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-7">
          {filtered.map(([group, list]) => (
            <section key={group} className="flex w-full flex-col gap-3">
              <h2 className="flex items-center gap-2 px-1">
                <span className="flex size-6 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Dumbbell className="size-3.5" />
                </span>
                <span className="font-display text-base font-bold tracking-tight">{group}</span>
                <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                  {list.length}
                </span>
              </h2>
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
                {list.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      vibrate(6);
                      setSelected(e);
                    }}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] active:scale-[0.98]"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--surface-3)]">
                      <ExerciseMedia
                        url={e.gif_url}
                        alt={e.name}
                        className="transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                      {e.primary_muscle && (
                        <span className="absolute left-1.5 top-1.5 max-w-[calc(100%-0.75rem)] truncate rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                          {e.primary_muscle}
                        </span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
                      <p className="line-clamp-2 min-h-[2.2em] text-[13px] font-bold leading-snug tracking-tight">
                        {e.name}
                      </p>
                      {e.equipment && (
                        <p className="flex items-center gap-1 text-[11px] font-medium text-[var(--muted)]">
                          <span className="size-1 rounded-full bg-[var(--accent)]/60" />
                          <span className="truncate">{e.equipment}</span>
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
      >
        {selected && (
          <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-3)]">
              <ExerciseMedia url={selected.gif_url} alt={selected.name} eager />
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {[selected.muscle_group, selected.primary_muscle, selected.equipment]
                .filter(Boolean)
                .map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-2)]"
                  >
                    {t}
                  </span>
                ))}
            </div>
            {selected.instructions && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
                <h3 className="mb-2 text-center font-display text-sm font-bold tracking-tight text-[var(--accent)]">
                  Técnica
                </h3>
                <p className="whitespace-pre-wrap text-center text-[13px] leading-relaxed text-[var(--text-2)]">
                  {selected.instructions}
                </p>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}