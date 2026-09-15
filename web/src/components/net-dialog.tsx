// Diálogo de red social: muestra seguidores y seguidos de un usuario.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

// Perfil mínimo mostrado en las listas.
type NetProfile = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

// Fila devuelta por la consulta: puede traer el perfil como follower o following.
type NetRow = {
  follower?: NetProfile;
  following?: NetProfile;
};

/**
 * Diálogo con pestañas de seguidores/seguidos.
 * @param userId Id del usuario cuya red se consulta.
 * @param isMine Si true el título se muestra en segunda persona ("Tu red").
 */
export function NetDialog({
  open,
  onClose,
  userId,
  isMine,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  isMine: boolean;
}) {
  const [tab, setTab] = useState<"followers" | "following">("followers");
  const qc = useQueryClient();

  // Consulta la lista según la pestaña activa; se habilita solo al abrir.
  const { data: list, isLoading } = useQuery({
    queryKey: ["net", userId, tab],
    queryFn: async () => {
      const supabase = createClient();
      if (tab === "followers") {
        const { data } = await supabase
          .from("followers")
          .select("follower:profiles!followers_follower_id_fkey(id, display_name, username, avatar_url)")
          .eq("following_id", userId)
          .order("created_at", { ascending: false });
        return (data ?? []) as unknown as NetRow[];
      }
      const { data } = await supabase
        .from("followers")
        .select("following:profiles!followers_following_id_fkey(id, display_name, username, avatar_url)")
        .eq("follower_id", userId)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as NetRow[];
    },
    enabled: open,
  });

  // Refresca la caché de la red cada vez que se abre el diálogo.
  useEffect(() => {
    if (open) qc.invalidateQueries({ queryKey: ["net"] });
  }, [open, qc]);

  // Normaliza la fila a un perfil (venga como follower o following).
  const people = (list ?? [])
    .map((x) => x.follower ?? x.following)
    .filter((x): x is NonNullable<typeof x> => !!x);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isMine ? "Tu red" : "Red"}
      footer={
        <div className="flex w-full justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Selector de pestaña */}
        <div className="flex rounded-xl bg-[var(--surface-2)] p-1">
          {(
            [
              { id: "followers", label: "Seguidores" },
              { id: "following", label: "Seguidos" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
                tab === t.id
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
                  : "text-[var(--muted)]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex max-h-96 flex-col gap-1.5 overflow-y-auto pr-1">
          {/* Lista: loading / vacío / resultados */}
          {isLoading ? (
            <Skeleton className="h-20" />
          ) : people.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--muted)]">
              {tab === "followers" ? "Todavía no te sigue nadie." : "Todavía no seguís a nadie."}
            </p>
          ) : (
            people.map((p) => (
              <Link
                key={p.id}
                href={p.id === userId ? "/perfil" : `/perfil/${p.id}`}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5 transition-colors hover:bg-[var(--surface-2)]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--surface-3)] text-sm font-bold">
                  {p.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={String(p.avatar_url)} alt="" className="size-full object-cover" />
                  ) : (
                    (p.display_name ?? p.username ?? "A")[0]?.toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {p.display_name ?? p.username ?? "Atleta"}
                  </p>
                  {p.username && (
                    <p className="truncate text-xs text-[var(--muted)]">@{p.username}</p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
}
