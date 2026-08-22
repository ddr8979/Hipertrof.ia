"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Flame,
  Trophy,
  Utensils,
  Dumbbell,
  ChartLine,
  CalendarDays,
  ChevronRight,
  Music4,
  BookOpenText,
  Calculator,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Skeleton, Avatar } from "@/components/ui/primitives";
import { EmptyState, StatCard } from "@/components/ui/data";
import { cn, formatDate, formatDuration, splitEmojiRuns } from "@/lib/utils";

export default function DashboardPage() {
  const profile = useProfile((s) => s.profile);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: workouts } = await supabase
        .from("workouts")
        .select("id, name, started_at, ended_at, duration_sec, workout_exercises(count)")
        .order("started_at", { ascending: false })
        .limit(5);

      const { data: routines } = await supabase
        .from("routines")
        .select("id, name, routine_exercises(count)")
        .order("updated_at", { ascending: false })
        .limit(6);

      const { data: streakData } = await supabase
        .from("workouts")
        .select("started_at")
        .order("started_at", { ascending: false })
        .limit(90);

      const { data: playlists } = await supabase
        .from("playlists")
        .select("id, provider, name, artist, url, thumbnail_url")
        .order("created_at", { ascending: false })
        .limit(4);

      return {
        workouts: workouts ?? [],
        routines: routines ?? [],
        dates: streakData ?? [],
        playlists: (playlists ?? []) as {
          id: string;
          provider: string;
          name: string;
          artist: string | null;
          url: string | null;
          thumbnail_url: string | null;
        }[],
      };
    },
  });

  const days = profile?.streak_count ?? 0;
  const weeklyVolume = data?.workouts?.slice(0, 7);

  return (
    <div className="flex flex-col gap-6">
      {/* Widget de perfil */}
      <Link
        href="/perfil"
        className="flex items-center gap-3.5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]"
      >
        <Avatar
          src={profile?.avatar_url}
          size={52}
          alt={profile?.display_name ?? profile?.username ?? "Perfil"}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--muted)]">
            {new Date().toLocaleDateString("es-UY", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="truncate font-display text-xl font-bold tracking-tight">
            Hola,{" "}
            {splitEmojiRuns(profile?.display_name ?? "atleta").map((s, i) =>
              s.emoji ? (
                <span key={i} className="text-[var(--text)]">
                  {s.text}
                </span>
              ) : (
                <span key={i} className="text-[var(--accent)]">
                  {s.text}
                </span>
              )
            )}
          </h1>
          {profile?.username && (
            <p className="truncate text-xs text-[var(--muted)]">@{profile.username}</p>
          )}
        </div>
        <ChevronRight className="size-5 shrink-0 text-[var(--muted)]" />
      </Link>

      {/* Streak */}
      <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--accent-soft)] to-transparent p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-ink)]">
            <Flame className="size-5.5 fill-current" />
          </span>
          <div>
            <p className="font-display text-xl font-bold leading-none">
              {days} {days === 1 ? "día" : "días"} de racha
            </p>
            <p className="mt-1 text-xs text-[var(--text-2)]">
              Racha máxima: {profile?.max_streak ?? 0} días
            </p>
          </div>
        </div>
        <Link
          href="/progreso"
          className="text-sm font-semibold text-[var(--accent)] hover:underline"
        >
          Ver progreso
        </Link>
      </div>

      {/* CTA principal */}
      <Link
        href="/entrenar"
        className="group relative overflow-hidden rounded-3xl border border-[var(--border)] p-6 transition-colors hover:border-[var(--accent)] sm:p-8"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, var(--surface)), var(--surface))",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              {weeklyVolume?.length ? "Tu último entrenamiento" : "Listo para entrenar"}
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {weeklyVolume?.length
                ? weeklyVolume[0].name
                : "Arrancá tu primera sesión"}
            </h2>
            {weeklyVolume?.length && (
              <p className="mt-1 text-sm text-[var(--text-2)]">
                {formatDate(weeklyVolume[0].started_at)} ·{" "}
                {formatDuration(weeklyVolume[0].duration_sec ?? 0)}
              </p>
            )}
          </div>
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-ink)] transition-colors">
            <Play className="ml-0.5 size-6 fill-current" />
          </span>
        </div>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Sesiones"
          value={data?.workouts?.length ?? 0}
          sub="últimas"
          icon={<Dumbbell className="size-4" />}
        />
        <StatCard
          label="Rutinas"
          value={data?.routines?.length ?? 0}
          sub="guardadas"
          icon={<CalendarDays className="size-4" />}
        />
        <StatCard
          label="1RM"
          value="—"
          sub="máximo estimado"
          icon={<Trophy className="size-4" />}
        />
      </div>

      <SpotifyWidget />

      {/* Rutinas */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold tracking-tight">
            Tus rutinas
          </h3>
          <Link
            href="/rutinas"
            className="flex items-center gap-0.5 text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            Ver todas <ChevronRight className="size-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : data?.routines.length ? (
          <div className="grid grid-cols-2 gap-3">
            {data.routines.slice(0, 4).map((r: { id: string; name: string; routine_exercises: { count: number }[] }) => (
              <Link
                key={r.id}
                href="/rutinas"
                className="card card-hover flex flex-col justify-between p-4"
              >
                <p className="line-clamp-2 text-sm font-semibold leading-snug">
                  {r.name}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {r.routine_exercises[0]?.count ?? 0} ejercicios
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Dumbbell className="size-6" />}
            title="Todavía no tenés rutinas"
            description="Armá tu primera rutina o usá una plantilla de la biblioteca."
            action={
              <Link href="/rutinas">
                <Button variant="accent">
                  Crear rutina <ChevronRight className="size-4" />
                </Button>
              </Link>
            }
          />
        )}
      </section>

      {/* Hub de opciones */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold tracking-tight">Explorar</h3>
          <span className="text-xs text-[var(--muted)]">todas las herramientas</span>
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
          <Link href="/nutricion" className="card card-hover flex min-w-0 flex-col items-center gap-2 p-4 text-center">
            <Utensils className="size-5 text-[var(--accent)]" />
            <span className="w-full truncate text-xs font-semibold">Nutrición</span>
          </Link>
          <Link href="/progreso" className="card card-hover flex min-w-0 flex-col items-center gap-2 p-4 text-center">
            <ChartLine className="size-5 text-[var(--accent)]" />
            <span className="w-full truncate text-xs font-semibold">Progreso</span>
          </Link>
          <Link href="/perfil" className="card card-hover flex min-w-0 flex-col items-center gap-2 p-4 text-center">
            <Music4 className="size-5 text-[var(--accent)]" />
            <span className="w-full truncate text-xs font-semibold">Perfil</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function SpotifyWidget() {
  const { data: spotify, refetch } = useQuery({
    queryKey: ["spotify"],
    queryFn: async () => {
      const r = await fetch("/api/spotify/data");
      if (r.status === 401) return null;
      if (!r.ok) throw new Error("spotify");
      return (await r.json()) as {
        connected: boolean;
        hidden?: boolean;
        premiumRequired?: boolean;
        playing?: { name: string; artists: string; cover: string | null; is_playing: boolean; is_recent?: boolean } | null;
      };
    },
    refetchInterval: (query) => {
      const d = query.state.data as { connected?: boolean } | null | undefined;
      return d?.connected ? 30000 : false;
    },
  });

  if (spotify?.connected && spotify?.premiumRequired && !spotify?.hidden) {
    return (
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <Music4 className="size-5 text-[#1DB954]" />
            Escuchando ahora
          </h3>
          <button
            onClick={() => refetch()}
            className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)]"
          >
            Actualizar
          </button>
        </div>
        <div className="flex items-center gap-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[#1DB954]">
            <Music4 className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Spotify requiere Premium</p>
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              La cuenta dueña de la app de Spotify necesita Premium para ver lo que se reproduce.
              Puede tardar unas horas tras activarlo.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (spotify?.connected && !spotify?.hidden) {
    const share = !spotify.playing || spotify.playing.is_playing;
    return (
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <Music4 className="size-5 text-[#1DB954]" />
            Escuchando ahora
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                void (async () => {
                  const r = await fetch("/api/spotify/share", { method: "POST" });
                  if (r.ok) refetch();
                })();
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)]"
            >
              <span className={cn("size-2 rounded-full", share ? "bg-[#1DB954]" : "bg-[var(--muted)]")} />
              {share ? "Aprobado" : "Oculto"}
            </button>
            <button
              onClick={() => refetch()}
              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)]"
            >
              Actualizar
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          {spotify.playing?.cover ? (
            <img
              src={spotify.playing.cover}
              referrerPolicy="no-referrer"
              alt=""
              className="size-12 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[#1DB954]">
              <Music4 className="size-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">
              {spotify.playing?.name ?? "Nada sonando ahora"}
            </p>
            {spotify.playing ? (
              <p className="truncate text-xs text-[var(--muted)]">
                {spotify.playing.artists}
                {spotify.playing.is_recent ? " · último" : spotify.playing.is_playing ? "" : " · pausado"}
              </p>
            ) : (
              <p className="text-xs text-[var(--muted)]">Sin reproducción reciente</p>
            )}
          </div>
          {spotify.playing?.is_playing ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-[#1DB954]">
              <Music4 className="size-3.5" />
              Sonando
            </span>
          ) : spotify.playing?.is_recent ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-[var(--muted)]">
              <Music4 className="size-3.5" />
              Último
            </span>
          ) : null}
        </div>
      </section>
    );
  }

  if (spotify === null) {
    return (
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <Music4 className="size-5 text-[#1DB954]" />
            Spotify
          </h3>
          <a
            href="/api/spotify/auth"
            className="flex items-center gap-0.5 text-sm font-semibold text-[#1DB954] hover:underline"
          >
            Vincular <ChevronRight className="size-4" />
          </a>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#1DB954]/15 text-[#1DB954]">
              <Music4 className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Conectá tu Spotify</p>
              <p className="text-xs text-[var(--muted)]">
                Mostrá lo que escuchás mientras entrenás
              </p>
            </div>
          </div>
          <a href="/api/spotify/auth">
            <Button variant="outline" size="sm">
              Conectar
            </Button>
          </a>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <Music4 className="size-5 text-[#1DB954]" />
          Spotify
        </h3>
        <span className="text-xs font-semibold text-[var(--muted)]">Conectado</span>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-sm font-semibold">Nada reproduciéndose ahora</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Refrescar
        </Button>
      </div>
    </section>
  );
}