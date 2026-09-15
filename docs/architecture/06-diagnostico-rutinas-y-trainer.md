# Diagnóstico: motor de rutinas + funciones de Personal Trainer

> Complementa [`05-mapa-hipertrofia.md`](./05-mapa-hipertrofia.md).
> Auditar el código antes de tocar. Cada hallazgo tiene `archivo:línea`,
> causa raíz y arreglo propuesto.

---

## 0. Resumen ejecutivo

El motor de rutinas **propias** funciona a medias (guardado sin transacción).
Lo que está **roto de punta a punta** es el circuito **trainer → alumno**:

1. **RLS no deja al alumno leer la rutina asignada** → "Entrenar" abre sesión vacía.
2. **El rol `trainer` nunca llega al cliente** (el sincronizador de perfil lo pisa).
3. **Un trigger revierte el cambio de rol** → "Registrarme como trainer" no hace nada.
4. **`assigned_recipes` no existe** → recetas asignadas muertas.
5. **Mensajería/push dependen de tablas y RPC que ninguna migración crea.**

---

## 1. P0 — Bloqueantes (rompen features completas)

### P0-1 · El alumno no puede abrir/entrenar una rutina asignada
- **Dónde:** `supabase/migrations/20260818000001_init_schema.sql:406-407` y `:418-421`; consumido en `web/src/app/(app)/entrenadores/page.tsx:159-171,785-791` y `web/src/app/(session)/entrenar/page.tsx:330-342`.
- **Causa raíz:** `routines_select` sólo permite `user_id = auth.uid() or is_public = true`. La rutina asignada pertenece al trainer y nace `is_public=false`. La fila en `assigned_routines` **no otorga acceso**. `assignRoutine` (`entrenadores/page.tsx:358-366`) nunca marca la rutina como pública.
- **Efecto:** el embed `routine:routines(id,name)` vuelve `null` → botón apunta a `/entrenar?routine=undefined`; si se fuerza el ID, la query no devuelve fila y arranca una sesión vacía sin error (el boot con `routine === undefined` se cuelga, `entrenar/page.tsx:365`).
- **Arreglo (SQL):** políticas que contemplen `assigned_routines`:

```sql
-- Migración nueva: 2026xxxx_fix_routines_assigned_rls.sql
drop policy if exists routines_select on public.routines;
create policy routines_select on public.routines
  for select using (
    user_id = auth.uid()
    or is_public = true
    or exists (
      select 1 from public.assigned_routines ar
      where ar.routine_id = routines.id
        and ar.active
        and (ar.athlete_id = auth.uid() or ar.trainer_id = auth.uid())
    )
  );

drop policy if exists routine_exercises_select on public.routine_exercises;
create policy routine_exercises_select on public.routine_exercises
  for select using (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id
        and (
          r.user_id = auth.uid()
          or r.is_public
          or exists (
            select 1 from public.assigned_routines ar
            where ar.routine_id = r.id
              and ar.active
              and (ar.athlete_id = auth.uid() or ar.trainer_id = auth.uid())
          )
        )
    )
  );
```

### P0-2 · El rol `trainer` nunca llega al cliente
- **Dónde:** `web/src/components/providers.tsx:11-22` (tipo) y `:133-139` (`select`); vs `web/src/components/profile-provider.tsx:29-33` (`select("*")`).
- **Causa raíz:** `ProfileSync` siempre corre, hace un `select` acotado **sin** `role`, `plan`, `is_admin`, `is_trainer_approved`, y **sobrescribe** el perfil que `ProfileProvider` había cargado completo (que además tiene guarda `:27` y se saltea la carga).
- **Efecto:** `isTrainer = profile?.role === "trainer"` (`entrenadores/page.tsx:103`) es siempre `false` → nunca se ve el panel trainer; el paywall por `plan` (`:527,532`) queda salteado; `/ajustes` nunca muestra trainer/admin; `/facturacion` siempre "free".
- **Arreglo:** unificar en **un** cargador. Mover los campos al `select` de `ProfileSync`, ampliar `ProfileRow`, y eliminar/deshabilitar `ProfileProvider` (o que `ProfileProvider` sea el único y `ProfileSync` no toque `profile`).

### P0-3 · El trigger revierte `role` → "Registrarme como trainer" no hace nada
- **Dónde:** `supabase/migrations/20260819000013_bestfriends_dm_images_security.sql:108-128`; usado por `entrenadores/page.tsx:447-461` (`becomeTrainer`) y `ajustes/page.tsx:63-89` (`setTrainerRole`).
- **Causa raíz:** `prevent_privilege_escalation` setea `new.role := old.role` (e `is_trainer_approved`) para todo `authenticated`. Supabase **no** devuelve error → la UI muestra éxito (`:456-459`) pero el rol no cambia. Además `ajustes` intenta actualizar la fila **de otro** usuario, bloqueado por RLS (`init_schema.sql:377`).
- **Arreglo:** decidir el modelo:
  - **Opción A (recomendada, mínima):** `becomeTrainer` inserta una **solicitud** (tabla `trainer_requests` nueva) y un admin la aprueba con `service_role`. Muestra "solicitud enviada", no "ya sos trainer".
  - **Opción B:** permitir el self-update del `role` a `trainer` **pero no** de `is_trainer_approved` (que lo setea el admin), y hacer que el panel se habilite con `is_trainer_approved`. En cualquier caso, la RLS `profiles_update` debe permitir al admin (`public.is_admin()`).

### P0-4 · `assigned_recipes` no existe
- **Dónde:** referenciada en `entrenadores/page.tsx:173-185, 228-241, 394-411, 413-428` y `nutricion/page.tsx:231-255`. `grep create table public.assigned_recipes` → **0**.
- **Efecto:** toda la sección "Recetas asignadas" falla o queda vacía.
- **Arreglo:** crear la tabla (gemela de `assigned_routines`) + RLS + grants:

```sql
create table if not exists public.assigned_recipes (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (athlete_id, recipe_id),
  check (trainer_id <> athlete_id)
);
alter table public.assigned_recipes enable row level security;
create policy assigned_recipes_select on public.assigned_recipes
  for select using (trainer_id = auth.uid() or athlete_id = auth.uid());
create policy assigned_recipes_insert on public.assigned_recipes
  for insert with check (trainer_id = auth.uid() and athlete_id <> auth.uid());
create policy assigned_recipes_delete on public.assigned_recipes
  for delete using (trainer_id = auth.uid());
create policy recipes_select on public.recipes for select using (true);
```

### P0-5 · Mensajería / push dependen de objetos inexistentes
- **Dónde:** `direct_messages` (usada en `mensajes/[id]`, `dm-notifications.tsx`, `entrenadores.tsx:434`), RPC `get_conversations`/`send_message`, `push_subscriptions`, `spotify_tokens`, `star_balances`, bucket `dm-images`.
- **Causa raíz:** el repo **no** contiene los `create`; sólo `alter table` (`20260819000013:7`, `20260822000001:2-9`), así que un `db reset` falla y la reproducibilidad es cero.
- **Arreglo:** volcar el esquema real de producción a migraciones versionadas (o crear las faltantes). **Requiere acceso a tu Supabase** para `supabase db pull` / introspección.

---

## 2. P1 — Pérdida de datos / fugas / integridad

| # | Dónde | Problema | Arreglo |
|---|---|---|---|
| P1-1 | `rutinas/page.tsx:232-275` | Editar rutina: `SELECT` de existentes ignora `error` y `DELETE` va **antes** del `UPSERT`, sin transacción → si el upsert falla, la rutina queda **sin ejercicios**; si el select falla, **duplica** todos | Mover a un RPC transaccional `save_routine(...)` |
| P1-2 | `rutinas/page.tsx:277-297`, `436-458` | Crear/copiar plantilla: si falla el 2º insert queda rutina **huérfana** | Envolver en RPC/secuencia con compensación |
| P1-3 | `rutinas/page.tsx:410-416` | Al cargar no se ordena `routine_exercises` por `order_index` → editar **reordena** silenciosamente | Agregar `.order("order_index", { referencedTable: "routine_exercises" })` |
| P1-4 | `entrenar/page.tsx:350, 394-415` | `target_reps` nunca se aplica al workout (no está en `RoutineExRow` ni en `addExercise`) → series nacen en 0 | Incluir `target_reps` en el mapeo y en el store |
| P1-5 | `entrenar/page.tsx:585-641` | Finalizar: `workouts.upsert` → `workout_exercises.insert` en loop → `workout_sets.insert`; sin transacción → reintento **duplica** hijos; el trigger de racha/feed corre **antes** de los hijos | RPC transaccional `finalize_workout(jsonb)` |
| P1-6 | `dashboard/page.tsx:39-43` | Lista rutinas **públicas ajenas** como "Tus rutinas" (sin `.eq("user_id")`) | Filtrar por `user_id` |
| P1-7 | `explorar/page.tsx:209-231, 417-432` | Selector "Compartir" incluye rutinas ajenas y `shareRoutine` las publica sin poder despublicar; además queda `is_public=true` aunque el post sea privado | Filtrar propias; publicar sólo con `scope` público; agregar "despublicar" |
| P1-8 | `entrenadores/page.tsx:327-343` | `addAlumno` inserta `status:"active"` **sin consentimiento**; no hay solicitud ni rechazo (la UI de `pending` `:609-625` es código muerto) | Insertar `pending` y dar al alumno UI de aceptar/rechazar (o notificar) |
| P1-9 | `entrenadores/page.tsx:345-356`, `init_schema.sql:559-560` | `removeAlumno` borra `trainer_clients` pero **no** `assigned_routines` → el alumno sigue viendo rutinas del ex-trainer; el alumno no puede salir solo | Cascade manual al dar de baja + policy de delete para el alumno |
| P1-10 | `init_schema.sql:377-378` + `20260819000013:119-121` | No hay forma de que un admin cambie el rol de otro (RLS + trigger) | Policy de update para `is_admin()` y bypass del trigger para admin |
| P1-11 | `init_schema.sql:662-663` | `enrollments_select` no incluye al trainer dueño del curso | Policy joineando `courses.trainer_id = auth.uid()` |
| P1-12 | `marketplace/page.tsx:41-56`, `init_schema.sql:270-276` | Enrolamiento `paid:false` sin pago; `content_url` nunca se muestra | Fuera de alcance hasta definir pasarela |
| P1-13 | `entrenadores/page.tsx:1274-1295` | Editar rutina del alumno sólo cambia sets/reps/rest (no agrega/quita) — contradice plan Plus (`lib/plans.ts:32`) | Reutilizar `RoutineEditor` completo |
| P1-14 | `entrenadores/page.tsx:1033-1055` + `init_schema.sql:110` | "ya asignada" ignora filas `active=false`; reasignar viola `unique(athlete_id, routine_id)` | Reactivar (`update active=true`) en vez de `insert` |

---

## 3. P2 — Consistencia, seguridad, deuda

| # | Dónde | Problema |
|---|---|---|
| P2-1 | `init_schema.sql:91` vs `entrenadores/page.tsx:246,1238,1276` | `target_reps` es `text` ("8-12") pero el editor del trainer lo trata como `number` → aplana rangos y muestra vacío |
| P2-2 | `entrenadores/page.tsx:105,150` | `profile!.id` sin guard → queries con `undefined` durante la carga |
| P2-3 | `entrenadores/page.tsx:632,642,657,1006` | `c.athlete!.id` / `a.routine!` con RLS que puede devolver join `null` → TypeError |
| P2-4 | `entrenadores/page.tsx:430-445` | "Felicitar" inserta DM directo saltándose RPC `send_message` (estrellas/saldo/view-once) |
| P2-5 | `entrenadores/page.tsx:103` vs `ajustes/page.tsx:33` | Criterio de "es trainer" distinto (`role` vs `role` + `is_trainer_approved`) |
| P2-6 | `init_schema.sql:553-554, 446-447, 653-654` | Ninguna policy exige `is_trainer_approved` ni relación activa → cualquiera se auto-nombra trainer, asigna rutinas y vende cursos |
| P2-7 | `init_schema.sql:80,79` + `rutinas/page.tsx:492` | `is_template` nunca se setea en `true`; "Plantillas que ya agregaste" es código muerto; metadata de `lib/templates.ts` (`daysPerWeek`, `level`, `durationMin`) no tiene columnas |
| P2-8 | `rutinas/page.tsx:448-462` | Plantillas sin match insertan `exercise_id=null` y **pierden el nombre** (`routine_exercises` no tiene columna `name`) pero el toast dice lo contrario |
| P2-9 | `rutinas/page.tsx:227,480`, `entrenadores/page.tsx:276-278` | `update`/`delete` sin `.eq("user_id")` (defensa en profundidad) |
| P2-10 | `src/app/api/spotify/debug/route.ts:3-48` | Endpoint **sin auth**, expone prefijo del Client ID y prueba el secret |
| P2-11 | `src/middleware.ts:4-13` | `/auth/callback` no está en `PUBLIC_PATHS` → OAuth/magic-link puede rebotar a `/login` |
| P2-12 | `web/edit-check.js:5-8`, `movil-check.js`, `pl-self.js` | Service-role key hardcodeada en disco (gitignored pero existe) → **rotar** |
| P2-13 | `lib/spotify-token.ts:5` | Lee `SERVICE_ROLE_KEY`; el resto usa `SUPABASE_SERVICE_ROLE_KEY` → mismatch |
| P2-14 | `20260819000013:143` | `new.amount_paid := old.amount_paid` pero `course_enrollments` no tiene `amount_paid` → trigger falla al actualizar |
| P2-15 | `20260818000004_account_tools.sql:19-41` | `export_my_data` no incluye `assigned_routines` (RGPD incompleto) |
| P2-16 | `package.json:9` | `"start:safe": "hiptrun"` → comando inexistente |
| P2-17 | `docs/architecture/01,02`, `docs/02,07`, `CONTEXT.md`, `web/README.md` | Describen Prisma/SQLite/FSD y rutas que no existen |
| P2-18 | `public/` | `layout.tsx:38-39` referencia `/icon.svg` y `/apple-touch-icon.png` que **no existen** → 404 |
| P2-19 | `api/youtube/search/route.ts` | Huérfano (0 usos, sin API key) |
| P2-20 | `public/sw.js:78-95` | Cachea respuestas autenticadas de Supabase en Cache Storage (riesgo de datos sensibles y cache stale) |

---

## 4. Plan de arreglo por fases

> Cada fase es verificable de forma independiente. Las fases 1 y 2 son
> **SQL** (requieren aplicar migraciones a tu Supabase). Las 3–6 son código.

### Fase 0 — Preparación
- [ ] Confirmar entorno: ¿la BD de producción tiene los objetos "drift" creados a mano? (`supabase db pull` o consulta directa).
- [ ] Rotar la service-role key expuesta en `*-check.js`.

### Fase 1 — Reparación de BD (una migración nueva)
- [ ] RLS `routines`/`routine_exercises` con `assigned_routines` (P0-1).
- [ ] Crear `assigned_recipes` + RLS (P0-4).
- [ ] Crear `push_subscriptions`, `spotify_tokens`, `direct_messages`, `star_balances`, bucket `dm-images` **si no existen** (P0-5).
- [ ] Corregir trigger `protect_enrollment_payment` (`amount_paid`) (P2-14).
- [ ] Policies admin para `profiles_update` (P1-10).
- [ ] Policies `enrollments_select` trainer (P1-11).

### Fase 2 — Rol y perfil
- [ ] Unificar `ProfileSync`/`ProfileProvider`; incluir `role`, `plan`, `is_admin`, `is_trainer_approved` (P0-2).
- [ ] Definir el flujo de alta de trainer (solicitud + aprobación) y arreglar `becomeTrainer`/`setTrainerRole` (P0-3).
- [ ] Unificar criterio de "es trainer" (P2-5).

### Fase 3 — Motor de rutinas
- [ ] RPC `save_routine(...)` transaccional para crear/editar (P1-1, P1-2).
- [ ] Ordenar `routine_exercises` al cargar (P1-3).
- [ ] Aplicar `target_reps` (P1-4) y unificar tipo string/number (P2-1).
- [ ] Filtrar rutinas propias en dashboard/explorar (P1-6, P1-7).
- [ ] Plantillas: nombre en `routine_exercises` o columnas de metadata (P2-7, P2-8).

### Fase 4 — Flujo trainer ↔ alumno (lo que pediste "de cara al alumno")
- [ ] Solicitud/aceptación real con `pending` + UI del alumno (P1-8).
- [ ] Baja en cascada de `assigned_routines` + el alumno puede dejar al trainer (P1-9).
- [ ] Notificar asignaciones (DM vía RPC + push) (P0-5, P2-4).
- [ ] Editor completo de rutina del alumno (P1-13) y reactivar asignaciones (P1-14).
- [ ] Vista de progreso del alumno (hoy sólo `streak_count`).

### Fase 5 — Entrenamiento atómico
- [ ] RPC `finalize_workout(jsonb)` transaccional; hijos antes del trigger (P1-5).
- [ ] Manejo de error real en el boot de `/entrenar` (P0-1 efecto).

### Fase 6 — Limpieza
- [ ] Reemplazar docs viejos; completar `export_my_data` (P2-15).
- [ ] Borrar endpoints huérfanos/`debug`; arreglar `start:safe` (P2-10, P2-16, P2-19).
- [ ] Iconos 404 (P2-18); revisar cache del SW (P2-20).

---

## 5. Verificación (por cada fase)
- [ ] `MALLOC_CHECK_=0 ./node_modules/.bin/tsc --noEmit` en `web/` → sin errores.
- [ ] Probar en runtime los caminos críticos: asignar rutina → abrir como alumno → entrenar → finalizar sin duplicar.
- [ ] `supabase db reset` en local debe pasar **todas** las migraciones sin error (hoy no).

---

## 6. Estado de implementación

### Hecho (código, sin DDL)
- **P0-2** — `ProfileSync` (`web/src/components/providers.tsx`) usa `select("*")`
  y el tipo incluye `role/plan/is_admin/is_trainer_approved/onboarded`.
  Se eliminó `web/src/components/profile-provider.tsx` (loader redundante):
  `ProfileSync` ya es global desde el root layout.
- **P0-3** — `web/src/app/api/trainer/role/route.ts` (service role) cambia el rol
  evadiendo el trigger `prevent_privilege_escalation`; cableado en
  `entrenadores/page.tsx` (`becomeTrainer`) y `ajustes/page.tsx` (admin).
- **Invitaciones trainer ↔ alumno** — flujo link/QR + aceptación:
  - Migración `web/supabase/migrations/20260916000001_trainer_invites.sql`:
    tabla `trainer_invites` + RLS + RPCs `create_trainer_invite`,
    `get_trainer_invite`, `accept_trainer_invite`.
  - `web/src/components/trainer-invite-dialog.tsx` (QR vía `api.qrserver.com`,
    Web Share, copiar link).
  - `web/src/components/trainer-invite-accept.tsx` (`?invite=CODE` + entrada manual).
  - `addAlumno` ahora crea `pending` (upsert); el alumno acepta/rechaza desde
    "Mis entrenadores"; el trainer ve "Esperando aceptación" y puede cancelar.
  - `middleware.ts` preserva el query al setear `next`; `auth-card.tsx` respeta
    `next` en login, OAuth y magic link (el link de invitación sobrevive al login).

### Pendiente de aplicar en Supabase (bloqueado: sin PAT/DB password)
- [ ] Pegar `20260916000000_fix_assigned_routines_visibility.sql` (P0-1, efecto runtime).
- [ ] Pegar `20260916000001_trainer_invites.sql` (habilita el flujo de invitación).

### Decisiones tomadas
- QR por servicio externo (no se puede `npm install` en el entorno actual).
- Modelo **invitación + aceptación** (no auto-vínculo directo).
- **NFC descartado**: Web NFC no existe en iOS; requeriría plugin nativo + entitlements.

