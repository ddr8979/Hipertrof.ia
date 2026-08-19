import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url") ?? "";
  const url = raw.trim();

  if (!url) {
    return NextResponse.json({ error: "URL vacía" }, { status: 400 });
  }

  try {
    if (url.includes("open.spotify.com")) {
      const res = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
      );
      if (!res.ok) throw new Error("no meta");
      const d = await res.json();
      return NextResponse.json({
        provider: "spotify",
        title: d.title ?? null,
        thumbnail_url: d.thumbnail_url ?? null,
      });
    }

    if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("music.youtube.com")) {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}`
      );
      if (!res.ok) throw new Error("no meta");
      const d = await res.json();
      const videoId = /(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&/]|$)/.exec(
        url.includes("youtu.be") ? `/${url.split("youtu.be/")[1] ?? ""}` : url
      )?.[1];
      return NextResponse.json({
        provider: "youtube_music",
        title: d.title ?? null,
        thumbnail_url: videoId
          ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
          : null,
      });
    }

    if (url.includes("music.apple.com")) {
      const id = /\/id(\d+)/.exec(url)?.[1];
      if (id) {
        const res = await fetch(`https://itunes.apple.com/lookup?id=${id}`);
        if (res.ok) {
          const d = await res.json();
          const it = d.results?.[0];
          if (it) {
            return NextResponse.json({
              provider: "apple_music",
              title: it.collectionName ?? it.trackName ?? null,
              thumbnail_url: (it.artworkUrl100 ?? "").replace(
                /100x100/,
                "300x300"
              ),
            });
          }
        }
      }
    }
  } catch {
    // sin metadata: devolver solo el provider detectado
  }

  const provider = url.includes("open.spotify.com")
    ? "spotify"
    : url.includes("music.apple.com")
      ? "apple_music"
      : url.includes("youtube") || url.includes("youtu.be")
        ? "youtube_music"
        : null;

  return NextResponse.json({ provider, title: null, thumbnail_url: null });
}