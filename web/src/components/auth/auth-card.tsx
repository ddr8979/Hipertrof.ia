"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Mail, ArrowRight, Loader2 } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const emailSchema = z.string().trim().email("Ingresá un email válido");
const passSchema = z.string().min(8, "La contraseña debe tener al menos 8 caracteres");
const nameSchema = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(60, "El nombre es muy largo");

const OAuth_BTN = [
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
  { id: "facebook", label: "Facebook" },
] as const;

export function AuthCard({
  mode,
  providers,
}: {
  mode: "login" | "registro";
  providers: string[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [busy, setBusy] = useState<null | string>(null);

  const isLogin = mode === "login";

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace("/dashboard");
        router.refresh();
      }
    });
  }, [router]);

  async function handleEmailPass(e: React.FormEvent) {
    e.preventDefault();
    if (!isLogin && !agree) {
      toast("warning", "Aceptá los términos y condiciones para continuar");
      return;
    }
    const parsed = z
      .object({
        email: emailSchema,
        password: passSchema,
        name: isLogin ? z.string().optional() : nameSchema,
      })
      .safeParse({ email, password, name });
    if (!parsed.success) {
      toast("warning", parsed.error.issues[0]?.message ?? "Revisá los campos");
      return;
    }
    setBusy("creds");
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw new Error(prettyAuthError(error.message));
        toast("success", "Bienvenido de nuevo");
        router.push("/dashboard");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name || email.split("@")[0] } },
        });
        if (error) throw new Error(prettyAuthError(error.message));
        if (data.session) {
          toast("success", "Cuenta creada. Bienvenido");
          router.push("/onboarding");
          router.refresh();
        } else {
          setMagicSent(true);
        }
      }
    } catch (err) {
      toast("error", "No se pudo continuar", (err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy("magic");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw new Error(prettyAuthError(error.message));
      setMagicSent(true);
      toast("success", "Revisá tu correo", "Te enviamos un enlace de acceso");
    } catch (err) {
      toast("error", "No se pudo enviar el enlace", (err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleOAuth(provider: string) {
    setBusy(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as "google" | "apple" | "facebook",
        options: { redirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw new Error(prettyAuthError(error.message));
    } catch (err) {
      toast("error", "No se pudo conectar", (err as Error).message);
      setBusy(null);
    }
  }

  if (magicSent) {
    return (
      <div className="card animate-[fade-up_0.4s_ease] p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Mail className="size-7" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">
          Revisá tu correo
        </h2>
        <p className="mt-2 text-sm text-[var(--text-2)]">
          Te enviamos un enlace de acceso a <strong>{email}</strong>. Si no
          llegó, revisá spam.
        </p>
        <Button
          variant="ghost"
          className="mt-6"
          onClick={() => setMagicSent(false)}
        >
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="card animate-[fade-up_0.4s_ease] p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-ink)]">
          <Dumbbell className="size-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {isLogin ? "Bienvenido de nuevo" : "Creá tu cuenta"}
          </h1>
          <p className="text-sm text-[var(--text-2)]">
            {isLogin
              ? "Entrá a tu progreso y tu comunidad"
              : "Crear cuenta"}
          </p>
        </div>
      </div>

      {providers.length > 0 && (
        <>
          <div className="grid gap-2.5">
            {providers.map((p) => {
              const meta = OAuth_BTN.find((o) => o.id === p)!;
              return (
                <Button
                  key={p}
                  variant="outline"
                  size="lg"
                  fullWidth
                  disabled={busy !== null}
                  loading={busy === p}
                  onClick={() => handleOAuth(p)}
                >
                  <OAuthIcon provider={p} />
                  Continuar con {meta.label}
                </Button>
              );
            })}
          </div>
          <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            <span className="divider flex-1" />
            o con tu email
            <span className="divider flex-1" />
          </div>
        </>
      )}

      <form onSubmit={handleEmailPass} className="flex flex-col gap-4">
        {!isLogin && (
          <Field label="Nombre">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
              required
            />
          </Field>
        )}
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vos@ejemplo.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field
          label={isLogin ? "Contraseña" : "Contraseña (mín. 8 caracteres)"}
          hint={isLogin ? "¿Olvidaste tu contraseña? Usá el enlace mágico." : undefined}
        >
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={8}
            required
          />
        </Field>

        {!isLogin && (
          <label className="flex items-start gap-2.5 text-[13px] leading-snug text-[var(--text-2)]">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 size-4 rounded border-[var(--border)] accent-[var(--accent)]"
            />
            <span>
              Acepto los{" "}
              <Link href="/terminos" className="font-semibold text-[var(--text)] underline underline-offset-2">
                Términos y Condiciones
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" className="font-semibold text-[var(--text)] underline underline-offset-2">
                Política de Privacidad
              </Link>
              .
            </span>
          </label>
        )}

        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={busy !== null}
          loading={busy === "creds"}
        >
          {isLogin ? "Iniciar sesión" : "Crear cuenta"}
          {busy !== "creds" && <ArrowRight className="size-4" />}
        </Button>
      </form>

      <div className="mt-4">
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          disabled={busy !== null}
          onClick={handleMagicLink}
        >
          <Mail className="size-4" />
          {isLogin ? "¿Olvidaste tu contraseña? Entrá con enlace mágico" : "O registrate con enlace mágico"}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-[var(--text-2)]">
        {isLogin ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
        <Link
          href={isLogin ? "/registro" : "/login"}
          className="font-semibold text-[var(--accent)] hover:underline"
        >
          {isLogin ? "Registrate" : "Iniciá sesión"}
        </Link>
      </p>
    </div>
  );
}

function OAuthIcon({ provider }: { provider: string }) {
  // SVG minimal de marcas (inline, sin dependencias)
  const paths: Record<string, React.ReactNode> = {
    google: (
      <svg viewBox="0 0 24 24" className="size-5">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" />
      </svg>
    ),
    apple: (
      <svg viewBox="0 0 24 24" className="size-5 fill-current">
        <path d="M17.05 20.28c-.98.95-2.05.86-3.08.38-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.38C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
      </svg>
    ),
    facebook: (
      <svg viewBox="0 0 24 24" className="size-5 fill-[#1877F2]">
        <path d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0 0 24 12Z" />
      </svg>
    ),
  };
  return <>{paths[provider]}</>;
}

function prettyAuthError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "Email o contraseña incorrectos";
  if (/user already registered/i.test(msg)) return "Ese email ya está registrado";
  if (/password should be at least/i.test(msg)) return "La contraseña debe tener al menos 8 caracteres";
  if (/email not confirmed/i.test(msg)) return "Confirmá tu email antes de entrar";
  if (/rate limit/i.test(msg)) return "Demasiados intentos. Esperá un momento";
  return msg;
}

export function AuthLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Loader2 className="size-8 animate-spin text-[var(--accent)]" />
    </div>
  );
}