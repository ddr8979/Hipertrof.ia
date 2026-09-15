/**
 * api/spotify/share/route.ts — Preferencia de compartir reproducción.
 *
 * Activa/desactiva `share_playing` del usuario autenticado. Cuando está
 * apagado, `/api/spotify/data?user=<username>` no revela qué escucha.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST con { share?: boolean } → actualiza la preferencia (default true). */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "no auth" }, { status: 401 });

  // Body opcional: ausencia de `share` se interpreta como activar.
  const body = (await req.json().catch(() => ({}))) as { share?: boolean };
  const share = body.share !== false;

  const { error } = await supabase
    .from("spotify_tokens")
    .update({ share_playing: share, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ share });
}