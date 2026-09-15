"use client";

/**
 * trainer-invite-accept.tsx
 * Permite a un atleta aceptar la invitación de un entrenador, ya sea desde el
 * parámetro `?invite=CODE` de la URL o ingresando un código manualmente.
 */

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Search, Ticket, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, Spinner } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";

// Datos de la invitación devueltos por la RPC `get_trainer_invite`.
type InvitePreview = {
  code: string;
  trainer_id: string;
  trainer_name: string | null;
  trainer_username: string | null;
  trainer_avatar: string | null;
  note: string | null;
  expired: boolean;
  exhausted: boolean;
  already_linked: boolean;
  self_invite: boolean;
};

/** Componente de aceptación de invitaciones de entrenador. */
export function TrainerInviteAccept() {
  const qc = useQueryClient();
  const [code, setCode] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [accepting, setAccepting] = useState(false);

  // Lee el código de invitación desde la query string al montar.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("invite");
    if (c) setCode(c.trim().toUpperCase());
  }, []);

  // Consulta la vista previa de la invitación cuando hay un código.
  const { data: preview, isLoading } = useQuery({
    queryKey: ["trainer_invite_preview", code],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_trainer_invite", {
        p_code: code!,
      });
      if (error) throw new Error(error.message);
      const row = (Array.isArray(data) ? data[0] : data) as InvitePreview | null;
      return row ?? null;
    },
    enabled: !!code,
    retry: false,
  });

  /** Quita el parámetro `invite` de la URL sin recargar la página. */
  function clearUrl() {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("invite");
    window.history.replaceState({}, "", url.toString());
  }

  /** Acepta la invitación y refresca las consultas de vínculos. */
  async function accept() {
    if (!code) return;
    setAccepting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("accept_trainer_invite", {
        p_code: code,
      });
      if (error) throw new Error(error.message);
      toast("success", "¡Vinculado!", "Ya podés ver las rutinas de tu entrenador");
      qc.invalidateQueries({ queryKey: ["my_trainers"] });
      qc.invalidateQueries({ queryKey: ["trainer_clients"] });
      qc.invalidateQueries({ queryKey: ["assigned_routines"] });
      qc.invalidateQueries({ queryKey: ["assigned_recipes"] });
      setCode(null);
      setManual("");
      clearUrl();
    } catch (e) {
      toast("error", "No se pudo aceptar", (e as Error).message);
    } finally {
      setAccepting(false);
    }
  }

  /** Normaliza y envía el código ingresado a mano. */
  function submitManual() {
    const c = manual.trim().toUpperCase();
    if (!c) return;
    setCode(c);
  }

  // La invitación es válida solo si existe y no está expirada, agotada, ya vinculada o es propia.
  const valid =
    preview &&
    !preview.expired &&
    !preview.exhausted &&
    !preview.already_linked &&
    !preview.self_invite;

  // Mensaje explicativo según el motivo por el que la invitación no es válida.
  const reason = !preview
    ? "No encontramos esa invitación. Verificá el código."
    : preview.self_invite
      ? "No podés aceptar tu propia invitación."
      : preview.already_linked
        ? "Ya estás vinculado con este entrenador."
        : preview.expired
          ? "Esta invitación expiró. Pedile una nueva a tu entrenador."
          : preview.exhausted
            ? "Esta invitación ya alcanzó su límite de usos."
            : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Vista previa de la invitación detectada por código */}
      {code && (
        <section className="card p-5">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-[var(--muted)]">
              <Spinner /> <span className="text-sm">Verificando invitación…</span>
            </div>
          ) : preview ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Avatar
                  src={preview.trainer_avatar}
                  size={44}
                  alt={preview.trainer_name ?? "Entrenador"}
                  initialsText={preview.trainer_name ?? "E"}
                  className="rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {preview.trainer_name ?? "Entrenador"}
                  </p>
                  {preview.trainer_username && (
                    <p className="truncate text-xs text-[var(--muted)]">
                      @{preview.trainer_username}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm text-[var(--text-2)]">
                {valid
                  ? "Te invitó a entrenar juntos. Al aceptar vas a ver las rutinas y recetas que te asigne."
                  : reason}
              </p>
              {valid && (
                <Button
                  variant="accent"
                  onClick={accept}
                  disabled={accepting}
                  fullWidth
                >
                  <Check className="size-4" /> Aceptar invitación
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCode(null);
                  clearUrl();
                }}
              >
                <X className="size-3.5" /> Descartar
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <Ticket className="size-7 text-[var(--muted)]" />
              <p className="text-sm text-[var(--muted)]">{reason}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCode(null);
                  clearUrl();
                }}
              >
                Usar otro código
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Entrada manual de código (cuando no hay uno en la URL) */}
      {!code && (
        <section className="card flex items-center gap-2 p-4">
          <Search className="size-4 shrink-0 text-[var(--muted)]" />
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitManual();
            }}
            placeholder="¿Tenés un código de invitación?"
            maxLength={12}
            className="uppercase tracking-widest"
          />
          <Button variant="accent" onClick={submitManual} disabled={!manual.trim()}>
            Vincular
          </Button>
        </section>
      )}
    </div>
  );
}