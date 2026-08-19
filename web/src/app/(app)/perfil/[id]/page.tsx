"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Flame,
  Scale,
  Users,
  UserPlus,
  UserCheck,
  Play,
  Lock,
  Ruler,
  MessageCircle,
  Music4,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { playlistThumb } from "@/lib/utils";
import { SpotifyNowCard } from "@/components/spotify-now";
import { Skeleton, Avatar } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/data";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useProfile } from "@/components/providers";
import { NetDialog } from "@/components/net-dialog";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn, vibrate } from "@/lib/utils";

type PublicProfile = {
  id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  accent_color: string | null;
  streak_count: number | null;
  is_public_profile: boolean;
  show_weight: boolean;
  show_height: boolean;
  show_followers: boolean;
  show_personal: boolean;
} & Record<string, unknown>;

type PublicPost = {
  id: string;
  type: string;
  caption: string | null;
  created_at: string;
  recipe: { id: string; name: string; calories: number } | null;
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const me = useProfile((s) => s.profile);
  const [pendingFollow, setPendingFollow] = useState(false);
  const [netOpen, setNetOpen] = useState(false);

  const { data: target, isLoading } = useQuery({
    queryKey: ["public_profile", id],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("public_profiles")
        .select(
          "id, display_name, username, bio, avatar_url, banner_url, accent_color, streak_count, is_public_profile, show_weight, show_height, show_followers, show_personal"
        )
        .eq("id", id)
        .maybeSingle();
      return data as unknown as PublicProfile | null;
    },
  });

  const { data: followersCount } = useQuery({
    queryKey: ["followers_count", id],
    queryFn: async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from("followers")
        .select("follower_id", { count: "exact", head: true })
        .eq("following_id", id);
      return count ?? 0;
    },
    enabled: !!target,
  });

  const { data: followingCount } = useQuery({
    queryKey: ["following_count", id],
    queryFn: async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from("followers")
        .select("following_id", { count: "exact", head: true })
        .eq("follower_id", id);
      return count ?? 0;
    },
    enabled: !!target,
  });

  const { data: iFollow } = useQuery({
    queryKey: ["i_follow", id],
    queryFn: async () => {
      if (!me?.id) return false;
      const supabase = createClient();
      const { data } = await supabase
        .from("followers")
        .select("follower_id")
        .eq("follower_id", me.id)
        .eq("following_id", id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!target && !!me?.id,
  });

  const { data: isBestFriend } = useQuery({
    queryKey: ["is_best_friend", id],
    queryFn: async () => {
      if (!me?.id) return false;
      const supabase = createClient();
      const { data } = await supabase
        .from("followers")
        .select("is_best_friend")
        .eq("follower_id", me.id)
        .eq("following_id", id)
        .maybeSingle();
      return !!data?.is_best_friend;
    },
    enabled: !!target && !!me?.id && !!iFollow,
  });

  const { data: posts } = useQuery({
    queryKey: ["user_posts", id],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("feed_posts")
        .select("id, type, caption, created_at, recipe:recipes(id, name, calories)")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(30);
      return (data ?? []) as unknown as PublicPost[];
    },
    enabled: !!target,
  });

  const { data: playlists } = useQuery({
    queryKey: ["user_playlists", id],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("playlists")
        .select("id, provider, name, artist, url, thumbnail_url")
        .eq("user_id", id)
        .order("created_at", { ascending: false });
      return (data ?? []) as {
        id: string;
        provider: string;
        name: string;
        artist: string | null;
        url: string | null;
        thumbnail_url: string | null;
      }[];
    },
    enabled: !!target,
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!me?.id || !target) return;
      const supabase = createClient();
      if (iFollow) {
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", me.id)
          .eq("following_id", target.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("followers")
          .insert({ follower_id: me.id, following_id: target.id });
        if (error) throw new Error(error.message);
      }
    },
    onMutate: () => setPendingFollow(true),
    onSettled: () => setPendingFollow(false),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["i_follow"] });
      qc.invalidateQueries({ queryKey: ["is_best_friend"] });
      qc.invalidateQueries({ queryKey: ["followers_count"] });
      toast("success", iFollow ? "Dejaste de seguir" : "Siguiendo");
    },
    onError: (e) => toast("error", "No se pudo actualizar", e.message),
  });

  const toggleBestFriend = useMutation({
    mutationFn: async () => {
      if (!me?.id || !target || !iFollow) return;
      const supabase = createClient();
      const { error } = await supabase
        .from("followers")
        .update({ is_best_friend: !isBestFriend })
        .eq("follower_id", me.id)
        .eq("following_id", target.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["is_best_friend"] });
      qc.invalidateQueries({ queryKey: ["best_friends"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast(
        "success",
        isBestFriend ? "Dejó de ser mejor amigo" : "Mejor amigo",
        isBestFriend
          ? "Sus posts de mejores amigos ya no te llegan"
          : "Vas a ver sus posts de mejores amigos en el feed"
      );
    },
    onError: (e) => toast("error", "No se pudo actualizar", e.message),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 ">
        <Skeleton className="h-40" />
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!target) {
    return (
      <EmptyState
        icon={<Lock className="size-6" />}
        title="Perfil no disponible"
        description="Este perfil es privado o no existe."
        action={
          <Link href="/explorar">
            <Button variant="outline">Volver a Social</Button>
          </Link>
        }
      />
    );
  }

  const isMine = target.id === me?.id;
  const name = target.display_name ?? target.username ?? "Atleta";

  return (
    <div className="flex flex-col gap-5 ">
      <div className="card overflow-hidden">
        {Boolean(target.banner_url) && (
          <div className="h-36 w-full">
            <img
              src={String(target.banner_url)}
              alt=""
              className="size-full object-cover"
            />
          </div>
        )}
        <div className="px-5 pb-5" style={target.banner_url ? undefined : { paddingTop: "1.25rem" }}>
          <div className="-mt-10 flex items-end justify-between">
            <span
              className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-[var(--surface)] bg-[var(--surface-3)] font-display text-2xl font-bold"
              style={
                target.accent_color
                  ? { background: "var(--accent-soft)", color: "var(--accent)" }
                  : undefined
              }
            >
              <Avatar
                src={target.avatar_url}
                alt={name}
                initialsText={name}
                className="size-full rounded-none border-0 text-2xl"
                size={80}
              />
            </span>
            {!isMine && me?.id && (
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/mensajes/${target.id}`}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-[var(--surface-2)] px-3 text-sm font-semibold transition-colors hover:bg-[var(--surface-3)]"
                >
                  <MessageCircle className="size-4" /> Mensaje
                </Link>
                <Button
                  variant={iFollow ? "outline" : "accent"}
                  onClick={() => {
                    vibrate(12);
                    toggleFollow.mutate();
                  }}
                  disabled={pendingFollow}
                >
                  {iFollow ? (
                    <>
                      <UserCheck className="size-4" /> Siguiendo
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-4" /> Seguir
                    </>
                  )}
                </Button>
                {iFollow && (
                  <button
                    onClick={() => {
                      vibrate(8);
                      toggleBestFriend.mutate();
                    }}
                    disabled={toggleBestFriend.isPending}
                    aria-label={isBestFriend ? "Quitar de mejores amigos" : "Marcar como mejor amigo"}
                    title={isBestFriend ? "Mejor amigo" : "Marcar como mejor amigo"}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl border transition-all active:scale-90",
                      isBestFriend
                        ? "border-[#22c55e]/50 bg-[#22c55e]/15 text-[#22c55e]"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-[#22c55e]/40 hover:text-[#22c55e]"
                    )}
                  >
                    <Star className={cn("size-4", isBestFriend && "fill-current")} />
                  </button>
                )}
              </div>
            )}
            {isMine && (
              <Link href="/perfil">
                <Button variant="outline">Editar mi perfil</Button>
              </Link>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-display text-2xl font-bold tracking-tight">{name}</h1>
            {target.username && (
              <span className="text-sm font-semibold text-[var(--muted)]">
                @{target.username}
              </span>
            )}
            {!target.is_public_profile && (
              <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                <Lock className="mr-1 inline size-3" />
                Privado
              </span>
            )}
          </div>
          {Boolean(target.bio) && (target.show_personal || isMine) && (
            <p className="mt-2 max-w-xl text-sm text-[var(--text-2)]">{String(target.bio)}</p>
          )}
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="rounded-xl bg-[var(--surface-2)] p-3 text-center">
              <p className="font-display text-sm font-bold">{target.streak_count ?? 0} días</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">Racha</p>
            </div>
            <button
              onClick={() => setNetOpen(true)}
              disabled={!target.show_followers && !isMine}
              className={cn(
                "rounded-xl bg-[var(--surface-2)] p-3 text-center transition-colors",
                (target.show_followers || isMine) && "hover:bg-[var(--surface-3)]"
              )}
            >
              <p className="font-display text-sm font-bold">
                {target.show_followers || isMine ? followersCount ?? 0 : "—"}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Seguidores
              </p>
            </button>
            <button
              onClick={() => setNetOpen(true)}
              disabled={!target.show_followers && !isMine}
              className={cn(
                "rounded-xl bg-[var(--surface-2)] p-3 text-center transition-colors",
                (target.show_followers || isMine) && "hover:bg-[var(--surface-3)]"
              )}
            >
              <p className="font-display text-sm font-bold">
                {target.show_followers || isMine ? followingCount ?? 0 : "—"}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Seguidos
              </p>
            </button>
            {target.show_weight !== false && (target as { weight_kg?: number }).weight_kg ? (
              <div className="rounded-xl bg-[var(--surface-2)] p-3 text-center">
                <p className="font-display text-sm font-bold">
                  {(target as { weight_kg?: number }).weight_kg} kg
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">Peso</p>
              </div>
            ) : null}
          </div>
          {(target.show_height || isMine) && (target as { height_cm?: number }).height_cm ? (
            <p className="mt-3 text-xs text-[var(--muted)]">
              <Ruler className="mr-1 inline size-3.5" />
              {(target as { height_cm?: number }).height_cm} cm de altura
            </p>
          ) : null}
        </div>
      </div>

      <NetDialog
        open={netOpen}
        onClose={() => setNetOpen(false)}
        userId={target.id}
        isMine={isMine}
      />

      {!isMine && !target.is_public_profile && !iFollow ? (
        <EmptyState
          icon={<Lock className="size-6" />}
          title="Perfil privado"
          description="Seguí a este atleta para ver sus logros, playlists y publicaciones."
        />
      ) : (
        <>
          {playlists && playlists.length > 0 && (
            <section className="card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Play className="size-5 text-[var(--accent)]" />
                <h2 className="font-display text-lg font-bold tracking-tight">Playlists</h2>
              </div>
              <div className="flex flex-col gap-2">
                {playlists.map((p) => (
                  <a
                    key={p.id}
                    href={p.url ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5 transition-colors hover:bg-[var(--surface-2)]"
                  >
                    {p.thumbnail_url ? (
                      <img
                        src={p.thumbnail_url}
                        alt=""
                        className="size-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-3)] text-sm font-bold uppercase">
                        {p.provider.slice(0, 1)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      {p.artist && (
                        <p className="truncate text-xs text-[var(--muted)]">{p.artist}</p>
                      )}
                    </div>
                    <span className="text-xs font-bold uppercase text-[var(--muted)]">
                      {p.provider}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {(posts ?? []).length > 0 && (
            <section className="card p-5">
              <h2 className="font-display text-lg font-bold tracking-tight">Publicaciones</h2>
              <div className="mt-3 flex flex-col gap-2">
                {posts?.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl bg-[var(--surface-2)]/60 px-3.5 py-3 text-sm"
                  >
                    {p.type === "recipe" && p.recipe ? (
                      <p>
                        <strong>Recomienda:</strong> {p.recipe.name} · {p.recipe.calories} kcal
                      </p>
                    ) : p.caption ? (
                      <p>{p.caption}</p>
                    ) : (
                      <p className="text-[var(--muted)]">Publicación de entrenamiento</p>
                    )}
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          </>
      )}
    </div>
  );
}