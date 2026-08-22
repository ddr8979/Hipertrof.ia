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
  BookOpenText,
  Calculator,
  Utensils,
  PartyPopper,
  Search,
  UserPlus,
  Trash2,
  History,
  Store,
  LayoutList,
  Settings,
  ChartLine,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Skeleton, Avatar } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/data";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useProfile } from "@/components/providers";
import { cn } from "@/lib/utils";

type ClientRow = {
  id: string;
  status: string;
  created_at: string;
  athlete: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    streak_count: number | null;
  } | null;
};

type RoutineRow = {
  id: string;
  name: string;
  user_id: string;
  is_template: boolean;
};

type TrainerRow = {
  id: string;
  status: string;
  trainer: { id: string; display_name: string | null; username: string | null } | null;
};

type AssignedRow = {
  id: string;
  active: boolean;
  routine: { id: string; name: string } | null;
  trainer: { id: string; display_name: string | null } | null;
};

type AssignedRecipeRow = {
  id: string;
  active: boolean;
  recipe: { id: string; name: string; calories: number; protein_g: number; photos: string[] | null } | null;
  trainer: { id: string; display_name: string | null } | null;
};

const CONGRATS = [
  "¡Felicitaciones! Estoy muy orgulloso de tu esfuerzo. ¡Seguí así! 💪",
  "¡Gran trabajo hoy! Cada sesión cuenta y la estás rompiendo. 🏆",
  "¡Felicitaciones por tu progreso! Así se construye un campeón. 🔥",
  "¡Excelente constancia! Tu disciplina te está dando resultados. 👏",
];

export default function EntrenadoresPage() {
  const profile = useProfile((s) => s.profile);
  const qc = useQueryClient();
  const router = useRouter();
  const [courseOpen, setCourseOpen] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cPrice, setCPrice] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  const [manageFor, setManageFor] = useState<string | null>(null);
  const [manageTab, setManageTab] = useState<"routine" | "recipe">("routine");

  const isTrainer = profile?.role === "trainer";

  const { data: clients, isLoading } = useQuery({
    queryKey: ["trainer_clients"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("trainer_clients")
        .select(
          "id, status, created_at, athlete:profiles!trainer_clients_athlete_id_fkey(id, display_name, username, avatar_url, streak_count)"
        )
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
        .select("id, name, is_template")
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
        .select("id, active, routine:routines(id, name), trainer:profiles!assigned_routines_trainer_id_fkey(id, display_name)")
        .eq("athlete_id", profile!.id)
        .eq("active", true)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as AssignedRow[];
    },
  });

  const { data: assignedRecipes } = useQuery({
    queryKey: ["assigned_recipes"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("assigned_recipes")
        .select("id, active, recipe:recipes(id, name, calories, protein_g, photos), trainer:profiles!assigned_recipes_trainer_id_fkey(id, display_name)")
        .eq("athlete_id", profile!.id)
        .eq("active", true)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as AssignedRecipeRow[];
    },
  });

  const { data: addResults } = useQuery({
    queryKey: ["search_athletes", addSearch],
    queryFn: async () => {
      const q = addSearch.trim().toLowerCase();
      if (!q) return [];
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, streak_count, is_public_profile")
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(15);
      return (data ?? []) as {
        id: string;
        display_name: string | null;
        username: string | null;
        avatar_url: string | null;
        streak_count: number | null;
        is_public_profile: boolean;
      }[];
    },
  });

  const clientIds = new Set((clients ?? []).map((c) => c.athlete?.id));

  const manageClient = (clients ?? []).find((c) => c.athlete?.id === manageFor);

  const { data: manageAssignedRoutines } = useQuery({
    queryKey: ["assigned_routines_athlete", manageFor],
    queryFn: async () => {
      if (!manageFor) return [] as AssignedRow[];
      const supabase = createClient();
      const { data } = await supabase
        .from("assigned_routines")
        .select("id, active, routine:routines(id, name)")
        .eq("athlete_id", manageFor)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as AssignedRow[];
    },
    enabled: !!manageFor,
  });

  const { data: manageAssignedRecipes } = useQuery({
    queryKey: ["assigned_recipes_athlete", manageFor],
    queryFn: async () => {
      if (!manageFor) return [] as AssignedRecipeRow[];
      const supabase = createClient();
      const { data } = await supabase
        .from("assigned_recipes")
        .select("id, active, recipe:recipes(id, name, calories, protein_g)")
        .eq("athlete_id", manageFor)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as AssignedRecipeRow[];
    },
    enabled: !!manageFor,
  });

  const { data: allRecipes } = useQuery({
    queryKey: ["recipes_all"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("recipes")
        .select("id, name, calories, protein_g, category")
        .order("name")
        .limit(500);
      return (data ?? []) as { id: string; name: string; calories: number; protein_g: number; category: string | null }[];
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

  const addAlumno = useMutation({
    mutationFn: async (athleteId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("trainer_clients").insert({
        trainer_id: profile!.id,
        athlete_id: athleteId,
        status: "active",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setAddSearch("");
      qc.invalidateQueries({ queryKey: ["trainer_clients"] });
      toast("success", "Alumno agregado", "Ya podés asignarle rutinas y recetas");
    },
    onError: (e) => toast("error", "No se pudo agregar", e.message),
  });

  const removeAlumno = useMutation({
    mutationFn: async (clientId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("trainer_clients").delete().eq("id", clientId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainer_clients"] });
      toast("success", "Alumno quitado");
    },
    onError: (e) => toast("error", "No se pudo quitar", e.message),
  });

  const assignRoutine = useMutation({
    mutationFn: async (routineId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("assigned_routines").insert({
        trainer_id: profile!.id,
        athlete_id: manageFor!,
        routine_id: routineId,
        active: true,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assigned_routines_athlete", manageFor] });
      qc.invalidateQueries({ queryKey: ["assigned_routines"] });
      toast("success", "Rutina asignada");
    },
    onError: (e) => toast("error", "No se pudo asignar", e.message),
  });

  const unassignRoutine = useMutation({
    mutationFn: async (assignmentId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("assigned_routines")
        .delete()
        .eq("id", assignmentId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assigned_routines_athlete", manageFor] });
      qc.invalidateQueries({ queryKey: ["assigned_routines"] });
      toast("success", "Rutina desasignada");
    },
    onError: (e) => toast("error", "No se pudo desasignar", e.message),
  });

  const assignRecipe = useMutation({
    mutationFn: async (recipeId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("assigned_recipes").insert({
        trainer_id: profile!.id,
        athlete_id: manageFor!,
        recipe_id: recipeId,
        active: true,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assigned_recipes_athlete", manageFor] });
      qc.invalidateQueries({ queryKey: ["assigned_recipes"] });
      toast("success", "Receta asignada");
    },
    onError: (e) => toast("error", "No se pudo asignar", e.message),
  });

  const unassignRecipe = useMutation({
    mutationFn: async (assignmentId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("assigned_recipes")
        .delete()
        .eq("id", assignmentId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assigned_recipes_athlete", manageFor] });
      qc.invalidateQueries({ queryKey: ["assigned_recipes"] });
      toast("success", "Receta desasignada");
    },
    onError: (e) => toast("error", "No se pudo desasignar", e.message),
  });

  const congrats = useMutation({
    mutationFn: async (athleteId: string) => {
      const supabase = createClient();
      const msg = CONGRATS[Math.floor(Math.random() * CONGRATS.length)];
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: profile!.id,
        recipient_id: athleteId,
        content: msg,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast("success", "¡Felicitaciones enviadas!", "Le llegó por mensaje directo");
    },
    onError: (e) => toast("error", "No se pudo enviar", e.message),
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

  const activeClients = (clients ?? []).filter((c) => c.status === "active");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Entrenadores</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">
          {isTrainer ? "Panel de entrenador: alumnos, rutinas, recetas y cursos" : "Tus entrenadores, rutinas y recetas asignadas"}
        </p>
      </div>

      {isTrainer ? (
        <>
          {/* Alumnos */}
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-[var(--accent)]" />
                <h2 className="font-display text-lg font-bold tracking-tight">Mis alumnos</h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                <UserPlus className="size-4" /> Agregar alumno
              </Button>
            </div>
            {activeClients.length === 0 ? (
              <EmptyState
                icon={<Users className="size-6" />}
                title="Todavía no tenés alumnos"
                description="Buscá por nombre o username y agregalos como alumnos. Después podés asignarles rutinas y recetas."
                action={
                  <Button variant="accent" size="sm" onClick={() => setAddOpen(true)}>
                    <UserPlus className="size-4" /> Agregar mi primer alumno
                  </Button>
                }
              />
            ) : (
              <div className="flex flex-col gap-2">
                {clients?.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5"
                  >
                    <Avatar
                      src={c.athlete?.avatar_url}
                      size={36}
                      alt={c.athlete?.display_name ?? "Alumno"}
                      initialsText={c.athlete?.display_name ?? "A"}
                      className="rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {c.athlete?.display_name ?? "Atleta"}
                        {c.athlete?.username && (
                          <span className="ml-1 text-xs text-[var(--muted)]">
                            @{c.athlete.username}
                          </span>
                        )}
                      </p>
                      <p className="text-xs capitalize text-[var(--muted)]">
                        {c.status === "active" ? (
                          <>
                            racha {c.athlete?.streak_count ?? 0} días
                            {c.status !== "active" ? ` · ${c.status}` : ""}
                          </>
                        ) : (
                          c.status
                        )}
                      </p>
                    </div>
                    {c.status === "pending" ? (
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
                    ) : c.status === "active" ? (
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setManageFor(c.athlete!.id);
                            setManageTab("routine");
                          }}
                        >
                          <ClipboardList className="size-3.5" /> Rutina
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setManageFor(c.athlete!.id);
                            setManageTab("recipe");
                          }}
                        >
                          <Utensils className="size-3.5" /> Receta
                        </Button>
                        <button
                          onClick={() => congrats.mutate(c.athlete!.id)}
                          disabled={congrats.isPending}
                          title="Felicitar"
                          className="flex size-8 items-center justify-center rounded-lg bg-[#f59e0b]/15 text-[#f59e0b] transition-colors hover:bg-[#f59e0b]/25"
                        >
                          <PartyPopper className="size-4" />
                        </button>
                        <button
                          onClick={() => removeAlumno.mutate(c.id)}
                          disabled={removeAlumno.isPending}
                          title="Quitar alumno"
                          className="flex size-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ) : null}
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
                description="Pedile a tu profe que te agregue como alumno desde su panel."
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
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {a.routine?.name ?? "Rutina"}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        por {a.trainer?.display_name ?? "tu entrenador"}
                      </p>
                    </div>
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => router.push(`/entrenar?routine=${a.routine?.id}`)}
                    >
                      <Dumbbell className="size-3.5" /> Entrenar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recetas asignadas */}
          <section className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Utensils className="size-5 text-[var(--accent)]" />
              <h2 className="font-display text-lg font-bold tracking-tight">Recetas asignadas</h2>
            </div>
            {(assignedRecipes ?? []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Tu entrenador todavía no te asignó recetas.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {assignedRecipes?.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {a.recipe?.name ?? "Receta"}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {a.recipe?.calories ?? 0} kcal · P {a.recipe?.protein_g ?? 0} g · por{" "}
                        {a.trainer?.display_name ?? "tu entrenador"}
                      </p>
                    </div>
                    <Link href="/nutricion">
                      <Button variant="outline" size="sm">
                        Ver en recetario
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Hub de herramientas */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight">Herramientas</h2>
          <span className="text-xs text-[var(--muted)]">para tu entrenamiento</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/ejercicios" className="card card-hover flex min-w-0 flex-col items-center gap-2 p-4 text-center">
            <Dumbbell className="size-5 text-[var(--accent)]" />
            <span className="w-full truncate text-xs font-semibold">Ejercicios</span>
          </Link>
          <Link href="/glosario" className="card card-hover flex min-w-0 flex-col items-center gap-2 p-4 text-center">
            <BookOpenText className="size-5 text-[var(--accent)]" />
            <span className="w-full truncate text-xs font-semibold">Diccionario</span>
          </Link>
          <Link href="/calculadora" className="card card-hover flex min-w-0 flex-col items-center gap-2 p-4 text-center">
            <Calculator className="size-5 text-[var(--accent)]" />
            <span className="w-full truncate text-xs font-semibold">Calculadora</span>
          </Link>
          <Link href="/progreso" className="card card-hover flex min-w-0 flex-col items-center gap-2 p-4 text-center">
            <ChartLine className="size-5 text-[var(--accent)]" />
            <span className="w-full truncate text-xs font-semibold">Progreso</span>
          </Link>
          <Link href="/historial" className="card card-hover flex min-w-0 flex-col items-center gap-2 p-4 text-center">
            <History className="size-5 text-[var(--accent)]" />
            <span className="w-full truncate text-xs font-semibold">Historial</span>
          </Link>
          <Link href="/marketplace" className="card card-hover flex min-w-0 flex-col items-center gap-2 p-4 text-center">
            <Store className="size-5 text-[var(--accent)]" />
            <span className="w-full truncate text-xs font-semibold">Marketplace</span>
          </Link>
          <Link href="/rutinas" className="card card-hover flex min-w-0 flex-col items-center gap-2 p-4 text-center">
            <LayoutList className="size-5 text-[var(--accent)]" />
            <span className="w-full truncate text-xs font-semibold">Mis Rutinas</span>
          </Link>
          <Link href="/nutricion" className="card card-hover flex min-w-0 flex-col items-center gap-2 p-4 text-center">
            <Utensils className="size-5 text-[var(--accent)]" />
            <span className="w-full truncate text-xs font-semibold">Alimentación</span>
          </Link>
          <Link href="/ajustes" className="card card-hover flex min-w-0 flex-col items-center gap-2 p-4 text-center">
            <Settings className="size-5 text-[var(--accent)]" />
            <span className="w-full truncate text-xs font-semibold">Ajustes</span>
          </Link>
        </div>
      </section>

      {/* Agregar alumno */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Agregar alumno">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              placeholder="Buscar por nombre o username…"
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
            {addSearch.trim() && (addResults ?? []).length === 0 && (
              <p className="py-3 text-center text-sm text-[var(--muted)]">
                Sin resultados para “{addSearch.trim()}”
              </p>
            )}
            {(addResults ?? []).map((u) => {
              const isMine = u.id === profile?.id;
              const isClient = clientIds.has(u.id);
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--surface-2)]"
                >
                  <Avatar
                    src={u.avatar_url}
                    size={36}
                    alt={u.display_name ?? u.username ?? "Atleta"}
                    initialsText={u.display_name ?? u.username ?? "A"}
                    className="rounded-full"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {u.display_name ?? u.username}
                      {!u.is_public_profile && (
                        <span className="ml-1 text-[10px] uppercase text-[var(--muted)]">
                          privado
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      @{u.username ?? "—"} · racha {u.streak_count ?? 0} días
                    </p>
                  </div>
                  {isMine ? (
                    <span className="text-xs font-semibold text-[var(--muted)]">Sos vos</span>
                  ) : isClient ? (
                    <span className="text-xs font-semibold text-[var(--success)]">Ya es alumno</span>
                  ) : (
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => addAlumno.mutate(u.id)}
                      disabled={addAlumno.isPending}
                    >
                      <UserPlus className="size-3.5" /> Agregar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Dialog>

      {/* Gestionar alumno: rutinas / recetas */}
      <Dialog
        open={!!manageFor}
        onClose={() => setManageFor(null)}
        title={`Gestionar: ${manageClient?.athlete?.display_name ?? "alumno"}`}
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-1.5">
            {[
              { id: "routine" as const, label: "Rutinas", icon: <ClipboardList className="size-4" /> },
              { id: "recipe" as const, label: "Recetas", icon: <Utensils className="size-4" /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setManageTab(t.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all",
                  manageTab === t.id
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]"
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {manageTab === "routine" ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  Rutinas asignadas
                </p>
                {(manageAssignedRoutines ?? []).length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Sin rutinas asignadas todavía.</p>
                ) : (
                  (manageAssignedRoutines ?? []).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {a.routine?.name ?? "Rutina"}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {a.active ? "activa" : "inactiva"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[var(--danger)]/70 hover:text-[var(--danger)]"
                        onClick={() => unassignRoutine.mutate(a.id)}
                        disabled={unassignRoutine.isPending}
                      >
                        <Trash2 className="size-3.5" /> Quitar
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  Asignar rutina (tus rutinas)
                </p>
                {(myRoutines ?? []).length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    Creá rutinas en la sección Rutinas para asignarlas.
                  </p>
                ) : (
                  <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
                    {myRoutines?.map((r) => {
                      const already = (manageAssignedRoutines ?? []).some(
                        (a) => a.routine?.id === r.id && a.active
                      );
                      return (
                        <div
                          key={r.id}
                          className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--surface-2)]"
                        >
                          <Dumbbell className="size-4 shrink-0 text-[var(--muted)]" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{r.name}</p>
                            <p className="text-xs text-[var(--muted)]">
                              {r.is_template ? "plantilla" : "tu rutina"}
                            </p>
                          </div>
                          {already ? (
                            <span className="text-xs font-semibold text-[var(--success)]">
                              Asignada
                            </span>
                          ) : (
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={() => assignRoutine.mutate(r.id)}
                              disabled={assignRoutine.isPending}
                            >
                              <Plus className="size-3.5" /> Asignar
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  Recetas asignadas
                </p>
                {(manageAssignedRecipes ?? []).length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Sin recetas asignadas todavía.</p>
                ) : (
                  (manageAssignedRecipes ?? []).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {a.recipe?.name ?? "Receta"}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {a.recipe?.calories ?? 0} kcal · P {a.recipe?.protein_g ?? 0} g
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[var(--danger)]/70 hover:text-[var(--danger)]"
                        onClick={() => unassignRecipe.mutate(a.id)}
                        disabled={unassignRecipe.isPending}
                      >
                        <Trash2 className="size-3.5" /> Quitar
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  Asignar receta del recetario
                </p>
                <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
                  {(allRecipes ?? []).map((r) => {
                    const already = (manageAssignedRecipes ?? []).some(
                      (a) => a.recipe?.id === r.id && a.active
                    );
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--surface-2)]"
                      >
                        <Utensils className="size-4 shrink-0 text-[var(--muted)]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{r.name}</p>
                          <p className="text-xs text-[var(--muted)]">
                            {r.calories} kcal · P {r.protein_g} g
                            {r.category ? ` · ${r.category}` : ""}
                          </p>
                        </div>
                        {already ? (
                          <span className="text-xs font-semibold text-[var(--success)]">
                            Asignada
                          </span>
                        ) : (
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => assignRecipe.mutate(r.id)}
                            disabled={assignRecipe.isPending}
                          >
                            <Plus className="size-3.5" /> Asignar
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
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