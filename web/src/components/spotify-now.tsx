// Muestra la reproducción actual de Spotify del usuario o de otro perfil.
"use client";

import { useQuery } from "@tanstack/react-query";
import { ComingSoon } from "@/components/coming-soon";

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

/** Tarjeta del tema que se está reproduciendo (hoy: cartel de próximamente). */
export function SpotifyNowCard() {
  return (
    <ComingSoon
      compact
      title="Spotify en el entreno"
      description="Próximamente vas a ver lo que estás escuchando mientras entrenás."
    />
  );
}

/** Tarjeta para iniciar la conexión con Spotify (hoy: cartel de próximamente). */
export function SpotifyConnectCard() {
  return (
    <ComingSoon
      compact
      title="Conectá tu Spotify"
      description="Próximamente: mostrá lo que escuchás mientras entrenás."
    />
  );
}
