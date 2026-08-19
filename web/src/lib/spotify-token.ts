import { createServerClient } from "@supabase/ssr";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY ?? "";

export async function getSpotifyToken(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  userId?: string
) {
  let uid = userId ?? null;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    uid = user?.id ?? null;
  }
  if (!uid) return null;

  const db =
    uid && userId && SERVICE_ROLE_KEY
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

export async function getClientCredentialsToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) return null;
  const t = (await r.json()) as { access_token?: string };
  return t.access_token ?? null;
}