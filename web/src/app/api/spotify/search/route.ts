import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSpotifyToken, getClientCredentialsToken } from "@/lib/spotify-token";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Falta el parámetro q" }, { status: 400 });
  }
  const supabase = await createClient();
  let token = (await getSpotifyToken(supabase))?.token ?? null;
  if (!token) {
    token = await getClientCredentialsToken();
  }
  if (!token) {
    return NextResponse.json({ error: "No conectado a Spotify" }, { status: 401 });
  }

  const r = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=8&q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!r.ok) {
    return NextResponse.json({ error: "Error de Spotify" }, { status: r.status });
  }
  const d = (await r.json()) as {
    tracks?: {
      items?: {
        id: string;
        name: string;
        preview_url: string | null;
        artists?: { name: string }[];
        album?: { images?: { url: string }[] };
      }[];
    };
  };
  return NextResponse.json({
    tracks: (d.tracks?.items ?? [])
      .filter((t) => t.preview_url)
      .map((t) => ({
        id: t.id,
        name: t.name,
        artist: t.artists?.map((a) => a.name).join(", ") ?? "",
        preview_url: t.preview_url,
        cover: t.album?.images?.[0]?.url ?? null,
      })),
  });
}