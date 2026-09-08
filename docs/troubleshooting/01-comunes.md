# Problemas Comunes

## Next.js crashea repetidamente

**Síntomas**: 
- `hiptrun` muestra múltiples restarts en pocos minutos
- Load average alto
- Coredumps creciendo

**Diagnóstico**:
```bash
tail -50 ~/.config/guardian/hiptrun/hiptrun.log
journalctl --user -u hiptrun-next --since "10 min ago"
```

**Soluciones**:

1. **Limpiar cache**:
   ```bash
   rm -rf ~/Documentos/HIPERTROFIA/web/.next/cache/*
   ```

2. **Verificar memoria disponible**:
   ```bash
   free -h
   ```
   Si tenés <4GB libres, cerrá otras apps.

3. **Modo safe**:
   ```bash
   cd ~/Documentos/HIPERTROFIA/web
   npm run start:safe   # 1GB de heap en vez de 1.5GB
   ```

4. **Ver si es bug del código**:
   ```bash
   cd ~/Documentos/HIPERTROFIA/web
   NODE_OPTIONS='--inspect' npm run dev
   # Chrome: chrome://inspect
   ```

---

## Disco lleno

**Síntomas**: Todo el sistema lento, no podés instalar nada.

**Diagnóstico**:
```bash
df -h /
du -sh ~/* | sort -h | tail -20
```

**Solución rápida**:
```bash
sudo pacman -Scc
sudo journalctl --vacuum-time=3d
rm -rf ~/.cache/*
~/.local/bin/guardian.sh   # limpia coredumps
```

---

## "Permiso denegado" en operaciones

**Causa**: Archivos creados con sudo en home del usuario.

**Solución**:
```bash
sudo chown -R $USER:$USER ~/Documentos/HIPERTROFIA/
```

---

## Brave lento

**Solución nuclear**:
```bash
rm -rf ~/.cache/BraveSoftware
rm -rf ~/.config/BraveSoftware/Brave-Browser
```

---

## Sistema lento sin causa clara

**Diagnóstico completo**:
```bash
healthcheck
```

Si load > 2*nproc:
```bash
ps aux --sort=-%cpu | head -20
```

Si es Node/Next: ver [crash loop](#nextjs-crashea-repetidamente)
Si es `systemd-coredump`: Guardian lo maneja
Si es otro proceso: matá manualmente y abrí issue

---

## Guardian no inicia

```bash
systemctl --user status guardian.service
~/.local/bin/guardian.sh test   # notificaciones funcionan?
```

Si falla:
```bash
systemctl --user daemon-reload
systemctl --user reset-failed guardian.service
systemctl --user start guardian.service
```

---

## WiFi no anda

```bash
nmcli device status
nmcli radio wifi on
nmcli device wifi rescan
nmcli connection up "nombre-de-tu-red"
```

---

## Pantalla negra / Wayland colgado

```bash
# TTY alternativa
Ctrl+Alt+F2

# Login y reiniciar display manager
sudo systemctl restart sddm    # o gdm, lightdm
```

---

## Audio no funciona (PipeWire)

```bash
systemctl --user restart pipewire pipewire-pulse wireplumber
```

---

## Disco cifrado LUKS no monta

En el boot te pide la password, y si la tipeás mal:

1. Reiniciá (Ctrl+Alt+Del)
2. Asegurate de tener el layout de teclado correcto en initramfs
3. Si persiste: boot desde USB live y recuperá con:
   ```bash
   sudo cryptsetup open /dev/nvme0n1p2 crypt
   sudo mount /dev/mapper/crypt /mnt
   ```

---

## Build de Next.js falla

```bash
cd ~/Documentos/HIPERTROFIA/web
rm -rf .next node_modules
npm install
npm run build
```

Si sigue fallando:
```bash
NODE_OPTIONS='--max-old-space-size=2048' npm run build
```

---

## "Out of memory" durante build

Next.js build consume mucha RAM. Si tenés <8GB:

```bash
cd ~/Documentos/HIPERTROFIA/web

# Editar next.config.ts
# Agregar: experimental: { cpus: 1 }

NODE_OPTIONS='--max-old-space-size=3072' npm run build
```