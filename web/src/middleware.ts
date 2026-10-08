/**
 * middleware.ts — Punto de entrada del middleware global de Next.js.
 *
 * Responsabilidades:
 *  1. Rate limit básico por IP (en memoria, no distribuido).
 *  2. Refrescar/validar la sesión de Supabase vía `updateSession`.
 *  3. Proteger rutas privadas y redirigir a /login cuando no hay usuario.
 *  4. Evitar que usuarios autenticados vean /login y /registro.
 */
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Rutas accesibles sin sesión. Se consideran públicas también sus subrutas.
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/registro",
  // Callback de OAuth/magic link: llega ANTES de que exista sesión
  // (el route handler valida el `code` y crea la sesión).
  "/auth/callback",
  "/terminos",
  "/privacidad",
  "/manifest.webmanifest",
  "/sw.js",
];

// Rate limit simple por IP (in-memory, por instancia).
// Nota: al ser memoria de proceso, no es compartido entre instancias/serverless.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 60;
const buckets = new Map<string, { count: number; resetAt: number }>();

/** Devuelve true si la IP superó el máximo de solicitudes en la ventana actual. */
function rateLimited(request: NextRequest): boolean {
  // Detrás de proxies/CDN la IP real llega en x-forwarded-for o x-real-ip.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const now = Date.now();
  const bucket = buckets.get(ip);
  // Sin bucket o ventana expirada: reiniciar contador para esta IP.
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count++;
  return bucket.count > RATE_MAX;
}

/**
 * Handler principal. Aplica rate limit, refresca sesión y aplica
 * las reglas de acceso antes de continuar con la request.
 */
export async function middleware(request: NextRequest) {
  // 1) Rate limit: cortar temprano para no gastar recursos.
  if (rateLimited(request)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Esperá un minuto." },
      { status: 429 }
    );
  }

  // 2) Refresca tokens de Supabase y restaura la sesión en cookies.
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Rutas públicas: lista blanca, subrutas y toda la API (la API
  // valida su propia auth dentro de cada handler).
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/api/");

  // Sin sesión y ruta privada → redirigir a login conservando el destino.
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  // Usuario ya autenticado no debería ver login/registro → dashboard.
  if (user && (pathname === "/login" || pathname === "/registro")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Devolver la respuesta con las cookies de sesión actualizadas.
  return supabaseResponse;
}

// Matcher: excluye assets estáticos, imágenes y archivos con extensión
// para no ejecutar el middleware en cada recurso.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webm|ico)$).*)",
  ],
};