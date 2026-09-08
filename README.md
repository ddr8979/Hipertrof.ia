# Hipertrof.ia

> PWA offline-first para atletas y personal trainers. Diario de cargas con UX Hevy-like, gestión de alumnos, y rendimiento táctil móvil.

---

## Quick start

```bash
cd ~/Documentos/HIPERTROFIA/web
npm install
npm run dev
# → http://localhost:3000
```

Para producción local con protección anti-crash:

```bash
hiptrun
```

---

## Documentación

**Toda la documentación está en [`docs/`](./docs/).** Empezá por:

- 📚 [**Índice completo**](./docs/README.md)
- 🚀 [**Setup local**](./docs/operations/01-setup-local.md)
- 🏗️ [**Arquitectura**](./docs/architecture/01-vision-general.md)
- 🤖 [**Sistema Guardian**](./docs/operations/03-sistema-guardian.md) — Cómo evitar que el sistema se trabe
- 🆘 [**Problemas comunes**](./docs/troubleshooting/01-comunes.md)

---

## Stack

- **Next.js 16.3.1** + React 19 + TypeScript
- **Prisma** ORM (SQLite local, Postgres prod)
- **Zustand** con persistencia offline
- **Tailwind CSS v4**
- **Capacitor 8** para Android
- **Supabase** como backend cloud

---

## Estructura

```
.
├── web/             → Next.js app + Android project
├── docs/            → Documentación completa
├── exercises-dataset/  → Catálogo de ejercicios
└── web-legacy/      → Código viejo archivado (no usar)
```

---

## Scripts útiles

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Modo desarrollo con hot reload |
| `npm start` | Producción local |
| `hiptrun` | Producción con protección anti-crash |
| `npx prisma studio` | Inspector visual de DB |
| `healthcheck` | Diagnóstico del sistema |
| `~/.local/bin/guardian.sh status` | Estado del monitor |

---

## Sistema Guardian

El sistema incluye un monitor inteligente que previene los problemas que tuvimos:

- Auto-limpia coredumps cuando se acumulan
- Detecta crash loops de Next.js y limita CPU
- Notifica con notificaciones nativas (sin spam)
- **Nunca mata procesos sin avisar**

Ver [`docs/operations/03-sistema-guardian.md`](./docs/operations/03-sistema-guardian.md) para detalles.

---

## Licencia

Privado.