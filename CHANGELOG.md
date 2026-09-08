# Changelog

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

## Historial anterior

Ver `AUDITORIA_PROYECTO_MEJORA.md` y `CONTEXTO_SESION_2026-08-22.md`.