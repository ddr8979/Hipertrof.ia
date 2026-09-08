# Arquitectura — Visión General

## Stack Tecnológico

### Frontend & Backend
- **Next.js 16.3.1** con App Router y TypeScript
- **React 19.2.8** (componentes server y client)
- **Tailwind CSS v4** para estilos
- **lucide-react** para iconografía

### Persistencia
- **Prisma ORM** como capa de acceso a datos
  - **SQLite** en desarrollo (`dev.db`)
  - **PostgreSQL** en producción
- **Zustand** con persistencia en `localStorage`/`IndexedDB` para estado offline
- **Supabase** como backend cloud (auth, realtime, storage)

### Mobile
- **Capacitor 8.5.0** — wrapper nativo Android
- **Web Push API** para notificaciones

---

## Feature-Sliced Design (FSD)

El proyecto sigue FSD para mantener bajo acoplamiento y alta cohesión. Cada capa solo puede importar de capas inferiores.

```
web/src/
├── app/              →  Capa 1: Routing, layouts, providers globales
├── processes/        →  Capa 2: Flujos complejos multi-paso (ej: onboarding)
├── pages/            →  Capa 3: Composición de widgets en vistas de usuario
├── widgets/           →  Capa 4: Componentes UI autónomos (ej: WorkoutSessionTracker)
├── features/         →  Capa 5: Acciones con valor de negocio (ej: add-set)
├── entities/         →  Capa 6: Conceptos de dominio (workout, user, exercise)
└── shared/           →  Capa 7: Utilidades genéricas sin lógica de negocio
```

### Reglas de dependencia

```
app     → processes, pages, widgets, features, entities, shared
processes → widgets, features, entities, shared
pages   → widgets, features, entities, shared
widgets → features, entities, shared
features → entities, shared
entities → shared
shared  → (nada)
```

**Nunca** importar hacia arriba. Si `shared` necesita algo de `entities`, hay que refactorizar.

---

## Entidades de dominio

### workout (la más importante)
- `WorkoutLog` — sesión completa
- `WorkoutExercise` — ejercicios en la sesión
- `WorkoutSet` — series individuales (weight, reps, rpe, completed)

### user
- `User` — credenciales, rol (`ATHLETE`/`TRAINER`), streak
- `TrainerClient` — relación entrenador↔atleta

### exercise
- `Exercise` — catálogo con gifUrl, músculo objetivo
- `Routine` — plantilla
- `RoutineExercise` — ejercicios en una plantilla
- `AssignedRoutine` — rutina asignada a un atleta

---

## Decisiones de arquitectura clave

### 1. Offline-first con persistencia optimista

```
Usuario marca serie completada
        ↓
Zustand store actualiza (localStorage)  ← UI reacciona al instante
        ↓
Al finalizar workout:
        ↓
Una sola request POST /workouts/log
        ↓
Servidor guarda via Prisma
        ↓
Confirmación → Zustand se limpia
```

**Ventaja**: La UI nunca espera a la red. El usuario puede entrenar en un sótano sin señal.

### 2. SSR mínimo en páginas de workout

Las páginas críticas (WorkoutSessionTracker) son **client components** porque necesitan estado reactivo inmediato. Solo layouts y páginas de auth usan SSR.

### 3. Single source of truth: Zustand

Todo el estado de la sesión activa vive en un solo store (`workoutStore`). Las componentes solo leen/escriben, no tienen estado local.

---

## Flujo de datos

```
[Browser Storage]  ←→  [Zustand Store]  ←→  [React Components]
                              ↓
                       [Sync on workout end]
                              ↓
                       [Next.js Server Action / API Route]
                              ↓
                       [Prisma Client]
                              ↓
                       [SQLite local | Supabase Postgres]
```

---

## Configuración de Next.js (hardening)

En `web/next.config.ts` se desactivaron:
- `reactStrictMode: false` — evita double-rendering que causaba crash loops en Next 16
- `workerThreads: false` — incompatibilidad con LUKS
- `cpus: 1` — limita paralelismo

Ver [`../operations/03-sistema-guardian.md`](../operations/03-sistema-guardian.md) para entender por qué.

---

## Próximos pasos arquitectónicos

- [ ] Migrar de Zustand persistido a IndexedDB con sincronización
- [ ] Implementar service worker con cache estratégico
- [ ] Background sync para workouts offline
- [ ] Compartir Prisma schema entre web y mobile