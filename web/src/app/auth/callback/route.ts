/**
 * auth/callback/route.ts — Callback de autenticación (OAuth / magic link).
 *
 * Intercambia el `code` de Supabase por una sesión y decide el destino.
 * Contempla casos de carrera cuando el código ya fue consumido o la cookie
 * de sesión aún se está escribiendo.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Normaliza el destino `next` para evitar open redirect.
 * Sólo permite rutas relativas del mismo origen (empiezan con "/" pero no "//"
 * ni "/\"), y rechaza saltos de línea (inyección de encabezados).
 */
function sanitizeNext(next: string | null): string {
  if (typeof next !== "string" || next.length > 2048) return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/dashboard";
  }
  if (next.includes("\n") || next.includes("\r")) return "/dashboard";
  return next;
}

/**
 * Callback de OAuth / magic link: intercambia el código por sesión
 * y redirige al destino. Verifica que la sesión sea real.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Destino posterior al login; por defecto el dashboard.
  const next = sanitizeNext(searchParams.get("next"));
  // En local se reconstruye el redirect con el host reenviado.
  const isLocal = origin.includes("localhost") || origin.includes("127.0.0.1");

  // Supabase llega con `error` (sin `code`) cuando el proveedor falla
  // (secret desactualizado, access_denied, state mismatch, etc.).
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  if (oauthError) {
    console.error(
      `[auth/callback] error de OAuth: ${oauthError} — ${oauthErrorDescription ?? "(sin descripción)"}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development" || isLocal;
      // En desarrollo el origin puede diferir del host real (proxy/túnel).
      if (isLocalEnv && forwardedHost) {
        return NextResponse.redirect(`http://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error(`[auth/callback] exchangeCodeForSession falló: ${error.message}`);

    // Si el canje falla puede ser porque el código ya se usó
    // (doble request del navegador/SW): verificar que la sesión esté activa.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Redirige a onboarding si el perfil aún no completó el alta.
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", user.id)
        .single();
      return NextResponse.redirect(
        `${origin}${profile?.onboarded ? next : "/onboarding"}`
      );
    }

    // Carrera entre dos requests concurrentes: el primer canje puede estar
    // escribiendo la cookie todavía. Reintentar tras un instante.
    await new Promise((r) => setTimeout(r, 1200));
    const {
      data: { user: retryUser },
    } = await supabase.auth.getUser();
    if (retryUser) {
      // El reintento sí encontró sesión: decidir destino según onboarding.
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", retryUser.id)
        .single();
      return NextResponse.redirect(
        `${origin}${profile?.onboarded ? next : "/onboarding"}`
      );
    }
  }

  // Sin código (o canje fallido): intentar con sesión ya presente en cookies.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Usuario nuevo → onboarding
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", user.id)
      .single();

    return NextResponse.redirect(`${origin}${profile?.onboarded ? next : "/onboarding"}`);
  }

  const paramKeys = [...searchParams.keys()].join(", ") || "(sin parámetros)";
  console.warn(
    `[auth/callback] sin sesión resultante (code=${code ? "sí" : "no"}, error=${oauthError ?? "no"}); params: ${paramKeys}`
  );
  return NextResponse.redirect(`${origin}/login?error=callback`);
}