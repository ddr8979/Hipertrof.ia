import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Actualiza la sesión de Supabase (refresh tokens) y fija cabeceras de seguridad.
 * Devuelve true si hay sesión activa.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Importante: no ejecutar código entre createServerClient y getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Cabeceras de seguridad (hardening)
  const securityHeaders: [string, string][] = [
    ["X-Frame-Options", "DENY"],
    ["X-Content-Type-Options", "nosniff"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"],
    ["X-DNS-Prefetch-Control", "off"],
    [
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    ],
    [
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' blob: data: https://*.supabase.co http://127.0.0.1:54321 https://i.scdn.co https://*.scdn.co https://image-cdn-ak.spotifycdn.com https://i.ytimg.com https://img.youtube.com https://*.spotifycdn.com https://static.exercisedb.dev",
        "media-src 'self' blob: data: https://static.exercisedb.dev",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co ws://localhost:54321 http://127.0.0.1:54321 wss://127.0.0.1:54321",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; "),
    ],
  ];
  securityHeaders.forEach(([key, value]) =>
    supabaseResponse.headers.set(key, value)
  );

  return { supabaseResponse, user };
}