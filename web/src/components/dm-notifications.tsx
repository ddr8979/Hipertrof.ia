"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/providers";
import { Avatar } from "@/components/ui/primitives";
import { vibrate } from "@/lib/utils";

type Incoming = {
  id: string;
  sender_id: string;
  content: string;
  stars: number;
  created_at: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

let audioCtx: AudioContext | null = null;

function playDmSound() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    const notes: [number, number, number][] = [
      [880, now, 0.09],
      [1174.66, now + 0.1, 0.14],
    ];
    for (const [freq, start, dur] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    }
  } catch {
    /* sin audio */
  }
}

export function DmNotifications() {
  const me = useProfile((s) => s.profile);
  const pathname = usePathname();
  const [incoming, setIncoming] = useState<Incoming | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const seen = useRef<Set<string>>(new Set());

  const notify = useCallback((m: Incoming) => {
    if (seen.current.has(m.id)) return;
    seen.current.add(m.id);
    playDmSound();
    vibrate(18);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("hypertrof.ia", {
          body: `${m.display_name ?? m.username ?? "Nuevo mensaje"}: ${m.content}`,
          tag: "dm",
          icon: "/icons/icon-192.png",
        });
      } catch {
        /* sin notificación */
      }
    }
    setIncoming(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setIncoming(null), 5000);
  }, []);

  useEffect(() => {
    if (!me?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel("dm-inbox")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${me.id}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            sender_id: string;
            content: string;
            stars: number;
            created_at: string;
          };
          const { data: author } = await supabase
            .from("profiles")
            .select("display_name, username, avatar_url")
            .eq("id", row.sender_id)
            .maybeSingle();
          const msg: Incoming = {
            ...row,
            display_name: (author as { display_name?: string | null } | null)?.display_name ?? null,
            username: (author as { username?: string | null } | null)?.username ?? null,
            avatar_url: (author as { avatar_url?: string | null } | null)?.avatar_url ?? null,
          };
          notify(msg);
        }
      )
      .subscribe();
    const poll = setInterval(async () => {
      if (!me.id) return;
      const { data: fresh } = await supabase
        .from("direct_messages")
        .select("id, sender_id, content, stars, created_at")
        .eq("recipient_id", me.id)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(3);
      for (const row of (fresh ?? []) as {
        id: string;
        sender_id: string;
        content: string;
        stars: number;
        created_at: string;
      }[]) {
        if (seen.current.has(row.id)) continue;
        const { data: author } = await supabase
          .from("profiles")
          .select("display_name, username, avatar_url")
          .eq("id", row.sender_id)
          .maybeSingle();
        notify({
          ...row,
          display_name: (author as { display_name?: string | null } | null)?.display_name ?? null,
          username: (author as { username?: string | null } | null)?.username ?? null,
          avatar_url: (author as { avatar_url?: string | null } | null)?.avatar_url ?? null,
        });
      }
    }, 3000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [me?.id]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (!incoming) return null;
  const inChat = pathname === `/mensajes/${incoming.sender_id}`;
  if (inChat) return null;

  return (
    <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-[fade-up_0.3s_cubic-bezier(0.16,1,0.3,1)_both]">
      <Link
        href={`/mensajes/${incoming.sender_id}`}
        className="glass flex items-center gap-3 rounded-2xl border border-[var(--border)] p-3 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.3)]"
      >
        <Avatar
          src={incoming.avatar_url}
          size={40}
          alt={incoming.display_name ?? incoming.username ?? "?"}
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-bold">
            {incoming.display_name ?? incoming.username ?? "Nuevo mensaje"}
            {incoming.stars > 0 && (
              <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-[var(--accent)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent)]">
                <Star className="size-2.5 fill-current" /> {incoming.stars}
              </span>
            )}
          </p>
          <p className="truncate text-sm text-[var(--text-2)]">{incoming.content}</p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            setIncoming(null);
          }}
          aria-label="Cerrar"
          className="shrink-0 rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)]"
        >
          <X className="size-4" />
        </button>
      </Link>
    </div>
  );
}