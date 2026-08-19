"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Trash2,
  LogOut,
  ShieldAlert,
  UserX,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export default function AjustesPage() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
