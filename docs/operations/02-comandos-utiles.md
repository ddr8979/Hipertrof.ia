# Comandos Útiles

## Desarrollo diario

```bash
# Dev server (hot reload)
cd ~/Documentos/HIPERTROFIA/web
npm run dev

# Lint
npm run lint

# Type check
npx tsc --noEmit

# Build
npm run build

# Producción local
npm start
```

---

## Base de datos

```bash
# Ver DB visual
npx prisma studio

# Nueva migración
npx prisma migrate dev --name cambio_x

# Aplicar migrations sin dev
npx prisma migrate deploy

# Reset completo (borra datos)
npx prisma migrate reset

# Generar cliente Prisma
npx prisma generate

# Pull schema de DB existente
npx prisma db pull
```

---

## Git

```bash
# Status
git status

# Branch
git checkout -b feature/nueva-cosa

# Commit
git add .
git commit -m "feat: descripción"

# Push
git push origin feature/nueva-cosa
```

---

## Sistema Guardian

```bash
# Ver estado
~/.local/bin/guardian.sh status

# Ver logs en vivo
tail -f ~/.config/guardian/guardian.log

# Test de notificaciones
~/.local/bin/guardian.sh test

# Detener/Reiniciar
systemctl --user stop guardian.service
systemctl --user start guardian.service

# Ver estado del servicio
systemctl --user status guardian.service
```

---

## Hiptrun (wrapper para hipertrof.ia)

```bash
# Arrancar con protección
hiptrun

# Ver logs
tail -f ~/.config/guardian/hiptrun/hiptrun.log

# Limpiar cache manualmente
rm -rf ~/Documentos/HIPERTROFIA/web/.next/cache/*

# Ver contador de restarts
cat ~/.config/guardian/hiptrun/restart_count
```

---

## Diagnóstico del sistema

```bash
# Load average
cat /proc/loadavg

# Procesos top CPU
ps aux --sort=-%cpu | head

# Procesos top RAM
ps aux --sort=-%mem | head

# Disco
df -h

# Memoria
free -h

# Servicios fallando
systemctl --failed

# Coredumps acumulados
ls /var/lib/systemd/coredump | wc -l
```

---

## Limpieza

```bash
# Caché de paquetes
sudo pacman -Scc

# Logs viejos
sudo journalctl --vacuum-time=3d

# Caché general
rm -rf ~/.cache/*

# node_modules huérfanos (con cuidado)
cd ~/Documentos/HIPERTROFIA/web
rm -rf node_modules
npm install
```

---

## Android / Capacitor

```bash
cd ~/Documentos/HIPERTROFIA/web

# Sincronizar web → android
npx cap sync android

# Solo copiar assets
npx cap copy android

# Build APK debug
cd android && ./gradlew assembleDebug

# Instalar
adb install app/build/outputs/apk/debug/app-debug.apk

# Logs en device
adb logcat | grep -i "hipertrof"
```