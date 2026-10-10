"use client";

/**
 * Página de rutinas.
 * Lista las rutinas propias y la biblioteca de plantillas, permite crear/editar
 * rutinas (INSERT/UPDATE en `routines` + `routine_exercises`), duplicar plantillas,
 * compartir, eliminar y lanzar un entrenamiento con una rutina concreta.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, PencilSimple as Pencil, Trash as Trash2, Play, Barbell as Dumbbell, Copy, DotsSixVertical as GripVertical, Clock, ListDashes as LayoutList, BookOpen, CaretUp as ChevronUp, CaretDown as ChevronDown, ShareNetwork as Share2, Info as AlertCircle, Users } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/data";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { ExercisePicker } from "@/components/exercise-picker";
import { toast } from "@/components/ui/toast";
import { ROUTINE_TEMPLATES } from "@/lib/templates";
import { EntrenadoresView } from "../entrenadores/page";
import { cn } from "@/lib/utils";

type RoutineEx = {
  id: string;
  exercise_id: string | null;
  order_index: number;
  target_sets: number;
  target_reps: string;
  rest_sec: number;
  target_weight_kg: number | null;
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
  days_per_week: number;  // Cuántos días por semana (1-7)
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
  weight: number;
  groupName: string | null;
  isSuperset: boolean;
  color: string | null;
};

/**
 * Fila editable de un ejercicio en el borrador de rutina.
 * Permite ajustar series, reps y descanso, reordenar (↑/↓) y eliminar.
 */
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
            {ex.sets} × {ex.reps}
            {ex.weight > 0 ? ` · ${ex.weight} kg` : ""} · {ex.rest}s descanso
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
      <div className="grid grid-cols-2 gap-2 pl-6.5 sm:grid-cols-4">
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
        <Field label="Peso (kg)">
          <Input
            type="number"
            min={0}
            step="0.5"
            value={ex.weight}
            onChange={(e) => onChange({ weight: Number(e.target.value) })}
            placeholder="0"
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

/**
 * Editor de rutina (alta y edición) dentro de un Dialog.
 * Mantiene el borrador local de ejercicios y persiste en Supabase al guardar.
 */
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
  // Borrador editable: nombre, descripción, lista de ejercicios y estado de UI.
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
      weight: e.target_weight_kg ?? 0,
      groupName: e.group_name,
      isSuperset: e.is_superset,
      color: e.color,
    })) ?? []
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Agrega un ejercicio al borrador evitando duplicados y cierra el selector.
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
        weight: 0,
        groupName: null,
        isSuperset: false,
        color: null,
      },
    ]);
    setPickerOpen(false);
  }

  // Persiste la rutina: valida, separa alta vs edición y sincroniza los ejercicios.
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

      // Persistencia atómica vía RPC: crea/actualiza la rutina y reemplaza sus
      // ejercicios (incluido el peso objetivo) en una sola transacción.
      const payload = {
        id: routine?.id ?? null,
        name: name.trim(),
        description: description.trim() || null,
        exercises: drafts.map((d, i) => ({
          exercise_id: d.exerciseId,
          order_index: i,
          target_sets: d.sets,
          target_reps: d.reps,
          rest_sec: d.rest,
          target_weight_kg: d.weight > 0 ? d.weight : null,
          group_name: d.groupName,
          color: d.color,
          is_superset: d.isSuperset,
        })),
      };
      const { error } = await supabase.rpc("save_routine", { p_routine: payload });
      if (error) throw error;

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

/**
 * Vista principal de rutinas: pestañas "Mis rutinas" / "Biblioteca",
 * carga de rutinas del usuario, duplicado de plantillas y borrado con confirmación.
 */
export default function RutinasPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState<"mine" | "library" | "coach">("mine");

  // Links de invitación (?invite=CODE) abren directo en la pestaña Entrenador.
  // Se aplica en el siguiente frame para no encadenar renders sincrónicos.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (!p.get("invite")) return;
    const id = requestAnimationFrame(() => setTab("coach"));
    return () => cancelAnimationFrame(id);
  }, []);
  // `undefined` = cerrado, `null` = nueva rutina, objeto = edición.
  const [editing, setEditing] = useState<Routine | null | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<Routine | null>(null);

  // Carga las rutinas del usuario con sus ejercicios y datos del ejercicio asociado.
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
          "id, name, description, is_template, updated_at, routine_exercises(id, exercise_id, order_index, target_sets, target_reps, rest_sec, target_weight_kg, group_name, is_superset, color, exercise:exercises(id, name, muscle_group, gif_url))"
        )
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      return (data ?? []) as unknown as Routine[];
    },
  });

  // Duplica una plantilla de la biblioteca: crea la rutina y sus ejercicios,
  // mapeando cada nombre de ejercicio a un id real de la tabla `exercises`.
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

  // Abre el diálogo de confirmación de borrado.
  async function remove(routine: Routine) {
    setDeleteConfirm(routine);
  }

  // Elimina definitivamente la rutina seleccionada y refresca la lista.
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

  // Separación de rutinas propias vs. plantillas guardadas.
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

      {/* Pestañas segmentadas: mis rutinas / biblioteca / entrenador */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-1">
        {[
          { id: "mine" as const, label: "Mis rutinas", icon: <LayoutList className="size-4" /> },
          { id: "library" as const, label: "Biblioteca", icon: <BookOpen className="size-4" /> },
          { id: "coach" as const, label: "Entrenador", icon: <Users className="size-4" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl border border-transparent px-1.5 py-2 text-[13px] font-semibold transition-all",
              tab === t.id
                ? "bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-sm)]"
                : "text-[var(--muted)] hover:text-[var(--text-2)]"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "coach" ? (
        <EntrenadoresView embedded />
      ) : isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : tab === "mine" ? (
        mine.length ? (
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {mine.map((r) => {
              // Agrupa los ejercicios por grupo muscular para mostrar los chips.
              const groups = new Map<string, number>();
              r.routine_exercises.forEach((e) => {
                const m = e.exercise?.muscle_group ?? "Otro";
                groups.set(m, (groups.get(m) ?? 0) + 1);
              });
              // Total de series y estimación de duración (descanso + ~40 s de trabajo por serie).
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
                    {/* Compartir por Web Share API o copiar link al portapapeles */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/entrenar?routine=${r.id}`;
                        const text = `Rutina: ${r.name}\n${url}`;
                        if (navigator.share) {
                          navigator.share({ title: r.name, text })
                            .then(() => toast("success", "Compartido", "Rutina compartida"))
                            .catch(() => navigator.clipboard.writeText(text).then(() => toast("success", "Link copiado", "Link copiado al portapapeles")));
                        } else {
                          navigator.clipboard.writeText(text).then(() => toast("success", "Link copiado", "Link copiado al portapapeles"));
                        }
                      }}
                      aria-label="Compartir rutina"
                    >
                      <Share2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/entrenar?routine=${r.id}`)}
                      aria-label="Copiar link de la rutina"
                    >
                      <Copy className="size-4" />
                    </Button>

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
          {/* Tarjetas de plantillas predefinidas de la biblioteca */}
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

      {/* Editor de rutina (nueva o existente) */}
      {editing !== undefined && (
        <RoutineEditor
          routine={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["routines"] })}
        />
      )}

      {/* Diálogo de confirmación para eliminar una rutina */}
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