# Hipertrof.ia — Documentación Completa

PWA offline-first para atletas y personal trainers. Diario de cargas, gestión de alumnos y rendimiento táctil móvil.

---

## Índice rápido

### Para arrancar
- [Setup local](./operations/01-setup-local.md) — Instalar y correr en 5 minutos
- [Comandos útiles](./operations/02-comandos-utiles.md) — Scripts de desarrollo

### Arquitectura
- [Visión general](./architecture/01-vision-general.md) — Stack, FSD, decisiones
- [Modelo de datos](./architecture/02-modelo-datos.md) — Prisma, entidades, relaciones
- [Offline-first](./architecture/03-offline-first.md) — Zustand, persistencia, sync
- [Capacitor Android](./architecture/04-capacitor-android.md) — Build, permisos, FCM

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

# O modo dev normal (sin protección)
cd ~/Documentos/HIPERTROFIA/web
npm run dev

# Estado del sistema
~/.local/bin/guardian.sh status

# Logs de hipertrofia
tail -f ~/.config/guardian/hiptrun/hiptrun.log
```

---

## Estructura del proyecto

```
~/Documentos/HIPERTROFIA/
├── web/                     # Next.js + Capacitor
│   ├── src/
│   │   ├── app/             # Rutas Next.js
│   │   ├── processes/       # Flujos multi-step
│   │   ├── pages/           # Vistas
│   │   ├── widgets/         # Componentes UI complejos
│   │   ├── features/        # Acciones de negocio
│   │   ├── entities/        # workout/, user/, etc
│   │   └── shared/          # api, lib, data
│   ├── android/             # Proyecto nativo Android
│   └── package.json
├── docs/                    # Esta documentación
├── exercises-dataset/       # Catálogo de ejercicios
├── web-legacy/              # Código viejo (no usar)
└── dev.db                   # DB local SQLite
```

---

## Stack

- **Next.js 16.3.1** + React 19 + TypeScript
- **Prisma** ORM (SQLite dev, Postgres prod)
- **Zustand** para estado offline
- **Tailwind v4**
- **Capacitor 8** para Android
- **Supabase** como backend cloud (auth, sync)

---

## Documentos históricos (NO borrar)

- `AUDITORIA_PROYECTO_MEJORA.md` — Auditoría técnica
- `CONTEXT.md` — Contexto original del proyecto
- `INFORME_ARQUITECTO.md`, `INFORME_TECNICO.md` — Análisis previos
- `Manual_Integral_HipertrofIA_Final.pdf` — Manual de usuario