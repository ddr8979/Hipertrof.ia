/**
 * api/push/register/route.ts — Registro de suscripciones Web Push.
 *
 * Guarda/actualiza el endpoint y las claves del navegador del usuario
 * autenticado en `push_subscriptions` para enviarle notificaciones.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST con { endpoint, keys } → upsert de la suscripción del usuario. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "no auth" }, { status: 401 });

  // Validar forma mínima de la suscripción antes de persistirla.
  const { endpoint, keys } = (await req.json()) as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
  }

  // Upsert: un endpoint puede re-registrarse o cambiar de dueño/sesión.
  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}