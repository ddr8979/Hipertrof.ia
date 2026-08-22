import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSpotifyToken, getClientCredentialsToken } from "@/lib/spotify-token";

type SpotifyArtist = { name: string };
type SpotifyTrackItem = {
  id: string;
  name: string;
  preview_url: string | null;
  artists?: SpotifyArtist[];
  album?: { images?: { url: string }[] };
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Falta el parámetro q" }, { status: 400 });
  }
  const supabase = await createClient();
  let token = (await getSpotifyToken(supabase))?.token ?? null;
  let tokenSource = "user";
  let canPreview = false;

  if (!token) {
    token = await getClientCredentialsToken();
    tokenSource = "client_credentials";
  }

  if (!token) {
    return NextResponse.json({ error: "No conectado a Spotify", tracks: [], canPreview: false }, { status: 401 });
  }

  const r = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=8&q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!r.ok) {
    const errText = await r.text().catch(() => "");
    console.error(`[spotify/search] Spotify API error: ${r.status} ${errText} (token: ${tokenSource})`);
    return NextResponse.json({ error: "Error de Spotify", tracks: [], canPreview: false, details: errText }, { status: r.status });
  }
  const d = (await r.json()) as {
    tracks?: { items?: SpotifyTrackItem[] };
  };
  const tracks = (d.tracks?.items ?? [])
    .map((t) => ({
      id: t.id,
      name: t.name,
      artist: t.artists?.map((a) => a.name).join(", ") ?? "",
      preview_url: t.preview_url,
      cover: t.album?.images?.[0]?.url ?? null,
    }));
  
  // Con user token SÍ hay preview_url; con client_credentials NO
  canPreview = tokenSource === "user";

  return NextResponse.json({ tracks, source: tokenSource, canPreview });
}
