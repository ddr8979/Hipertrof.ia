import Link from "next/link";
import { Dumbbell } from "lucide-react";

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="mb-10 inline-flex items-center gap-2 font-display font-bold">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-ink)]">
          <Dumbbell className="size-4" />
        </span>
        hypertrof<span className="text-[var(--accent)]">.ia</span>
      </Link>
      <h1 className="font-display text-3xl font-bold tracking-tight">Términos y Condiciones</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Última actualización: agosto 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-[var(--text-2)]">
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-[var(--text)]">1. El servicio</h2>
          <p>
            hypertrof.ia es una aplicación de registro de entrenamiento, nutrición y comunidad
            para atletas y personal trainers. Al registrarte aceptás estos términos.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-[var(--text)]">2. Tus datos</h2>
          <p>
            Los datos que cargás (entrenamientos, comidas, métricas corporales) te pertenecen.
            Podés exportarlos o eliminar tu cuenta en cualquier momento desde Ajustes. No vendemos
            ni compartimos tus datos con terceros.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-[var(--text)]">3. Contenido de la comunidad</h2>
          <p>
            El contenido que publicás en el feed (sesiones, logros, estados) es visible según la
            configuración de privacidad de tu perfil. No publicamos nada en tu nombre.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-[var(--text)]">4. Entrenadores y cursos</h2>
          <p>
            Los cursos y programas del marketplace son creados por entrenadores independientes.
            hypertrof.ia facilita la transacción pero no garantiza resultados ni es responsable
            por el contenido de los cursos.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-[var(--text)]">5. Riesgo y salud</h2>
          <p>
            Los cálculos de calorías, macros y 1RM son estimaciones orientativas. Antes de
            comenzar un programa de entrenamiento o nutrición, consultá a un profesional de la
            salud. Usás la app bajo tu propio riesgo.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-[var(--text)]">6. Baja del servicio</h2>
          <p>
            Podés dejar de usar la app cuando quieras y eliminar tu cuenta desde Ajustes. El
            borrado es irreversible: se eliminan todos tus datos de forma permanente.
          </p>
        </section>
      </div>
    </main>
  );
}
