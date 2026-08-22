"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Dumbbell,
  Copy,
  GripVertical,
  Clock,
  LayoutList,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Share2,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/data";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { ExercisePicker } from "@/components/exercise-picker";
import { toast } from "@/components/ui/toast";
import { ROUTINE_TEMPLATES } from "@/lib/templates";
import { cn } from "@/lib/utils";

type RoutineEx = {
  id: string;
  exercise_id: string | null;
  order_index: number;
  target_sets: number;
  target_reps: string;
  rest_sec: number;
  group_name: string | null;
  is_superset: boolean;
  color: string | null;
  exercise: { name: string; muscle_group: string | null; gif_url: string | null } | null;
};

type Routine = {
  id: string;
  name: string;
  description: string | null;
  is_template: boolean;
  updated_at: string;
  routine_exercises: RoutineEx[];
};

type DraftEx = {
  key: string;
  exerciseId: string | null;
  name: string;
  gifUrl: string | null;
  sets: number;
  reps: string;
  rest: number;
  groupName: string | null;
  isSuperset: boolean;
  color: string | null;
};

function DraftRow({
  ex,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  ex: DraftEx;
  index: number;
  total: number;
  onChange: (patch: Partial<DraftEx>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3">
      <div className="flex items-center gap-2.5">
        <GripVertical className="size-4 shrink-0 text-[var(--muted)]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{ex.name}</p>
          <p className="text-xs text-[var(--muted)]">
            {ex.sets} × {ex.reps} · {ex.rest}s descanso
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:text-[var(--text)] disabled:opacity-30"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:text-[var(--text)] disabled:opacity-30"
          >
            <ChevronDown className="size-4" />
          </button>
          <button
            onClick={onRemove}
            className="rounded-lg p-1.5 text-[var(--danger)]/70 transition-colors hover:text-[var(--danger)]"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pl-6.5">
        <Field label="Series">
          <Input
            type="number"
            min={1}
            max={20}
            value={ex.sets}
            onChange={(e) => onChange({ sets: Number(e.target.value) })}
          />
        </Field>
        <Field label="Reps">
          <Input
            value={ex.reps}
            onChange={(e) => onChange({ reps: e.target.value })}
            placeholder="8-12"
          />
        </Field>
        <Field label="Descanso (s)">
          <Select
            value={ex.rest}
            onChange={(e) => onChange({ rest: Number(e.target.value) })}
          >
            {[30, 45, 60, 90, 120, 150, 180].map((r) => (
              <option key={r} value={r}>
                {r}s
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </div>
  );
}

function RoutineEditor({
  routine,
  onClose,
  onSaved,
}: {
  routine?: Routine | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(routine?.name ?? "");
  const [description, setDescription] = useState(routine?.description ?? "");
  const [drafts, setDrafts] = useState<DraftEx[]>(
    routine?.routine_exercises?.map((e) => ({
      key: crypto.randomUUID(),
      exerciseId: e.exercise_id,
      name: e.exercise?.name ?? "",
      gifUrl: e.exercise?.gif_url ?? null,
      sets: e.target_sets,
      reps: e.target_reps,
      rest: e.rest_sec,
      groupName: e.group_name,
      isSuperset: e.is_superset,
      color: e.color,
    })) ?? []
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function addExercise(ex: { id: string; name: string; gifUrl: string | null }) {
    if (drafts.some((d) => d.exerciseId === ex.id)) {
      toast("warning", "Ese ejercicio ya está en la rutina");
      return;
    }
    setDrafts((d) => [
      ...d,
      {
        key: crypto.randomUUID(),
        exerciseId: ex.id,
        name: ex.name,
        gifUrl: ex.gifUrl,
        sets: 3,
        reps: "8-12",
        rest: 90,
        groupName: null,
        isSuperset: false,
        color: null,
      },
    ]);
    setPickerOpen(false);
  }

  async function save() {
    if (!name.trim()) {
      toast("warning", "Poné un nombre a la rutina");
      return;
    }
    if (!drafts.length) {
      toast("warning", "Agregá al menos un ejercicio");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sin sesión");

      let routineId = routine?.id ?? null;

      if (routineId) {
        const { error: er } = await supabase
          .from("routines")
          .update({ name: name.trim(), description: description.trim() || null })
          .eq("id", routineId);
        if (er) throw er;

        // Upsert de ejercicios preservando order_index, group_name, is_superset, color
        // Primero obtener existentes para mapear por exercise_id+order_index
        const { data: existingEx } = await supabase
          .from("routine_exercises")
          .select("id, exercise_id, order_index")
          .eq("routine_id", routineId);

        const existingMap = new Map<string, string>();
        for (const ex of existingEx ?? []) {
          existingMap.set(`${ex.exercise_id}:${ex.order_index}`, ex.id);
        }

const upserts = drafts.map((d, i) => {
          const existingKey = `${d.exerciseId}:${i}`;
          const existingId = existingMap.get(existingKey);
          return {
            id: existingId,
            routine_id: routineId!,
            exercise_id: d.exerciseId,
            order_index: i,
            target_sets: d.sets,
            target_reps: d.reps,
            rest_sec: d.rest,
            group_name: d.groupName,
            is_superset: d.isSuperset,
            color: d.color,
          };
        });

        // Para los existentes que ya no están en drafts, borrar
        const newKeys = new Set(drafts.map((d, i) => `${d.exerciseId}:${i}`));
        const toDelete = (existingEx ?? [])
          .filter((ex) => !newKeys.has(`${ex.exercise_id}:${ex.order_index}`))
          .map((ex) => ex.id);
        if (toDelete.length > 0) {
          const { error: ed } = await supabase
            .from("routine_exercises")
            .delete()
            .in("id", toDelete);
          if (ed) throw ed;
        }

        const { error: ei } = await supabase
          .from("routine_exercises")
          .upsert(upserts, { onConflict: "id" });
        if (ei) throw ei;
      } else {
        const { data: r, error: er } = await supabase
          .from("routines")
          .insert({ name: name.trim(), description: description.trim() || null, user_id: user.id })
          .select("id")
          .single();
        if (er) throw er;
        routineId = r.id;

        const rows = drafts.map((d, i) => ({
          routine_id: routineId!,
          exercise_id: d.exerciseId,
          order_index: i,
          target_sets: d.sets,
          target_reps: d.reps,
          rest_sec: d.rest,
          group_name: d.groupName,
          is_superset: d.isSuperset,
          color: d.color,
        }));
        const { error: ei } = await supabase.from("routine_exercises").insert(rows);
        if (ei) throw ei;
      }

      qc.invalidateQueries({ queryKey: ["routines"] });
      toast("success", routine ? "Rutina actualizada" : "Rutina creada");
      onSaved();
      onClose();
    } catch (err) {
      toast("error", "No se pudo guardar", (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        title={routine ? "Editar rutina" : "Nueva rutina"}
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={save} loading={saving}>
              Guardar rutina
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nombre">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Push A"
              autoFocus
            />
          </Field>
          <Field label="Descripción (opcional)">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas para vos o tus alumnos…"
            />
          </Field>

          <div className="flex flex-col gap-2.5">
            {drafts.map((d, i) => (
              <DraftRow
                key={d.key}
                ex={d}
                index={i}
                total={drafts.length}
                onChange={(patch) =>
                  setDrafts((arr) =>
                    arr.map((x) => (x.key === d.key ? { ...x, ...patch } : x))
                  )
                }
                onRemove={() =>
                  setDrafts((arr) => arr.filter((x) => x.key !== d.key))
                }
                onMove={(dir) =>
                  setDrafts((arr) => {
                    const j = i + dir;
                    if (j < 0 || j >= arr.length) return arr;
                    const copy = [...arr];
                    [copy[i], copy[j]] = [copy[j], copy[i]];
                    return copy;
                  })
                }
              />
            ))}
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] py-4 text-sm font-semibold text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <Plus className="size-4.5" />
              Agregar ejercicio
            </button>
          </div>
        </div>
      </Dialog>
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addExercise}
        onRemove={(exerciseId) => {
          setDrafts((d) => d.filter((x) => x.exerciseId !== exerciseId));
        }}
        selectedIds={drafts.map((d) => d.exerciseId).filter(Boolean) as string[]}
      />
    </>
  );
}

export default function RutinasPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState<"mine" | "library">("mine");
  const [editing, setEditing] = useState<Routine | null | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<Routine | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["routines"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [] as Routine[];
      const { data } = await supabase
        .from("routines")
        .select(
          "id, name, description, is_template, updated_at, routine_exercises(id, exercise_id, order_index, target_sets, target_reps, rest_sec, group_name, is_superset, color, exercise:exercises(id, name, muscle_group, gif_url))"
        )
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      return (data ?? []) as unknown as Routine[];
    },
  });

  async function duplicateTemplate(template: (typeof ROUTINE_TEMPLATES)[number]) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sin sesión");

      const { data: exercises } = await supabase
        .from("exercises")
        .select("id, name")
        .in("name", template.exercises.map((e) => e.name));

      const byName = new Map((exercises ?? []).map((e) => [e.name, e.id]));

      const { data: routine, error: er } = await supabase
        .from("routines")
        .insert({
          name: template.name,
          description: template.description,
          user_id: user.id,
          is_template: false,
        })
        .select("id")
        .single();
      if (er) throw er;

      const rows = template.exercises.map((e, i) => ({
        routine_id: routine.id,
        exercise_id: byName.get(e.name) ?? null,
        order_index: i,
        target_sets: e.sets,
        target_reps: e.reps,
        rest_sec: e.rest,
      }));
      const unmatched = template.exercises.filter((e) => !byName.has(e.name));
      const { error: ei } = await supabase.from("routine_exercises").insert(rows);
      if (ei) throw ei;

      qc.invalidateQueries({ queryKey: ["routines"] });
      if (unmatched.length > 0) {
        toast("warning", "Algunos ejercicios no se encontraron en la BD", `${unmatched.map((e) => e.name).join(", ")} se agregaron sin video/músculo`);
      } else {
        toast("success", "Plantilla agregada", `${template.name} está en tus rutinas`);
      }
      router.push(`/entrenar?routine=${routine.id}`);
    } catch (err) {
      toast("error", "No se pudo agregar la plantilla", (err as Error).message);
    }
  }

  async function remove(routine: Routine) {
    setDeleteConfirm(routine);
  }

  async function confirmRemove() {
    if (!deleteConfirm) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("routines").delete().eq("id", deleteConfirm.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["routines"] });
      toast("success", "Rutina eliminada");
    } catch (err) {
      toast("error", "No se pudo eliminar", (err as Error).message);
    } finally {
      setDeleteConfirm(null);
    }
  }

  const mine = data?.filter((r) => !r.is_template) ?? [];
  const templates = data?.filter((r) => r.is_template) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Rutinas</h1>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            {mine.length} rutinas · {ROUTINE_TEMPLATES.length} plantillas en la biblioteca
          </p>
        </div>
        <Button onClick={() => setEditing(null)}>
          <Plus className="size-4" />
          Nueva
        </Button>
      </div>

      <div className="flex gap-1.5">
        {[
          { id: "mine" as const, label: "Mis rutinas", icon: <LayoutList className="size-4" /> },
          { id: "library" as const, label: "Biblioteca", icon: <BookOpen className="size-4" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all",
              tab === t.id
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : tab === "mine" ? (
        mine.length ? (
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {mine.map((r) => {
              const groups = new Map<string, number>();
              r.routine_exercises.forEach((e) => {
                const m = e.exercise?.muscle_group ?? "Otro";
                groups.set(m, (groups.get(m) ?? 0) + 1);
              });
              const totalSets = r.routine_exercises.reduce(
                (a, e) => a + e.target_sets,
                0
              );
              return (
                <Card key={r.id} className="card-hover flex min-w-0 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg font-bold tracking-tight">
                        {r.name}
                      </h3>
                      {r.description && (
                        <p className="mt-0.5 line-clamp-2 text-sm text-[var(--text-2)]">
                          {r.description}
                        </p>
                      )}
                    </div>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">
                      <Clock className="size-3" />
                      {Math.round(
                        r.routine_exercises.reduce(
                          (a, e) => a + (e.rest_sec * e.target_sets + 40 * e.target_sets),
                          0
                        ) / 60
                      )}{" "}
                      min
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[...groups.entries()].map(([m, n]) => (
                      <span
                        key={m}
                        className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent)]"
                      >
                        {m} ×{n}
                      </span>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-[var(--muted)]">
                    {r.routine_exercises.length} ejercicios · {totalSets} series
                  </p>

                  <div className="mt-4 flex min-w-0 gap-2">
                    <Link href={`/entrenar?routine=${r.id}`} className="min-w-0 flex-1">
                      <Button variant="accent" className="w-full" size="sm">
                        <Play className="size-4" />
                        Entrenar
                      </Button>
                    </Link>
                    <Link href="/social" aria-label="Compartir rutina">
                      <Button variant="ghost" size="sm">
                        <Share2 className="size-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--danger)]/70 hover:text-[var(--danger)]"
                      onClick={() => remove(r)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Dumbbell className="size-6" />}
            title="Todavía no tenés rutinas"
            description="Creá una desde cero o tomá una plantilla de la biblioteca."
            action={
              <Button onClick={() => setTab("library")}>
                Ver biblioteca <BookOpen className="size-4" />
              </Button>
            }
          />
        )
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          {ROUTINE_TEMPLATES.map((t) => (
            <Card key={t.id} className="card-hover flex min-w-0 flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold tracking-tight">
                    {t.name}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-sm text-[var(--text-2)]">
                    {t.description}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                  {t.level}
                </span>
                <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                  {t.daysPerWeek} días/semana
                </span>
                <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                  ~{t.durationMin} min
                </span>
              </div>
              <p className="mt-3 text-xs text-[var(--muted)]">
                {t.exercises.length} ejercicios ·{" "}
                {t.exercises.reduce((a, e) => a + e.sets, 0)} series totales
              </p>
              <Button
                className="mt-4"
                variant="accent"
                size="sm"
                onClick={() => duplicateTemplate(t)}
              >
                <Copy className="size-4" />
                Usar plantilla
              </Button>
            </Card>
          ))}
          {templates.length > 0 && (
            <p className="col-span-full text-center text-xs text-[var(--muted)]">
              Plantillas que ya agregaste: {templates.length}
            </p>
          )}
        </div>
      )}

      {editing !== undefined && (
        <RoutineEditor
          routine={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["routines"] })}
        />
      )}

      {deleteConfirm && (
        <Dialog
          open
          onClose={() => setDeleteConfirm(null)}
          title="Eliminar rutina"
        >
          <div className="flex flex-col gap-3">
            <AlertCircle className="size-10 text-[var(--danger)] mx-auto" />
            <p className="text-center text-sm text-[var(--text-2)]">
              ¿Eliminar <strong>&laquo;{deleteConfirm.name}&raquo;</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="flex-1">
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmRemove} className="flex-1">
                <Trash2 className="size-4" /> Eliminar
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}