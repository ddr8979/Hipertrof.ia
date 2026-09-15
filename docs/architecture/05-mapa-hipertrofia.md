# Mapa visual de Hipertrof.ia

> Documento maestro. Explica **qué partes tiene la app**, **cómo se comunican**
> y **qué protocolos usa cada una**. Los diagramas son Mermaid (se ven en
> GitHub). Última auditoría de código: ver [`06-diagnostico-rutinas-y-trainer.md`](./06-diagnostico-rutinas-y-trainer.md).

> ⚠️ **Ojo**: `docs/architecture/01-vision-general.md`, `02-modelo-datos.md`,
> `docs/02-arquitectura.md` y `docs/07-mapa-completo-web.md` están
> **desactualizados**: describen Prisma + SQLite + FSD, que **no existen** en el
> código. El stack real es el de este documento.

---

## 1. Qué es y qué partes tiene

PWA **web-first** (instalable en iOS/Android, wrapper Capacitor) para **atletas**
y **personal trainers**. Tres grandes bloques:

| Bloque | Módulos | Qué hace |
|---|---|---|
| **Entrenamiento** | `rutinas`, `entrenar`, `ejercicios`, `historial`, `progreso`, `calculadora`, `glosario` | Crear rutinas, ejecutar sesiones (diario de cargas), ver récords y progreso |
| **Trainer** | `entrenadores`, `marketplace`, `facturacion`, `mensajes` | Vinculación trainer↔alumno, asignar rutinas/recetas, cursos, suscripciones |
| **Social / vida** | `dashboard`, `explorar`, `perfil`, `social`, `nutricion`, `mensajes`, `ajustes` | Feed, seguir usuarios, recetas, chat, integración musical |

---

## 2. Vista de sistema (alto nivel)

```mermaid
graph TB
  subgraph Cliente["📱 Cliente (iOS PWA / Android / Web)"]
    UI["React 19 · App Router<br/>client components"]
    ZU["Zustand<br/>borrador de sesión + perfil + toasts"]
    RQ["TanStack Query<br/>cache de datos"]
    SW["Service Worker<br/>cache / offline / push"]
    LS["localStorage"]
  end

  subgraph Next["▲ Next.js 16 (Vercel)"]
    MW["middleware.ts<br/>auth + rate limit + headers"]
    SSR["RSC / layouts<br/>session check"]
    API["Route Handlers /api/*<br/>solo integraciones"]
  end

  subgraph SB["🗄️ Supabase"]
    AUTH["Auth<br/>OAuth + magic link"]
    PG["Postgres + RLS"]
    RT["Realtime"]
    ST["Storage"]
    RPC["RPC Postgres"]
  end

  EXT["Externos: Spotify · YouTube ·<br/>Google · Apple Music · Web Push"]

  UI --> RQ
  UI --> ZU
  ZU --> LS
  UI -- "Supabase browser client" --> PG
  UI -- "Supabase JS" --> AUTH
  RT -- "postgres_changes" --> UI
  UI -- "upload/download" --> ST
  UI -- "rpc()" --> RPC
  SSR -- "Supabase server client (cookies)" --> AUTH
  SSR --> PG
  API -- "service_role" --> PG
  API --> EXT
  SW --> API
  MW --> SSR
```

**Regla de oro:** el **90% de los datos** viaja directo del navegador a Supabase
(con RLS como control de acceso). Next.js **no** es una API REST de dominio:
solo hace SSR de layouts/auth y expone `/api/*` para integraciones externas.

---

## 3. Stack real

| Capa | Tecnología | Dónde |
|---|---|---|
| Framework | Next.js **16.3.1** (App Router, RSC) | `web/next.config.ts` |
| UI | React 19.0.2, Tailwind CSS v4, lucide-react | `web/src/**` |
| Backend / DB | **Supabase** (Postgres + RLS + Auth + Realtime + Storage) | `web/src/lib/supabase/**` |
| Estado cliente | Zustand 5 (persist) + TanStack Query 5 | `web/src/lib/workout-store.ts`, `web/src/components/providers.tsx` |
| Integraciones | Spotify OAuth PKCE, YouTube oEmbed, Web Push | `web/src/app/api/**` |
| Mobile | Capacitor 8.5 (iOS/Android shell) | `web/capacitor.config.ts` |
| Deploy | Vercel | `web/.vercel` |

> **No hay** Prisma, SQLite, `server actions`, ni capas FSD. Ignorar `dev.db`,
> `web-legacy/` y los docs viejos.

---

## 4. Mapa de rutas (App Router)

```mermaid
graph LR
  subgraph Public["Público / raíz"]
    ROOT["/ (landing)"]
    LOGIN["/login"]
    REG["/registro"]
    CB["/auth/callback"]
    ONB["/onboarding"]
    LEGAL["/terminos · /privacidad"]
    MKTPUB["/marketplace (en nav público,<br/>igual redirige a login)"]
  end

  subgraph App["(app) — con AppShell + auth obligatoria"]
    DASH["/dashboard"]
    RUT["/rutinas"]
    MSG["/mensajes · /mensajes/[id]"]
    PERF["/perfil · /perfil/[id]"]
    EXP["/explorar"]
    SOC["/social → redirect /explorar?share=1"]
    EJ["/ejercicios"]
    CALC["/calculadora"]
    NUT["/nutricion"]
    GLO["/glosario"]
    MKT["/marketplace"]
    ENT["/entrenadores"]
    HIST["/historial"]
    PROG["/progreso"]
    AJU["/ajustes"]
    FACT["/facturacion (no está en el nav)"]
  end

  subgraph Session["(session) — pantalla completa, sin shell"]
    ENTR["/entrenar"]
  end

  ROOT --> LOGIN
  ROOT --> REG
  LOGIN --> CB
  REG --> CB
  CB --> ONB
  ONB --> DASH
  App --> Session
```

Nav del shell: `web/src/components/app-shell.tsx` (bottom tab bar móvil +
sidebar desktop + sheet "Más"). `PRIMARY` = dashboard, rutinas, mensajes, perfil.

---

## 5. Estructura real de carpetas

```text
web/
├── src/
│   ├── app/
│   │   ├── (app)/          # producto (auth + AppShell)
│   │   ├── (auth)/         # login / registro
│   │   ├── (session)/      # entrenar (pantalla completa)
│   │   ├── auth/callback/  # intercambio de código Supabase
│   │   ├── onboarding/     # alta guiada (server)
│   │   ├── api/            # route handlers SOLO de integraciones
│   │   ├── layout.tsx      # metadata + Providers
│   │   ├── manifest.ts     # PWA manifest (/manifest.webmanifest)
│   │   └── globals.css     # tokens, dark mode, safe-areas iOS
│   ├── components/         # app-shell, ui/, providers, toggles…
│   └── lib/                # supabase/, stores, planes, glosario
├── public/sw.js            # service worker
├── supabase/migrations/    # 15 migraciones SQL (fuente de verdad del modelo)
└── android/ · capacitor.config.ts
```

---

## 6. Modelo de datos (tablas reales)

Las 23 tablas creadas por las migraciones. Detalle de Drift al final.

### 6.1 Núcleo entrenamiento

```mermaid
erDiagram
  profiles ||--o{ routines : "crea"
  profiles ||--o{ workouts : "registra"
  exercises ||--o{ routine_exercises : "se usa en"
  routines ||--o{ routine_exercises : "contiene"
  routines ||--o{ assigned_routines : "se asigna"
  routines ||--o{ workouts : "source_routine_id"
  workouts ||--o{ workout_exercises : "contiene"
  exercises ||--o{ workout_exercises : "referencia"
  workout_exercises ||--o{ workout_sets : "contiene"

  routines {
    uuid id PK
    uuid user_id FK
    text name
    bool is_template
    bool is_public
  }
  routine_exercises {
    uuid id PK
    uuid routine_id FK
    text exercise_id FK
    int order_index
    int target_sets
    text target_reps
    int rest_sec
    bool is_superset
  }
  workouts {
    uuid id PK
    uuid user_id FK
    uuid source_routine_id FK
    timestamptz started_at
    timestamptz ended_at
  }
  workout_exercises {
    uuid id PK
    uuid workout_id FK
    text exercise_id FK
    int order_index
  }
  workout_sets {
    uuid id PK
    uuid workout_exercise_id FK
    int set_index
    text type
    numeric weight_kg
    int reps
    numeric rpe
    bool completed
  }
```

### 6.2 Relación trainer ↔ alumno

```mermaid
erDiagram
  profiles ||--o{ trainer_clients : "trainer_id"
  profiles ||--o{ trainer_clients : "athlete_id"
  profiles ||--o{ assigned_routines : "trainer_id"
  profiles ||--o{ assigned_routines : "athlete_id"
  routines ||--o{ assigned_routines : "routine_id"
  profiles ||--o{ courses : "trainer_id"
  courses ||--o{ course_enrollments : "course_id"
  profiles ||--o{ course_enrollments : "athlete_id"

  trainer_clients {
    uuid id PK
    uuid trainer_id FK
    uuid athlete_id FK
    text status "pending|active|terminated"
  }
  assigned_routines {
    uuid id PK
    uuid routine_id FK
    uuid trainer_id FK
    uuid athlete_id FK
    bool active
    date start_date
    date end_date
  }
  courses {
    uuid id PK
    uuid trainer_id FK
    text title
    int price_uyu
    text status "draft|published|archived"
    text content_url
  }
```

### 6.3 Social / vida (resumen)

`followers` (N–M perfiles, `is_best_friend`), `feed_posts` (`workout`/`achievement`/`status`/`routine`/`recipe`, con `scope`), `post_likes`, `post_comments`,
`achievements` → `user_achievements`, `recipes` → `meal_logs`, `daily_entries`,
`user_connections` (Spotify/Apple/YouTube) → `playlists`, `message_reactions`.

### 6.4 🔴 Drift: lo que el código usa pero **ninguna migración crea**

| Objeto | Tipo | Usado por | Estado |
|---|---|---|---|
| `assigned_recipes` | tabla | `entrenadores`, `nutricion` | ❌ no existe → recetas asignadas rotas |
| `direct_messages` | tabla | `mensajes`, `dm-notifications`, `entrenadores` | ❌ no se `create` (solo `alter`) → `db reset` falla en migración 13 |
| `push_subscriptions` | tabla | `api/push/register`, `api/push/send` | ❌ no existe → push nunca persiste |
| `spotify_tokens` | tabla | `api/spotify/*`, `lib/spotify-token` | ❌ no existe en migraciones |
| `star_balances` | tabla | `mensajes/[id]` | ❌ no existe |
| `get_conversations` | RPC | `app-shell`, `mensajes` | ❌ no existe → badge 0 |
| `send_message` | RPC | `mensajes/[id]` | ❌ no existe |
| bucket `dm-images` | storage | `mensajes/[id]` | ❌ no se crea |
| columnas `is_verified`, `instagram_handle`, `tiktok_handle`, `twitter_handle`, `spotify_handle`, `profile_track_*` | columnas | `perfil`, `perfil/[id]` | ❌ no migradas |

> Consecuencia clave: **la base de producción seguramente tiene estos objetos
> creados a mano** (por eso la app anda a medias), pero **una base nueva creada
> desde el repo no funciona**. Es deuda de reproducibilidad + una parte real de
> los bugs.

---

## 7. Protocolos / canales de comunicación

| Canal | Implementación | Cuándo se usa |
|---|---|---|
| **Supabase browser client** | `createBrowserClient` (`lib/supabase/client.ts`) | CRUD de dominio desde componentes `"use client"`: rutinas, workouts, social, nutrición, chat |
| **Supabase server client** | `createServerClient` + cookies (`lib/supabase/server.ts`) | SSR: layouts `(app)`/`(session)`, callback, landing |
| **RPC Postgres** | `supabase.rpc(...)` | `unlock_achievements`, `export_my_data`, `delete_account`, `get_conversations`, `send_message` |
| **Realtime** | `postgres_changes` | Chat (DM), reacciones, comentarios del feed |
| **Storage** | `supabase.storage.from(...)` | `avatars`, `banners`, `recipe-photos`, `dm-images` |
| **Route handlers** | `web/src/app/api/**` | **solo** integraciones: Spotify, YouTube, oEmbed, Push |
| **Web Push** | `web-push` + service worker | notificaciones (hoy incompleto) |

Detalle por dominio:

| Dominio | Canal | Archivo representativo |
|---|---|---|
| Rutinas | browser client → `routines`/`routine_exercises` | `(app)/rutinas/page.tsx` |
| Workouts | Zustand local → Supabase al finalizar | `(session)/entrenar/page.tsx` |
| Chat | browser + RPC `send_message` + Realtime | `(app)/mensajes/[id]/page.tsx` |
| Social | browser + Realtime | `(app)/explorar/page.tsx` |
| Trainer | browser → `trainer_clients`/`assigned_routines` | `(app)/entrenadores/page.tsx` |
| Spotify | route handlers server | `api/spotify/**` |
| YouTube | oEmbed (server) | `api/oembed/route.ts` |

**No hay server actions.** `rg "use server"` → 0.

---

## 8. Motor de rutinas — flujo real

### 8.1 Crear / editar rutina

```mermaid
flowchart TD
  A[Usuario en /rutinas] --> B[Editor local useState<br/>DraftEx array]
  B --> C{¿Nueva o editar?}
  C -->|Editar| D[UPDATE routines]
  D --> E[SELECT routine_exercises existentes]
  E --> F[DELETE sobrantes]
  F --> G[UPSERT routine_exercises]
  C -->|Nueva| H[INSERT routines .select id]
  H --> I[INSERT routine_exercises]
  G --> J{¿Error?}
  I --> J
  J -->|Sí| K[toast error]
  J -->|No| L[toast ok + invalidar query]
  M["Sin transacción / sin rollback:<br/>si falla el paso 2 quedan<br/>rutinas huérfanas o vacías"] -.-> D
  M -.-> H
```

- Estado del borrador: `useState` **local** (no Zustand).
- Guardado multi-paso **sin transacción** → riesgo de pérdida/duplicación de
  ejercicios. Detalle en el diagnóstico.

### 8.2 Iniciar y finalizar entrenamiento

```mermaid
sequenceDiagram
  participant U as Usuario
  participant E as /entrenar
  participant Z as Zustand (localStorage)
  participant S as Supabase

  U->>E: abre /entrenar?routine=ID
  E->>S: SELECT routines + routine_exercises + exercises
  S-->>E: rutina (o null por RLS)
  E->>Z: startWorkout + addExercise (por cada ejercicio)
  E->>S: carga pesos del último workout
  U->>Z: marca series (instantáneo, offline)
  U->>E: "Finalizar"
  E->>S: UPSERT workouts
  Note over S: trigger handle_workout_insert<br/>→ racha + post del feed
  E->>S: INSERT workout_exercises (uno a uno)
  E->>S: INSERT workout_sets (batch)
  E->>S: RPC unlock_achievements
  E->>Z: discardWorkout
```

> Puntos débiles: inserción de hijos **después** del trigger de racha/feed, y
> **sin transacción** → reintentos duplican series. Ver diagnóstico.

---

## 9. Flujo trainer ↔ alumno (estado actual)

```mermaid
sequenceDiagram
  participant T as Trainer
  participant DB as Supabase
  participant A as Alumno

  Note over T: intenta "Registrarme como trainer"
  T->>DB: UPDATE profiles.role = 'trainer'
  Note over DB: trigger prevent_privilege_escalation<br/>REVIERTE role/is_trainer_approved ❌
  Note over T: nunca ve el panel de trainer

  T->>DB: INSERT trainer_clients (status active)
  Note over DB: RLS: solo trainer puede insertar<br/>sin consentimiento del alumno
  T->>DB: INSERT assigned_routines (routine del trainer)
  Note over A: no recibe DM ni push

  A->>DB: SELECT assigned_routines (ve nombre)
  A->>DB: SELECT routines WHERE id = asignada
  Note over DB: RLS routines_select NO contempla<br/>assigned_routines → null ❌
  Note over A: "Entrenar" abre sesión vacía
```

Estados y capacidades **reales**:

| Acción | Trainer | Alumno |
|---|---|---|
| Autoregistrarse como trainer | ❌ bloqueado por trigger | — |
| Solicitar ser alumno | — | ❌ no existe |
| Aceptar / rechazar | ❌ UI sin origen de `pending` | ❌ no existe |
| Agregar alumno | ✅ unilateral, sin aviso | — |
| Dejar al trainer | — | ❌ no existe |
| Ver rutina asignada | ✅ | ⚠️ solo lista, **no abre** (RLS) |
| Ver progreso del alumno | ⚠️ solo `streak_count` | — |

---

## 10. Autenticación y sesión

```mermaid
flowchart TD
  A[Usuario] --> B{Proveedor}
  B -->|Google OAuth| C[signInWithOAuth]
  B -->|Magic link| D[signInWithOtp]
  B -->|Email+pass| E[signUp / signInWithPassword]
  C --> F[/auth/callback<br/>exchangeCodeForSession]
  D --> F
  F --> G{profiles.onboarded?}
  G -->|No| H[/onboarding]
  G -->|Sí| I[destino / next]
  I --> J[(app)/layout: getUser]
  J -->|sin sesión| K[/login?next=]
  J -->|ok| L[AppShell + ProfileProvider]
```

- `middleware.ts`: refresca token, headers de seguridad, rate-limit 60 req/min/IP,
  redirige a `/login`.
- `(app)/layout.tsx`: exige sesión y `onboarded=true`.
- ⚠️ `/auth/callback` **no** está en `PUBLIC_PATHS` → el primer request sin cookie
  puede redirigir a `/login` antes de ejecutar el handler.

---

## 11. Estado global (cliente)

| Store | Archivo | Persiste | Qué guarda |
|---|---|---|---|
| Workout draft | `lib/workout-store.ts` | ✅ localStorage (`hypertrofia-workout-draft`) | borrador de la sesión activa |
| Perfil | `components/providers.tsx` | ❌ | perfil del usuario (Zustand) |
| Toasts | `components/ui/toast.tsx` | ❌ | notificaciones |
| Query cache | `components/providers.tsx` | ❌ | TanStack Query (staleTime 30s) |
| Tema | `next-themes` | ✅ | claro/oscuro/sistema |

> ⚠️ **Dos** cargadores de perfil compiten: `ProfileSync` (en `providers.tsx`) y
> `ProfileProvider` (en los layouts). El primero pisa al segundo con un `select`
> incompleto → pierde `role`, `plan`, `is_admin`, `is_trainer_approved`.

---

## 12. PWA / offline / push

| Pieza | Archivo | Estrategia |
|---|---|---|
| Manifest | `src/app/manifest.ts` → `/manifest.webmanifest` | standalone, `start_url=/dashboard` |
| Service Worker | `public/sw.js` | `network-first` para Supabase y navegación (fallback shell), `cache-first` para estáticos |
| Registro SW | `components/sw-register.tsx` | solo en producción |
| Push (cliente) | `(app)/mensajes/page.tsx` | `pushManager.subscribe` con `NEXT_PUBLIC_VAPID_PUBLIC_KEY` |
| Push (server) | `api/push/send/route.ts` | protegido por `x-hook-secret`, **sin caller** en el repo |
| Detector offline | — | ❌ no existe (no hay banner de `navigator.onLine`) |

---

## 13. Integraciones externas

| Integración | Cómo | Auth |
|---|---|---|
| **Spotify** | `/api/spotify/auth` (PKCE) → `/callback` → tokens; `/data`, `/search`, `/share` | OAuth usuario + client_credentials |
| **YouTube** | `/api/oembed` (oEmbed, usado en perfil) | ninguna |
| **Apple Music** | `/api/oembed` | ninguna |
| **YouTube Data API** | `/api/youtube/search` | **huérfano** (sin usos, sin API key) |
| **Spotify debug** | `/api/spotify/debug` | ⚠️ **sin auth**, expone prefijo del Client ID |
| **Web Push** | `/api/push/*` + `web-push` | VAPID + hook secret |

---

## 14. Semáforo de salud

| Área | Estado | Comentario |
|---|---|---|
| Auth / login | 🟡 | callback posiblemente bloqueado por middleware |
| Rutinas propias (crear/editar) | 🟡 | funciona, pero sin transacción (pierde/duplica) |
| Rutinas asignadas (alumno) | 🔴 | RLS impide abrirlas |
| Rol trainer | 🔴 | trigger revierte + perfil no carga `role` |
| Recetas asignadas | 🔴 | tabla inexistente |
| Chat / DM | 🔴 | tabla/RPC inexistentes (salvo que existan a mano) |
| Push | 🔴 | sin caller + tabla inexistente |
| Cursos / marketplace | 🟠 | sin pago real ni acceso a contenido |
| Social / feed | 🟢 | funcional |
| PWA / tema / iOS | 🟢 | optimizado recientemente |

➡️ Diagnóstico detallado, causa raíz y plan de arreglo:
[`06-diagnostico-rutinas-y-trainer.md`](./06-diagnostico-rutinas-y-trainer.md)
