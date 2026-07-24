# Contexto del Proyecto: hypertrof.ia

Ecosistema web-first (PWA) diseñado con enfoque **offline-first** para **atletas** y **personal trainers**, enfocado en el alto rendimiento táctil en dispositivos móviles, diario de cargas y administración de alumnos.

---

## 1. Stack Tecnológico

- **Frontend & Backend**: Next.js 15 (App Router) + TypeScript.
- **Estilos**: Tailwind CSS v4.
- **Persistencia & ORM**: Prisma ORM con SQLite (Desarrollo) y PostgreSQL (Producción).
- **Gestión de Estado**: Zustand con persistencia en localStorage/IndexedDB.
- **Iconografía**: `lucide-react`.

---

## 2. Estrategia de Arquitectura Frontend: Feature-Sliced Design (FSD)

El proyecto está estructurado siguiendo los principios de FSD para mantener un acoplamiento débil y alta cohesión:

```text
web/src/
├── app/                  # Enrutamiento de Next.js (App Router), estilos globales y layouts base.
├── processes/            # Flujos y lógica compleja multietapa (ej. onboarding paso a paso).
├── pages/                # Vistas de páginas estructuradas a partir de widgets.
├── widgets/              # Componentes de UI autónomos y complejos (ej. WorkoutSessionTracker).
├── features/             # Acciones específicas con valor de negocio (ej. add-set, toggle-completed).
├── entities/             # Conceptos de negocio y lógica de dominio aislada.
│   └── workout/
│       ├── model/        # Zustand stores y tipos de datos (workoutStore.ts).
│       ├── ui/           # Componentes visuales genéricos del dominio de entrenamiento.
│       └── api/          # Endpoints o llamadas específicas.
└── shared/               # Recursos genéricos sin lógica de negocio (helpers, UI general, config de DB, datos estáticos).
    ├── api/              # Cliente de Prisma.
    ├── data/             # Constantes y datos estáticos (glosario-data.ts).
    └── lib/              # Funciones puras (mifflinStJeor.ts, calculadoras de 1RM).
```

---

## 3. Modelo de Datos Relacional (Prisma)

El esquema de base de datos define las entidades y relaciones entre Atleta y Entrenador:

### Usuarios y Roles
- **User**: Contiene credenciales, rol (`ATHLETE` o `TRAINER`), contador de racha (`streakCount`) y fecha del último entrenamiento (`lastWorkoutAt`).
- **TrainerClient**: Relación intermedia para vincular a un entrenador con sus alumnos con estado `PENDING`, `ACTIVE` o `TERMINATED`.

### Rutinas y Ejercicios
- **Exercise**: Catálogo de ejercicios con URL del GIF demostrativo (`gifUrl`), músculo objetivo y flags de personalización.
- **Routine**: Plantilla de rutina creada por un usuario.
- **RoutineExercise**: Tabla intermedia para definir y ordenar los ejercicios dentro de una plantilla.
- **AssignedRoutine**: Asignación de una rutina hecha por un entrenador a un atleta.

### Diario de Cargas (Hevy UX)
- **WorkoutLog**: Registro de una sesión de entrenamiento completada (nombre, duración, fecha).
- **WorkoutExercise**: Ejercicios realizados durante la sesión.
- **WorkoutSet**: Series individuales ejecutadas dentro de un ejercicio con el registro exacto de `weight` (peso), `reps` (repeticiones), `completed` (estado) y `rpe` (esfuerzo percibido).

---

## 4. Filosofía del Diario de Cargas y Offline-First

1. **Estado en Caliente**: Las modificaciones de la sesión activa (añadir series, marcar como completadas, cambiar peso/reps) se guardan instantáneamente en el store de **Zustand** persistido en el cliente.
2. **Optimistic Updates**: La interfaz reacciona de inmediato sin esperas de red.
3. **Persistencia Final**: Al presionar "Finalizar Entrenamiento", el store se vacía y se realiza una única petición REST/Action para guardar el `WorkoutLog` completo con todas sus relaciones en la base de datos a través de Prisma.
