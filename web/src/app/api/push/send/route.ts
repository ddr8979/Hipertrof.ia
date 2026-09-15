/**
 * api/push/send/route.ts — Envío de notificaciones Web Push.
 *
 * Invocado por un hook externo (p. ej. Supabase) autenticado con
 * `x-hook-secret`. Busca las suscripciones del destinatario, firma con
 * VAPID y envía la notificación; limpia suscripciones caducadas.
 */
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Configuración VAPID y secreto del hook (desde variables de entorno).
const HOOK_SECRET = process.env.PUSH_HOOK_SECRET ?? "";
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:dev@hypertrofia.app";

/**
 * Compara dos strings en tiempo constante (evita timing attacks).
 * Devuelve false si alguno está vacío o difieren en longitud.
 */
function safeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** POST autenticado por secreto: envía push al `recipient_id`. */
export async function POST(req: NextRequest) {
  // Autorización por secreto compartido, comparado en tiempo constante.
  if (!safeEqual(req.headers.get("x-hook-secret") ?? "", HOOK_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Validación mínima del cuerpo para no procesar payloads incompletos.
  const payload = (await req.json().catch(() => null)) as {
    sender_id?: string;
    recipient_id?: string;
    content?: string;
    stars?: number;
  } | null;
  if (!payload?.sender_id || !payload?.recipient_id || typeof payload.content !== "string") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const { sender_id, recipient_id, content, stars } = payload;

  // Cliente service_role: este endpoint no tiene sesión de usuario y necesita
  // leer `push_subscriptions`, que RLS negaría con el cliente anónimo.
  const supabase = createAdminClient();
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", recipient_id);
  if (error || !subs?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // Nombre del remitente para el título de la notificación.
  const { data: sender } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", sender_id)
    .maybeSingle();

  const title = (sender?.display_name ?? sender?.username ?? "hypertrof.ia");
  const body = stars && stars > 0 ? `${content} (${stars} estrellas)` : content;

  // Import dinámico: si `web-push` no está instalado, no romper el build.
  let webpush: typeof import("web-push") | null = null;
  try {
    webpush = (await import("web-push")).default;
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  } catch {
    return NextResponse.json({ ok: true, sent: 0, note: "web-push missing" });
  }

  // Enviar a todas las suscripciones en paralelo y contar los exitosos.
  let sent = 0;
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush!.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          JSON.stringify({
            title,
            body,
            tag: "dm",
            url: `/mensajes/${sender_id}`,
          })
        );
        sent++;
      } catch (e) {
        // 404/410 = suscripción expirada o revocada: eliminarla.
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    })
  );

  return NextResponse.json({ ok: true, sent });
}