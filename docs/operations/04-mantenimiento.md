# Mantenimiento

## Rutina semanal

```bash
# 1. Actualizar sistema
sudo pacman -Syu

# 2. Limpiar caché de paquetes
sudo pacman -Scc

# 3. Limpiar logs viejos
sudo journalctl --vacuum-time=7d

# 4. Limpiar caché general
rm -rf ~/.cache/*

# 5. Ver estado del sistema
~/.local/bin/guardian.sh status

# 6. Buscar archivos grandes
du -sh ~/* | sort -h | tail -10
```

---

## Rutina mensual

```bash
# Backup de DB local
cp ~/Documentos/HIPERTROFIA/dev.db ~/Backups/dev-$(date +%Y%m%d).db

# Backup de .env (sin commitear)
cp ~/Documentos/HIPERTROFIA/web/.env.local ~/Backups/

# Revisar uso de disco
df -h
du -sh ~/Documentos/HIPERTROFIA/*

# Revisar servicios fallando
systemctl --user --failed
systemctl --failed
```

---

## Actualizar dependencias

```bash
cd ~/Documentos/HIPERTROFIA/web

# Ver qué hay desactualizado
npm outdated

# Actualizar todo (cuidado con breaking changes)
npm update

# Si hay issues, regenerar Prisma
npx prisma generate

# Rebuild
npm run build
```

### Actualizar Next.js específicamente

Next.js tiene breaking changes frecuentes. Antes de actualizar:

```bash
# Ver changelog
# https://nextjs.org/docs/app/building-your-application/upgrading

# Crear branch
git checkout -b upgrade/next-X

# Actualizar
npm install next@latest react@latest react-dom@latest

# Test
npm run dev
npm run build

# Si todo OK, merge
```

---

## Limpiar proyecto

```bash
cd ~/Documentos/HIPERTROFIA/web

# Borrar build artifacts
rm -rf .next out
rm -rf android/app/build
rm -rf android/build

# Reset node_modules (si hay conflictos)
rm -rf node_modules package-lock.json
npm install
```

---

## Logs importantes

| Path | Qué hay |
|------|---------|
| `~/.config/guardian/guardian.log` | Eventos del sistema |
| `~/.config/guardian/hiptrun/hiptrun.log` | Crashes de hipertrofia |
| `~/.local/share/opencode/logs/` | Logs de opencode (esta IA) |
| `~/Documentos/HIPERTROFIA/web/.next/trace` | Tracing de Next.js |
| `journalctl --user` | Logs de tus servicios |

---

## Monitoreo de salud

### Script rápido de health check

```bash
cat > ~/.local/bin/healthcheck << 'EOF'
#!/bin/bash
echo "=== SISTEMA ==="
echo "Load: $(cut -d' ' -f1 /proc/loadavg) (cores: $(nproc))"
echo "RAM: $(free -h | awk 'NR==2 {print $7}') libre"
echo "Disco: $(df -h / | awk 'NR==2 {print $4}') libre"
echo ""
echo "=== SERVICIOS ==="
systemctl --user --failed --no-pager | head -5
echo ""
echo "=== COREDUMPS ==="
echo "$(ls /var/lib/systemd/coredump 2>/dev/null | wc -l) archivos"
echo ""
echo "=== NODE/NEXT PROCESOS ==="
pgrep -af "next start" | head
EOF
chmod +x ~/.local/bin/healthcheck
```

Después: `healthcheck`

---

## Backup strategy

### Crítico (backup diario)
- `~/Documentos/HIPERTROFIA/dev.db`
- `~/Documentos/HIPERTROFIA/web/.env.local`

### Importante (backup semanal)
- Código fuente (git remote)
- Assets personalizados (`/public/uploads/`)
- Certificados/keystore de Android

### Nice to have (backup mensual)
- Logs importantes
- Configuración de sistema (`~/.config/`)
- Scripts custom (`~/.local/bin/`)

---

## Troubleshooting rápido

| Síntoma | Comando |
|---------|---------|
| Sistema lento | `healthcheck` |
| Next.js crashea | `tail -50 ~/.config/guardian/hiptrun/hiptrun.log` |
| Brave lento | `rm -rf ~/.cache/BraveSoftware` |
| Disco lleno | `du -sh ~/* | sort -h | tail` |
| Algo no arranca | `systemctl --user status nombre` |