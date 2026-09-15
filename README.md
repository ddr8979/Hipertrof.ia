# Hipertrof.ia

> PWA web-first para atletas y personal trainers. Diario de cargas, rutinas,
> gestión de alumnos, nutrición, social y mensajería.

---

## Quick start

```bash
cd web
cp .env.example .env.local   # completar credenciales (proyecto de DEV, no prod)
npm install
npm run dev                  # → http://localhost:3000
```

> ⚠️ **Nunca uses credenciales de producción en local.** Ver
> [`docs/security/AUDITORIA-SEGURIDAD.md`](./docs/security/AUDITORIA-SEGURIDAD.md).

---

## Documentación

Toda la documentación está en [`docs/`](./docs/). Empezá por:

- 📚 [Índice completo](./docs/README.md)
- 🚀 [Setup local](./docs/operations/01-setup-local.md)
- 🗺️ [Mapa de arquitectura](./docs/architecture/05-mapa-hipertrofia.md)
- 🩺 [Diagnóstico rutinas + trainer](./docs/architecture/06-diagnostico-rutinas-y-trainer.md)
- 🔒 [Auditoría de seguridad](./docs/security/AUDITORIA-SEGURIDAD.md)
- 🆘 [Problemas comunes](./docs/troubleshooting/01-comunes.md)

---

## Stack

- **Next.js 16.3.1** (App Router) + React 19 + TypeScript
- **Supabase** (Postgres + RLS + Auth + Realtime + Storage + RPC) como backend
- **@supabase/ssr** para acceso de datos desde el navegador y SSR
- **Zustand 5** + **TanStack Query 5** para estado y caché
- **Tailwind CSS v4**
- **Capacitor 8** para Android (wrapper) e iOS vía PWA
- Deploy en **Vercel**

> No hay Prisma, ni SQLite de aplicación, ni server actions.

---

## Estructura

```
.
├── web/                 → App Next.js + Supabase + Capacitor
│   ├── src/             → app/, components/, lib/
│   ├── supabase/        → config.toml + migrations/ (fuente de verdad del modelo)
│   ├── public/          → sw.js, iconos
│   └── .env.example     → plantilla de variables (versionada)
├── docs/                → Documentación (ver docs/README.md)
│   ├── architecture/    → mapas, diagnósticos, contexto para IA
│   ├── security/        → auditoría y políticas
│   ├── operations/      → setup, guardian, mantenimiento
│   ├── deployment/      → producción
│   └── archive/         → informes viejos (NO versionado)
├── exercises-dataset/   → dataset de ejercicios
├── CHANGELOG.md
├── SECURITY.md          → política de seguridad y reporte de vulnerabilidades
└── web-legacy/          → código viejo (NO versionado, no usar)
```

---

## Scripts útiles (en `web/`)

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Desarrollo con hot reload |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción |
| `npm run lint` | ESLint |
| `MALLOC_CHECK_=0 ./node_modules/.bin/tsc --noEmit` | Typecheck (workaround de entorno) |
| `hiptrun` | Producción local con protección anti-crash |

---

## Seguridad

- Los `.env*` están ignorados por git; solo `.env.example` se versiona.
- La `service_role` **nunca** sale del servidor ni se usa en local contra prod.
- Antes de commitear, revisá la [auditoría](./docs/security/AUDITORIA-SEGURIDAD.md).
- Reporte de vulnerabilidades: ver [`SECURITY.md`](./SECURITY.md).

---

## Licencia

Privado.
