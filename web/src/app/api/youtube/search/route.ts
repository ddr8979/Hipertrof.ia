/**
 * api/youtube/search/route.ts — Búsqueda de videos musicales en YouTube.
 *
 * Usa YouTube Data API v3 para buscar videos embebibles. Devuelve items
 * normalizados con URL de embed recortada (30s–90s) y de reproducción.
 */
import { NextRequest, NextResponse } from "next/server";

// API key leída de entorno; el endpoint falla si no está configurada.
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

type YouTubeItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: { high?: { url?: string }; default?: { url?: string } };
  };
};

/** GET ?q=... → lista de tracks normalizados o error. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Falta el parámetro q" }, { status: 400 });
  }
  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: "YouTube API key no configurada" }, { status: 500 });
  }

  try {
    // Se añade " audio" a la consulta y se filtran sólo videos embebibles.
    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q + " audio")}&maxResults=10&videoEmbeddable=true&videoSyndicated=true`,
      { headers: { "Accept": "application/json" } }
    );
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      console.error("[youtube/search]", r.status, err);
      return NextResponse.json({ error: "Error YouTube API", details: err }, { status: r.status });
    }
    const d = (await r.json()) as { items?: YouTubeItem[] };
    // Normaliza y descarta items sin videoId.
    const items = (d.items ?? [])
      .map((v: YouTubeItem) => ({
        videoId: v.id?.videoId,
        title: v.snippet?.title,
        channel: v.snippet?.channelTitle,
        thumbnail: v.snippet?.thumbnails?.high?.url ?? v.snippet?.thumbnails?.default?.url,
        embedUrl: `https://www.youtube.com/embed/${v.id?.videoId}?autoplay=1&start=30&end=90&rel=0`,
        watchUrl: `https://www.youtube.com/watch?v=${v.id?.videoId}`,
      }))
      .filter((x) => x.videoId);
    return NextResponse.json({ tracks: items });
  } catch (e: unknown) {
    // Error inesperado (red, parseo, etc.).
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[youtube/search] exception", e);
    return NextResponse.json({ error: "Error interno", details: msg }, { status: 500 });
  }
}
