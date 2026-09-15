/**
 * api/spotify/data/route.ts — Lectura de datos de Spotify para el usuario.
 *
 * Devuelve lo que se está reproduciendo (o lo último escuchado) y las
 * playlists del usuario. Soporta el modo público (`?user=<username>`) que
 * sólo expone datos si el usuario activó `share_playing`.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSpotifyToken } from "@/lib/spotify-token";

/**
 * GET ?user=<username>&type=now|playlists
 * - user/ejecución propia: acceso a datos completos.
 * - user de tercero: sólo si compartió su reproducción.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  // `publicUser` indica que se consulta a otro usuario (modo compartido).
  const publicUser = req.nextUrl.searchParams.get("user") ?? undefined;
  // getSpotifyToken valida la sesión/permisos y devuelve token + flag share.
  const session = await getSpotifyToken(supabase, publicUser);
  if (!session) {
    return NextResponse.json({ connected: false }, { status: publicUser ? 200 : 401 });
  }
  // En modo público sin share activo: no revelar la reproducción.
  if (publicUser && !session.share) {
    return NextResponse.json({ connected: true, playing: null, hidden: true });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "now";
  if (type === "now") {
    // Sin share y consulta propia: ocultar (el usuario desactivó compartir).
    if (!session.share && !publicUser) {
      return NextResponse.json({ connected: true, playing: null, hidden: true });
    }
    const r = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      { headers: { Authorization: `Bearer ${session.token}` } }
    );

    // Helper: obtiene la última canción reproducida como fallback.
    const fetchRecent = async () => {
      try {
        const rr = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        if (!rr.ok) return null;
        const dd = (await rr.json()) as {
          items?: {
            track: {
              name: string;
              artists: { name: string }[];
              album?: { images?: { url: string }[]; name?: string };
            };
          }[];
        };
        const track = dd.items?.[0]?.track;
        if (!track) return null;
        // Normaliza el track al mismo formato que "currently playing".
        return {
          name: track.name,
          artists: track.artists?.map((a) => a.name).join(", ") ?? "",
          cover: track.album?.images?.[0]?.url ?? null,
          album: track.album?.name ?? null,
          is_playing: false,
          is_recent: true,
        };
      } catch {
        return null;
      }
    };

    // 204 = sin reproducción activa; usar la última escuchada.
    if (r.status === 204) {
      const recent = await fetchRecent();
      return NextResponse.json({ connected: true, playing: recent });
    }
    // 401/403 = token sin permisos; 403 con "premium" indica cuenta free.
    if (r.status === 401 || r.status === 403) {
      const body = await r.text().catch(() => "");
      if (/premium/i.test(body)) {
        return NextResponse.json({ connected: true, playing: null, premiumRequired: true });
      }
      return NextResponse.json({ connected: true, playing: null });
    }
    // Otros errores: intentar el fallback de última reproducción.
    if (!r.ok) {
      const recent = await fetchRecent();
      if (recent) return NextResponse.json({ connected: true, playing: recent });
      return NextResponse.json({ connected: true, playing: null });
    }
    const p = (await r.json()) as {
      item?: {
        name: string;
        artists: { name: string }[];
        album?: { images?: { url: string }[]; name?: string };
        duration_ms?: number;
        explicit?: boolean;
      } | null;
      is_playing?: boolean;
      progress_ms?: number;
    };
    // Sin item activo: usar la última escuchada como fallback.
    if (!p.item) {
      const recent = await fetchRecent();
      return NextResponse.json({ connected: true, playing: recent });
    }
    return NextResponse.json({
      connected: true,
      playing: {
        name: p.item.name,
        artists: p.item.artists?.map((a) => a.name).join(", ") ?? "",
        cover: p.item.album?.images?.[0]?.url ?? null,
        album: p.item.album?.name ?? null,
        is_playing: p.is_playing ?? false,
      },
    });
  }

  // type distinto de "now": devolver las primeras playlists del usuario.
  const r = await fetch("https://api.spotify.com/v1/me/playlists?limit=6", {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  if (!r.ok) return NextResponse.json({ connected: true, playlists: [] });
  const d = (await r.json()) as { items?: { id: string; name: string; owner?: { display_name?: string }; images?: { url?: string }[] }[] };
  return NextResponse.json({
    connected: true,
    playlists: (d.items ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      owner: p.owner?.display_name ?? null,
      image: p.images?.[0]?.url ?? null,
    })),
  });
}