import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSpotifyToken } from "@/lib/spotify-token";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const publicUser = req.nextUrl.searchParams.get("user") ?? undefined;
  const session = await getSpotifyToken(supabase, publicUser);
  if (!session) {
    return NextResponse.json({ connected: false }, { status: publicUser ? 200 : 401 });
  }
  if (publicUser && !session.share) {
    return NextResponse.json({ connected: true, playing: null, hidden: true });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "now";
  if (type === "now") {
    if (!session.share && !publicUser) {
      return NextResponse.json({ connected: true, playing: null, hidden: true });
    }
    const r = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      { headers: { Authorization: `Bearer ${session.token}` } }
    );

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

    if (r.status === 204) {
      const recent = await fetchRecent();
      return NextResponse.json({ connected: true, playing: recent });
    }
    if (r.status === 401 || r.status === 403) {
      const body = await r.text().catch(() => "");
      if (/premium/i.test(body)) {
        return NextResponse.json({ connected: true, playing: null, premiumRequired: true });
      }
      return NextResponse.json({ connected: true, playing: null });
    }
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