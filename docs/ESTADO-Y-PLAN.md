# Estado y Plan — Hipertrof.ia

**Última actualización:** 2026-09-16
**Auditoría de referencia:** [`docs/security/AUDITORIA-SEGURIDAD.md`](../security/AUDITORIA-SEGURIDAD.md)
**Política de seguridad:** [`SECURITY.md`](../../SECURITY.md)

Este documento es la **fuente de verdad de qué se hizo, qué falta y qué hacer**.
Cuando completes una tarea, marcá el checkbox y anotá la fecha.

---

## 1. Qué se hizo (2026-09-16)

### 1.1 Limpieza y organización
- [x] Raíz reorganizada: informes viejos movidos a `docs/archive/`
      (`AUDITORIA_PROYECTO_MEJORA.md`, `CONTEXT.md`, `INFORME_ARQUITECTO.md`,
      `INFORME_TECNICO.md`). **`docs/archive/` no se versiona.**
- [x] Borrados: `convert.py`, `.config/`, `Captura de pantalla_*.png`, `dev.db`,
      `CONTEXTO_SESION_2026-08-22.md` (contenía una `service_role` completa).
- [x] `web-legacy/` (987 MB, 324 archivos) **desrastreado** de git y en
      `.gitignore`. Sigue en disco, pero ya no se sube.
- [x] `.gitignore` de raíz y de `web/` reescritos: `.env*` salvo `.env.example`,
      `web-legacy/`, `docs/archive/`, `*-check.js`, `*.local.js`,
      claves/certificados (`*.pem`, `*.key`, …), `supabase/.temp`, `.vercel`,
      `CONTEXTO_SESION_*`, logs y temporales.

### 1.2 Contención de secretos
- [x] Borrados los 4 scripts con `service_role` hardcodeada:
      `web/edit-check.js`, `web/movil-check.js`, `web/pl-check.js`,
      `web/pl-self.js`.
- [x] Borrados `web/.env.production` (token OIDC real de Vercel),
      `web/supabase/.env` (Google secret) y `web-legacy/.env` (Google secret).
- [x] Prefijos de claves redactados en la auditoría.
- [x] Plantillas creadas: `web/.env.example` (completa) y
      `web/supabase/.env.example`.
- [ ] **Pendiente y crítico:** rotar las credenciales (ver §2).

### 1.3 Documentación
- [x] `SECURITY.md` — política y reporte de vulnerabilidades.
- [x] `docs/security/AUDITORIA-SEGURIDAD.md` — 18 hallazgos, runbook de rotación,
      plan 24h/7d/30d.
- [x] `README.md` raíz y `docs/README.md` actualizados al stack real
      (sin Prisma/SQLite/FSD).
- [x] `docs/architecture/07-contexto-para-ia.txt` — contexto autocontenido para IA.

### 1.4 Código
- [x] Comentados los 85 archivos de `web/src/` (cabecera, JSDoc y secciones),
      sin cambios de lógica.
- [x] Typecheck en verde: `MALLOC_CHECK_=0 ./node_modules/.bin/tsc --noEmit` → 0.
- [x] **Sin commitear todavía** (ver §4).

---

## 2. Recomendación priorizada

> **Regla de oro:** si un secreto estuvo en disco, en un backup, en un chat o en
> un ZIP, **se considera comprometido y se rota**. Punto.

### 🔴 AHORA (0–24 h) — rotar y contener

1. **Rotar `service_role`** (la más urgente).
   - Supabase → Project Settings → API → **Rotate** `service_role`.
   - Actualizar `SUPABASE_SERVICE_ROLE_KEY` en **Vercel** (Production y Preview)
     y en `web/.env.local` (dev).
   - Redeploy y probar `/api/trainer/role` y `/api/push/send`.
2. **Rotar Google OAuth client secret.**
   - Google Cloud Console → Credentials → OAuth client → *Reset secret*.
   - Actualizar en Vercel y en Supabase Auth → Providers → Google.
3. **Rotar Spotify client secret.**
   - Spotify Developer Dashboard → app → *Rotate secret* → Vercel.
4. **Revocar tokens de Vercel** que hayan estado en el `.env.production`
   borrado (Vercel → Account/Team → Tokens).
5. **Verificar que el historial de git esté limpio** (debería estarlo):
   ```bash
   cd ~/Documentos/HIPERTROFIA
   # instalar gitleaks una vez (o usar docker)
   gitleaks detect --source . --no-banner --redact
   # chequeo rápido puntual:
   git log --all -p | grep -nE 'sb_secret_[A-Za-z0-9]{20}|GOCSPX-[A-Za-z0-9_-]{15}'
   ```
   Resultado esperado: **sin coincidencias**.
6. **Confirmar que no haya copias fuera del repo:** backups de `~/Documentos`,
   `Escritorio/*.txt`, ZIPs enviados, llaveros USB, nube.

### 🟠 Esta semana (1–7 días) — separar entornos y arreglar código

7. **Crear Supabase de DEV/STAGING separada de producción.** Hoy `web/.env.local`
   apunta al proyecto de producción (`oiirsbzuufrcagcjvzpi`). Nunca más service_role
   de prod en local.
8. **Arreglar open redirect** en `web/src/app/auth/callback/route.ts`: validar
   `next` como ruta relativa (`/`, no `//`, sin `@`, `:`, `\`, `http`).
9. **Eliminar `/api/spotify/debug`** (endpoint público que usa credenciales).
10. **Endurecer `/api/push/send`**: comparar el secreto con
    `crypto.timingSafeEqual`, exigir usuario autenticado y que
    `sender_id === auth.uid()`; validar body con `zod`.
11. **CSP**: agregar `api.qrserver.com` a `img-src` (hoy el QR no renderiza),
    `object-src 'none'`, `upgrade-insecure-requests`, y evaluar nonce en
    `script-src` para quitar `unsafe-inline`/`unsafe-eval`.
12. **Cookies**: fijar `SameSite=Lax`/`Strict` y `Secure` en producción.
13. **Validación de entorno** con `zod` (`web/src/lib/env.ts`) y fail-fast.
14. **Rate limit distribuido** (Upstash/Vercel Firewall) para auth y mensajería.

### 🟡 Este mes (30 días) — profesionalizar

15. **CI de seguridad** (GitHub Actions): typecheck, lint, `npm audit`,
    `gitleaks`, test de RLS. Agregar pre-commit hook con gitleaks.
16. **Dependabot/Renovate** + pin de versiones.
17. **Suite de tests de RLS** tabla por tabla contra staging.
18. **RPC transaccionales** `save_routine` y `finish_workout` (evita huérfanos y
    duplicados que hoy ocurren por no ser atómico).
19. **Backups automáticos + prueba de restore** documentada.
20. **MFA** en Supabase/Vercel/Google/Spotify y **audit log** de acciones admin.

---

## 3. Pendientes funcionales (base de datos)

Aplicar migraciones que están escritas pero **no pegadas** en Supabase:

- [ ] `web/supabase/migrations/20260916000000_fix_assigned_routines_visibility.sql`
      → **P0-1**: que el alumno pueda leer la rutina asignada (hoy la sesión
      arranca vacía).
- [ ] `web/supabase/migrations/20260916000001_trainer_invites.sql`
      → tabla `trainer_invites` + RPCs `create_trainer_invite`,
      `get_trainer_invite`, `accept_trainer_invite`.

**Workflow (no hay Supabase CLI ni `psql` en este entorno):**
pegar el SQL en https://supabase.com/dashboard/project/oiirsbzuufrcagcjvzpi/sql/new
Primero en **staging**, recién después en producción.

**Deuda de drift** (existía en prod, faltaba en migraciones):
formalizada el 2026-09-16 en
`web/supabase/migrations/20260818000011_drift_baseline.sql`:
`assigned_recipes`, `direct_messages`, `push_subscriptions`, `spotify_tokens`,
`star_balances`, RPCs `get_conversations`/`send_message`, bucket `dm-images` y
columnas de `profiles`. Idempotente; ordenada antes de la migración 13 (que
asume `direct_messages`). **Pendiente: pegarla en staging y luego en prod.**

Fixes de código asociados (2026-09-16):
- `/api/push/send` ahora usa el cliente `service_role` (antes RLS negaba las
  suscripciones), compara el secreto en tiempo constante y valida el body.
- `lib/spotify-token.ts` acepta `SUPABASE_SERVICE_ROLE_KEY` (antes solo
  `SERVICE_ROLE_KEY`, que no estaba definido → los tokens de otro usuario
  fallaban).

---

## 4. Estado de git y recomendación de commit

Hay ~430 entradas en `git status`, entre limpieza, docs, migraciones nuevas y
comentarios. **Recomendación:** commitear en bloques lógicos, no un commit
gigante. Sugerido:

1. `chore: reorganizar raíz y desrastrear web-legacy/archive`
2. `chore(security): eliminar scripts/env con secretos y blindar .gitignore`
3. `docs(security): auditoría, política y plan de acción`
4. `feat(trainer): invitaciones trainer↔alumno + fix RLS assigned_routines`
5. `docs: comentar código fuente y actualizar README/docs`
6. `chore: eliminar profile-provider duplicado`

**No hagas push todavía si no rotaste**, aunque el historial debería estar
limpio. Orden ideal: rotar → commit → push.

Para revisar que los agentes solo agregaron comentarios:
```bash
cd ~/Documentos/HIPERTROFIA
git diff -- 'web/src/**/*.ts' 'web/src/**/*.tsx' | grep '^-' | grep -vE '^---' | grep -vE '^\-\s*(//|\*|/\*)'
# Salida esperada: vacía (no hubo eliminación de código, solo comentarios).
```

---

## 5. Convenciones del proyecto (para que quede consistente)

- **Comentarios:** español. Cabecera en cada archivo, JSDoc en funciones y
  componentes exportados, `//` por secciones. No comentar obviedades.
- **Datos:** `createClient()` del navegador + **RLS**. El 90% no pasa por Next.
- **Server:** route handlers en `web/src/app/api/` para integraciones; service
  role solo ahí, nunca en el cliente.
- **Mutaciones:** `useMutation` + `invalidateQueries` + `toast(...)`.
- **Typecheck (workaround del entorno Node 26/glibc):**
  `MALLOC_CHECK_=0 ./node_modules/.bin/tsc --noEmit`.
  `npm`/`next build`/`eslint` crashean en este entorno (`free(): invalid pointer`).
- **Nunca** `git add -f` sobre `.env*`.

---

## 6. Verificación rápida del estado de seguridad

```bash
cd ~/Documentos/HIPERTROFIA

# 1) ¿Hay secretos completos fuera de .env.local?
grep -rIlE 'sb_secret_[A-Za-z0-9]{20}|GOCSPX-[A-Za-z0-9_-]{15}|vcp_[A-Za-z0-9]{20}' . \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=out --exclude-dir=.git
# Esperado: web/.env.local (único, y está gitignored)

# 2) ¿Está algo sensible trackeado?
git ls-files | grep -iE '\.env|secret|credential|\.key|\.pem'
# Esperado: solo web/.env.example, web/supabase/.env.example

# 3) ¿web-legacy y archive fuera de git?
git ls-files | grep -E 'web-legacy/|docs/archive/' | head
# Esperado: vacío
```

---

## 7. Preguntas frecuentes

**¿Hay que reescribir el historial de git?**
No. Las claves nunca se commitearon; los `.env*` estuvieron siempre ignorados.
Igual conviene correr `gitleaks` para confirmar.

**¿Borro `web-legacy/`?**
Podés hacerlo cuando quieras: ya no está en git y ocupa ~1 GB. Mientras tanto,
movelo fuera de carpetas que se sincronicen a la nube/backups.

**¿La app sigue funcionando?**
Sí: no se tocó lógica. El typecheck pasa. Solo se borraron archivos de test y
secretos locales; la app usa Vercel Env en producción.

**¿Qué hago primero si solo tengo 10 minutos?**
Rotar la `service_role` y borrar `web/.env.local` si no podés rotarla hoy
(volvés a generarla cuando tengas la clave nueva).
