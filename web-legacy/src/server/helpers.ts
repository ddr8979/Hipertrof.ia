import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function jsonOk(data: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

/** Requiere sesión válida. Devuelve el payload o una respuesta 401. */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return { session: null, response: jsonError("No autorizado", 401) };
  }
  return { session, response: null };
}
