# Changelog

## 2026-09-16 (2) — M0: drift formalizado

### Base de datos
- Nueva migración `web/supabase/migrations/20260818000011_drift_baseline.sql`:
  crea/formaliza `direct_messages`, `assigned_recipes`, `push_subscriptions`,
  `spotify_tokens`, `star_balances`, RPCs `get_conversations` y `send_message`,
  bucket `dm-images` y columnas de `profiles` que usaba `/perfil`.
  Idempotente y ordenada antes de la migración 13.
- Pendiente: pegar en Supabase (staging y luego producción).

### Fixes de código
- `/api/push/send`: usa `service_role` (RLS negaba las suscripciones), compara
  el secreto con `timingSafeEqual` y valida el body.
- `lib/spotify-token.ts`: acepta `SUPABASE_SERVICE_ROLE_KEY` (antes el nombre no
  coincidía y fallaba al leer tokens de otro usuario).

### Docs
- `docs/ESTADO-Y-PLAN.md`, `docs/CHECKLISTS-DOD.md`, `docs/security/AUDITORIA-SEGURIDAD.md`
  y `docs/architecture/07-contexto-para-ia.txt` actualizados.

---

## 2026-09-16 — Limpieza, seguridad y documentación

### Seguridad
- Auditoría completa: `docs/security/AUDITORIA-SEGURIDAD.md` (18 hallazgos).
- Política y reporte de vulnerabilidades: `SECURITY.md`.
- Eliminados archivos con secretos en disco: `web/.env.production`,
  `web/supabase/.env`, `web-legacy/.env`, `CONTEXTO_SESION_2026-08-22.md` y los
  4 scripts `*-check.js` con `service_role` hardcodeada.
- `.gitignore` de raíz y `web/` blindados.
- Plantillas `web/.env.example` y `web/supabase/.env.example`.
- **Pendiente crítico:** rotar `service_role`, Google y Spotify (ver `docs/ESTADO-Y-PLAN.md`).

### Organización
- Informes viejos a `docs/archive/` (fuera de git).
- `web-legacy/` desrastreado (sigue en disco, ignorado).
- Borrados `convert.py`, `.config/`, captura y `dev.db`.
- `README.md` y `docs/README.md` actualizados al stack real (sin Prisma/SQLite/FSD).

### Código
- 85 archivos de `web/src/` comentados (cabecera, JSDoc y secciones).
- Typecheck en verde (`MALLOC_CHECK_=0 ./node_modules/.bin/tsc --noEmit`).

### Nuevos documentos
- `docs/ESTADO-Y-PLAN.md` — estado y plan priorizado.
- `docs/ROADMAP.md` — roadmap por fases (M0–M7) para terminar la app.
- `docs/security/AUDITORIA-SEGURIDAD.md`
- `SECURITY.md`

---

## 2026-09-06 — Reorganización

### Movimientos
- Todo el proyecto movido de `~/Documentos/ideas/hypertrof.ia/` a `~/Documentos/HIPERTROFIA/`
- Documentación consolidada en `docs/` con índice navegable

### Nuevos archivos
- `docs/README.md` — Índice principal
- `docs/architecture/01-vision-general.md`
- `docs/architecture/02-modelo-datos.md`
- `docs/architecture/03-offline-first.md`
- `docs/architecture/04-capacitor-android.md`
- `docs/operations/01-setup-local.md`
- `docs/operations/02-comandos-utiles.md`
- `docs/operations/03-sistema-guardian.md`
- `docs/operations/04-mantenimiento.md`
- `docs/deployment/01-produccion.md`
- `docs/troubleshooting/01-comunes.md`
- `docs/troubleshooting/02-sistema-roto.md`

### Sistema Guardian
- Daemon `~/.local/bin/guardian.sh` corriendo cada 30s
- Wrapper `~/.local/bin/hiptrun` para producción local
- Servicio systemd-user `guardian.service` auto-arranca
- Hardening global en `/etc/systemd/coredump.conf.d/` y `/etc/security/limits.d/`

### Fixes de hipertrof.ia
- `next.config.ts`: `reactStrictMode: false`, `cpus: 1`, `workerThreads: false`
- `package.json`: `NODE_OPTIONS='--max-old-space-size=1536'`

### Script adicional
- `~/.local/bin/healthcheck` para reportar problemas

---

## 2026-09-19 — M0 hardening de código, CSP y validación de env

### Seguridad (código)
- Borrado `/api/spotify/debug` (endpoint público que usaba credenciales de
  Spotify). No tenía referencias en código.
- Anti open redirect en `/auth/callback`: `next` normalizado con `sanitizeNext`
  (allowlist de rutas relativas; rechaza `//`, `/\`, CRLF y longitudes absurdas).
- CSP en `lib/supabase/middleware.ts`: añadido `object-src 'none'` y
  `https://api.qrserver.com` a `img-src` (el QR de invitaciones dejaba de cargar).

### Infraestructura / configuración
- Nuevo `src/lib/env.ts` (zod, fail-fast) centraliza y valida todas las vars de
  entorno; `SUPABASE_SERVICE_ROLE_KEY` (alias `SERVICE_ROLE_KEY`) validada al
  import. Server-only — no importar desde cliente.
- `lib/supabase/admin.ts` rearmado sobre `env` (elimina `process.env!*`).
- Documentación inline (JSDoc) de 85 archivos de `src/` sin cambios de lógica.

### Estado
- Typecheck: `MALLOC_CHECK_=0 tsc --noEmit` → exit 0.
- **Pendiente (bloqueado, requiere vos):** pegar en el SQL Editor de Supabase
  (`oiirsbzuufrcagcjvzpi`) el drift baseline (`20260818000011`), la P0-1
  (`20260916000000_fix_assigned_routines_visibility`) y las invitaciones
  (`20260916000001_trainer_invites`) — staging, luego prod.
- **Pendiente (bloqueado, requiere dashboards):** rotar `service_role`, Google y
  Spotify (están vivos en `web/.env.local` de prod) y apuntar `.env.local` a staging.

### Docs
- `docs/security/AUDITORIA-SEGURIDAD.md` (SEC-05/08/09/10 + checklist aplicación),
  `docs/CHECKLISTS-DOD.md`, `docs/architecture/07-contexto-para-ia.txt` actualizados.

## Historial anterior

Ver `AUDITORIA_PROYECTO_MEJORA.md` (el `CONTEXTO_SESION_2026-08-22.md` se borró
en la limpieza de secretos).