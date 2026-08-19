import Link from "next/link";
import { Dumbbell } from "lucide-react";

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="mb-10 inline-flex items-center gap-2 font-display font-bold">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-ink)]">
          <Dumbbell className="size-4" />
        </span>
        hypertrof<span className="text-[var(--accent)]">.ia</span>
      </Link>
      <h1 className="font-display text-3xl font-bold tracking-tight">Política de Privacidad</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Última actualización: agosto 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-[var(--text-2)]">
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-[var(--text)]">1. Qué datos guardamos</h2>
          <p>
            Guardamos los datos que creás en la app: tu perfil, entrenamientos, series, comidas,
            métricas corporales, logros, playlists y publicaciones del feed. También los datos
            básicos de la cuenta (email y nombre).
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-[var(--text)]">2. Para qué los usamos</h2>
          <p>
            Para darte el servicio: mostrar tu progreso, calcular estimaciones (1RM, calorías),
            mantener rachas y mostrar tu actividad a quienes seguís o te siguen. No usamos tus
            datos para publicidad ni los vendemos.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-[var(--text)]">3. Visibilidad</h2>
          <p>
            Tu perfil es público por defecto (nombre, avatar, estadísticas y feed), salvo que lo
            configures como privado. Las comidas, métricas y series detalladas solo las ves vos
            y tu entrenador.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-[var(--text)]">4. Almacenamiento y seguridad</h2>
          <p>
            Los datos se guardan en una base de datos con acceso restringido por rol y políticas
            de seguridad por fila. Las contraseñas se almacenan cifradas por nuestro proveedor
            de autenticación.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-[var(--text)]">5. Tus derechos</h2>
          <p>
            Podés exportar todos tus datos en JSON desde Ajustes y eliminar tu cuenta de forma
            definitiva cuando quieras. El borrado incluye todos los datos asociados.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-[var(--text)]">6. Contacto</h2>
          <p>
            Ante cualquier consulta sobre privacidad o tus datos, escribinos a
            <span className="font-semibold text-[var(--text)]"> hola@hipertrof.ia</span>.
          </p>
        </section>
      </div>
    </main>
  );
}
