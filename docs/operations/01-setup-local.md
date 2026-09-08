# Setup Local — 5 minutos

## Requisitos

- Node.js 20+
- npm o pnpm
- Android Studio (solo para build APK)

---

## Instalación

```bash
# 1. Clonar o ubicarse en el proyecto
cd ~/Documentos/HIPERTROFIA/web

# 2. Instalar dependencias
npm install
# o si tenés pnpm
pnpm install

# 3. Configurar DB local
npx prisma migrate dev
npx prisma db seed   # (opcional, si hay seed script)

# 4. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus keys de Supabase
```

---

## Variables de entorno

`.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx
VAPID_SUBJECT=mailto:tu@email.com

# Spotify (opcional, integración música)
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
```

---

## Modo desarrollo

```bash
cd ~/Documentos/HIPERTROFIA/web
npm run dev
# → http://localhost:3000
```

---

## Modo producción (local)

```bash
cd ~/Documentos/HIPERTROFIA/web
npm run build
npm start
# → http://localhost:3001
```

O con el wrapper inteligente:

```bash
hiptrun
# Auto-restart con protección anti-crash
```

---

## Prisma Studio (inspector de DB)

```bash
cd ~/Documentos/HIPERTROFIA/web
npx prisma studio
# → http://localhost:5555
```

---

## Build APK Android

```bash
cd ~/Documentos/HIPERTROFIA/web
npm run build
npx cap sync android
cd android
./gradlew assembleDebug

# Instalar en device
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## Verificar instalación

```bash
# Node version
node --version   # >= 20

# Capacitor
npx cap --version

# Prisma
npx prisma --version

# DB existe?
ls -la ~/Documentos/HIPERTROFIA/dev.db
```

---

## Próximos pasos

- Leer [arquitectura](../architecture/01-vision-general.md)
- Leer [sistema Guardian](./03-sistema-guardian.md)
- Empezar a desarrollar (ver [flujo de trabajo con IA](./03-flujo-de-trabajo-con-ia.md))