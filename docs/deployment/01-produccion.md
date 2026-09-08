# Deploy a Producción

## Build

```bash
cd ~/Documentos/HIPERTROFIA/web

# Build optimizado
npm run build

# Genera:
# - .next/standalone/  (self-contained)
# - .next/static/      (assets)
# - out/               (static export si aplica)
```

---

## Variables de entorno producción

`web/.env.production`:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/hypertrofia"
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx
NEXT_PUBLIC_APP_URL=https://app.hipertrof.ia

# Web Push prod
NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx
VAPID_SUBJECT=mailto:ops@hipertrof.ia

NODE_ENV=production
```

---

## Opción A: Vercel (recomendado para MVP)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Configurar en dashboard de Vercel:
- Todas las env vars de arriba
- Build command: `prisma generate && next build`
- Output directory: `.next`

---

## Opción B: Self-hosted (VPS)

```bash
# En el servidor
git clone https://github.com/tuuser/hypertrofia
cd hypertrofia/web
npm ci --production
npx prisma migrate deploy
npm run build

# Con PM2
npm i -g pm2
pm2 start npm --name "hypertrofia" -- start
pm2 save
pm2 startup
```

### Nginx config

```nginx
server {
  listen 80;
  server_name app.hipertrof.ia;
  
  location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### SSL con Let's Encrypt

```bash
sudo certbot --nginx -d app.hipertrof.ia
```

---

## Opción C: Docker

`Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
EXPOSE 3001
CMD ["node", "server.js"]
```

```bash
docker build -t hipertrofia .
docker run -p 3001:3001 \
  -e DATABASE_URL="..." \
  hipertrofia
```

---

## Migración de DB

```bash
# SQLite (dev) → PostgreSQL (prod)

# 1. En el server
createdb hypertrofia

# 2. Cambiar DATABASE_URL en .env
DATABASE_URL="postgresql://..."

# 3. Aplicar migrations
npx prisma migrate deploy

# 4. (Opcional) migrar datos
# Script custom con Prisma client
```

---

## Monitoreo post-deploy

- **Logs**: `pm2 logs hipertrofia` o Vercel dashboard
- **Uptime**: UptimeRobot, BetterStack
- **Errores**: Sentry (recomendado)
- **Performance**: Vercel Analytics, Plausible

### Integrar Sentry

```bash
npm install @sentry/nextjs

# npx @sentry/wizard@latest init
```

---

## Play Store (Android)

```bash
cd android

# 1. Generar keystore (una sola vez)
keytool -genkey -v -keystore hypertrof.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias hipertrof

# 2. Configurar firma en android/app/build.gradle
signingConfigs {
  release {
    storeFile file('../hypertrof.keystore')
    storePassword 'xxx'
    keyAlias 'hipertrof'
    keyPassword 'xxx'
  }
}

# 3. Build AAB (no APK para Play Store)
./gradlew bundleRelease

# 4. Subir a Play Console
# app/build/outputs/bundle/release/app-release.aab
```

---

## Checklist pre-producción

- [ ] Todas las env vars configuradas
- [ ] DB migrada y con seed data
- [ ] SSL configurado
- [ ] Sentry integrado
- [ ] Backups automáticos de DB
- [ ] Rate limiting en API routes
- [ ] CORS configurado correctamente
- [ ] CSP headers estrictos
- [ ] Logs centralizados
- [ ] Monitoreo de uptime activo