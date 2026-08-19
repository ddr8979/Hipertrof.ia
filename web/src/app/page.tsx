import Link from "next/link";
import {
  Dumbbell,
  ChartLine,
  Timer,
  Users,
  Music4,
  Trophy,
  Store,
  ArrowRight,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-70" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "color-mix(in srgb, var(--accent) 9%, transparent)" }}
      />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-ink)]">
            <Dumbbell className="size-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            hypertrof<span className="text-[var(--accent)]">.ia</span>
          </span>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--text-2)] md:flex">
          <a href="#features" className="transition-colors hover:text-[var(--text)]">Features</a>
          <a href="#social" className="transition-colors hover:text-[var(--text)]">Comunidad</a>
          <a href="#trainers" className="transition-colors hover:text-[var(--text)]">Entrenadores</a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-[var(--accent-ink)] transition-colors"
            >
              Ir a mi entrenamiento
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-[var(--text-2)] transition-colors hover:text-[var(--text)]"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-[var(--accent-ink)] transition-colors"
              >
                Crear cuenta
                <ArrowRight className="size-4" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24 pt-16 text-center sm:pt-24">
        <h1 className="mx-auto max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
          Diario de cargas, rutinas,{" "}
          <span className="accent-gradient">nutrición y comunidad.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--text-2)]">
          Registrá cada serie con peso y repeticiones, seguí tu progreso con
          métricas, y compartí tus sesiones con otros atletas.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={user ? "/dashboard" : "/registro"}
            className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--accent)] px-8 text-base font-bold text-[var(--accent-ink)]  transition-colors sm:w-auto"
          >
            {user ? "Ir a mi entrenamiento" : "Empezar gratis"}
            <ArrowRight className="size-5" />
          </Link>
          <Link
            href="#features"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 px-8 text-base font-semibold backdrop-blur transition-colors hover:border-[var(--muted)]"
          >
            Ver features
          </Link>
        </div>

        {/* Mockup */}
        <div className="relative mx-auto mt-20 max-w-3xl">
          <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-[var(--accent)]/20 blur-3xl" />
          <div className="card overflow-hidden rounded-[2rem] p-2 shadow-[var(--shadow-lg)]">
            <div className="grid grid-cols-2 gap-2">
              <div className="card flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Sesión activa
                  </p>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--danger)]">
                    <span className="size-1.5 animate-pulse rounded-full bg-[var(--danger)]" />
                    42:18
                  </span>
                </div>
                {[
                  { name: "Sentadilla", sets: "3 × 8", kg: "80 kg", ok: true },
                  { name: "Press banca", sets: "4 × 6", kg: "60 kg", ok: true },
                  { name: "Peso muerto", sets: "3 × 5", kg: "100 kg", ok: false },
                ].map((e) => (
                  <div
                    key={e.name}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold">{e.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {e.sets} · {e.kg}
                      </p>
                    </div>
                    <span
                      className={`size-6 rounded-full border-2 ${e.ok ? "border-[var(--success)] bg-[var(--success)]/20" : "border-[var(--border)]"}`}
                    >
                      {e.ok && (
                        <span className="flex size-full items-center justify-center text-[10px] text-[var(--success)]">
                          ✓
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <div className="card flex flex-col justify-between gap-4 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Progreso semanal
                  </p>
                  <p className="mt-1 font-display text-4xl font-bold tracking-tight">
                    18.420{" "}
                    <span className="text-lg text-[var(--text-2)]">kg</span>
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[var(--success)]">
                    +12% vs la semana pasada
                  </p>
                </div>
                <div className="flex h-20 items-end gap-1.5">
                  {[45, 70, 55, 90, 65, 100, 80].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-md bg-[var(--accent)]/60"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="rounded-xl bg-[var(--accent-soft)] px-3 py-2.5">
                  <p className="text-xs font-bold text-[var(--accent)]">
                    Logro desbloqueado
                  </p>
                  <p className="text-sm font-semibold">Racha de 7 días</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Qué incluye
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <Dumbbell className="size-6" />,
              title: "Diario de cargas en vivo",
              desc: "Series, peso, repeticiones, warmups, fallo y drop sets. Timer de descanso inteligente.",
            },
            {
              icon: <Timer className="size-6" />,
              title: "Rutinas",
              desc: "Biblioteca de 246 ejercicios con video, supersets, y programas progresivos.",
            },
            {
              icon: <ChartLine className="size-6" />,
              title: "Progreso medible",
              desc: "1RM estimado, volumen semanal, récords personales, heatmap y rachas.",
            },
            {
              icon: <Users className="size-6" />,
              title: "Comunidad",
              desc: "Perfil público, seguidores, feed de actividad y logros.",
            },
            {
              icon: <Music4 className="size-6" />,
              title: "Tu música, tu perfil",
              desc: "Conectá Spotify, Apple Music o YouTube Music y mostrá tus playlists de entreno.",
            },
            {
              icon: <Store className="size-6" />,
              title: "Marketplace",
              desc: "Cursos y guías de entrenadores verificados, con pago integrado.",
            },
          ].map((f) => (
            <div key={f.title} className="card card-hover p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-lg font-bold tracking-tight">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-2)]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Social */}
      <section id="social" className="relative z-10 mx-auto max-w-6xl px-5 py-20">
        <div className="card overflow-hidden">
          <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent)]">
                <Trophy className="size-3.5" />
                Comunidad
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Perfil y comunidad
              </h2>
              <p className="mt-4 text-[var(--text-2)]">
                Personalizá tu acento de color, avatar, banner y logros.
                Compartí tus sesiones, seguí a otros atletas y mostrá qué
                escuchás mientras entrenás.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Logros", "Followers", "Playlists", "Rachas", "Feed"].map((b) => (
                  <span
                    key={b}
                    className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-2)]"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "Sofía · 42d", color: "#ff5d8f", pr: "PR 95kg" },
                { name: "Martín · 120d", color: "#5cc8ff", pr: "1.000 kg vol" },
                { name: "Lucas · 7d", color: "#ffb020", pr: "Racha 7" },
                { name: "Valen · 5d", color: "#c792ff", pr: "PR 120kg" },
                { name: "Agus · 1d", color: "#4ade80", pr: "PR 80kg" },
                { name: "Tomi · 33d", color: "#ff6b35", pr: "10 toneladas" },
              ].map((u) => (
                <div key={u.name} className="card p-3 text-center">
                  <span
                    className="mx-auto flex size-9 items-center justify-center rounded-full font-display text-sm font-bold text-black"
                    style={{ background: u.color }}
                  >
                    {u.name[0]}
                  </span>
                  <p className="mt-2 truncate text-xs font-semibold">{u.name}</p>
                  <p className="truncate text-[10px] text-[var(--accent)]">{u.pr}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trainers */}
      <section id="trainers" className="relative z-10 mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="card overflow-hidden p-2">
            <div className="card flex items-center gap-3 p-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent)] font-display font-bold text-[var(--accent-ink)]">
                PC
              </span>
              <div className="flex-1">
                <p className="font-semibold">Pablo Carrasco</p>
                <p className="text-xs text-[var(--muted)]">
                  Entrenador certificado · Powerlifting
                </p>
              </div>
              <span className="rounded-full bg-[var(--success-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--success)]">
                Verificado
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 px-2 pb-2">
              {[
                { label: "Alumnos", value: "48" },
                { label: "Cursos", value: "3" },
                { label: "Seguimiento", value: "Semanal" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-[var(--surface-2)] p-3 text-center">
                  <p className="font-display text-lg font-bold">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Entrenadores
            </h2>
            <p className="mt-4 text-[var(--text-2)]">
              Gestión de alumnos, asignación de programas, seguimiento de
              progreso set por set y venta de cursos en el marketplace.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                <Zap key="z" className="size-4 text-[var(--accent)]" />,
                <ChartLine key="c" className="size-4 text-[var(--accent)]" />,
              ]}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold">
                <Users className="size-3.5 text-[var(--accent)]" /> Gestión de alumnos
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold">
                <ChartLine className="size-3.5 text-[var(--accent)]" /> Progreso en vivo
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold">
                <Store className="size-3.5 text-[var(--accent)]" /> Marketplace
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-20">
        <div
          className="card relative overflow-hidden p-10 text-center sm:p-16"
          style={{ background: "color-mix(in srgb, var(--surface) 92%, var(--accent) 8%)" }}
        >
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
          <h2 className="relative font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Empezá a entrenar
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-[var(--text-2)]">
            Registrate gratis: diario de cargas, rutinas, nutrición y
            comunidad, sin tarjetas.
          </p>
          <Link
            href={user ? "/dashboard" : "/registro"}
            className="relative mt-8 inline-flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-[var(--accent)] px-8 text-base font-bold text-[var(--accent-ink)]  transition-colors"
          >
            {user ? "Ir a mi entrenamiento" : "Crear cuenta gratis"}
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-ink)]">
              <Dumbbell className="size-4" />
            </span>
            <span className="font-display font-bold">
              hypertrof<span className="text-[var(--accent)]">.ia</span>
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm text-[var(--muted)]">
            <Link href="/terminos" className="transition-colors hover:text-[var(--text)]">
              Términos
            </Link>
            <Link href="/privacidad" className="transition-colors hover:text-[var(--text)]">
              Privacidad
            </Link>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </main>
  );
}