# CONTEXTO PARA REANUDAR — Reconstrucción de hypertrof.ia

> **Instrucción para el agente:** analizá este archivo completo y continuá la reconstrucción del proyecto desde donde quedó. El proyecto vive en `/home/ddr/Documentos/ideas/hypertrof.ia/web`. Trabajá con el mismo plan de la sección "PLAN DE RECONSTRUCCIÓN" y marcá cada tarea completada actualizando este archivo al final.

## 0. PROGRESO ÚLTIMA SESIÓN (1-ago-2026, noche)

**TODO el frontend y backend quedó reconstruido y VERIFICADO. Estado: build OK, tsc 0 errores, lint 0 errores (1 warning de font en layout.tsx, preexistente).**

- Dev server corriendo en **:3001** (log `/tmp/opencode/next-dev.log`). Todas las páginas responden 200: `/`, `/dashboard`, `/trainer`, `/rutinas`, `/ejercicios`, `/calorias`, `/calculadora`, `/nutricion`, `/perfil`, `/pendiente`, `/auth`.
- Runtime verificado con curl: login OK, session OK, exercises search OK, profile OK, rutinas/logs POST (exerciseId+notes+volumen) y GET (weeklyVolumeKg) OK, programas OK, nutricion/diario POST (recipeId:""→null) y GET (totals) OK, OAuth mock (`/api/auth/oauth/google` → 307 a callback con code+state; callback 200), admin/users deniega ATHLETE (401/403 correctos), trainer/alumnos deniega ATHLETE, seed deniega ATHLETE (405), recetas sin sesión 401, attendance rechaza sin fecha.
- `.next` fue borrado 2 veces durante la sesión (errores de tipos stale + build). **Si algo raro de compilación: borrar `.next` y reiniciar `npm run dev`.**
- Último commit del repo: `3d0cfac` (no se commiteó nada en esta sesión).

## 1. Estado actual (1-ago-2026)

- **Proyecto:** hypertrof.ia — PWA fitness (Next.js 16.2.5 App Router, React 19, TS, Tailwind v4, Prisma 7.8 + libsql/pg, Zustand 5, lucide-react, jose JWT, bcryptjs, Capacitor 8 configurado sin builds).
- **Ubicación:** `/home/ddr/Documentos/ideas/hypertrof.ia/web` (git repo, última rama con commits hasta `3d0cfac`).
- **Docs del repo:** `AGENTS.md` (avisa que Next 16 tiene breaking changes; la doc está en `node_modules/next/dist/docs/`), `CONTEXT.md`, `CLAUDE.md`, `DEPLOY.md` — TODAS DESACTUALIZADAS (describen Next 15 y schema viejo). Hay que actualizarlas.
- **Base de datos:** SQLite en dev (`file:./dev.db`), adapter automático para Postgres en prod (`server/db.ts`). Cliente Prisma regenerado y consistente con el schema.
- **DEV SERVER IMPORTANTE:** el puerto 3000 está ocupado por un bot de Instagram (python `/home/ddr/Desktop/instagram/bot/bot.py`, PID variable). El dev server de Next arranca en **3001** (`npm run dev` → http://localhost:3001). No matar el bot.
- **Estética original:** tema claro "Soft Premium Light Sage": `--bg:#f4f6f1`, `--brand:#8fae82`, `--brand2:#5c7254`, `--brand3:#cbdac3`, glassmorphism, radios 24/16/12, botones pill con gradiente brand→brand2, bottom-nav fija con blur. Landing oscura (`#0d1209` + `background_cafe.png` + Playfair Display itálica para "Hipertrof.ia"). Ver `web/src/app/globals.css`.

## 2. DECISIONES DEL USUARIO (no revertir)

1. **Login social: ARMARLO Y QUE FUNCIONE con todas sus APIs** — implementar OAuth 2.0 REAL (Google, Apple, Facebook) con redirect + callback, listo para credenciales por env, y un **modo mock `OAUTH_MOCK=1`** para desarrollo sin credenciales (redirige directo al callback con código simulado → crea usuario con email `${provider}.user@hypertrof.ia`).
2. **Feature "pase de gimnasio" (modal QR): ELIMINAR** — quitar del dashboard todo lo relacionado (fetch a `/api/gimnasio/membresias`, estado `showQrModal`, `memberships`, `gymMemberships`).

## 3. PLAN DE RECONSTRUCCIÓN (todo en `web/`)

### Tareas ya COMPLETADAS
- [x] Exploración + diagnóstico (sección 4 y 5 de este archivo)
- [x] `src/lib/auth.ts` reescrito: secret obligatorio en prod, `getAuthUser()` verifica sesión contra DB, helpers `isTrainer/isStaff`, sin fallback inseguro
- [x] `src/server/helpers.ts` creado: `jsonError`, `jsonOk`, `requireSession()`
- [x] `src/shared/data/catalogs.ts` creado: `MUSCLE_GROUPS`, `EQUIPMENTS`, `ACTIVITY_LABELS`, `DIET_TYPES`, `DIET_GOALS` UNIFICADOS (todas las páginas deben importarlos de acá, no redefinir listas)
- [x] `src/lib/oauth.ts` creado: `OAUTH_PROVIDERS`, `buildAuthorizeUrl`, `exchangeCode`, `isProviderConfigured`, `isOAuthMockEnabled`, mock mode
- [x] **A. OAuth completo**: routes `[provider]/route.ts` + `callback/route.ts` creadas (state CSRF en cookie `ht_oauth_state`), `/api/auth/social` BORRADO, `.env` con `OAUTH_MOCK=1` + `APP_URL`, `.env.example` completo, landing `handleSocialLogin` redirige a `/api/auth/oauth/{provider}`, `jsonwebtoken` instalado (lo usa buildAppleClientSecret)
- [x] **B. Login**: sin sesión fantasma; DB caída → 500, usuario inexistente → 401
- [x] **C. APIs**: `/api/admin/users` creada (GET pending / PATCH approve, solo isStaff); marketplace borrado COMPLETO (pages+APIs+`lib/demo-user.ts`+`server/user.ts`); `/api/nutricion/diario` sesión real + fix `recipeId:""`→null; seed routes con isStaff; `/api/auth/trainers` sin hardcode de emails; `programas` PUT con verificación de propiedad + transacción 2 pasadas (índices temporales 100000+) sin violar `@@unique`; `/api/profile/attendance` sin fechas futuras + streak por upsert (`src/server/streak.ts`); `/api/trainer/alumnos` valida propiedad; `/api/rutinas/logs` acepta exerciseId/notes y llama markAttendance
- [x] **D. Frontend**: dashboard, trainer, rutinas, ejercicios, perfil, calorias, calculadora, nutricion, pendiente RECONSTRUIDOS (paleta salvia 100%, sin neón/cian/púrpura/iOS, sin Mascota, sin emojis-funcionales → lucide, auth guards en calorias/nutricion, `catalogs.ts` en todos, debounce alimentos en nutricion, `handleUnitToggle` sin mutación dentro del updater, Eye con onClick, `very` en vez de `very_active`, badgets green en vez de blue/purple — clase `.badge-blue` y `.badge-purple` ELIMINADAS de globals.css)
- [x] **E. WorkoutSessionTracker**: reescrito — si TODOS los POST fallan NO llama `endWorkout()` (no pierde datos), envía `exerciseId`+`notes`, promedios por ejercicio, timer de descanso REAL (90s al completar serie, con botón Saltar), colores iOS→paleta salvia, emojis→lucide, confirmación al cancelar
- [x] **F. Limpieza**: `src/generated` borrado, stubs mascota/main-nav borrados, carpetas FSD vacías removidas, `scripts/migrate.js`+`select.js`+`exercises-draft.json` borrados (eran one-off; el seed usa el JSON generado), `.next` limpio
- [x] **G. Verificación**: `npx tsc --noEmit` 0 errores, `npm run lint` 0 errores, `npm run build` ✓ (Compiled successfully, 35/35 static pages), runtime tests con curl en :3001 todos OK

### PENDIENTE (casi nada crítico)

**F. Limpieza (restos):**
- [ ] Actualizar `CONTEXT.md`, `CLAUDE.md`, `README.md`, `DEPLOY.md` a la realidad (Next 16, schema real, OAuth, puerto 3001)
- [ ] Eliminar usuario de prueba `test@bug.com` / `test12345` o dejar nota (fue usado para los tests de runtime)
- [ ] `auth/page.tsx`: verificar si sigue teniendo algo (solo es un redirect, opcional)
- [ ] Commit de todo el trabajo (repo en `3d0cfac`, no se commiteó nada aún)

### Tareas PENDIENTES (orden recomendado)

**Ya no hay tareas de código pendientes.** Las secciones A–E del plan original se completaron. Ver "PENDIENTE (casi nada crítico)" arriba. Para contexto histórico se dejan las secciones siguientes intactas.

**A. APIs de auth OAuth (pendiente):**
- [ ] Crear `src/app/api/auth/oauth/[provider]/route.ts` (GET): validar provider, generar `state` aleatorio, guardarlo en cookie httpOnly (ej. `ht_oauth_state`, 5 min), redirigir a `buildAuthorizeUrl`; si mock mode: redirigir a `/api/auth/oauth/{provider}/callback?code=mock-{state}&state={state}`
- [ ] Crear `src/app/api/auth/oauth/[provider]/callback/route.ts` (GET): leer code+state de query, verificar state contra cookie (borrarla), si mock (`code.startsWith("mock-")`) usar email `${provider}.user@hypertrof.ia`; si no, `exchangeCode(provider, code)`; upsert user (rol ATHLETE, `passwordHash: "oauth-{provider}-protected"`, `profile: {create:{}}`), `createSession`, redirigir a `/dashboard` (o `/trainer` si rol trainer)
- [ ] **Borrar** `src/app/api/auth/social/route.ts` (reemplazado por OAuth real)
- [ ] Agregar a `.env`: `OAUTH_MOCK=1` con comentario, y `.env.example` con `APP_URL`, `GOOGLE_CLIENT_ID/SECRET`, `APPLE_*`, `FACEBOOK_*` documentados
- [ ] Actualizar `src/app/page.tsx` (landing): `handleSocialLogin(provider)` → `window.location.href = "/api/auth/oauth/" + provider.toLowerCase()`
- [ ] Chequear si `jsonwebtoken` está en package.json (lo usa `buildAppleClientSecret`); si no, `npm i jsonwebtoken @types/jsonwebtoken`

**B. Arreglar login (pendiente):**
- [ ] `src/app/api/auth/login/route.ts`: quitar el fallback que crea sesión fantasma con userId aleatorio. Si `prisma.user.findUnique` falla (DB caída), responder 500 "Error en el servidor" y NO crear sesión. Si el usuario no existe → 401 "Credenciales inválidas" (no crear usuario).

**C. APIs nuevas/rotas:**
- [ ] Crear `src/app/api/admin/users/route.ts`: `GET ?pending=true` (solo ADMIN/OWNER; lista users con `isApproved:false`, sin passwordHash) y `PATCH {userId, approved}` (solo ADMIN/OWNER; setea isApproved). Referenciado desde dashboard y trainer (¡rompe ambos paneles hoy!)
- [ ] `src/app/api/marketplace/cursos/route.ts` y `inscripciones/route.ts`: quitar `DEMO_EMAIL`/`getOrCreateUser`; usar `getSession()`/`requireSession`; quitar spoofing de `body.email` en POST cursos (usar `session.id`); GET cursos sin auth OK (catálogo público); si no hay cursos auto-crear el demo con un OWNER/creador fijo solo una vez
- [ ] `src/app/api/nutricion/diario/route.ts`: quitar DEMO_EMAIL → usar sesión real
- [ ] `src/app/api/seed/route.ts` y `seed/recipes/route.ts`: proteger con rol ADMIN/OWNER (`isStaff`); devolver 403 si no
- [ ] `src/app/api/auth/trainers/route.ts`: quitar hardcode de emails; listar trainers aprobados con sesión requerida
- [ ] `src/app/api/rutinas/programas/route.ts` PUT (reordenar): verificar propiedad (el workout debe pertenecer al usuario) y arreglar el bug de constraint `@@unique([workoutId, exerciseId, orderIndex])` al intercambiar índices — usar transacción que actualice en orden inverso o deleteMany+createMany con los nuevos índices
- [ ] `src/app/api/profile/attendance/route.ts`: rechazar fechas futuras (bug: racha manipulable)
- [ ] `src/app/api/trainer/alumnos/route.ts` POST: validar que athleteId/programId correspondan al trainer cuando rol es TRAINER
- [ ] `src/app/api/rutinas/logs/route.ts` POST: aceptar `exerciseId` y `notes` opcionales (para el nuevo tracker); quitar fallback del tracker de "20kg × 10" si viene 0 (o validar)

**D. Frontend — reconstruir pages (mantener features, unificar estética salvia):**
- [ ] `src/app/dashboard/page.tsx`: quitar memberships/QR/memberships fetch (decisión usuario); arreglar `pendingUsers` con la nueva API admin/users; quitar `<Mascota/>` y `<Particles/>` si molesta; reemplazar todos los colores neón (`rgba(0,255,135,…)`), cian (`rgba(0,198,255,…)`) y púrpura por la paleta salvia (`--brand`, `--brand2`, `--brand3`, `--warn`, `--danger`); usar `catalogs.ts` si aplica
- [ ] `src/app/trainer/page.tsx` (1449 líneas): el bug CRÍTICO es `load()` con `Promise.all` a `/api/admin/users` (no existe) → **rompe todo el panel**. Usar la nueva API; reemplazar neón/cian/púrpura por salvia; quitar hardcodes de color `#3b82f6`, `#7c3aed` (usar paleta); validar entrenador dueño del alumno al evaluar
- [ ] `src/app/rutinas/page.tsx`: quitar púrpura `#7c3aed`/`#a78bfa` (usar brand/brand2); importar `MUSCLE_GROUPS/EQUIPMENTS` de `catalogs.ts`; quitar `<Mascota/>`; mantener tabs Registrar/Mis rutinas/Biblioteca, reorder con drag&drop, steppers, modal preview GIF, creador de ejercicios
- [ ] `src/app/ejercicios/page.tsx`: botón Eye sin onClick → ponerle onClick o quitarlo; usar `catalogs.ts`; reemplazar neón por salvia; mantener tabs Ejercicios/Glosario
- [ ] `src/app/perfil/page.tsx`: reemplazar cian/púrpura/naranja de medallas por paleta salvia; quitar emojis como iconos (usar lucide-react); mantener avatar con recorte canvas, preferencias, datos físicos, calendario
- [ ] `src/app/calorias/page.tsx`: agregar check de auth (redirigir a `/` si no hay sesión); arreglar `very_active` → `very`; dar feedback del error al guardar; paleta salvia; quitar `<Mascota/>`
- [ ] `src/app/calculadora/page.tsx`: quitar púrpura 1RM → paleta salvia; arreglar `handleUnitToggle` (mutar rmWeight dentro del updater de setUnit es anti-patrón); cargar historial 1RM al seleccionar ejercicio; unificar MUSCLE/EQUIPMENT con catalogs.ts
- [ ] `src/app/nutricion/page.tsx`: agregar check de auth; debounce en búsqueda de alimentos (hoy hace 4 fetches por tecla); fix `recipeId: ""` al agregar alimento libre (enviar undefined/null); modal claro no `#0c0f1d` oscuro (usar superficie clara del tema); paleta salvia; quitar `<Mascota/>`
- [ ] `src/app/marketplace/page.tsx`: agregar auth real (usar sesión, no demo); verificar `res.ok` en buyCourse/createCourse (hoy muestra éxito aunque falle); quitar emails hardcodeados en form
- [ ] `src/app/pendiente/page.tsx`: reemplazar púrpura/cian por salvia; mantener pantalla de espera
- [ ] `src/app/auth/page.tsx`: quitar fondo `#0d1209` hardcodeado (o dejarlo, solo es un redirect)

**E. WorkoutSessionTracker (widget clave):**
- [ ] `src/widgets/WorkoutSessionTracker.tsx`: 
  - NO perder datos: si el POST a `/api/rutinas/logs` falla (status no-2xx), mostrar toast de error y NO hacer `endWorkout()` (hoy pierde todo silenciosamente)
  - Enviar `exerciseId` y `notes` si la API los acepta; mantener promedios por ejercicio (schema no tiene WorkoutLog/WorkoutSet)
  - Si todos los sets de un ejercicio quedan sin completar, preguntar/saltar ese ejercicio en vez de registrar 20kg×10
  - Quitar colores iOS `#007aff/#34c759/#ff9500/#ff3b30/#af52de` → paleta salvia/badges
  - Reemplazar banner "Descanso: 1min 30s" hardcodeado (o hacer un timer real simple con el resto del workout)
  - Quitar emojis → lucide-react; quitar `<Mascota/>` si está

**F. Limpieza:**
- [ ] Borrar `src/generated/prisma/` (cliente obsoleto de ~1MB, nadie lo importa)
- [ ] Borrar stubs: `src/components/mascota.tsx` (y todos sus imports en pages), `src/components/main-nav.tsx` (y `TopBar` de nav.tsx si nadie lo usa)
- [ ] Borrar carpetas FSD vacías: `src/features/`, `src/processes/`, `src/pages/`, `src/entities/workout/ui/`, `src/entities/workout/api/` (mantener `entities/workout/model/workoutStore.ts` y `shared/`)
- [ ] Actualizar `CONTEXT.md`, `CLAUDE.md`, `README.md` a la realidad (stack real, schema real, OAuth)
- [ ] Revisar `middleware.ts` ausente — decidir si agregar protección server-side simple (opcional; las pages ya redirigen client-side)

**G. Verificación final:**
- [ ] `npx tsc --noEmit` (debe dar 0 errores)
- [ ] `npm run lint` (debe pasar)
- [ ] `npm run build` (debe pasar)
- [ ] Levantar dev (puerto 3001), probar flujos con curl: register/login/session, exercises, profile, rutinas/logs POST+GET, programas, trainer/alumnos (como trainer), admin/users (como owner: carrizoaxel67@gmail.com), marketplace, nutricion/diario, OAuth mock (`/api/auth/oauth/google?x` → sigue redirect)
- [ ] Eliminar usuarios de prueba creados (test@bug.com) o dejar una nota

## 4. DIAGNÓSTICO COMPLETO (bugs encontrados)

**Roturas críticas:**
1. `/api/admin/users` NO EXISTE pero dashboard (líneas 68, 126) y trainer (`load()` con Promise.all) lo llaman → ambos paneles fallan al cargar
2. `/api/gimnasio/membresias` NO EXISTE (dashboard línea 50) — feature a eliminar (decisión usuario)
3. Login: si la DB falla crea sesión con `userId` aleatorio inexistente ("sesión fantasma") — eliminar
4. Social login: mock inseguro (emails inventados) — reemplazar por OAuth real (decisión usuario)
5. Marketplace + nutrición/diario: usan `DEMO_EMAIL`/`getOrCreateUser` sin sesión → cualquiera lee/escribe datos del usuario demo; POST cursos permite spoofing de `body.email`
6. Seed routes sin auth y destructivas (borra y reinserta 246 ejercicios)
7. Reorder de rutinas (PUT programas): transacción rompe `@@unique([workoutId, exerciseId, orderIndex])` al intercambiar
8. Attendance: permite marcar cualquier día (pasado/futuro) → racha manipulable
9. WorkoutSessionTracker: no detecta 4xx/5xx → `endWorkout()` borra todo y se pierden datos; fallback 20kg×10; no envía exerciseId ni notas; banner descanso hardcodeado
10. Trainer: `addEx` hardcodea color `#3b82f6`; wizard genera nombre con prefijo `[#7c3aed]`; "Piernas+Glúteos" no existe en catálogo
11. Marketplace: `buyCourse`/`createCourse` no verifican `res.ok` → muestra éxito aunque falle
12. Nutrición: sin debounce (4 fetches por tecla); `recipeId: ""` al agregar alimento; modal oscuro `#0c0f1d` en tema claro
13. Calculadora: historial 1RM vacío hasta presionar Calcular; `handleUnitToggle` muta estado dentro de updater
14. Ejercicios: botón Eye sin onClick; listas MUSCLE/EQUIPMENT inconsistentes entre pages (rompe filtros)
15. Calorias/nutricion/marketplace: sin check de autenticación
16. `auth/trainers`: expone emails públicamente, excluye email hardcodeado
17. Secret JWT hardcodeado por defecto (ya arreglado en auth.ts)
18. `src/generated/prisma/`: cliente obsoleto, basura
19. Estética: tema salvia mezclado con neón `rgba(0,255,135)`, cian `rgba(0,198,255)`, púrpura `#7c3aed/#a78bfa`, azul iOS `#007aff`, `#34c759`, `#ff9500`, `#ff3b30`, `#af52de`, gradiente `#ff007f→#7c3aed` en: dashboard, trainer, rutinas, ejercicios, perfil, calorias, calculadora, nutricion, pendiente, marketplace, tracker. Emojis usados como iconos en lugar de lucide-react.
20. Docs (CONTEXT.md, CLAUDE.md, README, DEPLOY.md) desactualizadas

## 5. ARQUITECTURA ACTUAL (verdadera)

**Stack:** Next.js 16.2.5 (App Router, Turbopack), React 19.2.4, TS, Tailwind v4 (CSS-first, sin config JS), Prisma 7.8 (`@prisma/adapter-libsql` dev / `@prisma/adapter-pg` prod), Zustand 5 (persist localStorage), jose JWT HS256 cookie `ht_session` httpOnly 30 días, bcryptjs (12 rounds), lucide-react, Capacitor 8 (config sin builds).

**Estructura src/:**
- `app/`: layout.tsx + globals.css + pages: `/`(landing), `/dashboard`, `/rutinas`, `/ejercicios`, `/perfil`, `/calorias`, `/calculadora`, `/nutricion`, `/trainer`, `/marketplace`, `/pendiente`, `/auth`(redirect a /), + `app/api/**` (24 routes)
- `components/`: `auth-provider.tsx` (contexto cliente: user/loading/logout/refresh), `nav.tsx` (BottomNav + TopBar stub), `toast.tsx`, `mascota.tsx` (STUB null), `main-nav.tsx` (STUB null)
- `widgets/WorkoutSessionTracker.tsx` (552 líneas, diario de cargas)
- `entities/workout/model/workoutStore.ts`: store Zustand persistido `hypertrofia-active-session`; sets con `type: N/W/F/D`, `weight`, `reps`, `completed`, `previous?`, `rpe?`; acciones start/addExercise(no duplica)/removeExercise/addSet(hereda peso/reps del último set)/removeSet/toggleSet/cycleSetType/updateSet/updateNotes/endWorkout/cancelWorkout
- `shared/lib/mifflinStJeor.ts`: BMR/TDEE Mifflin-St Jeor, activities `sedentary|light|moderate|very|extra`
- `shared/data/glosario-data.ts`: 79 términos (Glosario Fit)
- `server/db.ts`: PrismaClient singleton + adapter automático libsql/pg
- `server/user.ts`: `getOrCreateUser` (SOLO usar para seeds/mock, NO en rutas de usuario real)
- `data/exercises-translated.json`: 246 ejercicios (semilla)

**Schema Prisma (16 modelos):** User (role ATHLETE|TRAINER|ADMIN|OWNER, isApproved default true, trainerId auto-relación TrainerAthletes), Profile (1:1, sex/age/height/weight/activity/bmr/tdee/avatar/streak/maxStreak/grade/medals/dietType/dietGoal/foodLikes/foodDislikes/favoriteMeals), TrainingProgram→Workout→WorkoutExercise (orderIndex/targetSets/targetReps/restSec/groupName/color/orderLabel/targetWeight/weightUnit/isSuperSet, @@unique(workoutId,exerciseId,orderIndex)), Exercise (name unique, muscleGroup/equipment/instructions/gifUrl/isCustom/authorId), ExerciseLog (sets/reps/weightKg/volumeKg/notes), Recipe (macros, countryCode UY, imageEmoji, dietTypes JSON-string), MealLog, Course (priceUyu Int, status), CourseEnrollment (@@unique courseId+athleteId, paid), Attendance (date String "YYYY-MM-DD", @@unique userId+date), OneRMRecord (weightKg/reps/oneRM/unit). NO hay enums, ni WorkoutLog/WorkoutSet (CONTEXT.md está desactualizado).

**Auth:** JWT HS256 cookie `ht_session` (30d). Register: bcrypt, auto-aprueba, emails carrizoaxel67@gmail.com / carrizoaxel30@gmail.com → rol OWNER hardcodeado (mantener, es el dueño). NO hay middleware.ts.

## 6. ESTÉTICA SALVIA (paleta a usar en TODO)

Tokens de `globals.css` (no tocar el archivo, solo usarlos):
- `--bg:#f4f6f1`, `--brand:#8fae82`, `--brand2:#5c7254`, `--brand3:#cbdac3`, `--danger:#ff4d6d`, `--warn:#ffb703`, `--text:#1c2319`, `--text2:#4d5849`, `--muted:#8c9689`
- Clases: `.glass`, `.glass-strong`, `.card`, `.card-sm`, `.grad-brand`, `.grad-text`, `.btn/.btn-primary/.btn-ghost/.btn-danger/.btn-sm/.btn-xs/.btn-full/.btn-icon`, `.input`, `.label`, `.field`, `.stepper`, `.stat-card/.stat-label/.stat-value/.stat-sub`, `.badge` (green/blue/purple/red/warn/gray), `.progress-bar/.progress-fill`, `.tab-bar/.tab-btn`, `.section-title`, `.divider`, `.toast`, `.chip/.chip.active`, `.empty-state`, `.spinner`, `.list-item`, `.action-tile`, `.macro-card`, `.autocomplete`, `.anim-fade/.anim-slide`
- **PROHIBIDO (reemplazar):** `rgba(0,255,135)`, `rgba(0,198,255)`, `#7c3aed`, `#a78bfa`, `rgba(124,58,237)`, `#3b82f6`, `#007aff`, `#34c759`, `#ff9500`, `#ff3b30`, `#af52de`, `#ff007f`, `#ff5e3a`, `#ffa502`, fondos `#0c0f1d` en modales (usar glass claro), `#0d1209` (solo la landing lo usa, se mantiene)
- Emojis como iconos funcionales → reemplazar por lucide-react (ya instalado)

## 7. CUENTAS PARA PROBAR

- Owner: `carrizoaxel67@gmail.com` (rol OWNER hardcodeado en register)
- Demo: `demo@hipertrof.ia` (getOrCreateUser)
- Prueba creada durante diagnóstico: `test@bug.com` / `test12345` (borrar o ignorar)
- Passwords de trainer create: default "123456"

## 8. COMANDOS ÚTILES

```bash
cd /home/ddr/Documentos/ideas/hypertrof.ia/web
npm run dev          # arranca en :3001 (3000 ocupado por bot instagram)
npm run build        # prisma generate + next build
npx tsc --noEmit     # typecheck
npm run lint         # eslint
npx prisma studio    # inspeccionar DB
```
