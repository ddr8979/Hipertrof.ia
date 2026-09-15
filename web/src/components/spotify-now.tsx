// Muestra la reproducción actual de Spotify del usuario o de otro perfil.
"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SpotifyIcon } from "@/components/brand-icons";

// Respuesta del endpoint /api/spotify/data.
export type SpotifyNowData = {
  connected: boolean;
  hidden?: boolean;
  premiumRequired?: boolean;
  playing?: { name: string; artists: string; cover: string | null; is_playing: boolean } | null;
};

/**
 * Hook de consulta del estado de Spotify.
 * Refresca cada 30s solo si la cuenta está conectada.
 * @param userId Opcional; si se omite consulta el perfil propio ("me").
 */
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
    // Solo seguir consultando si está conectado; si no, no gastar red
    refetchInterval: (query) => {
      const d = query.state.data;
      return d?.connected ? 30000 : false;
    },
  });
}

/**
 * Tarjeta con el tema que se está reproduciendo.
 * Devuelve null si no está conectado, está oculto o no hay reproducción
 * (salvo en modo `compact`, que también muestra lo pausado).
 */
export function SpotifyNowCard({
  userId,
  compact,
}: {
  userId?: string;
  compact?: boolean;
}) {
  const { data } = useSpotifyNow(userId);

  if (!data || !data.connected) return null;

  // Aviso cuando la cuenta de Spotify no es Premium.
  if (data.premiumRequired) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1DB954]/15 text-[#1DB954]">
            <SpotifyIcon size={20} />
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
  // En modo normal, ocultar si no está sonando.
  if (!p.is_playing && !compact) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      {p.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.cover} referrerPolicy="no-referrer" alt="" className="size-10 shrink-0 rounded-xl object-cover" />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1DB954]/15 text-[#1DB954]">
          <SpotifyIcon size={20} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{p.name}</p>
        <p className="truncate text-xs text-[var(--muted)]">{p.artists}</p>
      </div>
      {p.is_playing && (
        <span className="flex items-center gap-1 text-xs font-semibold text-[#1DB954]">
          <SpotifyIcon size={14} />
          Sonando
        </span>
      )}
    </div>
  );
}

/** Tarjeta para iniciar la conexión con Spotify; oculta si ya está conectado. */
export function SpotifyConnectCard() {
  const { data } = useSpotifyNow();
  if (data && data.connected) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#1DB954]/15 text-[#1DB954]">
          <SpotifyIcon size={20} />
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
