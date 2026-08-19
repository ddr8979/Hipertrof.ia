# Informe Técnico — hypertrof.ia

**Fecha:** 18/08/2026
**Audiencia:** Arquitecto de software senior
**Repo:** `/home/ddr/Documentos/ideas/hypertrof.ia/web` (git, último commit `8647a92`)
**Estado del informe:** Análisis del código fuente actual (working tree), no de la documentación del repo (que está desactualizada y contradice el código — ver §5.13).

> **Resumen ejecutivo:** Proyecto funcional en superficie pero con **deuda de seguridad crítica** (auth roto por diseño, escalada de privilegios, endpoints públicos destructivos, secretos reales en disco). La documentación `RECONSTRUCCION.md` declara arreglados bugs que **siguen presentes en el código**. No apto para producción sin intervención previa.

---

## 1. Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework web | Next.js (App Router, Turbopack) | **16.2.5** |
| UI | React + React DOM | **19.2.4** |
| Lenguaje | TypeScript | ^5 (Node v26.5.0 local) |
| Estilos | Tailwind CSS v4 (CSS-first, sin config JS) | ^4 |
| ORM / DB | Prisma Client | **7.8.0** |
| Drivers DB | `@prisma/adapter-libsql` (SQLite dev) / `@prisma/adapter-pg` + `pg` (PostgreSQL prod) | 0.17.3 / 7.8.0 / 8.21.0 |
| Estado global | Zustand (persistencia `localStorage`) | 5.0.14 |
| Auth | `jose` (JWT HS256) + `jsonwebtoken` (client secret Apple) | 6.2.3 / 9.0.3 |
| Hashing | `bcryptjs` (cost 12) | 3.0.3 |
| Iconos | `lucide-react` | 1.14.0 |
| Envoltorio nativo | Capacitor (Android + iOS) | 8.4.2 |
| Lint | ESLint 9 + `eslint-config-next` | ^9 |

**Aclaración importante:** **No es React Native ni Expo ni Flutter.** Es una web-app Next.js (PWA declarada, sin manifest ni service worker — ver §5.12) empaquetada con **Capacitor** en un WebView nativo. La app Android compila contra un **build estático** (`out/`) y, en la config actual, apunta a un dev server local por HTTP (ver §5.4).

**Modo de build dual** (`next.config.ts`): con `NEXT_SERVER_BUILD=1` compila como server (para Vercel); sin él, `output: "export"` estático (para Capacitor). Dos despliegues, una sola base de código.

---

## 2. Estructura del Proyecto

```
hypertrof.ia/
├── CONTEXT.md / README.md / RECONSTRUCCION.md / DEPLOY.md   # Docs (desactualizadas)
└── web/
    ├── prisma/schema.prisma          # 16 modelos (SIN migraciones versionadas)
    ├── prisma.config.ts              # Config Prisma (apunta a prisma/migrations, inexistente)
    ├── capacitor.config.ts           # Config Capacitor (URL LAN hardcodeada)
    ├── src/
    │   ├── app/                      # App Router
    │   │   ├── page.tsx              # Landing + login/registro (480 líneas)
    │   │   ├── dashboard/ rutinas/ ejercicios/ perfil/ calorias/
    │   │   ├── calculadora/ nutricion/ trainer/ marketplace/ pendiente/ auth/
    │   │   └── api/                  # 24 route handlers
    │   │       ├── auth/             # login, logout, register, session, social, trainers
    │   │       ├── calculadora/ exercises/ profile/ rutinas/ nutricion/
    │   │       ├── marketplace/ trainer/ seed/
    │   ├── components/               # auth-provider, nav, toast + 2 stubs vacíos
    │   ├── widgets/WorkoutSessionTracker.tsx   # Diario de cargas (631 líneas)
    │   ├── entities/workout/model/workoutStore.ts  # Zustand persistido
    │   ├── lib/                      # auth.ts (JWT), oauth.ts (código muerto), demo-user.ts
    │   ├── server/                   # db.ts (adapter automático), helpers, streak, user
    │   ├── shared/data/              # catalogs.ts, glosario-data.ts
    │   ├── shared/lib/mifflinStJeor.ts
    │   └── data/exercises-translated.json   # Semilla 246 ejercicios
    ├── public/assets/exercises/      # 246 WebM de ejercicios (~4.3 MB)
    ├── android/                      # Proyecto Capacitor Android (gitignored)
    └── out/                          # Export estático (gitignored)
```

**Arquitectura real vs. declarada:** La doc declara Feature-Sliced Design (FSD), pero `processes/`, `features/` y `pages/` **no existen**. La estructura real es: páginas monolíticas en `app/` (hasta 1.449 líneas en `trainer/page.tsx`), un widget gigante (`WorkoutSessionTracker`, 631 líneas) y helpers sueltos. La "lógica de negocio" está repartida entre los route handlers (`app/api/`), el store Zustand y `src/server/`.

---

## 3. Base de Datos y Supabase

### 3.1. Supabase: NO SE UTILIZA

El proyecto **no usa Supabase**. La persistencia es directa vía **Prisma 7.8**:
- **Dev:** SQLite (`file:./dev.db`, adapter `@prisma/adapter-libsql`).
- **Prod:** PostgreSQL (adapter `@prisma/adapter-pg`), seleccionado automáticamente por prefijo de URL en `src/server/db.ts`.

**Consecuencia directa sobre RLS:** No existe RLS ni nada equivalente. Toda la seguridad de datos es **a nivel de aplicación**, y es inconsistente (ver §6). Cualquier endpoint que omita la verificación de sesión expone/permite escritura de datos ajenos.

### 3.2. Esquema actual (16 modelos, `prisma/schema.prisma`)

| Modelo | Notas |
|---|---|
| `User` | `role` como **String** libre (ATHLETE/TRAINER/ADMIN/OWNER), `isApproved`, auto-relación `trainerId`→`athletes` |
| `Profile` | 1:1 con User; datos físicos, BMR/TDEE, streak/maxStreak, medallas, preferencias alimentarias (como String JSON) |
| `TrainingProgram` | Plantilla con `isTemplate`; FK opcional `trainerId` |
| `AthleteProgram` | Asignación atleta↔programa, `@@unique(athleteId, programId)` |
| `Workout` / `WorkoutExercise` | Rutina→ejercicios con `orderIndex`, sets objetivo, descanso, supersets; `@@unique(workoutId, exerciseId, orderIndex)` |
| `Exercise` | Catálogo, `name` único, `gifUrl`, `isCustom` |
| `ExerciseLog` | Log de series/peso/volumen por atleta |
| `Recipe` / `MealLog` | Recetas (macros, `countryCode "UY"`) y registros de comidas |
| `Course` / `CourseEnrollment` | Marketplace de cursos con `priceUyu` (Int) y `paid` |
| `Attendance` | `date` como **String** "YYYY-MM-DD", `@@unique(userId, date)` |
| `OneRMRecord` | Estimación 1RM histórica |

**Debilidades del esquema:**
- **No hay enums** (roles, estados y dietas son strings libres → datos inválidos a nivel DB).
- Fechas como `String` (Attendance, `performedAt`/`startDate`/`endDate` como DateTime en otros) → formato inconsistente.
- JSON serializado como String (`foodLikes`, `tags`, `dietTypes`) → sin consultas ni validación.
- `WorkoutLog`/`WorkoutSet` (modelados en la doc) **no existen**; el diario de cargas persiste vía `ExerciseLog` plano.
- **No hay migraciones** (`prisma/migrations/` inexistente). El schema se aplica a mano; sin versionado de esquema, los despliegues a Postgres son frágiles.

---

## 4. Autenticación y API

### 4.1. Flujo actual

1. **Registro** (`/api/auth/register`): valida campos mínimos, bcrypt cost 12, crea `User` + `Profile`, emite sesión. **Auto-aprueba a todos**; dos emails hardcodeados (`carrizoaxel67@gmail.com`, `carrizoaxel30@gmail.com`) reciben rol `OWNER`.
2. **Login** (`/api/auth/login`): busca por email, compara bcrypt.
3. **Sesión** (`src/lib/auth.ts`): JWT HS256 firmado con `SESSION_SECRET`, cookie `ht_session` **httpOnly, sameSite=lax, 30 días**, `secure` solo en prod (salvo `COOKIE_INSECURE=1`).
4. **Logout**: borra cookie.

### 4.2. Proveedores sociales (Google, Apple, Meta)

- **Google y Facebook: configurados con credenciales reales en `.env`** (client IDs y **secrets**; ver §6.1).
- **Apple: NO configurado** (comentado en `.env`; el código `buildAppleClientSecret()` existe en `src/lib/oauth.ts` pero nunca se invoca).
- **El flujo OAuth real NO existe en producción**: el landing (`src/app/page.tsx:80`) llama a `/api/auth/social` enviando `email` y `name` **inventados** (`${provider}.user@hipertrof.ia`) directamente al body del POST. El servidor lo acepta sin verificar nada (ver §6.3).
- Las rutas prometidas `/api/auth/oauth/[provider]` y `/callback` **no están en el repo**. `src/lib/oauth.ts` (Google/Facebook/Apple completos) es **código muerto**: solo lo importa el propio `social/route.ts` (que no lo usa).

### 4.3. Manejo de sesión/tokens

- Payload del JWT: `{ id, email, name, role, isApproved }`. **Ningún endpoint verifica el usuario contra la DB** (existe `getAuthUser()` pero no se usa en ninguna ruta). Consecuencias: un usuario baneado/aprobado tarde sigue operando con la sesión vieja, y un JWT válido (cualquiera con el secret) vale por 30 días.
- **No hay `middleware.ts`**: la protección de páginas es client-side (redirección tras leer `/api/auth/session`).

---

## 5. "Cables Puestos con Pinza" (bugs visuales, pantallas rotas, código hardcodeado)

| # | Problema | Evidencia | Severidad |
|---|---|---|---|
| 5.1 | **`/api/admin/users` NO existe** pero `dashboard/page.tsx:68,126` y `trainer/page.tsx:172,184` lo llaman → ambos paneles fallan al cargar / aprobar usuarios | `ls src/app/api/admin` → no existe | 🔴 Crítico |
| 5.2 | **`/api/gimnasio/membresias` NO existe** pero `dashboard/page.tsx:50` hace fetch (feature "pase QR" que se decidió eliminar, sigue el código) | grep en código | 🔴 Crítico |
| 5.3 | **Login social falso**: la landing fabrica `google.user@hipertrof.ia` y el endpoint crea la sesión sin verificación (ver §6.3) | `page.tsx:78-88` | 🔴 Crítico |
| 5.4 | `capacitor.config.ts`: **URL LAN hardcodeada** `http://192.168.1.12:3001` con `cleartext: true` — el APK depende de un dev server corriendo en esa IP; sin URL de producción | capacitor.config.ts | 🟠 Alto |
| 5.5 | **90 ocurrencias de colores prohibidos** (neón `rgba(0,255,135)`, cian `rgba(0,198,255)`, púrpura `#7c3aed/#a78bfa`, azul iOS `#007aff`, etc.) en 12 páginas, pese a la paleta unificada `--brand` de `globals.css` | grep en `src/app` + `src/widgets` | 🟠 Alto |
| 5.6 | `trainer/page.tsx`: **1.449 líneas monolíticas** con lógica de negocio, UI y estilos inline | wc -l | 🟠 Alto |
| 5.7 | `WorkoutSessionTracker.tsx`: 631 líneas; el POST falla detecta errores solo en algunos caminos y el fallback "20kg × 10" persiste en ciertos flujos (no todos los sets completados) | código | 🟠 Alto |
| 5.8 | Stubs vacíos aún presentes e importados: `components/mascota.tsx`, `components/main-nav.tsx` | código | 🟡 Medio |
| 5.9 | `auth/page.tsx` es solo un redirect a `/` con spinner (18 líneas) | código | 🟡 Medio |
| 5.10 | Landing con `<style>` inline gigante y estilos inline en componentes (spinner, loading) | `page.tsx` | 🟡 Medio |
| 5.11 | Endpoints `nutricion/diario` y `marketplace/*` atados a un **usuario demo** (`demo@hipertrof.ia`) en vez de la sesión (ver §6.5) | `diario/route.ts`, `cursos/route.ts` | 🟡 Medio |
| 5.12 | **"PWA" sin PWA**: no hay `manifest.webmanifest` ni service worker; `public/` solo tiene assets default de Next | `ls public/` | 🟡 Medio |
| 5.13 | **Documentación contradictoria**: `RECONSTRUCCION.md` declara arreglados los bugs 5.1–5.7, OAuth real y `/api/auth/social` borrado — **todo falso en el código actual**; `CONTEXT.md` describe Next 15, otro schema y otro auth | comparar doc vs código | 🟡 Medio |
| 5.14 | `out/` (export estático): en el build Capacitor las API routes **no existen**; toda la app nativa depende del servidor remoto (con la IP LAN de 5.4) | next.config.ts | 🟡 Medio |
| 5.15 | Usuarios de prueba en la DB local (`test@bug.com`, `demo@hipertrof.ia`, password "123456" documentado para trainers) | RECONSTRUCCION.md §7 | 🟢 Bajo |

---

## 6. Vulnerabilidades y Deuda Técnica

### 6.1. Exposición de claves

- **`.env` contiene credenciales REALES** de Google (`GOCSPX-...`) y Facebook (app secret) en disco. Está gitignored (no en el repo), pero: (a) riesgo de filtración por backup/copia/workspace compartido; (b) **el fallback del secret de sesión está hardcodeado en el código** (`auth.ts`: `"hipertrofia-super-secret-jwt-key-2026-xK9mP3qZ"`) y también en `.env.example` → quien obtenga ese string **forja JWT con cualquier rol** (OWNER).
- La cookie de sesión en dev no es `secure`; con `COOKIE_INSECURE=1` tampoco en prod (necesario por la IP LAN de 5.4, que además es HTTP en claro).

### 6.2. Escalada de privilegios en el registro

`register/route.ts` toma `role` **directamente del body del cliente** y lo persiste sin validar contra un set permitido. Cualquier persona puede registrarse como `TRAINER`, `ADMIN` u `OWNER`. (Solo los dos emails hardcodeados deberían ser OWNER.)

### 6.3. Autenticación rota por diseño

- **Login con "sesión fantasma"** (`login/route.ts`): si el usuario no existe (o la DB falla), se crea una sesión con un `userId` aleatorio (`usr-...`), rol ATHLETE. Cualquier email+contraseña "loguea" (los endpoints que exigen datos del perfil fallarán, pero la sesión se emite y el usuario navega el dashboard).
- **Social login sin verificación** (`social/route.ts`): acepta `{provider, email, name}` arbitrarios del cliente y crea/autentica usuarios con ese email. No hay intercambio de código OAuth, ni estado CSRF, ni validación de dominio. Es un login abierto disfrazado.

### 6.4. Endpoints sin autorización

- **`GET /api/seed` y `/api/seed/recipes`: públicos y destructivos.** Borran los 246 ejercicios no-custom y los reinsertan, y además **promueven a `carrizoaxel67@gmail.com` a ADMIN**. Cualquier persona puede llamarlo.
- **`GET /api/auth/trainers`: expone emails de trainers sin sesión** y hardcodea la exclusión de `carrizoaxel67@gmail.com`.
- **`GET /api/marketplace/cursos`**: público (ok para catálogo) pero auto-crea un curso demo con el usuario demo si no hay datos.

### 6.5. Falta de validaciones backend

- `marketplace/cursos` POST: el creador del curso es `body.email` (spoofeable) o el usuario demo; `priceUyu: Number(body.priceUyu ?? 0)` acepta `NaN`/negativos.
- `nutricion/diario` y `inscripciones`: operan sobre `DEMO_EMAIL` — **cualquier usuario lee/escribe los datos de un mismo usuario demo compartido**.
- `attendance`: acepta **cualquier fecha pasada o futura** → la racha (streak) es manipulable (el cálculo usa `Math.abs`).
- `register`: sin validación de formato de email ni fortaleza de contraseña; login sin rate limiting (fuerza bruta).
- `upload` (avatar): acepta `data:image/*` con regex `(\w+)` → **permite `image/svg+xml`** (vector de XSS stored si se renderiza en contexto no-img) y base64 sin sanitizar.

### 6.6. Frontend

- Auth guards solo client-side (sin `middleware.ts`): cualquier endpoint es accesible si se conoce la ruta; las páginas redirigen pero el HTML/JS es público.
- `nutricion/page.tsx`: búsqueda de alimentos **sin debounce** (múltiples fetches por tecla; documentado como arreglado y no lo está).
- 12 páginas con estilos/colores duplicados (ver 5.5) → CSS duplicado, sin sistema de tokens aplicado de forma consistente.
- `marketplace/page.tsx`: `buyCourse`/`createCourse` no verifican `res.ok` → muestran éxito aunque falle.

### 6.7. Rendimiento y operación

- **Avatares como base64 en la DB** (100 KB por imagen, sin CDN ni cache): infla Postgres y cada request de perfil.
- `dev.db` SQLite con la app en modo estático: la data de producción dependerá de Postgres, pero **sin migraciones** el despliegue es manual.
- 246 WebM (~4.3 MB) en `public/` servidos sin lazy-loading sistemático ni preloads.
- Build dual (estático + server) y `out/` regenerado a mano: **sin CI/CD**; `vercel.json` ni siquiera está commiteado (untracked).
- **Sin tests** de ningún tipo (unit, integración, e2e) ni lint en CI.
- `prisma.config.ts` referencia `prisma/migrations` que no existe; el schema evoluciona "a mano" (riesgo de drift dev/prod).

---

## 7. Recomendaciones prioritarias (para el arquitecto)

1. **Auth (bloqueante):** eliminar sesión fantasma y `/api/auth/social`; implementar OAuth real server-side con state CSRF (el código en `oauth.ts` está listo); validar `role` en registro contra whitelist; verificar sesión contra DB en rutas sensibles; rotar `SESSION_SECRET` y sacar el fallback del código.
2. **Rotar credenciales Google/Facebook** del `.env` (ya filtradas en disco); no commitear nunca; usar secreto fuerte por entorno.
3. **Proteger `/api/seed*`** (solo staff) y crear `/api/admin/users` (panel roto) o quitar esas llamadas.
4. **Reemplazar `DEMO_EMAIL`/`getOrCreateUser`** por sesión real en marketplace y nutrición; validar `priceUyu`, fechas de attendance y tipos de imagen.
5. **Migraciones Prisma** versionadas + generar el adapter de prod antes de desplegar; definir RLS-equivalente a nivel de servicio.
6. **Decidir el destino nativo:** la config Capacitor actual (IP LAN + cleartext) es inaceptable para release; apuntar a un dominio HTTPS real y decidir si el build estático tiene sentido sin API en el dispositivo.
7. **PWA real** (manifest + SW) si se mantiene la promesa offline-first, o eliminar el claim.
8. Priorizar refactor de `trainer/page.tsx` (1.449 líneas) y del tracker, y unificar paleta eliminando los colores hardcodeados.