"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Star, Send, Trash2, ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/primitives";
import { toast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/primitives";
import { useProfile } from "@/components/providers";
import { vibrate, cn } from "@/lib/utils";

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  stars: number;
  created_at: string;
  read_at: string | null;
  image_url?: string | null;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const otherId = params.id;
  const router = useRouter();
  const qc = useQueryClient();
  const me = useProfile((s) => s.profile);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [stars, setStars] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: other } = useQuery({
    queryKey: ["dm_other", otherId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, is_public_profile")
        .eq("id", otherId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as {
        id: string;
        display_name: string | null;
        username: string | null;
        avatar_url: string | null;
        is_public_profile: boolean | null;
      } | null;
    },
  });

  const { data: balance } = useQuery({
    queryKey: ["star_balance"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("star_balances")
        .select("balance")
        .maybeSingle();
      if (error) return 0;
      return (data?.balance ?? 0) as number;
    },
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ["dm", otherId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("direct_messages")
        .select("id, sender_id, recipient_id, content, stars, created_at, read_at, image_url")
        .or(`and(sender_id.eq.${me?.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${me?.id})`)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw new Error(error.message);
      return (data ?? []) as Message[];
    },
    enabled: !!me?.id,
  });

  useEffect(() => {
    if (!me?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`dm-${otherId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `and(sender_id=in.(${me.id},${otherId}),recipient_id=in.(${me.id},${otherId}))`,
        },
        (payload) => {
          const m = payload.new as Message;
          if (m.recipient_id === me.id) {
            vibrate(12);
            supabase
              .from("direct_messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", m.id);
          }
          qc.invalidateQueries({ queryKey: ["dm"] });
          qc.invalidateQueries({ queryKey: ["conversations"] });
          qc.invalidateQueries({ queryKey: ["unread_dm"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [otherId, me?.id, qc]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages?.length]);

  useEffect(() => {
    if (!me?.id || !otherId) return;
    const supabase = createClient();
    supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", me.id)
      .eq("sender_id", otherId)
      .is("read_at", null)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["conversations"] });
        qc.invalidateQueries({ queryKey: ["unread_dm"] });
      });
  }, [otherId, me?.id, messages?.length, qc]);

  const send = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("send_message", {
        p_recipient: otherId,
        p_content: text,
        p_stars: stars,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onMutate: () => vibrate(8),
    onSuccess: () => {
      setText("");
      setStars(0);
      qc.invalidateQueries({ queryKey: ["dm"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["star_balance"] });
      qc.invalidateQueries({ queryKey: ["unread_dm"] });
      inputRef.current?.focus();
    },
    onError: (e) => {
      toast("error", "No se pudo enviar", e.message);
    },
  });

  const sendWithImage = useMutation({
    mutationFn: async () => {
      if (!me?.id || !pendingImage) throw new Error("Sin imagen");
      const supabase = createClient();
      setUploading(true);
      const path = `${me.id}/${crypto.randomUUID()}.jpg`;
      const { data: up, error: ue } = await supabase.storage
        .from("dm-images")
        .upload(path, dataUrlToBlob(pendingImage), {
          contentType: "image/jpeg",
          cacheControl: "31536000",
        });
      if (ue) throw new Error(ue.message);
      const { data: pub } = supabase.storage.from("dm-images").getPublicUrl(up.path);
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: me.id,
        recipient_id: otherId,
        content: text.trim() || "📷 Imagen",
        image_url: pub.publicUrl,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setText("");
      setPendingImage(null);
      qc.invalidateQueries({ queryKey: ["dm"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["unread_dm"] });
      inputRef.current?.focus();
    },
    onError: (e) => toast("error", "No se pudo enviar la imagen", e.message),
    onSettled: () => setUploading(false),
  });

  const muted = useMemo(() => other && other.is_public_profile === false, [other]);

  function pickImage(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("warning", "Formato inválido", "Solo se permiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("warning", "Imagen muy grande", "Máximo 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPendingImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  if (isLoading || !other) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-[60dvh]" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col gap-3 lg:h-[calc(100dvh-10rem)]">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="rounded-xl p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)]"
        >
          <ArrowLeft className="size-5" />
        </button>
        <Link
          href={`/perfil/${otherId}`}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <Avatar
            src={other.avatar_url}
            size={40}
            alt={other.display_name ?? other.username ?? "?"}
          />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold tracking-tight">
              {other.display_name ?? other.username ?? "Atleta"}
            </p>
            {other.username && (
              <p className="truncate text-xs text-[var(--muted)]">@{other.username}</p>
            )}
          </div>
        </Link>
        {muted && (
          <button
            onClick={() => toast("info", "Perfil privado", "Solo podés ver lo que comparte.")}
            aria-label="Perfil privado"
            className="rounded-xl p-2 text-[var(--muted)]"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-2xl bg-[var(--surface-2)] p-4"
      >
        {messages?.length === 0 && (
          <p className="m-auto max-w-xs text-center text-sm text-[var(--muted)]">
            Todavía no hay mensajes. Saludá a {other.display_name ?? "este atleta"} y mandale
            unas estrellas si te gusta su laburo.
          </p>
        )}
        {(messages ?? []).map((m) => {
          const mine = m.sender_id === me?.id;
          return (
            <div
              key={m.id}
              className={cn("flex flex-col", mine ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  mine
                    ? "rounded-br-md bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "rounded-bl-md bg-[var(--surface-2)]"
                )}
              >
                {m.stars > 0 && (
                  <span
                    className={cn(
                      "mb-1 flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                      mine ? "bg-[var(--accent-ink)]/15" : "bg-[var(--accent)]/15 text-[var(--accent)]"
                    )}
                  >
                    <Star className="size-3 fill-current" /> {m.stars}
                  </span>
                )}
                {m.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.image_url}
                    alt="Imagen del chat"
                    loading="lazy"
                    className={cn(
                      "mb-1.5 max-h-64 w-full max-w-full rounded-xl object-cover",
                      mine && "bg-[var(--accent-ink)]/10"
                    )}
                  />
                )}
                {m.content !== "📷 Imagen" && (
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                )}
                <p
                  className={cn(
                    "mt-1 text-right text-[10px]",
                    mine ? "text-[var(--accent-ink)]/70" : "text-[var(--muted)]"
                  )}
                >
                  {formatTime(m.created_at)}
                  {mine && m.read_at && " · leído"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-end gap-2">
        {pendingImage && (
          <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImage}
              alt="Vista previa"
              className="h-40 w-full rounded-xl object-cover"
            />
            <button
              onClick={() => setPendingImage(null)}
              disabled={uploading}
              aria-label="Quitar imagen"
              className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform active:scale-90 disabled:opacity-40"
            >
              <X className="size-4" />
            </button>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Agregá un comentario…"
              className="mt-1.5 h-9 border-0 bg-transparent text-sm focus:ring-0"
            />
          </div>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[var(--surface-2)] p-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              pickImage(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => {
              vibrate(6);
              fileRef.current?.click();
            }}
            aria-label="Adjuntar imagen"
            className="flex shrink-0 items-center justify-center rounded-xl p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <ImagePlus className="size-5" />
          </button>
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing && text.trim()) {
                if (pendingImage) {
                  sendWithImage.mutate();
                } else {
                  send.mutate();
                }
              }
            }}
            placeholder={pendingImage ? "Comentario…" : "Escribí un mensaje…"}
            className="border-0 bg-transparent focus:ring-0"
          />
          <button
            onClick={() => {
              vibrate(6);
              setStars((s) => (s > 0 ? 0 : 1));
            }}
            disabled={(balance ?? 0) < stars + 1}
            aria-label="Enviar estrellas"
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold transition-colors",
              stars > 0
                ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
            )}
          >
            <Star className={cn("size-4", stars > 0 && "fill-current")} />
            {stars > 0 && stars}
          </button>
          {stars > 0 && (
            <span className="shrink-0 text-[10px] text-[var(--muted)]">saldo: {balance ?? 0}</span>
          )}
        </div>
        <button
          onClick={() => (pendingImage ? sendWithImage.mutate() : send.mutate())}
          disabled={
            (!text.trim() && !pendingImage) || send.isPending || sendWithImage.isPending || uploading
          }
          aria-label="Enviar"
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-ink)] transition-transform active:scale-95 disabled:opacity-40"
        >
          <Send className="size-5" />
        </button>
      </div>
    </div>
  );
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}