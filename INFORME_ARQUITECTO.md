# Informe Técnico: Estado Actual del Proyecto — hypertrof.ia

**Fecha:** 18 de agosto de 2026
**Auditoría de Origen:** Generado para revisión de arquitectura y seguridad previa a producción.
**Repo auditado:** `/home/ddr/Documentos/ideas/hypertrof.ia/web` (git, HEAD `8647a92`)

> **Nota de divergencia:** la plantilla de referencia asume React Native/Expo + Supabase. El repositorio local real (el único proyecto "hipertrofia" de la máquina) es **Next.js + Prisma empaquetado con Capacitor**. La plantilla se completa a continuación con los datos exactos del repo, marcando explícitamente los puntos donde la premisa de la plantilla no aplica.

---

## 1. Stack Tecnológico

* **Framework Mobile:** Capacitor **8.4.2** (Android + iOS vía WebView) sobre Next.js **16.2.5** (App Router, Turbopack). *(No es React Native/Expo/Flutter: la app es una web-app Next.js que se compila a estático en `out/` y se envuelve en un WebView nativo.)*
* **Lenguaje:** TypeScript ^5 (React 19.2.4, Node v26.5.0 local).
* **Backend como Servicio (BaaS):** **No usa Supabase.** Backend propio: 24 route handlers en `src/app/api/**` + Prisma ORM **7.8.0** con `@prisma/adapter-libsql` (SQLite `dev.db` en dev) y `@prisma/adapter-pg` (PostgreSQL en prod). *(No hay Supabase Auth, ni Realtime, ni Storage.)*
* **Hosting / Edge Functions:** Vercel — build dual: `NEXT_SERVER_BUILD=1 npm run build` (server) o `output: "export"` (estático para Capacitor).
* **Librerías Principales:**
  * Navegación: App Router de Next.js (rutas de archivo, sin react-navigation ni expo-router)
  * Gestión de Estado: `zustand` 5.0.14 con persistencia en `localStorage` (store de sesión de entrenamiento) + React Context (`auth-provider.tsx`) + `useState` locales en cada pantalla
  * Estilos UI: Tailwind CSS v4 (CSS-first, tokens en `globals.css`, sin config JS) + estilos inline en las pantallas
  * Auth: `jose` 6.2.3 (JWT HS256) + `jsonwebtoken` 9.0.3 (client secret Apple) + `bcryptjs` 3.0.3 (cost 12)
  * Iconografía: `lucide-react` 1.14.0

---

## 2. Estructura del Proyecto

### Árbol de Carpetas Simplificado

```
hypertrof.ia/
└── web/
    ├── prisma/schema.prisma          # 16 modelos (sin migraciones versionadas)
    ├── prisma.config.ts              # Config Prisma
    ├── capacitor.config.ts           # Config Capacitor (URL LAN hardcodeada)
    ├── next.config.ts                # Build dual (estático / server)
    ├── public/assets/exercises/      # 246 WebM de ejercicios (~4.3 MB)
    ├── android/                      # Proyecto Capacitor Android (gitignored)
    ├── out/                          # Export estático (gitignored)
    └── src/
        ├── app/                      # Páginas + API routes
        │   ├── page.tsx              # Landing + login/registro (480 líneas)
        │   ├── dashboard/ rutinas/ ejercicios/ perfil/ calorias/
        │   ├── calculadora/ nutricion/ trainer/ marketplace/ pendiente/ auth/
        │   └── api/                  # auth, exercises, rutinas, nutricion,
        │                             # marketplace, trainer, profile, seed, calculadora
        ├── components/               # auth-provider, nav, toast + stubs vacíos
        ├── widgets/WorkoutSessionTracker.tsx   # Diario de cargas (631 líneas)
        ├── entities/workout/model/workoutStore.ts  # Store Zustand persistido
        ├── lib/                      # auth.ts (JWT), oauth.ts (código muerto), demo-user.ts
        ├── server/                   # db.ts (adapter automático), streak, helpers, user
        ├── shared/                   # data/ (catálogos, glosario), lib/ (Mifflin-St Jeor)
        └── data/exercises-translated.json  # Semilla 246 ejercicios
```

### Arquitectura de Lógica de Negocio

* **Pantallas vs. Lógica:** Los route handlers de `app/api/**` consultan **Prisma directamente**, sin capa de repositorio/servicio. La lógica de negocio convive en el mismo archivo que el HTTP: por ejemplo `trainer/page.tsx` (1.449 líneas) mezcla UI, fetch y lógica de negocio en una sola pantalla.
* **Manejo de Estado:** Store Zustand persistido en `localStorage` (`hypertrofia-active-session`) para la sesión de entrenamiento en caliente (optimistic updates), más llamadas directas a la API dentro del renderizado de cada pantalla, **sin caché ni deduplicación** (p. ej. búsqueda de alimentos en `nutricion/page.tsx` dispara fetch por tecla).
* **FSD declarado, no implementado:** la doc promete Feature-Sliced Design (`features/`, `processes/`, `pages/`) pero esas carpetas no existen; la estructura real es páginas monolíticas + un widget gigante.

---

## 3. Base de Datos y Supabase

### 3.1. Supabase

**No aplica.** La persistencia es Prisma ORM (SQLite dev / PostgreSQL prod). No hay `supabase/` (migraciones SQL ni Edge Functions) en el repo.

### 3.2. Esquema Actual de Tablas y Relaciones (Prisma, 16 modelos)

* **User**: credenciales y roles. `id`, `email` (único), `passwordHash`, `role` (**String libre**: ATHLETE/TRAINER/ADMIN/OWNER — sin enum), `isApproved`, `phone`, `trainerId` (FK auto-relación TrainerAthletes).
* **Profile**: 1:1 con User. Datos físicos (`sex`, `ageYears`, `heightCm`, `weightKg`), `bmrKcal`/`tdeeKcal`, `activityFactor`, `avatarUrl`, `streak`/`maxStreak`, `grade`, `medals`, preferencias alimentarias (`dietType`, `dietGoal`, `foodLikes`/`foodDislikes`/`favoriteMeals` como String JSON).
* **TrainingProgram**: plantilla de entrenamiento, `isTemplate`, FK opcional `trainerId`.
* **AthleteProgram**: asignación atleta↔programa con `@@unique(athleteId, programId)`, `active`, `startDate`/`endDate`.
* **Workout** → **WorkoutExercise**: rutina y sus ejercicios con `orderIndex`, `targetSets`, `targetReps`, `restSec`, `groupName`, `color`, `isSuperSet`, `targetWeight`, `weightUnit`; `@@unique(workoutId, exerciseId, orderIndex)`.
* **Exercise**: catálogo global, `name` único, `muscleGroup`, `equipment`, `instructions`, `gifUrl` (WebM local), `isCustom`, `authorId`.
* **ExerciseLog**: diario de cargas ejecutado. FK a `athleteId` (User) y `exerciseId`; `sets`, `reps`, `weightKg`, `volumeKg`, `notes`.
* **Recipe** / **MealLog**: recetas con macros (`calories`, `proteinG`, `carbsG`, `fatsG`, `countryCode "UY"`, `dietTypes` String) y registros de comidas por atleta.
* **Course** / **CourseEnrollment**: marketplace. `priceUyu` (Int), `status` (String), FK `trainerId`; matrícula con `paid`/`paidAt`, `@@unique(courseId, athleteId)`.
* **Attendance**: check-in con `date` como **String** "YYYY-MM-DD" y `@@unique(userId, date)`.
* **OneRMRecord**: histórico de estimación 1RM (`weightKg`, `reps`, `oneRM`, `unit`).

**Debilidades del esquema:** sin enums (roles/estados libres), fechas como String en Attendance, JSON serializado como String (sin consultas ni validación), y **no existe `prisma/migrations/`** — el esquema se aplica a mano (riesgo de drift entre SQLite y PostgreSQL).

### 3.3. Seguridad RLS (Row Level Security)

* **Estado RLS:** ⚠️ **No aplica / Inexistente** (Prisma no tiene RLS). Equivalente a "RLS desactivado": la protección depende de que cada endpoint llame a `getSession()` manualmente.
* **Políticas Actuales:** No existe ninguna política de aislamiento por usuario (equivalente a `auth.uid() = client_id`). De hecho:
  * `GET /api/seed` y `GET /api/seed/recipes`: **públicos** (borran y reinsertan los 246 ejercicios, promueven a `carrizoaxel67@gmail.com` a ADMIN).
  * `GET /api/auth/trainers`: expone emails sin sesión.
  * `GET /api/marketplace/cursos` + POST: operan sobre un **usuario demo compartido** (`demo@hipertrof.ia`) y `body.email` spoofeable — cualquiera lee/escribe datos ajenos.

---

## 4. Autenticación y API

* **Flujo de Auth:** JWT **HS256** firmado con `SESSION_SECRET`, emitido en cookie `ht_session` (**httpOnly, sameSite=lax, 30 días**; `secure` solo en producción salvo `COOKIE_INSECURE=1`). Registro con `bcryptjs` cost 12, auto-aprobación de todos los usuarios, y dos emails hardcodeados (`carrizoaxel67@gmail.com`, `carrizoaxel30@gmail.com`) reciben rol `OWNER`. *(No es Supabase Auth: es auth propia sobre la cookie.)*
* **Proveedores de Identidad (OAuth):**
  * **Google:** Credenciales reales en `.env` (`GOOGLE_CLIENT_ID/SECRET`), pero **el flujo OAuth NO está operativo**: el landing envía un email inventado (`google.user@hipertrof.ia`) a `/api/auth/social`, que crea la sesión sin verificación de código OAuth. El intercambio real existe en `src/lib/oauth.ts` como **código muerto** (las rutas `/api/auth/oauth/[provider]/callback` no existen en el repo).
  * **Apple:** Código implementado en `lib/oauth.ts` (`buildAppleClientSecret`, ES256) pero **sin credenciales** en `.env` (comentadas).
  * **Meta (Facebook):** Credenciales reales en `.env`, mismo problema que Google: flujo no operativo (solo el POST sin verificar de `/api/auth/social`).
* **Gestión de Sesión:** Token en **cookie httpOnly** (no AsyncStorage/SecureStore, no localStorage). La sesión **no se re-verifica contra la DB** en cada request (`getAuthUser()` existe pero ninguna ruta lo usa): un usuario desaprobado sigue operando con la sesión vieja. **No hay `middleware.ts`** — la protección de páginas es client-side.

---

## 5. Lista de "Cables Puestos con Pinza" (Deuda Visual y UI)

 1. **Inconsistencia en Layouts:** **90 ocurrencias** de colores prohibidos (neón `rgba(0,255,135)`, cian `rgba(0,198,255)`, púrpura `#7c3aed/#a78bfa`, azul iOS `#007aff/#34c759/#ff9500/#ff3b30/#af52de`, naranja `#ff5e3a/#ffa502`) en **12 pantallas**, pese a la paleta unificada salvia (`--brand:#8fae82`) definida en `globals.css`. Estilos inline en la landing (`<style>` gigante) y spinners inline.
 2. **Componentes Duplicados:** Stubs vacíos aún importados (`components/mascota.tsx`, `components/main-nav.tsx`); botones/cards/tabs reimplementados inline en cada página en vez de componentes compartidos; guards de auth duplicados página por página; `auth/page.tsx` es solo un redirect (18 líneas).
 3. **Bugs de Re-renderizado / Fetch:** `nutricion/page.tsx` sin debounce (múltiples fetches por tecla); `dashboard/page.tsx:68,126` y `trainer/page.tsx:172,184` llaman a **`/api/admin/users`, que no existe** → ambos paneles fallan al cargar; `dashboard/page.tsx:50` llama a `/api/gimnasio/membresias` (tampoco existe, feature QR eliminada pero el código quedó).
 4. **Overlaps / UX móvil:** La app nativa Capacitor apunta a `http://192.168.1.12:3001` con `cleartext: true` (URL LAN hardcodeada, sin URL de producción; las pantallas del APK dependen de un dev server local). `WorkoutSessionTracker` registra "20kg × 10" como fallback si un ejercicio queda sin series completadas.
 5. **Otros:** `trainer/page.tsx` monolítico de 1.449 líneas; la "PWA" **no tiene manifest ni service worker**; `RECONSTRUCCION.md` declara arreglados bugs que siguen presentes (documentación contradictoria); sin migraciones versionadas; `out/` (build estático) no contiene las API routes → el binario nativo solo funciona contra servidor externo.

---

## 6. Vulnerabilidades y Deuda Técnica

 1. **Exposición de Variables de Entorno:** Credenciales **reales** de Google (`GOCSPX-...`) y Facebook (app secret) en `.env` en disco (gitignored, pero riesgo de backup/copia); **`SESSION_SECRET` hardcodeado en el código** (`auth.ts` y `.env.example`: `"hipertrofia-super-secret-jwt-key-2026-xK9mP3qZ"`) → quien lo obtenga **forja JWT con rol OWNER**. Cookie no `secure` en dev/LAN (HTTP en claro).
 2. **Falta de Validación de Datos:** Sin zod/yup en ningún formulario. `register` acepta `role` **directo del body del cliente** → **escalada de privilegios**: cualquiera se registra como TRAINER/ADMIN/OWNER. `priceUyu: Number(body.priceUyu ?? 0)` acepta NaN/negativos. Sin validación de email ni fortaleza de contraseña, sin rate limiting (fuerza bruta).
 3. **Sanitización e Inyecciones:** Prisma parametriza las consultas (riesgo SQL bajo), pero: datos no sanitizados en `avatarUrl` (base64 acepta `image/svg+xml` → vector de XSS stored), JSON sin validar en campos String, y **emails expuestos públicamente** en `/api/auth/trainers` sin autenticación.
 4. **Auth rota por diseño:** (a) **Sesión fantasma** en `login/route.ts`: si el usuario no existe (o la DB falla), se emite sesión con `userId` aleatorio → cualquier email+contraseña "loguea"; (b) **social login sin verificación** (`/api/auth/social` acepta cualquier `{provider, email, name}` del cliente); (c) la sesión no se contrasta contra la DB en rutas sensibles; (d) `/api/seed` **público y destructivo**.
 5. **Rendimiento:** Sin capa de caché (nada de React Query/SWR); fetch por tecla en nutrición; avatares base64 (hasta 100 KB) almacenados en la DB; 246 WebM (~4.3 MB) servidos sin lazy-loading; **sin tests, sin CI/CD** (`vercel.json` ni siquiera está commiteado); build dual estático/server que duplica la superficie de despliegue.
