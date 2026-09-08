# Capacitor — Android Build

## ¿Por qué Capacitor?

PWA-first con Capacitor como wrapper nativo. Ventajas sobre React Native puro:
- Un solo codebase (web + Android)
- Acceso a APIs nativas (cámara, notificaciones, haptics)
- PWA sigue funcionando en navegadores

---

## Setup inicial

```bash
cd ~/Documentos/HIPERTROFIA/web

# Instalar Capacitor (ya está)
npm install @capacitor/core @capacitor/cli @capacitor/android

# Inicializar (ya hecho)
npx cap init "Hipertrof.ia" "com.tuorg.hipertrofia" --web-dir=out

# Sincronizar web → android
npm run build      # genera /out
npx cap sync android
```

---

## Estructura

```
web/android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml   ← Permisos
│   │   ├── assets/public/        ← Tu web compilada
│   │   └── java/.../MainActivity.java
│   └── build.gradle
├── capacitor.config.ts           ← Symlink al root
└── variables.gradle
```

---

## Build APK debug

```bash
cd android
./gradlew assembleDebug
# APK queda en: app/build/outputs/apk/debug/app-debug.apk
```

## Build APK release

```bash
cd android
./gradlew assembleRelease
# APK queda en: app/build/outputs/apk/release/app-release.apk
```

Requiere configurar firma en `android/app/build.gradle` (keystore).

---

## Permisos

`AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

---

## Plugins útiles

| Plugin | Para qué |
|--------|----------|
| `@capacitor/push-notifications` | Web push → native push |
| `@capacitor/haptics` | Vibración al completar set |
| `@capacitor/app` | App state (foreground/background) |
| `@capacitor/network` | Detectar offline/online |
| `@capacitor/status-bar` | Color de status bar |

---

## Push Notifications (Web → Android)

```typescript
import { PushNotifications } from '@capacitor/push-notifications'

await PushNotifications.requestPermissions()
await PushNotifications.register()

PushNotifications.addListener('registration', (token) => {
  // Enviar token al backend para asociar al user
  fetch('/api/push/register', {
    method: 'POST',
    body: JSON.stringify({ token: token.value })
  })
})
```

---

## Haptics al marcar serie

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics'

function onSetComplete() {
  Haptics.impact({ style: ImpactStyle.Light })
}
```

---

## Diferencias web vs Android

| Feature | Web PWA | Android nativo |
|---------|---------|----------------|
| Service Worker | ✅ | ❌ (Capacitor usa WebView) |
| Push Notifications | Web Push API | FCM via plugin |
| Haptics | ❌ | ✅ |
| Splash screen | Manual | ✅ |
| App icon | ❌ | ✅ |
| Fullscreen | Limitado | ✅ |
| File system | IndexedDB | Filesystem plugin |

---

## Debug

```bash
# Chrome DevTools sobre USB
chrome://inspect/#devices

# Ver logs nativos
adb logcat | grep -i "hipertrof"
```

---

## Build optimizado

`next.config.ts` ya tiene:
- `output: "standalone"` para builds self-contained
- `productionBrowserSourceMaps: false` para reducir tamaño
- Headers de cache agresivo para `_next/static/`

Para reducir APK:
```gradle
android {
  buildTypes {
    release {
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
    }
  }
}
```