# Cuando el sistema se traba

## Señales de alerta

- **Load average > 2 × núcleos** (`cat /proc/loadavg`)
- **Teclado lag** en terminal
- **Ventanas tardan en abrir**
- **Apps se congelan al cambiar de foco**

---

## Paso 1: Diagnosticar (30 segundos)

```bash
# Carga del sistema
cat /proc/loadavg
# load average: 8.43, 12.10, 10.50
# Si tenés 4 cores y ves >8 → hay problema

# Qué proceso come CPU
ps aux --sort=-%cpu | head -10

# Qué proceso come RAM
ps aux --sort=-%mem | head -10

# Disco lleno?
df -h /

# Coredumps acumulados
ls /var/lib/systemd/coredump | wc -l
```

---

## Paso 2: Intervención rápida

### Caso A: Next.js en crash loop

```bash
# Ver logs
tail -50 ~/.config/guardian/hiptrun/hiptrun.log

# Solución: matar y limpiar
pkill -9 -f "next start"
rm -rf ~/Documentos/HIPERTROFIA/web/.next/cache/*

# Reiniciar limpio
hiptrun
```

### Caso B: systemd-coredump acumulado

```bash
# Guardian lo limpia solo, pero forzá:
echo "881881" | sudo -S rm -rf /var/lib/systemd/coredump/*

# Verificar espacio liberado
df -h /
```

### Caso C: Algo específico come CPU

```bash
# Identificar PID
ps aux --sort=-%cpu | head

# Bajar prioridad (NO mata)
sudo renice -n 19 -p <PID>

# Si sigue, ya podés matar
kill <PID>
```

---

## Paso 3: Si nada responde

### Reiniciar el entorno gráfico sin perder sesiones

```bash
# TTY alternativa
Ctrl+Alt+F2

# Login y reiniciar display manager
sudo systemctl restart sddm   # KDE
# o
sudo systemctl restart gdm    # GNOME
```

### Reiniciar solo tu sesión

```bash
# En TTY
Ctrl+Alt+F2

# Login y matar tu sesión
loginctl terminate-user $USER
```

### Si ni el teclado responde

Magic SysRq (núcleo):
```
Alt+SysRq+R    # Reclaim teclado
Alt+SysRq+E    # SIGTERM a todos (excepto init)
Alt+SysRq+I    # SIGKILL a todos (excepto init)
Alt+SysRq+S    # Sync
Alt+SysRq+B    # Reboot
```

---

## Paso 4: Limpieza profunda post-incidente

```bash
# Cuando vuelvas a tener control
echo "881881" | sudo -S pacman -Scc
sudo journalctl --vacuum-time=1d
rm -rf ~/.cache/*

# Limpiar node_modules y rebuild si toca
cd ~/Documentos/HIPERTROFIA/web
rm -rf .next node_modules
npm install

# Verificar que Guardian sigue activo
systemctl --user status guardian.service

# Si crasheó, reiniciar
systemctl --user restart guardian.service
```

---

## Prevención

1. **Nunca dejés Next.js corriendo toda la noche** sin supervisión
2. **Después de hacer cambios grandes en el código**, probá build primero: `npm run build`
3. **Mantené al menos 20% de disco libre**
5. **Si ves load >4 por más de 1 min**, intervení rápido
6. **Guardian debe estar siempre activo**:
   ```bash
   systemctl --user is-enabled guardian.service   # enabled
   systemctl --user is-active guardian.service    # active
   ```

---

## Diagnóstico para reportar bugs

Si el problema persiste y querés ayuda:

```bash
# Generar reporte
cat > /tmp/reporte.txt << EOF
=== SISTEMA ===
$(uname -a)
$(cat /proc/loadavg)
$(free -h | head -2)
$(df -h / | tail -1)

=== TOP CPU ===
$(ps aux --sort=-%cpu | head -10)

=== TOP RAM ===
$(ps aux --sort=-%mem | head -10)

=== COREDUMPS ===
$(ls /var/lib/systemd/coredump | wc -l) archivos

=== SERVICIOS FALLIDOS ===
$(systemctl --user --failed --no-pager)

=== GUARDIAN LOG ===
$(tail -30 ~/.config/guardian/guardian.log)

=== HIPTRUN LOG ===
$(tail -30 ~/.config/guardian/hiptrun/hiptrun.log 2>/dev/null)
EOF

cat /tmp/reporte.txt
```