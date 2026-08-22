# Especificación de Chat — hypertrof.ia (estándar Instagram/WhatsApp)

> Estado: documento vivo. Define el alcance, el modelo de datos y los estándares de UX del módulo de mensajería directa (DM) para que compita con redes sociales reales.

---

## 1. Estado actual

Hoy el DM soporta:
- Mensajes de texto + envío de **estrellas** (con saldo `star_balances`).
- **Imágenes** (upload a `dm-images`, columna `image_url`).
- Recibos de lectura (`read_at`).
- Notificaciones push + sonido + badge de no leídos.
- Realtime vía `postgres_changes`.

**Deuda / problemas detectados:**
- Al abrir el teclado el layout se movía (resize JS + `scrollIntoView`) → **corregido** con `100dvh` estático.
- Faltan funciones estándar: ver-una-vez, efímero, reacciones, respuestas, borrado, videos, indicador de escritura.

---

## 2. Modelo de datos (migración pendiente)

Agregar columnas a `public.direct_messages`:

```sql
ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS view_once boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS media_type text,          -- 'image' | 'video'
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,    -- cuándo se vio (ver-una-vez)
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,   -- caducidad (chat efímero)
  ADD COLUMN IF NOT EXISTS reply_to text,            -- id del mensaje citado
  ADD COLUMN IF NOT EXISTS deleted_for_everyone boolean NOT NULL DEFAULT false;
```

Tabla nueva para reacciones:

```sql
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (message_id, user_id)
);
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
```

---

## 3. Funciones a implementar (roadmap)

### 3.1 Ver una vez (`view_once`) — fotos y videos
- Al adjuntar una foto/video, toggle **"Ver una vez"** (icono de ojo / temporizador).
- El destinatario ve la media **blureada** con el texto "Toca para ver".
- Al tocarla: se muestra 1 vez, se registra `opened_at`, y **se bloquea** para siempre ("Abierto" / "Se vio una vez").
- El remitente ve el estado: enviado → visto → "abierto".
- RLS: `opened_at` solo lo escribe el destinatario.

### 3.2 Chat efímero (desaparición)
- Modo efímero por conversación: los mensajes se borran a los **24 h** (`expires_at = created_at + 24h`).
- Un job/cron (o limpieza al abrir la conversación) elimina mensajes vencidos.
- UI: banner arriba "Los mensajes desaparecen en 24 h".

### 3.3 Reacciones
- Mantener presionado un mensaje → barra de emojis (👍❤️😂🔥💪).
- Una reacción por usuario por mensaje (se puede cambiar).
- Se muestran agrupadas bajo el mensaje.

### 3.4 Responder / citar
- Deslizar o mantener → "Responder".
- El mensaje citado aparece arriba del input, se puede cancelar.
- `reply_to` guarda el id.

### 3.5 Borrado
- **"Eliminar para mí"** (soft-delete local, no se sincroniza).
- **"Eliminar para todos"** (`deleted_for_everyone = true`, muestra "Mensaje eliminado").

### 3.6 Media
- **Videos** (mp4 corto, límite 15 MB): `media_type='video'`, `video_url`.
- Preview con `object-contain`, autoplay muted al tocar.
- Galería: carrusel de la conversación (todas las fotos/videos).

### 3.7 Señales de presencia
- **"En línea"** (dot verde) y **"últ. vez"** — basado en heartbeat.
- **"Escribiendo…"** vía realtime (broadcast throttled).

### 3.8 Buscar en conversación
- Lupa en el header → filtro local de mensajes por texto.

---

## 4. Estándares de UX (calidad de red social)

- **Layout estático**: header + lista + input fijos; solo scrollea la lista. `100dvh`, sin resize JS.
- **Sin saltos al abrir el teclado** (ya corregido).
- **Autoscroll** solo si el usuario está al fondo (`isAtBottom`).
- **Skeletons** al cargar, sin flash de layout.
- **Optimistic UI** al enviar (mensaje aparece al instante, luego confirma).
- **Tap targets ≥ 40 px**, feedback táctil (`active:scale`).
- **Long-press** para acciones contextuales (reaccionar, responder, copiar, borrar).
- **Mensajes propios a la derecha** (burbuja accent), ajenos a la izquierda.
- **Marca de tiempo** + recibos (enviado ✓ / leído ✓✓).
- **Paginación** hacia arriba (cargar historial por lotes, no 200 de golpe).

---

## 5. Privacidad / seguridad

- Todo con RLS `user_id = auth.uid()` (mensajes, reacciones).
- `view_once` y `expires_at` se respetan tanto en UI como en RLS/triggers.
- Borrado real de media del bucket al borrar el mensaje.
- No exponer `image_url` de mensajes efímeros ya abiertos a terceros.

---

## 6. Prioridad sugerida

| Prioridad | Ítem |
|---|---|
| P0 (ya) | Layout estático teclado ✅ |
| P1 | Ver una vez (fotos), reacciones, responder |
| P2 | Videos, borrado para todos, galería |
| P3 | Efímero 24h, presencia, escribir…, búsqueda |

---

## 7. Notas de implementación

- La limpieza de efímeros puede ser un **RPC + cron** (pg_cron) o limpieza al cargar la conversación.
- El "escribiendo…" usa un canal realtime dedicado con debounce de 2 s.
- Reutilizar `send_message` RPC y el bucket `dm-images`; sumar bucket `dm-videos`.
