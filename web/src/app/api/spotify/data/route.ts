import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY ?? "";

async function getToken(supabase: Awaited<ReturnType<typeof createClient>>, userId?: string) {
  let uid = userId ?? null;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    uid = user?.id ?? null;
  }
  if (!uid) return null;

  const db = uid && userId && SERVICE_ROLE_KEY
    ? createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        SERVICE_ROLE_KEY,
        { cookies: { getAll: () => [], setAll: () => {} } }
      )
    : supabase;
  const { data: row } = await db
    .from("spotify_tokens")
    .select("access_token, refresh_token, expires_at, share_playing")
    .eq("user_id", uid)
    .maybeSingle();
  if (!row) return null;

  if (new Date(row.expires_at).getTime() > Date.now() + 60000) {
    return { token: row.access_token, id: uid, share: row.share_playing !== false };
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: row.refresh_token,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) return null;
  const t = (await r.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  await db.from("spotify_tokens").upsert({
    user_id: uid,
    access_token: t.access_token,
    refresh_token: t.refresh_token ?? row.refresh_token,
    expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  return { token: t.access_token, id: uid, share: row.share_playing !== false };
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const publicUser = req.nextUrl.searchParams.get("user") ?? undefined;
  const session = await getToken(supabase, publicUser);
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
    if (r.status === 204) {
      return NextResponse.json({ connected: true, playing: null });
    }
    if (r.status === 401 || r.status === 403) {
      const body = await r.text().catch(() => "");
      if (/premium/i.test(body)) {
        return NextResponse.json({ connected: true, playing: null, premiumRequired: true });
      }
      return NextResponse.json({ connected: true, playing: null });
    }
    if (!r.ok) {
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
    if (!p.item) return NextResponse.json({ connected: true, playing: null });
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