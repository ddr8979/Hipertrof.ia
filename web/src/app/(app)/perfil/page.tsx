"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  ChartLine,
  Check,
  Flame,
  Music4,
  Plus,
  Pencil,
  Trash2,
  Trophy,
  CalendarCheck,
  Dumbbell,
  Medal,
  Rocket,
  Zap,
  Cpu,
  Weight,
  ShieldCheck,
  Play,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { playlistThumb, splitEmojiRuns } from "@/lib/utils";
import { SpotifyNowCard, SpotifyConnectCard } from "@/components/spotify-now";
import { ProfileTrackPlayer, SocialCircles, VerifiedBadge } from "@/components/profile-bits";
import { PlanBadge } from "@/components/plan-badge";
import { NetDialog } from "@/components/net-dialog";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/data";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useProfile } from "@/components/providers";
import { ICONS, PROVIDERS } from "@/lib/profile-meta";
import { cn, vibrate } from "@/lib/utils";

type Achievement = {
  achievement: { code: string; name: string; description: string; icon: string; category: string };
  unlocked_at: string;
};

type Playlist = {
  id: string;
  provider: string;
  name: string;
  artist: string | null;
  url: string | null;
  thumbnail_url: string | null;
};

export default function PerfilPage() {
  const profile = useProfile((s) => s.profile);
  const setProfile = useProfile((s) => s.setProfile);
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [viewImg, setViewImg] = useState(false);
  const [username, setUsername] = useState(profile?.username ?? "");
  const [name, setName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState((profile?.bio as string) ?? "");
  const [weight, setWeight] = useState(profile?.weight_kg?.toString() ?? "");
  const [accent, setAccent] = useState(profile?.accent_color ?? "#a3e635");
  const [showWeight, setShowWeight] = useState(profile?.show_weight !== false);
  const [showHeight, setShowHeight] = useState(profile?.show_height !== false);
  const [showFollowers, setShowFollowers] = useState(profile?.show_followers !== false);
  const [showPersonal, setShowPersonal] = useState(profile?.show_personal !== false);
  const [showCalories, setShowCalories] = useState(profile?.show_calories !== false);
  const [igHandle, setIgHandle] = useState((profile?.instagram_handle as string) ?? "");
  const [ttHandle, setTtHandle] = useState((profile?.tiktok_handle as string) ?? "");
  const [twHandle, setTwHandle] = useState((profile?.twitter_handle as string) ?? "");
  const [spHandle, setSpHandle] = useState((profile?.spotify_handle as string) ?? "");
  const [trackName, setTrackName] = useState((profile?.profile_track_name as string) ?? "");
  const [trackArtist, setTrackArtist] = useState((profile?.profile_track_artist as string) ?? "");
  const [trackPreview, setTrackPreview] = useState((profile?.profile_track_preview as string) ?? "");
  const [trackId, setTrackId] = useState((profile?.profile_track_id as string) ?? "");
  const [trackCover, setTrackCover] = useState((profile?.profile_track_cover as string) ?? "");
  const [netOpen, setNetOpen] = useState(false);

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);

  const { data: playlists } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("playlists")
        .select("id, provider, name, artist, url, thumbnail_url")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as Playlist[];
    },
  });

  const { data: netCounts } = useQuery({
    queryKey: ["net_counts"],
    queryFn: async () => {
      const supabase = createClient();
      const [followers, following] = await Promise.all([
        supabase
          .from("followers")
          .select("follower_id", { count: "exact", head: true })
          .eq("following_id", profile!.id),
        supabase
          .from("followers")
          .select("following_id", { count: "exact", head: true })
          .eq("follower_id", profile!.id),
      ]);
      return { followers: followers.count ?? 0, following: following.count ?? 0 };
    },
  });

  async function uploadImage(kind: "avatar" | "banner", file: File) {
    if (!profile) return;
    setUploading(kind);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${profile.id}/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(kind === "avatar" ? "avatars" : "banners")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const { data: pub } = supabase.storage
        .from(kind === "avatar" ? "avatars" : "banners")
        .getPublicUrl(path);
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ [kind === "avatar" ? "avatar_url" : "banner_url"]: pub.publicUrl })
        .eq("id", profile.id);
      if (updErr) throw new Error(updErr.message);
      const { data: fresh } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profile.id)
        .single();
      if (fresh) setProfile(fresh as never);
      toast("success", kind === "avatar" ? "Avatar actualizado" : "Banner actualizado");
    } catch (e) {
      toast("error", "No se pudo subir la imagen", (e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  const saveProfile = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: name.trim() || null,
          username: username.trim() || null,
          bio: bio.trim() || null,
          weight_kg: weight ? Number(weight) : null,
          accent_color: accent,
          show_weight: showWeight,
          show_height: showHeight,
          show_followers: showFollowers,
          show_personal: showPersonal,
          show_calories: showCalories,
          instagram_handle: igHandle.trim().replace(/^@/, "") || null,
          tiktok_handle: ttHandle.trim().replace(/^@/, "") || null,
          twitter_handle: twHandle.trim().replace(/^@/, "") || null,
          spotify_handle: spHandle.trim().replace(/^@/, "") || null,
          profile_track_id: trackId || null,
          profile_track_name: trackName || null,
          profile_track_artist: trackArtist || null,
          profile_track_preview: trackPreview || null,
        })
        .eq("id", profile!.id);
      if (error) throw new Error(error.message);
      const { data: fresh } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profile!.id)
        .single();
      if (fresh) setProfile(fresh as never);
    },
    onSuccess: () => {
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast("success", "Perfil actualizado");
    },
    onError: (e) => toast("error", "No se pudo guardar", e.message),
  });

  const addPlaylist = useMutation({
    mutationFn: async (p: {
      provider: string;
      name: string;
      artist: string | null;
      url: string;
      thumbnail_url: string | null;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.from("playlists").insert({
        user_id: profile!.id,
        provider: p.provider,
        name: p.name,
        artist: p.artist || null,
        url: p.url || null,
        thumbnail_url: p.thumbnail_url,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setPlaylistOpen(false);
      qc.invalidateQueries({ queryKey: ["playlists"] });
      toast("success", "Playlist agregada");
    },
    onError: (e) => toast("error", "No se pudo agregar", e.message),
  });

  const removePlaylist = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("playlists").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playlists"] });
      toast("success", "Playlist eliminada");
    },
    onError: (e) => toast("error", "No se pudo eliminar", e.message),
  });

  if (!profile) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SpotifyNowCard />
      <SpotifyConnectCard />
      {/* Header */}
      <div className="card overflow-hidden">
        <div className="relative h-36 bg-[var(--surface-2)] sm:h-44">
          {profile.banner_url ? (
            <img src={String(profile.banner_url)} alt="" className="size-full object-cover" />
          ) : (
            <div
              className="size-full opacity-25"
              style={{
                background:
                  "repeating-conic-gradient(var(--accent) 0% 25%, transparent 0% 50%) 50% / 24px 24px",
              }}
            />
          )}
          <input
            ref={bannerInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadImage("banner", f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => bannerInput.current?.click()}
            disabled={uploading !== null}
            className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-xl bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
            title="Cambiar banner"
          >
            <Camera className="size-4" />
          </button>
        </div>
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between gap-3">
            <div className="relative">
              <button
                onClick={() => {
                  if (profile.avatar_url) {
                    vibrate(6);
                    setViewImg(true);
                  }
                }}
                disabled={!profile.avatar_url}
                aria-label="Ampliar foto de perfil"
                className={cn(
                  "flex size-20 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--surface)] bg-[var(--surface-3)] font-display text-2xl font-bold transition-transform",
                  profile.avatar_url && "active:scale-95 cursor-zoom-in"
                )}
              >
                {profile.avatar_url ? (
                  <img src={String(profile.avatar_url)} alt="" className="size-full object-cover" />
                ) : (
                  (profile.display_name ?? "?")[0]?.toUpperCase()
                )}
              </button>
              <input
                ref={avatarInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage("avatar", f);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => avatarInput.current?.click()}
                disabled={uploading !== null}
                className="absolute -right-1.5 -bottom-1.5 flex size-8 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] transition-transform hover:scale-105 active:scale-90"
                title="Cambiar avatar"
              >
                <Camera className="size-4" />
              </button>
            </div>
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 self-end pl-4">
              <Link href="/progreso">
                <Button variant="outline" size="sm">
                  <ChartLine className="size-4" /> Progreso
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" /> Editar perfil
              </Button>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight break-words leading-tight">
                {splitEmojiRuns(profile.display_name ?? profile.username ?? "Sin nombre").map((s, i) =>
                  s.emoji ? (
                    <span key={i} className="text-[var(--text)]">
                      {s.text}
                    </span>
                  ) : (
                    <span key={i} className="text-white">
                      {s.text}
                    </span>
                  )
                )}
              </h1>
              {(profile as { is_verified?: boolean }).is_verified && <VerifiedBadge size={18} />}
              <PlanBadge plan={profile.plan as never} />
            </div>
            {profile.username && (
              <span className="break-words text-sm font-semibold leading-snug text-[var(--muted)]">@{profile.username}</span>
            )}
          </div>
          {Boolean(profile.bio) && (
            <p className="mt-2 max-w-xl text-sm text-[var(--text-2)]">{String(profile.bio)}</p>
          )}
          <SocialCircles
            handles={profile as never}
            className="mt-3"
          />
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            <button
              onClick={() => setNetOpen(true)}
              className="text-left transition-opacity hover:opacity-70"
            >
              <strong className="font-display text-base font-bold">
                {profile.streak_count ?? 0}
              </strong>{" "}
              <span className="text-[var(--muted)]">días de racha</span>
            </button>
            <span className="text-[var(--muted)]">·</span>
            {profile.show_weight !== false && (
              <>
                <span>
                  <strong className="font-display text-base font-bold">
                    {profile.weight_kg ? `${profile.weight_kg}` : "—"}
                  </strong>{" "}
                  <span className="text-[var(--muted)]">kg</span>
                </span>
                <span className="text-[var(--muted)]">·</span>
              </>
            )}
            <button
              onClick={() => setNetOpen(true)}
              className="text-left transition-opacity hover:opacity-70"
            >
              <strong className="font-display text-base font-bold">
                {netCounts?.followers ?? 0}
              </strong>{" "}
              <span className="text-[var(--muted)]">seguidores</span>
            </button>
            <span className="text-[var(--muted)]">·</span>
            <button
              onClick={() => setNetOpen(true)}
              className="text-left transition-opacity hover:opacity-70"
            >
              <strong className="font-display text-base font-bold">
                {netCounts?.following ?? 0}
              </strong>{" "}
              <span className="text-[var(--muted)]">seguidos</span>
            </button>
            <span className="text-[var(--muted)]">·</span>
            {profile.show_calories !== false && (
              <span>
                <strong className="font-display text-base font-bold">
                  {profile.tdee_kcal ? `${profile.tdee_kcal}` : "—"}
                </strong>{" "}
                <span className="text-[var(--muted)]">kcal TDEE</span>
              </span>
            )}
          </div>
        </div>
      </div>



      {/* Tema del perfil */}
      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music4 className="size-5 text-[var(--accent)]" />
            <h2 className="font-display text-lg font-bold tracking-tight">Tema del perfil</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> {profile.profile_track_name ? "Cambiar" : "Elegir"}
          </Button>
        </div>
        <ProfileTrackPlayer
          name={profile.profile_track_name as string | null}
          artist={profile.profile_track_artist as string | null}
          previewUrl={profile.profile_track_preview as string | null}
          coverUrl={profile.profile_track_cover as string | null}
        />
      </section>

      {/* Playlist */}
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music4 className="size-5 text-[var(--accent)]" />
            <h2 className="font-display text-lg font-bold tracking-tight">Playlist</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPlaylistOpen(true)}>
            <Plus className="size-4" /> Agregar
          </Button>
        </div>
        {(playlists ?? []).length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Agregá playlists de Spotify, Apple Music o YouTube Music para compartirlas en tu perfil.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {playlists?.map((p) => {
              const meta = PROVIDERS.find((x) => x.id === p.provider);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5"
                >
                  {p.thumbnail_url ? (
                    <PlaylistThumb
                      src={playlistThumb(p.thumbnail_url) ?? ""}
                      meta={meta}
                    />
                  ) : (
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ background: meta?.color ?? "#555" }}
                    >
                      <Music4 className="size-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      {p.artist ?? meta?.label ?? p.provider}
                    </p>
                  </div>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[var(--accent)] hover:underline"
                    >
                      Abrir
                    </a>
                  )}
                  <button
                    onClick={() => removePlaylist.mutate(p.id)}
                    className="text-[var(--muted)] transition-colors hover:text-[var(--danger)]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Editar perfil */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar perfil"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button variant="accent" onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
              <Check className="size-4" /> Guardar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Nombre visible">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
          </Field>
          <Field label="Username">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@usuario" />
          </Field>
          <Field label="Bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Contá algo sobre tu entrenamiento..."
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </Field>
          <Field label="Color de acento">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="size-10 cursor-pointer rounded-xl border border-[var(--border)] bg-transparent p-1"
                />
                <span className="text-sm font-mono text-[var(--text-2)]">{accent}</span>
              </div>
            </Field>

          <div className="rounded-xl bg-[var(--surface-2)]/60 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Redes sociales
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Instagram">
                <Input
                  value={igHandle}
                  onChange={(e) => setIgHandle(e.target.value)}
                  placeholder="@usuario"
                />
              </Field>
              <Field label="TikTok">
                <Input
                  value={ttHandle}
                  onChange={(e) => setTtHandle(e.target.value)}
                  placeholder="@usuario"
                />
              </Field>
              <Field label="X / Twitter">
                <Input
                  value={twHandle}
                  onChange={(e) => setTwHandle(e.target.value)}
                  placeholder="@usuario"
                />
              </Field>
              <Field label="Spotify">
                <Input
                  value={spHandle}
                  onChange={(e) => setSpHandle(e.target.value)}
                  placeholder="usuario o ID"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-xl bg-[var(--surface-2)]/60 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Tema del perfil
            </p>
            <TrackPicker
              value={{ name: trackName, artist: trackArtist, preview: trackPreview }}
              onChange={(t) => {
                setTrackId(t.id);
                setTrackName(t.name);
                setTrackArtist(t.artist);
                setTrackPreview(t.preview);
                setTrackCover(t.cover ?? "");
              }}
              onClear={() => {
                setTrackId("");
                setTrackName("");
                setTrackArtist("");
                setTrackPreview("");
                setTrackCover("");
              }}
            />
          </div>

          <div className="rounded-xl bg-[var(--surface-2)]/60 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Visibilidad pública
            </p>
            <div className="flex flex-col gap-2.5">
              {(
                [
                  {
                    key: showWeight,
                    set: setShowWeight,
                    label: "Peso actual",
                    desc: "Mostrar tu peso en el perfil",
                  },
                  {
                    key: showHeight,
                    set: setShowHeight,
                    label: "Altura",
                    desc: "Mostrar tu altura en el perfil",
                  },
                  {
                    key: showFollowers,
                    set: setShowFollowers,
                    label: "Seguidores y seguidos",
                    desc: "Mostrar tus listas de la red",
                  },
                  {
                    key: showPersonal,
                    set: setShowPersonal,
                    label: "Datos personales",
                    desc: "Bio, edad y datos del perfil",
                  },
                  {
                    key: showCalories,
                    set: setShowCalories,
                    label: "Calorías",
                    desc: "Mostrar tus kcal (TDEE) en el perfil",
                  },
                ] as { key: boolean; set: (v: boolean) => void; label: string; desc: string }[]
              ).map((t) => (
                <div key={t.label} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{t.label}</p>
                    <p className="text-xs text-[var(--muted)]">{t.desc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={t.key}
                    onClick={() => t.set(!t.key)}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      t.key ? "bg-[var(--accent)]" : "bg-[var(--surface-3)]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-5 rounded-full bg-white transition-all",
                        t.key ? "left-[22px]" : "left-0.5"
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      {/* Agregar playlist */}
      <Dialog
        open={playlistOpen}
        onClose={() => setPlaylistOpen(false)}
        title="Agregar playlist"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="ghost" onClick={() => setPlaylistOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="accent"
              form="playlist-form"
              type="submit"
              disabled={addPlaylist.isPending}
            >
              Agregar
            </Button>
          </div>
        }
      >
        <PlaylistForm
          onSave={(p) => addPlaylist.mutate(p, { onSuccess: () => setPlaylistOpen(false) })}
        />
      </Dialog>

      {/* Red: seguidores / seguidos */}
      <NetDialog
        open={netOpen}
        onClose={() => setNetOpen(false)}
        userId={profile!.id}
        isMine
      />

      {/* Foto de perfil ampliada */}
      <Dialog open={viewImg} onClose={() => setViewImg(false)} title={profile.display_name ?? "Foto de perfil"}>
        <div className="mx-auto w-full max-w-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={String(profile.avatar_url)}
            alt=""
            className="size-full max-h-[70dvh] rounded-2xl object-contain"
            onClick={() => setViewImg(false)}
          />
        </div>
      </Dialog>
    </div>
  );
}

function PlaylistForm({
  onSave,
}: {
  onSave: (p: {
    provider: string;
    name: string;
    artist: string | null;
    url: string;
    thumbnail_url: string | null;
  }) => void;
}) {
  const [url, setUrl] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [name, setName] = useState("");
  const [artist, setArtist] = useState("");
  const [provider, setProvider] = useState("spotify");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  async function detect() {
    if (!url.trim()) return;
    setDetecting(true);
    try {
      const res = await fetch(`/api/oembed?url=${encodeURIComponent(url.trim())}`);
      const data = (await res.json()) as {
        title?: string;
        thumbnail_url?: string | null;
        provider?: string;
      };
      if (data.title) setName(data.title);
      if (data.thumbnail_url) setThumbnailUrl(data.thumbnail_url);
      if (data.provider) setProvider(data.provider);
      if (!data.title) {
        toast("error", "No se pudo detectar", "Probá con un link de Spotify, YouTube o Apple Music");
      }
    } catch {
      toast("error", "No se pudo detectar", "Verificá el enlace");
    } finally {
      setDetecting(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      toast("error", "Completá el nombre y el enlace");
      return;
    }
    if (!thumbnailUrl) {
      void (async () => {
        try {
          const res = await fetch(`/api/oembed?url=${encodeURIComponent(url.trim())}`);
          const data = (await res.json()) as {
            title?: string;
            thumbnail_url?: string | null;
            provider?: string;
          };
          onSave({
            provider: data.provider ?? provider,
            name: name.trim(),
            artist: artist.trim() || null,
            url: url.trim(),
            thumbnail_url: data.thumbnail_url ?? null,
          });
        } catch {
          onSave({
            provider,
            name: name.trim(),
            artist: artist.trim() || null,
            url: url.trim(),
            thumbnail_url: null,
          });
        }
      })();
      return;
    }
    onSave({
      provider,
      name: name.trim(),
      artist: artist.trim() || null,
      url: url.trim(),
      thumbnail_url: thumbnailUrl,
    });
  }

  return (
    <form id="playlist-form" onSubmit={submit} className="flex flex-col gap-3">
      <Field label="Enlace" hint="Spotify, YouTube o Apple Music">
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://open.spotify.com/..."
            required
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void detect()}
            loading={detecting}
            className="shrink-0"
          >
            Detectar
          </Button>
        </div>
      </Field>
      {thumbnailUrl && (
        <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnailUrl} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name || "Sin título"}</p>
            <p className="text-xs capitalize text-[var(--muted)]">{provider}</p>
          </div>
        </div>
      )}
      <Field label="Nombre">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Playlist de powerlifting" required />
      </Field>
      <Field label="Artista o creador">
        <Input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Mi banda favorita" />
      </Field>
    </form>
  );
}

function PlaylistThumb({ src, meta }: { src: string; meta?: { color: string } }) {
  const [candidates, setCandidates] = useState<string[] | null>(null);
  const list = (candidates ?? (src ? [src, playlistThumb(src)].filter((x): x is string => !!x) : [])) as string[];
  const current = list[0] ?? "";
  if (!current) {
    return (
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white"
        style={{ background: meta?.color ?? "#555" }}
      >
        <Music4 className="size-4" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      referrerPolicy="no-referrer"
      onError={() => setCandidates(list.slice(1))}
      alt=""
      className="size-11 shrink-0 rounded-lg object-cover"
    />
  );
}

type TrackPick = { id: string; name: string; artist: string; preview: string; hasPreview?: boolean; cover?: string };

function TrackPicker({
  value,
  onChange,
  onClear,
}: {
  value: { name: string; artist: string; preview: string };
  onChange: (t: TrackPick) => void;
  onClear: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<(TrackPick & { hasPreview?: boolean })[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchFromUrl(url: string): Promise<(TrackPick & { hasPreview: boolean }) | null> {
    try {
      const res = await fetch(`/api/oembed?url=${encodeURIComponent(url)}`);
      if (!res.ok) return null;
      const data = await res.json();
      // oEmbed no devuelve preview_url (requiere Premium del owner de la app)
      return {
        id: data.track_id ?? `url-${Date.now()}`,
        name: data.title ?? "Tema",
        artist: data.author_name ?? "Artista",
        preview: "",
        hasPreview: false,
      };
    } catch {
      return null;
    }
  }

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) {
      timer.current = setTimeout(() => {
        setResults(null);
        setSearchError(null);
        setSearching(false);
      }, 250);
      return;
    }

    // Si parece link de Spotify, usar oEmbed directo (sin debounce largo)
    const isSpotifyUrl = q.includes("spotify.com/track/") || q.includes("spotify:track:");

    timer.current = setTimeout(async () => {
      if (isSpotifyUrl) {
        setSearching(true);
        const track = await fetchFromUrl(q);
        if (track) {
          setResults([track]);
        } else {
          setResults([]);
          setSearchError("No se pudo obtener info de ese link. Probá con otro.");
        }
        setSearching(false);
        return;
      }

      // Búsqueda normal (requiere Premium del owner de la app)
      setSearching(true);
      setSearchError(null);
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        if (data.error) {
          if (data.details?.includes("premium") || data.details?.includes("Premium") || data.error.includes("premium")) {
            setSearchError("La búsqueda requiere Spotify Premium del propietario de la app. Podés pegar un link directo de Spotify (ej: open.spotify.com/track/...) para agregar el tema sin preview.");
          } else {
            setSearchError(data.error);
          }
          setResults([]);
        } else {
          setResults(data.tracks ?? []);
        }
      } catch {
        setResults([]);
        setSearchError("Error de conexión");
      } finally {
        setSearching(false);
      }
    }, isSpotifyUrl ? 0 : 450);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  return (
    <div className="flex flex-col gap-2.5">
      {value.name ? (
        <div className="flex items-center gap-2.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)]">
            <Music4 className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{value.name}</p>
            {value.artist && <p className="truncate text-xs text-[var(--muted)]">{value.artist}</p>}
            {value.preview ? null : (
              <p className="text-xs text-[var(--danger)]">Sin preview (requiere Premium del owner)</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Quitar
          </Button>
        </div>
      ) : (
        <p className="text-xs text-[var(--muted)]">
          Elegí una canción para que suene en tu perfil (30 seg, requiere Premium del owner). O pegá un link de Spotify.
        </p>
      )}
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar tema en Spotify… o pegá un link de Spotify"
      />
      {searching && <p className="text-xs text-[var(--muted)]">Buscando…</p>}
      {searchError && <p className="text-xs text-[var(--danger)]">{searchError}</p>}
      {results && !searching && results.length === 0 && !searchError && (
        <p className="text-xs text-[var(--muted)]">Sin resultados con preview.</p>
      )}
      {results && results.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {results.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onChange({ ...t, hasPreview: !!t.preview, cover: t.cover });
                setQ("");
                setResults(null);
              }}
              className="flex items-center gap-2.5 rounded-lg bg-[var(--surface)] px-2.5 py-2 text-left transition-colors hover:bg-[var(--surface-3)]"
            >
              <Play className="size-4 shrink-0 text-[var(--accent)]" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{t.name}</p>
                <p className="truncate text-xs text-[var(--muted)]">{t.artist}</p>
                {!t.hasPreview && <p className="text-[10px] text-[var(--danger)]">Sin preview (requiere Premium)</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
