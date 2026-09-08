# Sistema Guardian

> **¿Qué es?** Un daemon estilo Apple que monitorea el sistema y autorregula apps problemáticas **sin matar nada de la nada**.

---

## El problema que resolvió

**Antes**: Hipertrof.ia (Next.js) crasheaba en bucle → systemd-coredump generaba 4GB+ de dumps → disco al 92% → sistema entero se trababa → load average de 16 (4x núcleos) → todo congelado.

**Después**: Guardian detecta el crash loop, limita CPU del proceso, limpia coredumps automáticamente, y te avisa con notificaciones nativas.

---

## Componentes

### 1. Daemon principal
- **Path**: `~/.local/bin/guardian.sh`
- **Servicio**: `~/.config/systemd/user/guardian.service`
- **Frecuencia**: cada 30 segundos
- **Recursos**: ~1MB RAM, <1% CPU

### 2. Wrapper de hipertrof.ia
- **Path**: `~/.local/bin/hiptrun`
- **Logs**: `~/.config/guardian/hiptrun/`
- **Uso**: `hiptrun` en vez de `npm start`

### 3. Límites globales
- `/etc/systemd/coredump.conf.d/99-guardian.conf` — máximo 500MB de dumps
- `/etc/security/limits.d/99-guardian.conf` — límites suaves de procesos

---

## Qué hace cada 30 segundos

```
1. ¿Coredumps > 2GB o > 200 archivos?
   → Borra los más viejos (con sudo si hace falta)
   → Notifica cuánto liberó

2. ¿Algún proceso Node/Next crasheó 5+ veces en 30s?
   → Renice 19 (prioridad mínima, NO lo mata)
   → Notifica: "X está crasheando, revisá logs"

3. ¿Disco < 15% libre?
   → Notificación (1 vez por hora, no spam)

4. ¿RAM < 2GB libre?
   → Notificación (1 vez cada 30 min, no spam)
```

---

## Filosofía: nunca matar de la nada

| Nivel | Acción | Ejemplo |
|-------|--------|---------|
| 🟢 Info | Solo log | Coredumps limpiados |
| 🟡 Warning | Notificación | Memoria baja |
| 🔴 Critical | Notificación + renice | Crash loop |

**Nunca** manda SIGKILL. **Nunca** cierra apps en background sin avisar.

---

## Configuración

Editá `~/.local/bin/guardian.sh`:

```bash
MAX_LOAD_AVG=$(nproc)        # umbral de carga
MAX_COREDUMP_GB=2            # GB antes de auto-limpiar
MAX_COREDUMP_COUNT=200       # cantidad antes de auto-limpiar
DISK_FREE_MIN_PCT=15         # alerta si menos de esto
RAM_FREE_MIN_GB=2            # alerta si menos de esto
NODE_CRASH_LIMIT=5           # crashes antes de intervenir
NODE_RESTART_GRACE=30        # ventana en segundos
```

---

## Hiptrun: cómo protege hipertrof.ia

```
hiptrun
   ↓
1. ¿Crashed 5+ veces en 5 min? → ABORT + notify
2. ¿Cache de Next.js > 1.5GB? → Limpia automáticamente
3. Lanza Next.js con:
   - MemoryMax: 2GB (kernel lo mataría si pasa, suave)
   - MemoryHigh: 1.6GB (avisa antes)
   - NODE_OPTIONS: --max-old-space-size=1228
4. Si crashea: systemd --user reinicia automáticamente
6. Log completo en ~/.config/guardian/hiptrun/
```

---

## Por qué hipertrof.ia crasheaba (fix aplicado)

### Causa raíz
Next.js 16.3.1 + React 19.2.8 con `reactStrictMode: true` causaba **double-rendering** en SSR que desbordaba memoria en este hardware.

### Fix en `next.config.ts`
```typescript
{
  reactStrictMode: false,   // ← causa del crash
  experimental: {
    workerThreads: false,   // ← race condition con LUKS
    cpus: 1,                // ← menos paralelismo
  },
  output: "standalone",
}
```

### Fix en `package.json`
```json
{
  "start": "NODE_OPTIONS='--max-old-space-size=1536' next start"
}
```

---

## Verificación

```bash
# Estado general
~/.local/bin/guardian.sh status
# Heartbeat: 1788702788   ← último check
# Coredumps: 0 files      ← limpio
# Load: 0.89              ← normal

# Logs
tail -f ~/.config/guardian/guardian.log

# Estado del servicio systemd
systemctl --user status guardian.service
```

---

## Si necesitás ajustar

- **Más agresivo**: bajá `MAX_COREDUMP_GB` a 1
- **Menos agresivo**: subí `NODE_CRASH_LIMIT` a 10
- **Silenciar**: agregá tu usuario a `~/.config/guardian/silent` (touch)
- **Logs más detallados**: exportá `GUARDIAN_DEBUG=1` antes de correrlo