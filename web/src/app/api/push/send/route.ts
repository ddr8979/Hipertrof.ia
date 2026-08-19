import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const HOOK_SECRET = process.env.PUSH_HOOK_SECRET ?? "";
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:dev@hypertrofia.app";

export async function POST(req: NextRequest) {
  if (!HOOK_SECRET || req.headers.get("x-hook-secret") !== HOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { sender_id, recipient_id, content, stars } = (await req.json()) as {
    sender_id: string;
    recipient_id: string;
    content: string;
    stars?: number;
  };

  const supabase = await createClient();
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", recipient_id);
  if (error || !subs?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const { data: sender } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", sender_id)
    .maybeSingle();

  const title = (sender?.display_name ?? sender?.username ?? "hypertrof.ia");
  const body = stars && stars > 0 ? `${content} (${stars} estrellas)` : content;

  let webpush: typeof import("web-push") | null = null;
  try {
    webpush = (await import("web-push")).default;
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  } catch {
    return NextResponse.json({ ok: true, sent: 0, note: "web-push missing" });
  }

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
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    })
  );

  return NextResponse.json({ ok: true, sent });
}