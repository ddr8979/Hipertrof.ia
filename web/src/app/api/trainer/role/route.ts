/**
 * api/trainer/role/route.ts — Cambio de rol de perfil (trainer/athlete).
 *
 * Reglas:
 *  - Autoregistro (targetId omitido): requiere plan pago.
 *  - Promover/degradar a otro (targetId): requiere ser admin.
 *
 * Usa service_role porque el trigger prevent_privilege_escalation
 * revierte estos campos para usuarios `authenticated`. El service_role
 * bypasea RLS, por eso las validaciones de autorización se hacen aquí.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** POST: valida permisos y actualiza `role`/`is_trainer_approved`. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "no auth" }, { status: 401 });

  // Body opcional; `targetId` ausente implica autoregistro.
  let body: { targetId?: string; makeTrainer?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  // Por defecto se promueve a trainer; `makeTrainer: false` degrada.
  const makeTrainer = body.makeTrainer !== false;
  const id = body.targetId ?? user.id;

  // Cliente con service_role: bypasea RLS y el trigger de escalada.
  const admin = createAdminClient();

  // Datos del solicitante para decidir autorización.
  const { data: me } = await admin
    .from("profiles")
    .select("is_admin, plan")
    .eq("id", user.id)
    .maybeSingle();

  // Cambiar el rol de otro exige ser admin.
  if (id !== user.id) {
    if (!me?.is_admin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  // Autopromoción a trainer exige plan pago (no free).
  } else if (makeTrainer && (!me?.plan || me.plan === "free")) {
    return NextResponse.json(
      { error: "Necesitás un plan Plus o Deluxe" },
      { status: 403 }
    );
  }

  // Actualización efectiva del perfil objetivo.
  const { data: updated, error } = await admin
    .from("profiles")
    .update({
      role: makeTrainer ? "trainer" : "athlete",
      is_trainer_approved: makeTrainer,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sólo devolver el perfil si el cambio fue sobre uno mismo.
  return NextResponse.json({
    ok: true,
    profile: id === user.id ? updated : null,
  });
}
