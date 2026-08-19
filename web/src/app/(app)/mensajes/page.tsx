"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Send, Search, Star, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/data";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/primitives";
import { vibrate, cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

type Conversation = {
  other_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread: number;
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} d`;
  return d.toLocaleDateString("es-UY", { day: "numeric", month: "short" });
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function MensajesPage() {
  const router = useRouter();
  const [newOpen, setNewOpen] = useState(false);
  const [q, setQ] = useState("");

  const { data: convos, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_conversations");
      if (error) throw new Error(error.message);
      return (data ?? []) as Conversation[];
    },
    refetchInterval: 15000,
  });

  const { data: results, isLoading: searching } = useQuery({
    queryKey: ["dm_search", q],
    queryFn: async () => {
      if (q.trim().length < 2) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .or(`display_name.ilike.%${q.trim()}%,username.ilike.%${q.trim()}%`)
        .order("display_name")
        .limit(10);
      if (error) throw new Error(error.message);
      return (data ?? []) as { id: string; display_name: string | null; username: string | null; avatar_url: string | null }[];
    },
    enabled: q.trim().length >= 2,
  });

  const totalUnread = (convos ?? []).reduce((s, c) => s + (c.unread ?? 0), 0);
  const notifState =
    typeof Notification !== "undefined" ? Notification.permission : "unsupported";

  async function enableNotifications() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
        ).buffer as ArrayBuffer,
      });
      await fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      toast("success", "Notificaciones activadas");
    } catch {
      toast("error", "Este navegador no soporta push", "Probá en la app instalada (PWA)");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Mensajes</h1>
          <p className="text-sm text-[var(--muted)]">
            {totalUnread > 0 ? `${totalUnread} sin leer` : "Chats directos con estrellas"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {notifState === "default" && (
            <Button variant="outline" size="sm" onClick={enableNotifications}>
              <Bell className="size-4" /> Activar
            </Button>
          )}
          {notifState === "granted" && (
            <span className="flex items-center gap-1.5 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--muted)]">
              <Bell className="size-3.5 text-[var(--accent)]" /> Notif. activas
            </span>
          )}
          <Button onClick={() => { vibrate(6); setNewOpen(true); }}>
            <Send className="size-4" /> Nuevo
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (convos ?? []).length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="size-6" />}
          title="Todavía no tenés chats"
          description="Tocá Nuevo y buscá a alguien de la comunidad para saludar."
          action={
            <Button onClick={() => setNewOpen(true)}>
              <Send className="size-4" /> Empezar un chat
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {(convos ?? []).map((c) => (
            <Link
              key={c.other_id}
              href={`/mensajes/${c.other_id}`}
              className="flex items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3 transition-colors hover:bg-[var(--surface-2)]"
            >
              <span className="relative">
                <Avatar src={c.avatar_url} size={44} alt={c.display_name ?? c.username ?? "?"} />
                {(c.unread ?? 0) > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-[var(--accent-ink)]">
                    {c.unread}
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold">
                    {c.display_name ?? c.username ?? "Atleta"}
                  </p>
                  <span className="shrink-0 text-[11px] text-[var(--muted)]">
                    {timeAgo(c.last_message_at)}
                  </span>
                </div>
                <p className={cn("truncate text-sm", c.unread ? "font-semibold" : "text-[var(--muted)]")}>
                  {c.last_message ?? "Sin mensajes"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={newOpen} onClose={() => setNewOpen(false)} title="Nuevo mensaje">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o usuario…"
              className="pl-9"
            />
          </div>
          <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {searching && <Skeleton className="h-12" />}
            {(results ?? []).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  vibrate(6);
                  setNewOpen(false);
                  setQ("");
                  router.push(`/mensajes/${p.id}`);
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]"
              >
                <Avatar src={p.avatar_url} size={36} alt={p.display_name ?? "?"} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {p.display_name ?? p.username}
                  </p>
                  {p.username && (
                    <p className="truncate text-xs text-[var(--muted)]">@{p.username}</p>
                  )}
                </div>
                <Star className="ml-auto size-4 text-[var(--accent)]" />
              </button>
            ))}
            {!searching && q.trim().length >= 2 && (results ?? []).length === 0 && (
              <p className="py-4 text-center text-sm text-[var(--muted)]">
                Nadie con ese nombre.
              </p>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}