"use client";

import { useMemo, useState } from "react";
import { Search, X, SlidersHorizontal, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ExerciseMedia } from "@/components/exercise-media";
import { cn, vibrate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/primitives";

type ExerciseRow = {
  id: string;
  name: string;
  muscle_group: string | null;
  primary_muscle: string | null;
  equipment: string | null;
  gif_url: string | null;
};

export function ExercisePicker({
  open,
  onClose,
  onPick,
  onRemove,
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
  onRemove?: (exerciseId: string) => void;
  selectedIds: string[];
}) {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [muscleOpen, setMuscleOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

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

  const muscles = useMemo(() => {
    const s = new Set<string>();
    (exercises ?? []).forEach((e) => {
      if (e.muscle_group) s.add(e.muscle_group);
    });
    return [...s].sort();
  }, [exercises]);

  const equipments = useMemo(() => {
    const s = new Set<string>();
    (exercises ?? []).forEach((e) => {
      if (e.equipment) s.add(e.equipment);
    });
    return [...s].sort();
  }, [exercises]);

  const filtered = useMemo(() => {
    if (!exercises) return [];
    const q = search.toLowerCase().trim();
    return exercises.filter((e: ExerciseRow) => {
      if (muscle && e.muscle_group !== muscle && e.primary_muscle !== muscle) return false;
      if (equipment && e.equipment !== equipment) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        (e.primary_muscle ?? "").toLowerCase().includes(q) ||
        (e.muscle_group ?? "").toLowerCase().includes(q) ||
        (e.equipment ?? "").toLowerCase().includes(q)
      );
    });
  }, [exercises, search, muscle, equipment]);

  // Helpers para cerrar filtros
  const allFiltersActive = muscle || equipment;

  return (
    <Dialog open={open} onClose={onClose} title="Agregar ejercicio" size="full">
      <div className="flex flex-col gap-4">
        {/* Barra de búsqueda — truncate + min-w-0 para que el texto no desborde */}
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, músculo o equipo…"
            className="h-11 min-w-0 truncate rounded-2xl pl-10 pr-4 text-sm shadow-sm"
            autoFocus
          />
        </div>

        {/* Filtros colapsados: dos botones como en la biblioteca principal */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              vibrate(4);
              setMuscleOpen(true);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all active:scale-[0.98]",
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
              "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all active:scale-[0.98]",
              equipment
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_2px_8px_-2px_var(--accent-soft)]"
                : "border-[var(--border)] bg-[var(--surface-2)]/60 text-[var(--text-2)] hover:border-[var(--accent)]/40 hover:text-[var(--text)]"
            )}
          >
            <Wrench className="size-3.5" />
            {equipment ? `Equipo: ${equipment}` : "Filtrar por equipo"}
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
          {allFiltersActive && (
            <button
              onClick={() => {
                setMuscle(null);
                setEquipment(null);
              }}
              className="text-xs font-semibold text-[var(--muted)] underline-offset-2 hover:text-[var(--text)] hover:underline"
            >
              Limpiar
            </button>
          )}
          <span className="ml-auto text-xs tabular-nums text-[var(--muted)]">
            {isLoading ? "…" : `${filtered.length} ejercicios`}
          </span>
        </div>

        {/* Dialogs de selección de filtro */}
        <Dialog open={muscleOpen} onClose={() => setMuscleOpen(false)} title="Músculo" size="sm">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setMuscle(null);
                setMuscleOpen(false);
              }}
              className={cn(
                "rounded-full border px-3.5 py-2 text-xs font-bold transition-all",
                !muscle
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "border-[var(--border)] text-[var(--text-2)]"
              )}
            >
              Todos
            </button>
            {muscles.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMuscle(m);
                  setMuscleOpen(false);
                }}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-xs font-bold transition-all",
                  muscle === m
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "border-[var(--border)] text-[var(--text-2)]"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </Dialog>
        <Dialog open={equipmentOpen} onClose={() => setEquipmentOpen(false)} title="Equipamiento" size="sm">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setEquipment(null);
                setEquipmentOpen(false);
              }}
              className={cn(
                "rounded-full border px-3.5 py-2 text-xs font-bold transition-all",
                !equipment
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "border-[var(--border)] text-[var(--text-2)]"
              )}
            >
              Todos
            </button>
            {equipments.map((eq) => (
              <button
                key={eq}
                onClick={() => {
                  setEquipment(eq);
                  setEquipmentOpen(false);
                }}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-xs font-bold transition-all",
                  equipment === eq
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "border-[var(--border)] text-[var(--text-2)]"
                )}
              >
                {eq}
              </button>
            ))}
          </div>
        </Dialog>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-32 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((e: ExerciseRow, idx: number) => {
              const selected = selectedIds.includes(e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => {
                    vibrate(selected ? 6 : 8);
                    if (selected) {
                      onRemove?.(e.id);
                    } else {
                      onPick({
                        id: e.id,
                        name: e.name,
                        gifUrl: e.gif_url,
                        muscleGroup: e.muscle_group,
                      });
                    }
                  }}
                  style={{ animationDelay: `${idx * 18}ms` } as React.CSSProperties}
                  className={cn(
                    "group relative animate-[fade-up_0.35s_cubic-bezier(0.16,1,0.3,1)_both] overflow-hidden rounded-2xl border text-left will-change-[transform,box-shadow]",
                    "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] active:scale-[0.98] active:transition-none",
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]/30 ring-2 ring-[var(--accent-soft)]"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/40"
                  )}
                >
                  {/* Borde superior accent al hover */}
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[var(--accent)] transition-opacity duration-200",
                      selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                  />
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--surface-2)]">
                    <ExerciseMedia url={e.gif_url} alt={e.name} />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    {selected && (
                      <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-sm ring-2 ring-white/40">
                        <X className="size-3.5" />
                      </span>
                    )}
                    {/* Badge músculo */}
                    <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white backdrop-blur">
                      {e.primary_muscle ?? e.muscle_group ?? "—"}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="line-clamp-1 text-[13px] font-semibold leading-tight tracking-tight">
                      {e.name}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--muted)]">
                      {e.equipment ?? "—"}
                    </p>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-[var(--muted)]">
                Sin resultados para «{search}»{allFiltersActive ? " con esos filtros" : ""}
              </p>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}