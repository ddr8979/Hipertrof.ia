"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Check,
  X,
  ClipboardList,
  Plus,
  Dumbbell,
  GraduationCap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/data";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useProfile } from "@/components/providers";

type ClientRow = {
  id: string;
  status: string;
  athlete: { id: string; display_name: string | null; username: string | null } | null;
};

type RoutineRow = {
  id: string;
  name: string;
  user_id: string;
};

type TrainerRow = {
  id: string;
  status: string;
  trainer: { id: string; display_name: string | null; username: string | null } | null;
};

type AssignedRow = {
  id: string;
  routine: { id: string; name: string } | null;
  trainer: { id: string; display_name: string | null } | null;
};

export default function EntrenadoresPage() {
  const profile = useProfile((s) => s.profile);
  const qc = useQueryClient();
  const [assignOpen, setAssignOpen] = useState(false);
  const [athleteId, setAthleteId] = useState("");
  const [routineId, setRoutineId] = useState("");
  const [courseOpen, setCourseOpen] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cPrice, setCPrice] = useState("");

  const isTrainer = profile?.role === "trainer";

  const { data: clients, isLoading } = useQuery({
    queryKey: ["trainer_clients"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("trainer_clients")
        .select("id, status, athlete:profiles!trainer_clients_athlete_id_fkey(id, display_name, username)")
        .eq("trainer_id", profile!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as ClientRow[];
    },
  });

  const { data: myRoutines } = useQuery({
    queryKey: ["my_routines_min"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("routines")
        .select("id, name")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as RoutineRow[];
    },
  });

  const { data: myCourses } = useQuery({
    queryKey: ["my_courses"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("courses")
        .select("id, title, description, price_uyu, status")
        .eq("trainer_id", profile!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as { id: string; title: string; description: string | null; price_uyu: number; status: string }[];
    },
  });

  const { data: myTrainers } = useQuery({
    queryKey: ["my_trainers"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("trainer_clients")
        .select("id, status, trainer:profiles!trainer_clients_trainer_id_fkey(id, display_name, username)")
        .eq("athlete_id", profile!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as TrainerRow[];
    },
  });

  const { data: assigned } = useQuery({
    queryKey: ["assigned_routines"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("assigned_routines")
        .select("id, routine:routines(name), trainer:profiles!assigned_routines_trainer_id_fkey(display_name)")
        .eq("athlete_id", profile!.id);
      return (data ?? []) as unknown as AssignedRow[];
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from("trainer_clients").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainer_clients"] });
      toast("success", "Solicitud actualizada");
    },
    onError: (e) => toast("error", "No se pudo actualizar", e.message),
  });

  const assign = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.from("assigned_routines").insert({
        trainer_id: profile!.id,
        athlete_id: athleteId,
        routine_id: routineId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setAssignOpen(false);
      setAthleteId("");
      setRoutineId("");
      qc.invalidateQueries({ queryKey: ["assigned_routines"] });
      toast("success", "Rutina asignada");
    },
    onError: (e) => toast("error", "No se pudo asignar", e.message),
  });

  const createCourse = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.from("courses").insert({
        trainer_id: profile!.id,
        title: cTitle.trim(),
        description: cDesc.trim() || null,
        price_uyu: Math.max(0, Number(cPrice) || 0),
        status: "draft",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setCourseOpen(false);
      setCTitle("");
      setCDesc("");
      setCPrice("");
      qc.invalidateQueries({ queryKey: ["my_courses"] });
      toast("success", "Curso creado");
    },
    onError: (e) => toast("error", "No se pudo crear", e.message),
  });

  const publishCourse = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from("courses").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my_courses"] });
      toast("success", "Estado actualizado");
    },
    onError: (e) => toast("error", "No se pudo actualizar", e.message),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Entrenadores</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">
          {isTrainer ? "Panel de entrenador: alumnos, rutinas y cursos" : "Tus entrenadores y rutinas asignadas"}
        </p>
      </div>

      {isTrainer ? (
        <>
          {/* Alumnos */}
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-[var(--accent)]" />
                <h2 className="font-display text-lg font-bold tracking-tight">Mis alumnos</h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
                <ClipboardList className="size-4" /> Asignar rutina
              </Button>
            </div>
            {(clients ?? []).length === 0 ? (
              <EmptyState
                icon={<Users className="size-6" />}
                title="Todavía no tenés alumnos"
                description="Cuando un atleta te agregue como entrenador, aparece acá."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {clients?.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5"
                  >
                    <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--surface-3)] font-display font-bold">
                      {(c.athlete?.display_name ?? "?")[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {c.athlete?.display_name ?? "Atleta"}
                        {c.athlete?.username && (
                          <span className="ml-1 text-xs text-[var(--muted)]">
                            @{c.athlete.username}
                          </span>
                        )}
                      </p>
                      <p className="text-xs capitalize text-[var(--muted)]">{c.status}</p>
                    </div>
                    {c.status === "pending" && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => updateClient.mutate({ id: c.id, status: "active" })}
                          className="flex size-8 items-center justify-center rounded-lg bg-[var(--success-soft)] text-[var(--success)]"
                          title="Aceptar"
                        >
                          <Check className="size-4" />
                        </button>
                        <button
                          onClick={() => updateClient.mutate({ id: c.id, status: "terminated" })}
                          className="flex size-8 items-center justify-center rounded-lg bg-[var(--danger-soft)] text-[var(--danger)]"
                          title="Rechazar"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Cursos */}
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-5 text-[var(--accent)]" />
                <h2 className="font-display text-lg font-bold tracking-tight">Mis cursos</h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => setCourseOpen(true)}>
                <Plus className="size-4" /> Crear curso
              </Button>
            </div>
            {(myCourses ?? []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Creá cursos y publicálos en el marketplace.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {myCourses?.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{c.title}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {c.description ? `${c.description.slice(0, 60)}... · ` : ""}
                        ${c.price_uyu.toLocaleString("es-UY")} UYU · {c.status}
                      </p>
                    </div>
                    {c.status === "draft" ? (
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => publishCourse.mutate({ id: c.id, status: "published" })}
                      >
                        Publicar
                      </Button>
                    ) : c.status === "published" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => publishCourse.mutate({ id: c.id, status: "archived" })}
                      >
                        Archivar
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          {/* Mis entrenadores */}
          <section className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-5 text-[var(--accent)]" />
              <h2 className="font-display text-lg font-bold tracking-tight">Mis entrenadores</h2>
            </div>
            {(myTrainers ?? []).length === 0 ? (
              <EmptyState
                icon={<Dumbbell className="size-6" />}
                title="No tenés entrenador"
                description="Encontrá entrenadores en el marketplace o pedile a tu profe que te agregue por su panel."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {myTrainers?.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5"
                  >
                    <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--surface-3)] font-display font-bold">
                      {(t.trainer?.display_name ?? "?")[0]?.toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        {t.trainer?.display_name ?? "Entrenador"}
                      </p>
                      <p className="text-xs capitalize text-[var(--muted)]">{t.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Rutinas asignadas */}
          <section className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="size-5 text-[var(--accent)]" />
              <h2 className="font-display text-lg font-bold tracking-tight">Rutinas asignadas</h2>
            </div>
            {(assigned ?? []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Tu entrenador todavía no te asignó rutinas.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {assigned?.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{a.routine?.name ?? "Rutina"}</p>
                      <p className="text-xs text-[var(--muted)]">
                        por {a.trainer?.display_name ?? "tu entrenador"}
                      </p>
                    </div>
                    <a href={`/entrenar?routine=...`}>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Asignar rutina */}
      <Dialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Asignar rutina"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="accent"
              onClick={() => assign.mutate()}
              disabled={!athleteId || !routineId || assign.isPending}
            >
              Asignar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Alumno">
            <select
              value={athleteId}
              onChange={(e) => setAthleteId(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="">Elegí un alumno...</option>
              {(clients ?? [])
                .filter((c) => c.status === "active")
                .map((c) => (
                  <option key={c.id} value={c.athlete?.id}>
                    {c.athlete?.display_name ?? "Atleta"}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Rutina">
            <select
              value={routineId}
              onChange={(e) => setRoutineId(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="">Elegí una rutina tuya...</option>
              {myRoutines?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Dialog>

      {/* Crear curso */}
      <Dialog
        open={courseOpen}
        onClose={() => setCourseOpen(false)}
        title="Crear curso"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="ghost" onClick={() => setCourseOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="accent"
              onClick={() => createCourse.mutate()}
              disabled={!cTitle.trim() || createCourse.isPending}
            >
              Crear
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Título">
            <Input value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="Programa de fuerza 12 semanas" autoFocus />
          </Field>
          <Field label="Descripción">
            <textarea
              value={cDesc}
              onChange={(e) => setCDesc(e.target.value)}
              rows={3}
              placeholder="En qué consiste..."
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </Field>
          <Field label="Precio (UYU)">
            <Input
              type="number"
              inputMode="numeric"
              value={cPrice}
              onChange={(e) => setCPrice(e.target.value)}
              placeholder="1500"
            />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}
