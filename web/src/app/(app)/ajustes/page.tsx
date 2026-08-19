"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Trash2,
  LogOut,
  ShieldAlert,
  UserX,
  Dumbbell,
  BookOpenText,
  Calculator,
  GraduationCap,
  Search,
  UserPlus,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";
import { useProfile } from "@/components/providers";

export default function AjustesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const profile = useProfile((s) => s.profile);
  const isTrainer = profile?.role === "trainer" && profile?.is_trainer_approved === true;
  const isAdmin = profile?.is_admin === true;
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");

  const { data: adminResults } = useQuery({
    queryKey: ["admin_search", adminSearch],
    queryFn: async () => {
      const q = adminSearch.trim().toLowerCase();
      if (!q) return [];
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, role, is_trainer_approved")
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(15);
      return (data ?? []) as {
        id: string;
        display_name: string | null;
        username: string | null;
        avatar_url: string | null;
        role: string | null;
        is_trainer_approved: boolean;
      }[];
    },
    enabled: isAdmin,
  });

  const setTrainerRole = useMutation({
    mutationFn: async ({
      targetId,
      makeTrainer,
    }: {
      targetId: string;
      makeTrainer: boolean;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          role: makeTrainer ? "trainer" : "athlete",
          is_trainer_approved: makeTrainer,
        })
        .eq("id", targetId);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin_search"] });
      toast(
        "success",
        vars.makeTrainer ? "Entrenador promovido" : "Rol revertido a atleta"
      );
    },
    onError: (e) => toast("error", "No se pudo actualizar", e.message),
  });

  async function handleExport() {
    setExporting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("export_my_data");
      if (error) throw new Error(error.message);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hypertrofia-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("success", "Exportación lista", "Revisá tus descargas");
    } catch (e) {
      toast("error", "No se pudo exportar", (e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("delete_account");
      if (error) throw new Error(error.message);
      await supabase.auth.signOut();
      toast("success", "Cuenta eliminada", "Tus datos fueron borrados permanentemente");
      router.push("/");
      router.refresh();
    } catch (e) {
      toast("error", "No se pudo eliminar", (e as Error).message);
      setDeleting(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">Tu cuenta y tus datos</p>
      </div>

      {isTrainer && (
        <section className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <GraduationCap className="size-5 text-[var(--accent)]" />
            <h2 className="font-display text-lg font-bold tracking-tight">Personal Trainer</h2>
          </div>
          <p className="text-sm text-[var(--text-2)]">
            Tenés el rol de entrenador: podés gestionar alumnos, asignarles rutinas y recetas,
            y felicitarlos por sus logros.
          </p>
          <Link href="/entrenadores">
            <Button variant="accent" className="mt-4">
              <Users className="size-4" /> Ir a mis alumnos
            </Button>
          </Link>
        </section>
      )}

      {isAdmin && (
        <section className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="size-5 text-[var(--accent)]" />
            <h2 className="font-display text-lg font-bold tracking-tight">Zona admin</h2>
          </div>
          <p className="mb-3 text-sm text-[var(--text-2)]">
            Asigná el rol de Personal Trainer a cualquier usuario. Hoy es gratuito; más
            adelante será un plan pago.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder="Buscar usuario por nombre o username…"
              className="pl-9"
            />
          </div>
          <div className="mt-2 flex max-h-64 flex-col gap-1.5 overflow-y-auto">
            {adminSearch.trim() && (adminResults ?? []).length === 0 && (
              <p className="py-3 text-center text-sm text-[var(--muted)]">
                Sin resultados para "{adminSearch.trim()}"
              </p>
            )}
            {(adminResults ?? []).map((u) => {
              const isTrainerUser =
                u.role === "trainer" && u.is_trainer_approved;
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--surface-2)]"
                >
                  <Avatar
                    src={u.avatar_url}
                    size={36}
                    alt={u.display_name ?? u.username ?? "Usuario"}
                    initialsText={u.display_name ?? u.username ?? "U"}
                    className="rounded-full"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {u.display_name ?? u.username}
                      {isTrainerUser && (
                        <span className="ml-1.5 rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--accent)]">
                          trainer
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-[var(--muted)]">@{u.username ?? "—"}</p>
                  </div>
                  {isTrainerUser ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setTrainerRole.mutate({ targetId: u.id, makeTrainer: false })
                      }
                      disabled={setTrainerRole.isPending}
                    >
                      <UserX className="size-3.5" /> Quitar rol
                    </Button>
                  ) : (
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() =>
                        setTrainerRole.mutate({ targetId: u.id, makeTrainer: true })
                      }
                      disabled={setTrainerRole.isPending}
                    >
                      <UserPlus className="size-3.5" /> Hacer trainer
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Download className="size-5 text-[var(--accent)]" />
          <h2 className="font-display text-lg font-bold tracking-tight">Tus datos</h2>
        </div>
        <p className="text-sm text-[var(--text-2)]">
          Exportá todo lo que guardaste en hypertrof.ia: entrenamientos, comidas, rutinas,
          logros y más, en un archivo JSON.
        </p>
        <Button variant="outline" className="mt-4" onClick={handleExport} loading={exporting}>
          <Download className="size-4" /> Exportar mis datos
        </Button>
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Dumbbell className="size-5 text-[var(--accent)]" />
          <h2 className="font-display text-lg font-bold tracking-tight">Herramientas</h2>
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
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <LogOut className="size-5 text-[var(--accent)]" />
          <h2 className="font-display text-lg font-bold tracking-tight">Sesión</h2>
        </div>
        <Button variant="outline" className="mt-1" onClick={handleLogout}>
          <LogOut className="size-4" /> Cerrar sesión
        </Button>
      </section>

      <section className="card border-[var(--danger)]/30 p-5">
        <div className="mb-3 flex items-center gap-2 text-[var(--danger)]">
          <ShieldAlert className="size-5" />
          <h2 className="font-display text-lg font-bold tracking-tight">Zona peligrosa</h2>
        </div>
        <p className="text-sm text-[var(--text-2)]">
          Eliminar tu cuenta borra todos tus datos de forma permanente e irreversible:
          entrenamientos, rutinas, comidas, logros y publicaciones.
        </p>
        <Button
          variant="danger"
          className="mt-4"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" /> Eliminar mi cuenta
        </Button>
      </section>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Eliminar cuenta"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              <UserX className="size-4" /> Eliminar definitivamente
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3 text-sm text-[var(--text-2)]">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-[var(--danger)]" />
          <p>
            Esta acción es <strong>irreversible</strong>. Todos tus entrenamientos, comidas,
            rutinas, logros y publicaciones serán borrados. Si querés guardar algo, exportá
            tus datos antes.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
