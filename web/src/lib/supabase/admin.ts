import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Crea un cliente de Supabase con la clave `service_role`.
 *
 * ⚠️ SOLO para uso server-side (route handlers / server actions). Bypassa RLS y el
 * trigger `prevent_privilege_escalation`, por lo que nunca debe exponerse al cliente.
 * No gestiona cookies: se ejecuta sin contexto de sesión de usuario.
 */
export function createAdminClient() {
  // `env` valida (fail-fast) que service_role + url existan al importarse.
  const key = env.serviceRoleKey;
  if (!env.supabaseUrl || !key) throw new Error("Faltan credenciales de service role");
  return createServerClient(env.supabaseUrl, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
