# Hipertrof.ia — Documentación

PWA web-first para atletas y personal trainers. Diario de cargas, rutinas,
gestión de alumnos, nutrición, social y mensajería.

---

## Índice rápido

### Estado y próximos pasos
- 📌 [**Estado y Plan**](./ESTADO-Y-PLAN.md) — qué se hizo, qué falta y qué hacer (leer primero)
- 🗺️ [**Roadmap para terminar la app**](./ROADMAP.md) — fases, dependencias y DoD
- ✅ [**Checklists y DoD**](./CHECKLISTS-DOD.md) — documento de trabajo diario
- 📄 [Resumen del plan](./00-LEEME-PLAN.md)

### Para arrancar
- [Setup local](./operations/01-setup-local.md) — Instalar y correr en 5 minutos
- [Comandos útiles](./operations/02-comandos-utiles.md) — Scripts de desarrollo

### Arquitectura
- 🗺️ [**Mapa visual de Hipertrof.ia**](./architecture/05-mapa-hipertrofia.md) — **empezá acá**: partes, comunicación, datos, flujos
- 🩺 [**Diagnóstico rutinas + trainer**](./architecture/06-diagnostico-rutinas-y-trainer.md) — bugs con causa raíz y plan por fases
- 🤖 [**Contexto completo para IA**](./architecture/07-contexto-para-ia.txt) — volcado autocontenido (datos reales + prompt) para pedir diagramas del proyecto
- [Offline-first](./architecture/03-offline-first.md) — Zustand, persistencia, sync
- [Capacitor Android](./architecture/04-capacitor-android.md) — Build, permisos

> ⚠️ Desactualizados (describen Prisma/SQLite/FSD, que **no** existen):
> `01-vision-general.md`, `02-modelo-datos.md`, `07-mapa-completo-web.md`
> y los sueltos `00-indice.md`, `02-arquitectura.md`, `07-mapa-completo-web.md`.

### Seguridad
- 🔒 [**Auditoría de seguridad**](./security/AUDITORIA-SEGURIDAD.md) — hallazgos, rotación, plan de acción
- [Política de seguridad](../../SECURITY.md) — cómo reportar vulnerabilidades

### Operación
- [Sistema Guardian](./operations/03-sistema-guardian.md) — Anti-crash, autorregulación
- [Mantenimiento](./operations/04-mantenimiento.md) — Logs, backups, updates

### Deploy
- [Producción](./deployment/01-produccion.md) — Build, env, hosting

### Troubleshooting
- [Problemas comunes](./troubleshooting/01-comunes.md) — Crash loops, memoria, errores
- [Recuperar sistema](./troubleshooting/02-sistema-roto.md) — Cuando el sistema se traba

---

## TL;DR — Comandos esenciales

```bash
# Arrancar el server con protección anti-crash
hiptrun

# Modo dev normal
cd web && npm run dev

# Typecheck (workaround del entorno Node 26/glibc)
cd web && MALLOC_CHECK_=0 ./node_modules/.bin/tsc --noEmit

# Estado del sistema
~/.local/bin/guardian.sh status

# Logs
tail -f ~/.config/guardian/hiptrun/hiptrun.log
```

---

## Estructura del proyecto

```
~/Documentos/HIPERTROFIA/
├── web/                     # Next.js + Supabase + Capacitor
│   ├── src/
│   │   ├── app/             # App Router (grupos (app), (auth), (session), api/)
│   │   ├── components/      # UI y componentes de negocio
│   │   └── lib/             # supabase/, stores, utilidades
│   ├── supabase/            # config.toml + migrations/ (modelo de datos)
│   ├── android/             # proyecto nativo Android
│   └── .env.example         # plantilla de variables (versionada)
├── docs/                    # esta documentación
├── exercises-dataset/       # catálogo de ejercicios
├── web-legacy/              # código viejo (NO versionado, no usar)
└── SECURITY.md              # política de seguridad
```

---

## Stack

- **Next.js 16.3.1** + React 19 + TypeScript
- **Supabase** (Postgres + RLS + Auth + Realtime + Storage + RPC)
- **@supabase/ssr** (browser/server/middleware) + service role en route handlers
- **Zustand** + **TanStack Query** para estado y caché
- **Tailwind CSS v4**
- **Capacitor 8** para Android (iOS vía PWA)

> Sin Prisma, sin SQLite de aplicación y sin server actions.

---

## Documentos históricos (archivados)

En `docs/archive/` (fuera de git, en disco):
`AUDITORIA_PROYECTO_MEJORA.md`, `CONTEXT.md`, `INFORME_ARQUITECTO.md`,
`INFORME_TECNICO.md`. No borrar, pero no son fuente de verdad.
