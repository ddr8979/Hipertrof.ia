import { z } from "zod";

/**
 * Validación de variables de entorno (fail-fast) con zod.
 *
 * 🟒 SOLO server-side: incluye `service_role` y client secrets, que NUNCA deben
 * llegar al bundle del cliente. Importarlo en Server Components / Route Handlers
 * está bien; en client components NO.
 *
 * Next.js inyecta `NEXT_PUBLIC_*` en build-time, por lo que esas son seguras de
 * exponer. Las restantes (service_role, secrets) viven únicamente en el servidor
 * y deben definirse en Vercel Env (`.env.local` de staging/prod).
 */
const envSchema = z.object({
  // Públicas (browser-safe).
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_AUTH_PROVIDERS: z.string().optional().default(""),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional().default(""),

  // BYPASSA RLS — server only.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // OAuth (opcional).
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),

  // Web Push (server).
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional().default("mailto:dev@hypertrofia.app"),

  // Hook de push.
  PUSH_HOOK_SECRET: z.string().optional(),

  // YouTube (opcional).
  YOUTUBE_API_KEY: z.string().optional(),
});

// `SERVICE_ROLE_KEY` es un alias usado por algunos entornos locales.
const parsed = envSchema.safeParse({
  ...process.env,
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY ?? "",
});

// Fail-fast: este módulo sólo se importa desde server-side (admin client,
// middleware, route handlers), que no se evalúan en el build estático de
// páginas públicas, por lo que el lanzamiento no rompe `next dev`/`next build`.
if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `- ${(i.path.length ? i.path.join(".") : "(root)")}: ${i.message}`)
    .join("\n");
  throw new Error(`[env] Variables de entorno inválidas:\n${issues}`);
}

const data = parsed.data;

/** Accesores tipados. ✅ Server-only (no importar desde cliente). */
export const env = {
  supabaseUrl: data.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: data.SUPABASE_SERVICE_ROLE_KEY,
  appUrl: data.NEXT_PUBLIC_APP_URL,
  authProviders: data.NEXT_PUBLIC_AUTH_PROVIDERS
    ? data.NEXT_PUBLIC_AUTH_PROVIDERS.split(",")
        .map((p: string) => p.trim())
        .filter(Boolean)
    : [],
  vapidPublicKey: data.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  vapidPrivateKey: data.VAPID_PRIVATE_KEY,
  vapidSubject: data.VAPID_SUBJECT,
  pushHookSecret: data.PUSH_HOOK_SECRET,
  spotifyClientId: data.SPOTIFY_CLIENT_ID,
  spotifyClientSecret: data.SPOTIFY_CLIENT_SECRET,
  googleClientId: data.GOOGLE_CLIENT_ID,
  googleClientSecret: data.GOOGLE_CLIENT_SECRET,
  youtubeApiKey: data.YOUTUBE_API_KEY,
} as const;
