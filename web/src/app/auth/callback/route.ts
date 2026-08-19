import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback de OAuth / magic link: intercambia el código por sesión
 * y redirige al destino. Verifica que la sesión sea real.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const isLocal = origin.includes("localhost") || origin.includes("127.0.0.1");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development" || isLocal;
      if (isLocalEnv && forwardedHost) {
        return NextResponse.redirect(`http://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Si el canje falla puede ser porque el código ya se usó
    // (doble request del navegador/SW): verificar que la sesión esté activa.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
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

  // Sin código: sesión ya en cookies (magic link directo)
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

  return NextResponse.redirect(`${origin}/login?error=callback`);
}