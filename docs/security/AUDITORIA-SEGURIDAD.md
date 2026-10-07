# Auditoría de Seguridad — Hipertrof.ia

**Fecha:** 2026-09-16
**Alcance:** repo `~/Documentos/HIPERTROFIA` (Next.js 16 + Supabase + Capacitor),
`.env*`, scripts sueltos, git history, middleware/route handlers, RLS y docs.
**Método:** inspección de archivos, `git ls-files`, `git check-ignore`,
búsqueda de patrones de secretos en árbol de trabajo e historial.
**Equipos simulados:** 5 seniors (AppSec/Cloud/Backend/Frontend/DevOps) y un
atacante externo.

> **Veredicto corto:** **NO hay secretos commiteados en git** (los `.env*` están
> correctamente ignorados y no aparecen en el historial). **Sí hay secretos
> vivos en texto plano en el disco**, incluida una `service_role` de
> **PRODUCCIÓN**, y el entorno de desarrollo apunta a la Supabase de producción.
> La app tiene hardening básico decente, pero le falta el caparazón profesional:
> rotación, separación de entornos, validación de env, CI de seguridad y tests
> de RLS.

---

## 0. Resumen ejecutivo

| # | Severidad | Hallazgo | Evidencia |
|---|-----------|----------|-----------|
| SEC-01 | 🔴 Crítico | `service_role` de **producción** en texto plano en ≥4 archivos del disco | `web/.env.local:3`, `web/pl-self.js:7`, `web/movil-check.js:7`, `web/edit-check.js:7` |
| SEC-02 | 🔴 Crítico | Dev/tests apuntan a la **misma Supabase de producción** (`oiirsbzuufrcagcjvzpi`) | `web/.env.local:1` |
| SEC-03 | 🟠 Alto | Google OAuth client secret real en disco (2 archivos) | `web/supabase/.env:1`, `web-legacy/.env:7` |
| SEC-04 | 🟠 Alto | Spotify client secret real en disco | `web/.env.local` |
| SEC-05 | 🟠 Alto | Open redirect en `/auth/callback` (`next` sin validar) ✅ fixado con `sanitizeNext` | `web/src/app/auth/callback/route.ts` |
| SEC-06 | 🟠 Alto | Rate limit in-memory inútil en serverless (multi-instancia) | `web/src/middleware.ts:22-40` |
| SEC-07 | 🟡 Medio | Token OIDC real de Vercel en `.env.production` | `web/.env.production` (`VERCEL_OIDC_TOKEN=eyJ…`) |
| SEC-08 | 🟡 Medio | Endpoint `/api/spotify/debug` sin auth, usa credenciales ✅ borrado | `web/src/app/api/spotify/debug/route.ts` (borrado) |
| SEC-09 | 🟡 Medio | `/api/push/send`: secreto comparado sin tiempo constante, `sender_id` spoofeable, sin usuario ✅ timing-safe + createAdminClient + validación de body | `web/src/app/api/push/send/route.ts` |
| SEC-10 | 🟡 Medio | CSP: ✅ `object-src 'none'` + `api.qrserver.com` en img-src; falta nonce, `upgrade-insecure-requests`, `worker-src` | `web/src/lib/supabase/middleware.ts` |
| SEC-11 | 🟡 Medio | Cookies de sesión sin `httpOnly`/`Secure`/`SameSite` explícitos → XSS exfiltra sesión | `web/src/lib/supabase/server.ts`, `middleware.ts` |
| SEC-12 | 🟡 Medio | Sin validación de esquema de env (aunque `zod` ya es dependencia) | no existe `env.ts` |
| SEC-13 | 🟡 Medio | Scripts de test mutan **producción** con `service_role` | `web/*-check.js` (`BASE=https://hypertrofia.vercel.app`) |
| SEC-14 | 🔵 Bajo | `grant select ... to anon` en **todas** las tablas → una policy faltante = datos públicos | `web/supabase/migrations/20260818000001_init_schema.sql:721-725` |
| SEC-15 | 🔵 Bajo | Prefijos/claves parciales citados en docs rastreados | `AUDITORIA_PROYECTO_MEJORA.md:134-137` |
| SEC-16 | 🔵 Bajo | Sin CI, secret scanning, pre-commit hooks ni Dependabot | — |
| SEC-17 | 🔵 Bajo | `x-forwarded-host` confiado para construir redirect (solo dev) | `web/src/app/auth/callback/route.ts:19-21` |
| SEC-18 | 🔵 Bajo | Sin MFA para admins, sin audit log, sin alertas | — |

---

## 1. ¿Están expuestas las credenciales?

### 1.1 Lo que NO está expuesto (buena noticia)
- `git ls-files` no incluye `web/.env.local`, `web/.env.production`,
  `web/supabase/.env`, `web-legacy/.env` ni los `*-check.js`.
- Búsqueda en **todo el historial** (`git grep` sobre `git rev-list --all`):
  no aparece ninguna clave completa (`sb_secret_…`, `GOCSPX-…`, `vcp_…`).
- `.gitignore` funciona: `git check-ignore` confirma que `.env*` y
  `CONTEXTO_SESION_*.md` están ignorados.
- `productionBrowserSourceMaps: false` y `poweredByHeader: false` (bien).
- La `service_role` **no** se filtra al bundle: no hay `NEXT_PUBLIC_*` raro.
- `middleware` separa correctamente server/client y no ejecuta código entre
  `createServerClient` y `getUser()`.

### 1.2 Lo que SÍ está expuesto (en disco)
Secretos **reales y vivos** en texto plano:

```
web/.env.local:3              SUPABASE_SERVICE_ROLE_KEY=sb_secret_<REDACTADO>   ← PRODUCCIÓN
web/pl-self.js:7              "sb_secret_<REDACTADO>"                          ← PRODUCCIÓN
web/movil-check.js:7          "sb_secret_<REDACTADO>"                          ← PRODUCCIÓN
web/edit-check.js:7           "sb_secret_<REDACTADO>"                          ← PRODUCCIÓN
web/supabase/.env:1           GOOGLE_CLIENT_SECRET=GOCSPX-<REDACTADO>            ← OAuth
web/.env.local                GOOGLE_CLIENT_SECRET=GOCSPX-<REDACTADO>            ← OAuth
web/.env.local                SPOTIFY_CLIENT_SECRET=<REDACTADO>                  ← Spotify
web-legacy/.env:7             GOOGLE_CLIENT_SECRET=GOCSPX-<REDACTADO>           ← OAuth (legacy)
web/.env.production           VERCEL_OIDC_TOKEN=eyJhbGci… (JWT real)       ← Vercel
web/supabase/.temp/**         claves demo locales (no prod)                 ← local
```

La `service_role` **bypasea todo RLS**. Quien la obtenga puede leer, escribir y
borrar **toda** la base de producción, crear/borrar usuarios (auth admin) y
exfiltrar los tokens de Spotify de los usuarios (`spotify_tokens`) y los
refresh tokens guardados en `user_connections`.

### 1.3 Cómo la obtendría un atacante (sin hacking sofisticado)
1. **Backup / carpeta sincronizada / workspace compartido.** El repo vive en
   `~/Documentos`; cualquier backup a la nube, ZIP enviado, o `rsync` se lleva
   los `.env*` y los `*-check.js` aunque git los ignore.
2. **Machine share.** Si el equipo crece o se comparte la laptop, el atacante
   no necesita git: le alcanza `cat web/.env.local`.
3. **Logs/telemetría del chat/IA.** El historial de `opencode` (no versionado)
   ya contiene fragmentos de secretos en texto plano (ver SEC-15).
4. **Supply chain.** Un script `postinstall` malicioso en `node_modules` lee
   `process.env` o los `.env` locales y los exfiltra (esto aplica también a
   producción con la service role de Vercel).
5. **SSRF/inyección en `/api/spotify/*` o `/api/push/*`** si logueás errores
   con headers; menor, pero real.

---

## 2. Hallazgos detallados

### SEC-01 🔴 `service_role` de producción en disco (y en scripts de test)
**Evidencia:** `web/.env.local:3` y hardcodeada en `pl-self.js`, `movil-check.js`,
`edit-check.js`. La auditoría previa (`AUDITORIA_PROYECTO_MEJORA.md:134`) decía
haber eliminado `add_column.mjs`, pero quedaron **tres** scripts con la misma
clave viva.
**Impacto:** compromiso total de la DB de producción.
**Remediación:**
1. **Rotar YA** la `service_role` (Supabase → Settings → API → Rotate) y
   actualizar Vercel + `.env.local`.
2. Sacar la clave de los scripts: usar `process.env.SUPABASE_SERVICE_ROLE_KEY`
   con `dotenv` y borrar/renombrar los `*-check.js` fuera del repo.
3. Añadir al `.gitignore` `/*-check.js` y `*.local.js` para no depender de una
   lista manual frágil.

### SEC-02 🔴 Dev apunta a Supabase de producción
**Evidencia:** `web/.env.local:1` → `https://oiirsbzuufrcagcjvzpi.supabase.co`
(el mismo ref que producción, ver `.vercel/project.json` + docs).
**Impacto:** un bug en el front de desarrollo, un script de test o una
`service_role` local comprometida puede **borrar datos reales de usuarios**.
**Remediación:** crear un **proyecto Supabase de staging/dev separado**
(idealmente 3 entornos: dev, staging, prod). Nunca usar la service role de prod
en local.

### SEC-03/SEC-04 🟠 Google y Spotify client secrets en disco
**Evidencia:** `web/supabase/.env:1`, `web-legacy/.env:7`, `web/.env.local`.
**Impacto:** permiten impersonar la app OAuth (pedir tokens en nombre de la app),
abuso de cuota de Spotify, y potencialmente login social malicioso si se
manipulan redirect URIs.
**Remediación:** rotar en Google Cloud Console y Spotify Dashboard; borrar los
archivos legacy; `.env` de Supabase local solo para desarrollo.

### SEC-05 🟠 Open redirect en `/auth/callback`
**Evidencia:** `web/src/app/auth/callback/route.ts:12,23` usa `next` de la query
sin validar y hace `NextResponse.redirect(`${origin}${next}`)`. El front
(`auth-card.tsx:safeNext`) sí valida, pero el callback confía en cualquiera.
Un `next=@evil.com` produce `https://hypertrofia.vercel.app@evil.com`, que el
navegador interpreta como host `evil.com` (phishing post-login / robo de
contexto).
**Remediación:** validar `next` como ruta relativa: debe empezar con `/`, no
`//`, no contener `\`, `@`, `:` ni `http`. Envolver en helper compartido.

### SEC-06 🟠 Rate limit inútil en Vercel
**Evidencia:** `web/src/middleware.ts:22-40` — `Map` en memoria por instancia.
En serverless hay N instancias y el estado no se comparte; además el matcher
excluye static pero no protege `/auth/*`/`/api/*`.
**Remediación:** rate limit distribuido (Upstash Redis + `@upstash/ratelimit`),
o reglas de Vercel/Firewall; límites específicos para login, magic link,
`send_message` y `/api/push/send`.

### SEC-07 🟡 Token OIDC de Vercel en `.env.production`
**Evidencia:** `web/.env.production` (`VERCEL_OIDC_TOKEN=eyJ…`), generado por
`vercel env pull`. Es un JWT de identidad de despliegue (puede permitir
operaciones contra la API de Vercel según scope/expiración).
**Remediación:** borrar el archivo tras usarlo; no versionarlo; preferir
`vercel env pull` bajo demanda y con `--environment`. Verificar expiración.

### SEC-08 🟡 `/api/spotify/debug` sin auth
**Evidencia:** `web/src/app/api/spotify/debug/route.ts` — público, devuelve
`clientIdPrefix` y ejecuta `client_credentials` contra Spotify. Es un oráculo
para abusar de las credenciales de app y filtrar información.
**Remediación:** **eliminarlo** en producción (o exigir sesión + `is_admin`).

### SEC-09 🟡 `/api/push/send` débil — ✅ PARCIALMENTE RESUELTO (2026-09-16)
**Evidencia:** `web/src/app/api/push/send/route.ts`
- ~~Comparación no constante del secreto~~ → ahora `crypto.timingSafeEqual`.
- ~~Usa `createClient()` (anon) sin usuario → RLS niega `push_subscriptions`~~ →
  ahora usa `createAdminClient()` (service_role).
- ~~Body sin validar~~ → valida `sender_id`, `recipient_id` y `content`.
- **Sigue pendiente:** `sender_id` viene del body y no se verifica contra una
  sesión ni contra un mensaje real; el secreto estático compartido. Ideal:
  invocar desde el flujo autenticado o firmar el webhook.
**Remediación restante:** endpoint con JWT de usuario o webhook firmado.

### SEC-10 🟡 CSP débil y con un bug funcional
**Evidencia:** `web/src/lib/supabase/middleware.ts`
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` → XSS puede ejecutar script.
  Next 16 necesita nonce/hash; se puede endurecer.
- Faltan `object-src 'none'`, `worker-src`, `frame-src`, `upgrade-insecure-requests`.
- `img-src` **no incluye `https://api.qrserver.com`** → el QR de invitación
  (nuevo `trainer-invite-dialog.tsx`) probablemente **no renderiza**.
- `connect-src` no incluye `https://api.spotify.com`/`accounts.spotify.com`
  (el callback OAuth es server-side, ok, pero el cliente de datos de Spotify
  sí pega a la API).
**Remediación:** CSP con nonce (Next soporta `headers()` + middleware), agregar
`api.qrserver.com` a `img-src`, `object-src 'none'`, `upgrade-insecure-requests`.

### SEC-11 🟡 Cookies de sesión sin flags explícitos
**Evidencia:** `@supabase/ssr` escribe cookies legibles por JS (necesario para
el browser client). No se fuerzan `Secure`, `SameSite` ni `httpOnly` donde
aplican; en dev van por HTTP.
**Impacto:** un XSS (favorecido por SEC-10) puede exfiltrar el refresh token.
**Remediación:** endurecer CSP (mitiga XSS), forzar `SameSite=Lax`/`Strict`,
`Secure` en prod, y considerar un modo con cookie httpOnly si se migra a
server-only para datos sensibles.

### SEC-12 🟡 Sin validación de entorno
**Evidencia:** no hay módulo `env.ts`; se usan `process.env.X!` con
non-null-assertion (`server.ts`, `middleware.ts`, `admin.ts`). `zod` ya está en
`dependencies` pero sin uso de validación global.
**Remediación:** crear `src/lib/env.ts` con esquema `zod`, validar al arranque
(server y cliente), y fallar rápido con mensaje claro. Documentar todas las vars
en `.env.example` (hoy faltan `VAPID_*`, `PUSH_HOOK_SECRET`, y hay mismatch
`SERVICE_ROLE_KEY` vs `SUPABASE_SERVICE_ROLE_KEY`).

### SEC-13 🟡 Scripts de test mutan producción
**Evidencia:** `pl-check.js`, `pl-self.js`, `movil-check.js`, `edit-check.js`
apuntan a `BASE=https://hypertrofia.vercel.app` y usan `service_role` para
crear/borrar filas reales.
**Remediación:** mover a un proyecto de staging; usar variables de entorno;
marcar datos de test con prefijo y limpiarlos por job; no usar service_role en
tests de UI (usar un usuario de test dedicado).

### SEC-14 🔵 `grant select to anon` global
**Evidencia:** `20260818000001_init_schema.sql:721-725`.
**Impacto:** la seguridad depende 100% de que **todas** las tablas tengan RLS
habilitado y políticas correctas. Una tabla nueva sin `enable row level
security` o sin policy → legible por cualquiera con la anon key.
**Remediación:** `alter table ... enable row level security` por defecto +
`revoke select on ... from anon` para tablas no públicas; test automatizado que
falle si alguna tabla pública no tiene RLS.

### SEC-15 🔵 Secretos parciales en docs rastreados
`AUDITORIA_PROYECTO_MEJORA.md:134-137` contiene prefijos (`sb_secret_<REDACTADO>`,
`sb_secret_<REDACTADO>`) y el ID de proyecto. No son secretos completos, pero son
señales para un atacante y deben sanearse de docs versionados.

### SEC-16 🔵 Sin CI de seguridad
No hay secret scanning (`gitleaks`/`trufflehog`), pre-commit, SAST, ni
Dependabot/`npm audit` en CI. Además `npm`/`next build`/`eslint` **crashean en
este entorno** (Node 26 + glibc), así que hoy no hay gates locales.

### SEC-17 🔵 Confianza en `x-forwarded-host`
`auth/callback/route.ts:19-21` construye el redirect con ese header cuando es
local. Aunque acotado a dev, es host-header injection; validar contra una
allowlist.

### SEC-18 🔵 Falta de controles administrativos
Sin MFA para `is_admin`, sin audit log de acciones privilegiadas (cambio de
rol, borrado de cuentas, export de datos), sin alertas de picos de tráfico ni
de uso anómalo de la API.

---

## 3. Qué falta para "profesionalizar" (checklist)

### Secretos
- [ ] Rotar `service_role`, Google y Spotify secrets HOY.
- [ ] Eliminar `.env.production` del disco (o sacar el OIDC token).
- [ ] Borrar/relocalizar los 4 scripts `*-check.js` y `web-legacy/.env`.
- [ ] Un gestor de secretos (Vercel Env + 1Password/Doppler) como única fuente.
- [ ] `gitleaks` en pre-commit y en CI; bloquear push ante detección.
- [ ] `.env.example` completo y sincronizado con `env.ts`.

### Entornos y accesos
- [ ] 3 proyectos Supabase: dev / staging / prod.
- [ ] Cuentas de servicio separadas por entorno; service_role solo en Vercel
      de prod y nunca en local.
- [ ] MFA obligatorio en Supabase, Vercel, Google Cloud y Spotify.
- [ ] Principio de mínimo privilegio: revisar quién tiene acceso al equipo de
      Vercel/Supabase.

### Aplicación
- [x] Validación de env con `zod` y fail-fast (`src/lib/env.ts`).
- [ ] CSP con nonce, `upgrade-insecure-requests`, dominios reales; ✅ `object-src 'none'` + `api.qrserver.com` en img-src; falta nonce.
- [ ] `SameSite`/`Secure` en cookies.
- [x] Validación/allowlist del `next` (anti open redirect) — `sanitizeNext`.
- [ ] Rate limit distribuido + reglas de firewall.
- [x] Borrar `/api/spotify/debug` ✅; `/api/push/send` ya timing-safe + `createAdminClient` + validación de body.
- [ ] Parseo con `zod` en **todos** los route handlers (body/query).

### Datos (Supabase)
- [ ] Suite de tests de RLS (tabla por tabla) que corra en CI contra staging.
- [ ] `enable row level security` por defecto + `revoke` de `anon` en tablas no
      públicas.
- [x] Transacciones (RPC `SECURITY DEFINER`) para `finish_workout` (💥 wiring en `/entrenar`) + `save_routine` (RPC lista; wiring en `/rutinas` pendiente).
- [ ] Backups automáticos + prueba de restauración documentada (DR).
- [ ] Audit log de acciones privilegiadas.

### Proceso / DevOps
- [ ] CI (GitHub Actions) con: typecheck, lint, `npm audit`, `gitleaks`, tests
      de RLS.
- [ ] Dependabot/Renovate + pin de versiones.
- [ ] `SECURITY.md` con canal de reporte y política de divulgación.
- [ ] Sanear docs versionados de prefijos de claves.

---

## 4. Plan de acción

### 0–24 h (contención)
1. **Rotar `service_role`** en Supabase y actualizar Vercel + `.env.local`.
2. **Rotar** Google y Spotify client secrets; borrar `web-legacy/.env` y
   `web/supabase/.env` de la máquina (o dejarlos solo si son de un Supabase
   local).
3. **Eliminar** `.env.production` del disco y **borrar** `edit-check.js`,
   `movil-check.js`, `pl-self.js`, `pl-check.js` (o moverlos fuera del repo con
   variables de entorno).
4. Confirmar que ningún `.env` ni script quedó en un backup/sync.

### 1–7 días (endurecer)
5. Validación de env con `zod` (`src/lib/env.ts`).
6. Fix open redirect en `/auth/callback`.
7. Eliminar `/api/spotify/debug`; endurecer `/api/push/send` (timing-safe +
   `sender_id === auth.uid()` + validación con `zod`).
8. CSP: nonce, `object-src 'none'`, `img-src api.qrserver.com`,
   `upgrade-insecure-requests`; `SameSite`/`Secure` en cookies.
9. Rate limit distribuido para auth y mensajería.
10. Crear Supabase de **staging** y migrar dev/tests ahí.

### 30 días (profesionalizar)
11. CI de seguridad (gitleaks + `npm audit` + typecheck) y Dependabot.
12. Suite de tests de RLS + `SECURITY.md`.
13. Rotación periódica de secretos (calendario) y MFA en todos los paneles.
14. Backups/DR probados y audit log de acciones admin.
15. RPC transaccionales (`save_routine`, `finish_workout`).

---

## 5. Runbook de rotación (resumen)

**Supabase service_role**
1. Dashboard → Project Settings → API → *Rotate* `service_role` (dos veces si
   el proveedor invalida por etapas).
2. Actualizar `SUPABASE_SERVICE_ROLE_KEY` en Vercel (Production/Preview) y en
   `.env.local` (solo dev).
3. Re-deploy y verificar `/api/trainer/role` y `/api/push/send`.
4. Invalidar el entorno local viejo.

**Google OAuth**
1. Google Cloud Console → Credentials → OAuth client → *Reset secret*.
2. Actualizar en Vercel y en Supabase Auth (Google provider).

**Spotify**
1. Spotify Developer Dashboard → app → *Rotate client secret*.
2. Actualizar en Vercel; re-deploy.

**Vercel OIDC/token**
1. Vercel → Account/Team Tokens → revocar el token filtrado; regenerar solo si
   se necesita y guardarlo en el gestor de secretos.

---

## 6. Anexo — evidencia cruda

```
$ git ls-files | grep -iE '\.env|secret'
web/.env.example
web/src/lib/spotify-token.ts          # solo lee process.env, sin secreto

$ git check-ignore -v web/.env.local web/.env.production web/supabase/.env web-legacy/.env
web/.gitignore:4:.env*    web/.env.local
web/.gitignore:4:.env*    web/.env.production
web/.gitignore:4:.env*    web/supabase/.env
web-legacy/.gitignore:34:.env*  web-legacy/.env

$ git grep -E 'sb_secret_[A-Za-z0-9]|GOCSPX-[A-Za-z0-9_-]' $(git rev-list --all) -- .
# (sin coincidencias de claves completas)
```

Nota: `web/supabase/.temp/**` contiene claves de la Supabase local (demo), no de
producción, pero está en disco y conviene limpiarlo.
