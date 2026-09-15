# Hipertrof.ia — Checklists y Definition of Done (DoD)

Este es el documento **de trabajo diario**. Marcá `[x]` a medida que cerrás.
Cada fase se cierra solo cuando **todos** sus DoD están tildados.

Referencias en esta carpeta:
- `ROADMAP.md` — plan completo por fases
- `ESTADO-Y-PLAN.md` — qué se hizo y pendientes
- `AUDITORIA-SEGURIDAD.md` — hallazgos y runbook de rotación
- `DIAGNOSTICO-RUTINAS-TRAINER.md` — bugs P0/P1/P2 con causa raíz
- `POLITICA-SEGURIDAD.md` — reglas de secretos y rotación

---

## Reglas de trabajo

- No se pasa de fase sin cerrar el DoD de la actual.
- Si una tarea se traba **>1 día**, se recorta el alcance; no se arrastra.
- Cada viernes: cerrar DoD, actualizar este doc y commitear.
- Una fase al 80% **no** es una fase cerrada.

---

## MVP lanzable (definición global)

- [ ] Registro + onboarding + dashboard sin ayuda.
- [ ] Crear rutina y entrenar guardando cargas e historial.
- [ ] Ver progreso e historial.
- [ ] Trainer invita → alumno acepta → trainer asigna rutina → alumno ejecuta.
- [ ] Mensajería básica trainer↔alumno con push.
- [ ] PWA instalada (iOS/Android) sin crashear.
- [ ] DB recreable desde cero con migraciones (sin drift).
- [ ] Sin secretos expuestos y con entornos separados.

---

## 🔴 M0 — Cimientos (BLOQUEANTE) · ~1 semana

### Tareas
- [ ] Rotar `service_role` (Supabase) y actualizar Vercel + `web/.env.local`.
- [ ] Rotar Google OAuth client secret (Google Cloud + Supabase Auth).
- [ ] Rotar Spotify client secret (Spotify Dashboard + Vercel).
- [ ] Revocar tokens viejos de Vercel.
- [ ] Crear proyecto Supabase de **staging**, separado de producción.
- [ ] Apuntar `web/.env.local` a staging.
- [x] Migrar el **drift** a migraciones → `20260818000011_drift_baseline.sql`
      (idempotente, ordenada antes de la migración 13). **Falta pegarla en Supabase.**
  - [x] tabla `direct_messages` (+ columnas usadas por la UI)
  - [x] tabla `assigned_recipes`
  - [x] tabla `push_subscriptions`
  - [x] tabla `spotify_tokens`
  - [x] tabla `star_balances`
  - [x] RPC `get_conversations`
  - [x] RPC `send_message`
  - [x] bucket `dm-images` + policies
  - [x] columnas de `profiles` usadas por `/perfil`
- [x] Fix código: `/api/push/send` con service_role + timing-safe + validación.
- [x] Fix código: `lib/spotify-token.ts` acepta `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Pegar migraciones pendientes:
  - [ ] `20260916000000_fix_assigned_routines_visibility.sql` (P0-1)
  - [ ] `20260916000001_trainer_invites.sql`
- [ ] Recrear staging desde `supabase/migrations/` y levantar la app.

### DoD
- [ ] Staging recreada 100% desde migraciones y la app funciona igual que prod.
- [ ] No falta ningún objeto usado por el código.
- [ ] Secretos rotados y entornos separados.

---

## 🟠 M1 — Núcleo de entrenamiento sólido · ~1,5 semanas

### Tareas
- [ ] RPC transaccional `save_routine` (rutina + ejercicios atómico).
- [ ] RPC transaccional `finish_workout` (workout + ejercicios + series + logros).
- [ ] Arreglar `target_reps` (tipo/rango tratado como número).
- [ ] Repasar P0/P1 del diagnóstico que toquen este flujo.
- [ ] Error visible en `/entrenar` si la rutina asignada no carga.

### DoD
- [ ] Cortar la red a mitad de guardar no deja la DB a medias.
- [ ] Reintentar no duplica series.
- [ ] El alumno abre la rutina asignada y ejecuta sin sesión vacía.

---

## 🟠 M2 — Trainer completo · ~1 semana

### Tareas
- [ ] UI: trainer asigna rutina a alumno (`assigned_routines`).
- [ ] Panel de alumnos: adherencia, último entrenamiento, rutina activa.
- [ ] Asignar recetas (`assigned_recipes`).
- [ ] Estados claros: pending / active / terminated (+ cancelar/rechazar).

### DoD
- [ ] Flujo completo: trainer → alumno → entrena → trainer ve el resultado.
- [ ] Nunca se crea un vínculo `active` sin consentimiento del alumno.

---

## 🟡 M3 — Mensajería y notificaciones · ~1 semana

### Tareas
- [ ] `direct_messages` y RPCs migradas (M0) + UI estable.
- [ ] Push: registrar suscripción y enviar desde flujo autenticado.
- [ ] Badge de no leídos, view-once, imágenes, reacciones.
- [ ] Realtime con reconexión sin duplicar mensajes.

### DoD
- [ ] A y B se mandan mensajes; B recibe push con la app cerrada.
- [ ] Endpoints sin secretos frágiles ni `sender_id` spoofeable.

---

## 🟡 M4 — Nutrición · ~1 semana

### Tareas
- [ ] Recetas propias (crear/editar/foto) + catálogo.
- [ ] `meal_logs` + cierre de día (`daily_entries`) + macros.
- [ ] Recetas asignadas por trainer.

### DoD
- [ ] Registrar comidas y ver macros del día.
- [ ] Trainer asigna receta y el alumno la ve.

---

## 🔵 M5 — Social / perfil · ~1 semana (RECORTABLE)

### Tareas
- [ ] Feed (workout/logro/receta/rutina), likes y comentarios.
- [ ] Perfiles públicos/privados + flags de privacidad.
- [ ] Seguir / mejores amigos.

### DoD
- [ ] Feed carga, se puede likear/comentar y respeta privacidad.

---

## 🔵 M6 — Monetización · ~1–1,5 semanas (POST-MVP)

### Tareas
- [ ] Planes (free/plus/deluxe) y límites reales por plan.
- [ ] Marketplace de cursos + inscripción + pago.
- [ ] Facturación.

### DoD
- [ ] Un usuario free no accede a lo premium.
- [ ] El pago marca `paid` correctamente.

---

## 🟢 M7 — Lanzamiento · ~1 semana

### Tareas
- [ ] QA final en iPhone y Android (PWA instalada).
- [ ] PWA/Capacitor: íconos, splash, permisos, SW sin cachear respuestas
      autenticadas.
- [ ] Tests E2E de flujos críticos (registro → entrenar → guardar).
- [ ] Monitoreo de errores + backups con restore probado.
- [ ] Checklist de seguridad antes de cada release.

### DoD
- [ ] 10 usuarios beta completan el flujo sin crashear.
- [ ] Rollback documentado.

---

## Seguridad — pendientes (van en paralelo)

- [x] Open redirect `/auth/callback` (`next` sin validar) → `sanitizeNext`.
- [x] Eliminar `/api/spotify/debug` → borrado.
- [x] Endurecer `/api/push/send` (timing-safe + `createAdminClient` + validación de body).
- [ ] CSP: `object-src 'none'` ✅, `api.qrserver.com` en `img-src` ✅; falta nonce + `upgrade-insecure-requests`.
- [ ] Cookies `SameSite`/`Secure`.
- [x] Validación de env con `zod` (`src/lib/env.ts`).
- [ ] Rate limit distribuido.
- [ ] CI con gitleaks + `npm audit` + tests de RLS.
- [ ] Dependabot.

---

## Próximo paso concreto

1. Rotar secretos (30 min).
2. Crear staging y apuntar `web/.env.local` (1 h).
3. Escribir migraciones del drift (3–4 h).
4. Recrear staging y probar (1–2 h).
