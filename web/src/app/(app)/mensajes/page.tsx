"use client";

/**
 * Mensajes estilo Instagram — lista de conversaciones + chat activo.
 * Mobile: single column con tabs (Chats / Solicitudes). Desktop: split view.
 */
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle,
  Send,
  Search,
  Star,
  Bell,
  MoreHorizontal,
  Camera,
  Mic,
  Heart,
  Paperclip,
  X,
  ChevronLeft,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton, Avatar } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/data";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, InputWithIcon } from "@/components/ui/input";
import { vibrate, cn, formatDateTime } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { DumbbellIcon } from "@/components/mascot";

type Conversation = {
  other_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread: number;
};

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
  type: "text" | "image" | "workout" | "routine";
  metadata?: Record<string, unknown>;
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"chats" | "requests">("chats");
  const [newOpen, setNewOpen] = useState(false);
  const [q, setQ] = useState("");
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notifState =
    typeof Notification !== "undefined" ? Notification.permission : "unsupported";

  const { data: convos, isLoading, refetch } = useQuery({
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
        .select("id, display_name, username, avatar_url, is_trainer_approved")
        .or(`display_name.ilike.%${q.trim()}%,username.ilike.%${q.trim()}%`)
        .order("display_name")
        .limit(10);
      if (error) throw new Error(error.message);
      return (data ?? []) as { id: string; display_name: string | null; username: string | null; avatar_url: string | null; is_trainer_approved?: boolean }[];
    },
    enabled: q.trim().length >= 2,
  });

  const totalUnread = (convos ?? []).reduce((s, c) => s + (c.unread ?? 0), 0);

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

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConvo) throw new Error("No conversation selected");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("direct_messages")
        .insert({
          recipient_id: selectedConvo.other_id,
          content,
          type: "text",
        })
        .select()
        .single();
      if (error) throw error;
      return data as Message;
    },
    onSuccess: (msg) => {
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const readMutation = useMutation({
    mutationFn: async (convoId: string) => {
      const supabase = createClient();
      await supabase
        .from("direct_messages")
        .update({ read: true })
        .eq("sender_id", convoId)
        .eq("read", false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });

  useEffect(() => {
    if (selectedConvo) {
      loadMessages(selectedConvo.other_id);
      readMutation.mutate(selectedConvo.other_id);
    }
  }, [selectedConvo]);

  const loadMessages = async (otherId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`sender_id.eq.${otherId},recipient_id.eq.${otherId}`)
      .order("created_at", { ascending: true })
      .limit(100);
    if (!error) setMessages((data ?? []) as Message[]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConvo || sending) return;
    setSending(true);
    sendMutation.mutate(newMessage.trim(), {
      onSettled: () => setSending(false),
    });
    vibrate(6);
  };

  const startChat = (userId: string) => {
    vibrate(6);
    setNewOpen(false);
    setQ("");
    router.push(`/mensajes/${userId}`);
  };

  const handleBack = () => {
    setSelectedConvo(null);
    router.push("/mensajes");
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-5rem)]">
      {/* Header mobile tabs */}
      {isMobile && (
        <div className="flex border-b border-[var(--border)] bg-[var(--surface)] px-4">
          {(["chats", "requests"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-sm font-semibold transition-colors border-b-2",
                activeTab === tab
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[var(--muted)]"
              )}
            >
              {tab === "chats" ? "Chats" : "Solicitudes"}
              {tab === "chats" && totalUnread > 0 && (
                <span className="ml-1.5 size-4.5 rounded-full bg-[var(--danger)] text-[10px] font-bold text-white flex items-center justify-center">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: lista de conversaciones */}
        <aside className={cn(
          "flex flex-col border-r border-[var(--border)] bg-[var(--surface)] hidden lg:flex",
          isMobile && selectedConvo ? "hidden" : "flex"
        )}>
          {/* Header sidebar */}
          <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
            <div className="flex items-center gap-3">
              {!isMobile && (
                <Link href="/mensajes" onClick={handleBack} className="hidden lg:flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)]">
                  <ChevronLeft className="size-5" />
                  <span className="font-semibold">Chats</span>
                </Link>
              )}
              <h1 className="font-display text-xl font-bold tracking-tight lg:hidden">Mensajes</h1>
            </div>
            <div className="flex items-center gap-2">
              {notifState === "default" && (
                <Button variant="ghost" size="icon" onClick={enableNotifications} aria-label="Activar notificaciones">
                  <Bell className="size-5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => { vibrate(6); setNewOpen(true); }} aria-label="Nuevo mensaje">
                <Send className="size-5" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-[var(--border)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar chats…"
                className="pl-9"
              />
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            ) : (convos ?? []).length === 0 ? (
              <EmptyState
                icon={<MessageCircle className="size-8" />}
                title={activeTab === "chats" ? "Todavía no tenés chats" : "Sin solicitudes"}
                description={activeTab === "chats"
                  ? "Tocá Nuevo y buscá a alguien de la comunidad para saludar."
                  : "Cuando alguien te escriba por primera vez, aparecerá aquí."}
                action={
                  <Button onClick={() => setNewOpen(true)} className="w-full">
                    <Send className="size-4" /> {activeTab === "chats" ? "Empezar un chat" : "Ver solicitudes"}
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {(convos ?? []).map((c) => (
                  <Link
                    key={c.other_id}
                    href={isMobile ? `/mensajes/${c.other_id}` : "#"}
                    onClick={isMobile ? undefined : () => { vibrate(6); setSelectedConvo(c); }}
                    className={cn(
                      "flex items-center gap-3 p-3 transition-colors hover:bg-[var(--surface-2)]",
                      selectedConvo?.other_id === c.other_id && "bg-[var(--accent-soft)]"
                    )}
                  >
                    <span className="relative flex-shrink-0">
                      <Avatar src={c.avatar_url} size={50} alt={c.display_name ?? c.username ?? "?"} />
                      {(c.unread ?? 0) > 0 && (
                        <span className="absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-[var(--accent-ink)] ring-2 ring-[var(--surface)]">
                          {c.unread > 9 ? "9+" : c.unread}
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
                      <p className={cn("truncate text-sm", c.unread ? "font-semibold" : "text-[var(--text-2)]")}>
                        {c.last_message ?? "Sin mensajes"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Chat area */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0",
          isMobile && !selectedConvo ? "justify-center items-center" : ""
        )}>
          {!selectedConvo ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <DumbbellIcon size={64} className="text-[var(--muted)]/30" />
              <h2 className="mt-4 font-display text-xl font-bold tracking-tight">Mensajes</h2>
              <p className="mt-2 text-[var(--text-2)] max-w-xs">
                Seleccioná un chat a la izquierda o tocá Nuevo para empezar una conversación.
              </p>
              <Button variant="accent" className="mt-6" onClick={() => { vibrate(6); setNewOpen(true); }}>
                <Send className="size-4" /> Nuevo mensaje
              </Button>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <header className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                {isMobile && (
                  <button onClick={handleBack} className="flex size-9 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)]">
                    <ChevronLeft className="size-5" />
                  </button>
                )}
                <Avatar src={selectedConvo.avatar_url} size={36} alt={selectedConvo.display_name ?? "?"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{selectedConvo.display_name ?? selectedConvo.username ?? "Atleta"}</p>
                  <p className="truncate text-xs text-[var(--muted)]">@{selectedConvo.username ?? ""}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="flex size-9 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)]" aria-label="Videollamada">
                    <Camera className="size-5" />
                  </button>
                  <button className="flex size-9 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)]" aria-label="Llamada">
                    <Mic className="size-5" />
                  </button>
                  <button className="flex size-9 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)]" aria-label="Más opciones">
                    <MoreHorizontal className="size-5" />
                  </button>
                </div>
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: "var(--bg)" }}>
                {messages.map((msg) => {
                  const isOwn = msg.sender_id !== selectedConvo?.other_id;
                  return (
                    <div key={msg.id} className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
                      {!isOwn && (
                        <Avatar src={selectedConvo.avatar_url} size={28} alt="" className="self-end" />
                      )}
                      <div className={cn("flex flex-col max-w-[70%]", isOwn && "items-end")}>
                        <div className={cn(
                          "rounded-2xl px-4 py-2 text-sm",
                          isOwn
                            ? "bg-[var(--accent)] text-[var(--accent-ink)] rounded-br-md"
                            : "bg-[var(--surface)] text-[var(--text)] rounded-bl-md shadow-[var(--shadow-sm)]"
                        )}>
                          {msg.type === "image" && msg.metadata?.url ? (
                            <img src={msg.metadata.url as string} alt="Imagen" className="rounded-xl max-w-xs" />
                          ) : (
                            msg.content
                          )}
                        </div>
                        <span className={cn("mt-1 text-[10px] text-[var(--muted)]", isOwn ? "text-right" : "")}>
                          {formatDateTime(msg.created_at)}
                        </span>
                      </div>
                      {isOwn && <Avatar size={28} className="self-end" />}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <form onSubmit={handleSend} className="border-t border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="flex items-end gap-2">
                  <Button type="button" variant="ghost" size="icon" aria-label="Adjuntar">
                    <Paperclip className="size-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Mensaje…"
                      className="pr-12 rounded-full border-[var(--border)] bg-[var(--surface-2)] focus:border-[var(--accent)]"
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" aria-label="Cámara">
                        <Camera className="size-4" />
                      </Button>
                      <Button
                        type="submit"
                        variant="accent"
                        size="icon"
                        disabled={!newMessage.trim() || sending}
                        aria-label="Enviar"
                      >
                        <Send className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" aria-label="Audio">
                    <Mic className="size-5" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Nuevo mensaje dialog */}
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
                onClick={() => startChat(p.id)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]"
              >
                <Avatar src={p.avatar_url} size={36} alt={p.display_name ?? "?"} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.display_name ?? p.username}</p>
                  {p.username && <p className="truncate text-xs text-[var(--muted)]">@{p.username}</p>}
                  {p.is_trainer_approved && (
                    <ShieldCheck className="inline size-3.5 text-[var(--accent)]" />
                  )}
                </div>
                <Star className="ml-auto size-4 text-[var(--accent)]" />
              </button>
            ))}
            {!searching && q.trim().length >= 2 && (results ?? []).length === 0 && (
              <p className="py-4 text-center text-sm text-[var(--muted)]">Nadie con ese nombre.</p>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}