"use client";

import { useQuery } from "@tanstack/react-query";
import { Music4 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SpotifyNowData = {
  connected: boolean;
  hidden?: boolean;
  premiumRequired?: boolean;
  playing?: { name: string; artists: string; cover: string | null; is_playing: boolean } | null;
};

export function useSpotifyNow(userId?: string) {
  return useQuery<SpotifyNowData | null>({
    queryKey: ["spotify_now", userId ?? "me"],
    queryFn: async () => {
      const r = await fetch(
        userId ? `/api/spotify/data?user=${encodeURIComponent(userId)}` : "/api/spotify/data"
      );
      if (r.status === 401) return null;
      if (!r.ok) throw new Error("spotify");
      return (await r.json()) as SpotifyNowData;
    },
    refetchInterval: 20000,
  });
}

export function SpotifyNowCard({
  userId,
  compact,
}: {
  userId?: string;
  compact?: boolean;
}) {
  const { data } = useSpotifyNow(userId);

  if (!data || !data.connected) return null;

  if (data.premiumRequired) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1DB954]/15 text-[#1DB954]">
          <Music4 className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Spotify requiere Premium</p>
          <p className="text-xs text-[var(--muted)]">
            La cuenta dueña de la app de Spotify necesita Premium para ver lo que se reproduce.
          </p>
        </div>
      </div>
    );
  }

  if (data.hidden || !data.playing) return null;

  const p = data.playing;
  if (!p.is_playing && !compact) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      {p.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.cover} referrerPolicy="no-referrer" alt="" className="size-10 shrink-0 rounded-xl object-cover" />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1DB954]/15 text-[#1DB954]">
          <Music4 className="size-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{p.name}</p>
        <p className="truncate text-xs text-[var(--muted)]">{p.artists}</p>
      </div>
      {p.is_playing && (
        <span className="flex items-center gap-1 text-xs font-semibold text-[#1DB954]">
          <Music4 className="size-3.5" />
          Sonando
        </span>
      )}
    </div>
  );
}

export function SpotifyConnectCard() {
  const { data } = useSpotifyNow();
  if (data && data.connected) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#1DB954]/15 text-[#1DB954]">
          <Music4 className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">Conectá tu Spotify</p>
          <p className="text-xs text-[var(--muted)]">Mostrá lo que escuchás mientras entrenás</p>
        </div>
      </div>
      <a href="/api/spotify/auth">
        <Button variant="outline" size="sm">
          Conectar
        </Button>
      </a>
    </div>
  );
}
