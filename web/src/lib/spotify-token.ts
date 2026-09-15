import { createServerClient } from "@supabase/ssr";

// Credenciales de la app de Spotify (server-only).
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";
// Acepta ambos nombres por compatibilidad (el resto del proyecto usa el prefijo SUPABASE_).
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY ?? "";

/**
 * Obtiene un access_token válido de Spotify para el usuario.
 *
 * Estrategia:
 * 1. Resuelve el `uid` (por parámetro o desde la sesión de Supabase).
 * 2. Si se pasa `userId` y hay SERVICE_ROLE_KEY, usa un cliente admin para leer el
 *    token de otro usuario (bypassea RLS); si no, usa el cliente provisto.
 * 3. Si el token sigue vigente (>60s de margen) lo devuelve tal cual.
 * 4. Si expiró, lo refresca contra Spotify y hace upsert en `spotify_tokens`.
 *
 * Devuelve null ante cualquier falta de datos o error.
 */
export async function getSpotifyToken(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  userId?: string
) {
  let uid = userId ?? null;
  if (!uid) {
    // Sin userId explícito, se toma el usuario de la sesión actual.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    uid = user?.id ?? null;
  }
  if (!uid) return null;

  // Si se pidió el token de otro usuario (p. ej. alumno) y hay service_role,
  // se usa un cliente admin para saltar RLS al leer `spotify_tokens`.
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

  // Token aún vigente (con margen de 60s para evitar expirar en tránsito).
  if (new Date(row.expires_at).getTime() > Date.now() + 60000) {
    return { token: row.access_token, id: uid, share: row.share_playing !== false };
  }

  // Token expirado: se pide uno nuevo a Spotify con el refresh_token.
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
  // Persiste el nuevo token (conserva el refresh_token anterior si no vino uno nuevo).
  await db.from("spotify_tokens").upsert({
    user_id: uid,
    access_token: t.access_token,
    refresh_token: t.refresh_token ?? row.refresh_token,
    expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  return { token: t.access_token, id: uid, share: row.share_playing !== false };
}

/**
 * Token de aplicación de Spotify (flujo `client_credentials`), sin usuario.
 * Se usa para llamadas públicas (búsqueda, catálogo) que no requieren sesión.
 * Devuelve null si Spotify responde con error.
 */
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