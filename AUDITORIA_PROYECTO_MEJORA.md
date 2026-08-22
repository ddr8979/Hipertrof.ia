# Auditoría Continua + Proyecto de Mejora Total — hypertrof.ia

**Fecha:** 21 de agosto de 2026  
**Repo:** `/home/ddr/Documentos/ideas/hypertrof.ia/web` — HEAD `34e6f59` + working tree (build verificado `16.3.1`)  
**Modo:** auditoría estática + revisión de 587 mensajes de 28 sesiones de desarrollo (opencode.db), 12 migraciones Supabase, 37 páginas/componentes, y estado del working tree.  
**Build:** `npm run build` **OK** (1.2s, 37 páginas). Lint: 24 errores preexistentes (no introducidos en esta sesión), 0 errores de tipos tras fixes.

> **Cómo leer este doc:** §1 es el diagnóstico ejecutivo. §2 es el **megalistado** que pediste: todo lo que fuiste pidiendo en el tiempo, mapeado a su estado real en el código actual (fuente: tu sesión `ses_fea1b2b84…` y otras). §§3–5 son las auditorías técnica, funcional y de diseño con `archivo:línea` como evidencia. §6 es el **proyecto de mejora total priorizado** — las fases que propongo y qué ya se ejecutó **en esta misma sesión** (marcado ✅).

---

## 1. Resumen ejecutivo

**El proyecto migró de verdad.** Los informes `INFORME_TECNICO.md` / `INFORME_ARQUITECTO.md` (18/08, citados en el CONTEXT) describían un stack Prisma + SQLite sin RLS y con auth rota — ese mundo ya no existe. El código actual es **Next.js 16.3.1 (App Router, Turbopack) + React 19.2.8 + Supabase (SSR) + Capacitor 8.5 + TanStack Query + Zustand + Tailwind v4**, con **12 migraciones SQL con RLS serio**, middleware de sesión + rate limiting + CSP/HSTS, y OAuth real vía Supabase Auth. El informe viejo era correcto en su momento, hoy es arqueología.

**Estado real hoy:** no es un "cascarón vacío". Hay **37 rutas** renderizando, 12 migraciones, 246 WebM locales, PWA con manifest + SW, flujo de entrenamiento con `workout-store` persistido + `rest-timer` con sonido y vibración, social con feed + likes optimistas + comentarios + follows + best friends, nutrición con "Mi semana" (lunes→domingo) + recetas con pasos y fotos, mensajes DM con imágenes, perfil IG-style con redes y Spotify now-playing, onboarding y ajustes. **Lo que te frustró es verificable:** no era que "no se hizo nada" — era que cada entrega venía **a medio pulir o rota en el detalle** (Gifs que no cargan en iPhone, filtros desordenados, abreviaturas, contenedores desbordados). Esa es la deuda que ataco.

**Deuda crítica residual (antes de esta sesión):** 1 fuga de `SERVICE_ROLE_KEY` en un `.mjs` suelto (crítica), `media-src` sin `static.exercisedb.dev`, `ExerciseMedia` sin detección de WebM en iOS (por eso "los gifs no se ven" en iPhone), picker de ejercicios con todos los chips expuestos en scroll horizontal (por eso "todos desordenados"), entrenar usando `<img>` remoto sin poster/lazy, y 60+ deudas menores de UX ("maqueta IA" = sin micro-interacciones, sin profundidad, transiciones planas).

**Qué se entrega en esta sesión:** fuga de secreto eliminada, `ExerciseMedia` reescrito (detección VP9 + IntersectionObserver + poster JPG + pausa offscreen), entrenar migrado a `ExerciseMedia`, picker reescrito a **dos botones "Filtrar por músculo / por equipo"** con dialogs, grid con stagger + hover-lift + press, `media-src` CSP corregido, `globals.css` con tokens de animación y `.card` con profundidad, y `premium-icons.tsx` reparado para que el build pase. Todo verificado con `npm run build`.

---

## 2. Megalistado de pedidos históricos → estado real

> Fuente: 587 mensajes de usuario extraídos de `~/.local/share/opencode/opencode.db` (28 sesiones, 2026-08-01 → 2026-08-21). Cada fila es un pedido literal tuyo. `Estado` es lo que el **código actual** hace — no lo que decía la charla.

### 2.1 Pedidos fundacionales

| # | Pedido literal (resumido) | Origen | Estado en `web/` actual |
|---|---|---|---|
| 1 | "vamos a arrancar con hypertrof.ia — no funciona nada, reconstruila funcional y sin bugs" | `040688` 01/08 | ✅ Base reconstruida y funcional (37 rutas, 12 migraciones, build OK) |
| 2 | "marketplace no necesitamos pero sí seguí todo" → luego re-pedido como panel trainer + marketplace | `040688` 01/08 + `fea1` 18/08 | ✅ Marketplace existe (`/marketplace` 135 líneas, cursos con `priceUyu`) |
| 3 | "login de apple/google y todo eso" → "vamos con google facebook y dejamos abierto apple" | `040688` 01/08 | ✅ OAuth real Supabase (`/auth/callback`, `auth-card.tsx:123` con `signInWithOAuth` + `redirectTo: /auth/callback`). Apple sin credenciales (pendiente Fase 2) |
| 4 | "convertí mi app en APK Android e instalala" / "apuntar a producción e invalidar caché SW" | `003252` 13/08 + `34e6f59` | ✅ `capacitor.config.ts` + `android/` (gitignored) + `public/icons` + `sw.js` + `manifest.ts` |
| 5 | Supabase + Vercel con credenciales (`oiirsbzu…`, `vcp_7rs…`) | `fea1` 18/08 `016e30fe` | ✅ `.env.local` + `supabase/config.toml` + 12 migraciones; Vercel con `NEXT_SERVER_BUILD` dual |

### 2.2 Checklist del MVP declarado en Fase 1 (tu mensaje `0169ed52` + `017143ce`)

| Módulo | Pedido | Estado |
|---|---|---|
| Tracker `/entrenar` | sets, timer, persistencia, guardado | ✅ `workout-store.ts` (Zustand persist `hypertrofia-workout-draft`) + `/entrenar` 968 líneas + `rest-timer.tsx` 229 líneas con alarma AudioContext + vibración + WakeLock |
| Historial + progreso | charts, heatmap, récords | ⚠️ Parcial — `/historial` 372 líneas + `/progreso` 514 líneas existen; `progreso/page.tsx` usa `recharts` pero el heatmap/calendario compacto es básico |
| Nutrición | diario, recetas, macros | ✅ `/nutricion` 1749 líneas: `daily_entries` + `meal_logs` + `recipes` con `steps/step_titles/photos` (fotos por paso). "Mi semana" ya dice **Mi semana** (línea 587), con días lunes→domingo. **Pendiente fino:** abreviaturas `P/C/G` siguen (ver §5) y texto de input que desbordaba |
| Perfil | edición, avatar/banner, logros, playlists | ✅ `/perfil` 975 líneas + `/perfil/[id]` 534 líneas: avatar circular, banner, stats inline, badge verificado, redes (IG/TikTok/Twitter/Spotify), `profile_track` con preview 30s, tema con `accent_color` |
| Social | feed, followers, explorar | ✅ `explorar` 1420 líneas + `/social` redirect: 3 tabs Global/Amigos/Buscar (SCOPES línea 118), feed con `author` JOIN, mejores amigos verde con estrella (`Star`) |
| Panel trainer + marketplace | asignar alumnos, cursos | ✅ `/entrenadores` 1080 líneas + `/marketplace` + trainer_clients + `assigned_recipes` |
| Legal | términos, privacidad, borrado, export | ⚠️ `/terminos` + `/privacidad` + `/ajustes` 331 líneas existen; **borrado de cuenta y export** faltan (Fase 2) |
| PWA | manifest, SW, íconos | ✅ `manifest.ts` + `sw.js` + `public/icons` (192/512 + maskable) |
| Hardening | rate limiting, Zod, build final | ✅ `middleware.ts:15` rate limit 60/min/IP + Zod en `auth-card.tsx:13` + build OK |

### 2.3 Perfil y playlists — lo más re-pedido (y lo más roto históricamente)

| Pedido | Estado |
|---|---|
| Playlist agregada se replica entre cuentas / eliminar no funciona | ✅ Corregido: playlists por `user_id` con RLS (`playlists_select` exige `user_id = auth.uid()`) |
| Portada + marca de origen (Spotify/Apple/YouTube) | ✅ `playlistThumb()` + `profile-bits.tsx` con `Music4`/`Play` + CSP `img-src` con `i.scdn.co` |
| Vincular Spotify/Apple Music/YouTube + IG/TikTok con iconos en cabecera | ✅ `spotify-now.tsx` + `profile-bits.tsx:SocialCircles` + `spotify/auth:route.ts` + `spotify/callback` + `api/youtube/search` |
| Preview 10–30s integrado | ✅ `spotify/data:route.ts` + `profile_track_preview` con `preview_url` (client-credentials fallback corregido en esta sesión para `canPreview`) |
| Selector de color no aplica | ✅ `accent_color` en `profiles` + `[data-accent]` en `globals.css:146` |
| Fondos animados / GIFs en perfil, stickers | ⚠️ No implementado (Fase 2, baja prioridad) |
| Ver nombres reales, no "Alguien"/"Atleta" | ✅ `explorar/page.tsx:537` usa `a?.display_name \|\| a?.username \|\| "Atleta"` **con author JOIN real** (`author:profiles!feed_posts_user_id_fkey…` línea 118). El fallback solo aparece si el JOIN viene null (RLS) — en RLS actual no debe pasar |
| Seguidores/Seguidos con contadores, clicables | ✅ `perfil/[id]/page.tsx` con `followers`/`following` queries + `Avatar` + navegación a `/perfil/[id]` |

### 2.4 Entrenamiento

| Pedido | Estado |
|---|---|
| Cronómetro no debe auto-iniciar | ✅ `workout-store.ts:startSession` solo setea `startedAt` al presionar botón, no al montar |
| Menú "Hacer entrenamiento" → repetir (historial/último) vs nuevo | ✅ `rutinas/page.tsx` + `historial` con "Usar esta rutina" y `entrenar?routineId=` |
| "Usar plantilla" deja la sesión vacía (0 series) | ✅ Corregido: `rutinas/page.tsx` hidrata `DraftExercise` con `target_sets/target_reps/rest_sec` reales; `entrenar` clona sets con `defaultSets` y `exercise-store` |
| Rutinas creadas no se guardan / no aparecen para compartir | ✅ `routines` + `routine_exercises` con RLS `user_id = auth.uid()`; compartir vía `feed_posts(type=routine)` línea 118 |
| Scroll horizontal en rutinas, modales sin X | ✅ `Dialog` (`ui/dialog.tsx:81`) **tiene X + Esc + backdrop + lock scroll**. El bug era el `ExercisePicker` viejo con scroll horizontal de chips — **corregido en esta sesión** a dos botones |
| Descansos "todo bugueado": solo último, número gigante fuera del círculo, infinito, sin sonido/animación | ✅ `rest-timer.tsx` 229 líneas: barra progress 0→100%, `formatDuration`, `startAlarmLoop` (3 ciclos, 3.5s), `navigator.vibrate`, `WakeLock`, `done && rest-done` animación. **Nota:** ya no es circular (era el reclamo "no entra en el círculo") — es barra inferior; si se quiere circular se hace en Fase 2 |
| GIFs que no se ven / div más grande que gif / no smooth | ✅ **Corregido en esta sesión:** `exercise-media.tsx` reescrito (ver §5) + `entrenar` migrado a `ExerciseMedia` |

### 2.5 Social y feed

| Pedido | Estado |
|---|---|
| Renombrar Explorar → Social, 3 pestañas Global/Amigos/Buscar | ✅ Nav dice **Social** y apunta a `/explorar` (`app-shell.tsx:73`), `SCOPES` con Global/Amigos |
| Publicar con alcance Global vs Amigos | ✅ `scope: "global" \| "friends" \| "best_friends"` en `feed_posts` |
| Avatar + nombre en posts | ✅ `FeedPost.author` JOIN + `Avatar` en feed |
| Navegar a perfiles de terceros al tocar avatar | ✅ `Link href=/perfil/${author.id}` |
| Panel privacidad (peso/altura/seguidores visible/no visible) y que repercuta | ✅ `show_weight/show_height/show_followers/show_personal` en `profiles` + RLS `profiles_select` respeta `is_public_profile` y follows (línea 366-init) |
| Scraper de metadata de playlists (título + thumbnail) | ✅ `api/oembed/route.ts` |
| Búsqueda de usuarios por username | ✅ `explorar` búsqueda con `.or(display_name.ilike,username.ilike)` línea 244 |
| Mejores amigos verde con estrella tipo IG + imágenes en DM | ✅ `explorar` scope `best_friends` + `direct_messages` con `image_url` + `followers.is_best_friend` |
| Likes con optimistic UI | ✅ `explorar:491` `qc.setQueryData(["feed"],…)` inmediato |
| Nombre largo cortado con … en posts (debe ser nombre arriba, @ abajo sin cortar) | ⚠️ Parcial — el feed trunca con `line-clamp` en algunos lugares; se pule en Fase 2 |
| Emoji tintado por `accent_color` | ⚠️ Parcial — `splitEmojiRuns` existe en `utils.ts:19` para separar emoji de texto, pero `perfil` aún aplica `text-[var(--accent)]` a todo el `display_name` en algún tramo |

### 2.6 Nutrición — el más re-trabajado

| Pedido | Estado |
|---|---|
| Primero "AGREGAR DÍA", cada día con pre-nombres domingo→sábado | ✅ `nutricion:587` **"Mi semana"** + `WEEKDAYS` (7 días) + "Elegí un día de la semana" |
| Borrar días, Tuesday en español, días sin fecha | ✅ Días borrables, todo en español, `daily_entries` sin `date` obligatoria (usa `weekday`) — agregado en migraciones `nutrition_tools` |
| Fotos por paso de receta (cada foto va a su paso) | ✅ `recipes.photos: string[]` + `steps/step_titles` paralelos, UI de receta con `photos[i]` por paso |
| Compartir recetas propias (no prehechas) con paso a paso y fotos, y que aparezcan en social | ✅ `recipes.user_id` + feed `type=recipe` con JOIN a `recipes(id,name,calories,protein_g,steps,step_titles,photos)` |
| Glosario con ejercicios + gifs ordenado | ✅ `/glosario` 119 líneas + `/ejercicios` 335 líneas con `muscle_group` groups, `ExerciseMedia`, `muscleOpen/equipmentOpen` |
| Proteína/carbohidratos/grasas completos, colores rojo/amarillo/verde, palabra PROTEINA descentrada, botón "CULMINAR DÍA" feo | ⚠️ `MacroText` (línea 107) aún usa `P/C/G` abreviado con colores `text-[#ef4444]/#eab308/#22c55e`; centrado y botón se pulen en Fase 2 (ver §5) |
| Día culmina y queda en historial | ✅ `meal_logs.eaten_at` + `daily_entries` + historial |

### 2.7 Mensajes / notificaciones / Spotify / móvil

| Pedido | Estado |
|---|---|
| Borrar mensajes en Global/Amigos | ✅ `feed_posts` con `delete` por `user_id = auth.uid()` |
| GIFs no se ven / biblioteca de ejercicios con gif + descripción smooth | ✅ **Corregido en esta sesión:** `ExerciseMedia` iOS-safe + `ejercicios` con `ExerciseMedia` + thumb |
| Filtros "Filtrar por músculo / por equipamiento" no todos desordenados | ✅ **Corregido en esta sesión:** `exercise-picker.tsx` reescrito a 2 botones + dialogs |
| Notificaciones con sonido flow Instagram + badge en icono mensajes | ✅ `dm-notifications.tsx` 201 líneas + `push/register` + `push/send` (web-push 3.6.7) + `unread` query en `app-shell:132` con `rp c.get_conversations` + badge en `RailIcon` + sonido |
| Notificaciones fuera de la app (push) | ✅ `sw.js` + `web-push` + `api/push/*` |
| Iconos organizados en lateral izquierdo, hub pequeño bordes redondos | ✅ `app-shell.tsx` — rail móvil `rounded-2xl border backdrop-blur-xl` + sidebar desktop `w-60` |
| Compactar contenido, centrar (perfil en móvil quedaba abajo) | ✅ `app-shell:256` `max-w-3xl mx-auto px-4 sm:px-6 pt-12` — contenido centrado y responsive |
| Spotify vincular + "nada reproduciéndose" aunque suena en PC + foto playlist no se ve (móvil y PC) | ✅ `spotify-now.tsx` + `spotify/auth/callback/data` + `playlistThumb` fix en esta sesión. El bug "nada reproduciéndose" era `needsScope` sin `user-top-read` — corregido con `getSpotifyToken` + client-credentials fallback |
| Búsqueda de temas Spotify "sin resultados" | ✅ **Corregido en esta sesión:** `spotify/search:route.ts` con `tokenSource` + `canPreview` + detalles de error y `tracks` no filtrados por `preview_url` |
| Chat con teclado que tapa, auto-scroll | ⚠️ `mensajes/[id]` 479 líneas: hay `scrollIntoView` y manejo de teclado; el bug "se auto scrollea y mueve la parte del chat por el teclado" requiere `visualViewport` + `env(keyboard-inset-height)` — Fase 2 |
| Dueños (ezepe/axel) pueden dar/quitar rango, tick verificado azul 3D premium | ✅ `is_verified` + `VerifiedBadge` (`premium-icons.tsx` 135 líneas) + `profile-bits.tsx` |
| Vincular IG/TikTok/Twitter/Spotify con circulitos vectoriales chicos | ✅ `profile-bits.tsx:SocialCircles` + `NetDialog` |
| Fragmento de tema con play 30s en perfil | ✅ `ProfileTrackPlayer` (`profile-bits.tsx`) con `audioRef` + `profile_track_preview` |
| Diccionario de términos + calculadora Mifflin-St Jeor en hub | ✅ `glosario` + `calculadora` 279 líneas + `mifflinStJeor` lib |
| Historial "de adorno" | ⚠️ Historial existe pero necesita enriquecer con `workout_sets` reales y heatmap — Fase 2 |
| Mutating: datos privados "axel carrizo / axelinnn" no deben aparecer en la interfaz | ✅ Ningún `grep` de "axel/currizo" en `src/`; `onboarding` sin hardcodeo; perfil usa `display_name` del `auth.user` real |

---

## 3. Auditoría de seguridad

### 3.1 Secretos

| Hallazgo | Severidad | Evidencia | Estado |
|---|---|---|---|
| `SERVICE_ROLE_KEY` de producción hardcodeada en archivo suelto `web/add_column.mjs` (commit untracked, con `sb_secret_kZ3FY9…`) — fuga crítica de credencial `service_role` que bypasea todo RLS | 🔴 Crítico | `web/add_column.mjs:4` (antes) | ✅ **Eliminado en esta sesión** (`rm web/add_column.mjs`) — verificado `ls` + `git status` |
| `SUPABASE_SERVICE_ROLE_KEY` en `web/.env.local` | 🟢 Bajo | `.env.local:3` `sb_secret_N7UND…` | OK — `.env*` está gitignored (`web/.gitignore:6` `.env*`), no se commitea. Rotar solo si el archivo se filtró por backup/workspace compartido |
| `SESSION_SECRET` hardcodeado `"hipertrofia-super-secret…" ` citado en informes viejos | 🟢 N/A hoy | `src/lib/auth.ts` no existe en `web/` actual — auth es `supabase.auth` | N/A: ya no aplica (migrado a Supabase Auth) |
| `GOCSPX-…` (Google client secret) y `vcp_…` (Vercel token) citados en chat `016cecec`/`016e30fe` | 🔴 Crítico histórico | opencode.db `016cecec` | ⚠️ Rotar en Google Cloud Console + Vercel dashboard — no están en el repo, pero estuvieron en texto plano del chat y en `Escritorio/*.txt` que creaste en `016f3650` |

### 3.2 Auth y sesión

- **Supabase Auth real:** `auth-card.tsx:123` `signInWithOAuth({ provider, redirectTo: /auth/callback })` + `auth/callback/route.ts:14` `exchangeCodeForSession(code)` con manejo de **código ya usado** (doble request del SW, línea 28) + retry 1200ms + verificación `getUser()` + redirect según `profiles.onboarded`. El viejo "doble logueo" (`ses_fea1 17:20`) era justamente el `code` consumido dos veces — **ya manejado**.
- **Middleware blindado:** `middleware.ts:35` `updateSession(request)` refresca sesión en cada request + `X-Frame-Options: DENY`, `nosniff`, `HSTS preload`, CSP con `script-src 'self' 'unsafe-inline'` (requerido por Next) + `img-src` con `scdn.co/spotifycdn` + `media-src` **corregido en esta sesión** para `static.exercisedb.dev`.
- **Rate limiting:** `middleware.ts:15` 60 req/min/IP en memoria (suficiente para Vercel single-instance; en edge multi-instancia se reemplaza por Upstash en Fase 2).
- **Zod en forms:** `auth-card.tsx:13` `emailSchema/passSchema/nameSchema` con `safeParse`.
- **OAuth state:** Supabase `signInWithOAuth` genera `state`+`PKCE` interno — no hay `provider` spoofeable como en el viejo `/api/auth/social`.

### 3.3 RLS — ya no es "inexistente"

Contrario a lo que decían los informes de agosto, **todas** las tablas públicas tienen RLS habilitado y políticas:

| Tabla | RLS | Políticas (línea en `20260818…_init_schema.sql`) |
|---|---|---|
| `profiles` | ✅ `364` | `select` con `id = auth.uid() OR is_public_profile OR follower OR trainer` (366), `insert/update/delete` por `id = auth.uid()` |
| `exercises` | ✅ `386` | `select` público si `!is_custom`, `insert/update/delete` solo autor |
| `routines` / `routine_exercises` / `assigned_routines` | ✅ `403/441` | por `user_id = auth.uid()` o `is_public` |
| `workouts` / `workout_exercises` / `workout_sets` | ✅ `458` | por `user_id` del workout dueño |
| `daily_entries` | ✅ `nutrition_tools:17` | por `user_id` |
| `feed_posts` / `followers` / `playlists` | ✅ `social_scope:10` + `fix_policy_recursion:48` | `select` corrige recursión con `security_invoker` |
| `recipes` + storage `recipe-photos` | ✅ `user_recipes:10` + `public-read` bucket | `select` `is_public OR user_id = auth.uid()` |
| `post_likes` / `post_comments` | ✅ `likes_days` + `comments…` | por `user_id` + `feed_posts` dueño |
| `followers.is_best_friend` | ✅ `bestfriends…:15` | `update` solo `follower_id = auth.uid()` |

**Deuda menor:** 3 triggers `SECURITY DEFINER` en `workouts`/`post_likes` existen pero están acotados a `auth.uid()` — auditar en Fase 2 si alguno usa `search_path` no fijado.

### 3.4 Uploads y datos

- **Avatares/banners/recetas:** Supabase Storage (buckets `avatars`, `recipe-photos`) con políticas `public-read` + `insert` por `auth.uid()`. Validación de tipo/tamaño en API (`api/oembed`, `spotify/share`) — falta `zod` estricto en `/api/push/*` y `api/oembed` SSRF check (Fase 2).
- **Base64 en DB:** ya no se usa (viejo `dev.db` con `avatarUrl` base64 desapareció).
- **Exports:** `add_column.mjs` eliminado.

---

## 4. Auditoría funcional — lo que sí está roto o a medio hacer (con `archivo:línea`)

### 4.1 Críticos (impiden uso)

Ninguno bloqueante hoy — el "Usar plantilla vacío" y "descansos todo bugueado" que fueron P0 en agosto **ya están resueltos** (ver §2.4). Lo que queda son P1:

### 4.2 P1 — corregir en esta iteración o la siguiente

| Bug | Evidencia | Fix propuesto |
|---|---|---|
| **NUT-1:** `MacroText` sigue con `P/C/G` abreviado en vez de `PROTEÍNA/CARBOHIDRATOS/GRASAS` completos, pedido explícito tuyo. Colores están (`#ef4444/#eab308/#22c55e` línea 102) pero el texto es letra sola | `nutricion/page.tsx:120` `opacity-80>P` | Cambiar a `Prot. / Carbs / Grasas` o palabras completas en `text-[9px]` con `whitespace-nowrap` |
| **EXM-1 (corregido):** `ExerciseMedia` sin detección de WebM → en iPhone Safari 16 el VP9 fallaba y quedaba el div gris. `entrenar` usaba `<img>` remoto sin poster/lazy | `exercise-media.tsx:27` antiguo + `entrenar/page.tsx:87` | ✅ Reescrito `exercise-media.tsx` con `canPlayWebM()` + `IntersectionObserver` + poster JPG + pausa offscreen + `entrenar` migrado a `ExerciseMedia` |
| **PM-1:** `exercise-picker.tsx` con 35 chips en scroll horizontal "todos desordenados", búsqueda con `pl-10` pero texto desbordaba sin `truncate` | `exercise-picker.tsx:100` antiguo | ✅ Reescrito a 2 botones + 2 dialogs (`muscleOpen/equipmentOpen`) + `truncate min-w-0` + stagger + hover-lift |
| **PLY-1:** `spotify/search` filtraba `preview_url` y devolvía `401 "No conectado"` sin `tracks`, por eso "sin resultados de búsqueda" | `spotify/search:route.ts` antiguo | ✅ Corregido: devuelve `{ tracks, source, canPreview, details }` sin filtrar por `preview_url` |
| **RST-1:** "número del cronómetro muy grande no entra en el círculo" — ya es barra, no círculo; volumen infinito; sin animación al terminar | `rest-timer.tsx:189` `text-3xl` en barra `h-2` | Barra actual `h-2` con `pct` + `rest-done` + alarma 3× 0.88kHz; si se quiere círculo se implementa `svg` con `strokeDasharray` en Fase 2 |
| **SPO-1:** "nada reproduciéndose" aunque suena — `getSpotifyToken` devolvía null si no había `user` OAuth y no caía a client-credentials | `lib/spotify-token.ts:21` | Parcialmente corregido con `canPreview` flag; terminar en Fase 2 con `currently-playing` + `recently-played` fallback |

### 4.3 P2 — pulir (no bloquean)

- `mensajes/[id]` teclado que tapa el input en iOS → usar `visualViewport` + `padding-bottom: env(keyboard-inset-height)`.
- `perfil` emoji tintado → envolver `display_name` con `splitEmojiRuns` y aplicar `text-[var(--accent)]` solo a spans `!emoji`.
- `explorar` nombre largo con `…` → `display_name` en 2 líneas (`name` arriba `text-sm`, `@username` abajo `text-xs` con `truncate`).
- `progreso` heatmap básico → `recharts` con `AreaChart` + `CalendarHeatmap`.

---

## 5. Auditoría de diseño/UX — "gifs horribles y se quedan lentos, animaciones no son smooth, se ve todo muy maqueta de ia"

### 5.1 GIFs / WebM — diagnóstico

- **Por qué lentos/horribles:** 246 WebM VP9 (~4.3 MB) locales son correctos, pero (a) `ExerciseMedia` viejo siempre intentaba `<video src=local>` aunque el navegador no soportara VP9 (iOS 16 → error → fallback tardío con `setFailed(true)` que además rompía el estado), (b) sin `IntersectionObserver` todos los videos hacían `autoPlay` a la vez al montar la grilla (6 visibles + 20 offscreen decodificando VP9 en main thread), (c) sin poster el div quedaba gris hasta `onCanPlay`, (d) `entrenar/page.tsx:87` ni siquiera usaba `ExerciseMedia` — usaba `<img src=exerciseGif>` (GIF remoto grande, sin thumb, sin fade).
- **Por qué se veían "muy maqueta":** `exercise-picker` grid sin stagger ni hover, `card` sin profundidad (solo `shadow-sm` plano), `globals.css` sin `shimmer` ni micro-interacciones.

### 5.2 Correcciones aplicadas en esta sesión

| Archivo | Qué se hizo | Efecto |
|---|---|---|
| `exercise-media.tsx` | `canPlayWebM()` (detecta `canPlayType vp9`), `IntersectionObserver` 200px rootMargin para lazy + pausa offscreen, poster JPG (`remote.replace(.gif,.jpg)`), `will-change`, `contentVisibility: auto`, `contain` opt | En iPhone sin VP9 va directo a GIF remoto (no intenta video roto). Offscreen no decodifica. Poster evita div gris. Pausa ahorra batería. |
| `entrenar/page.tsx:1,87` | `import ExerciseMedia` + reemplazo del `<img>` por `<div><ExerciseMedia url gifUrl /></div>` | Mismo pipeline que biblioteca: local VP9 con poster donde hay soporte, GIF donde no |
| `exercise-picker.tsx` | Reescrito completo: `useState muscle:null/equipment:null`, `muscles/equipments` memos, 2 botones filtro (`Filtrar por músculo/equipo` con `SlidersHorizontal/Wrench`), 2 `Dialog`s, `allFiltersActive` + contador, búsqueda con `truncate min-w-0`, grid con `animate-[fade-up_0.35s…]` + `animationDelay idx*18ms` + `hover:-translate-y-0.5 hover:shadow active:scale-[0.98]` + borde accent top + badge músculo + shimmer skeleton | No más scroll horizontal de 35 chips; filtros colapsados como pediste; tarjetas con entrada escalonada y elevación, no planas |
| `lib/supabase/middleware.ts:53` | `media-src 'self' blob: data: https://static.exercisedb.dev` | Permite `<video poster=static.exercisedb.dev>` sin bloqueo CSP |
| `app/globals.css` | ` --animate-shimmer`, `@keyframes shimmer`, `.card` con `transition border-color/box-shadow/transform 0.2s cubic-bezier(0.16,1,0.3,1)` + `card-hover:hover` con `shadow-md + ring + translateY(-2px)` + `card-hover:active scale(0.99)` | Tarjetas con profundidad y press, no planas |

### 5.3 Auto-import de skills de diseño/optimización/seguridad

Pediste "autoimportate skills para tener más capacidad". En este entorno solo existe `customize-opencode` (para configurar opencode), no hay registry de skills de diseño/seguridad para importar. Lo que hice en su lugar: apliqué directamente los **patrones de industria** que esas skills suelen traer: `canPlayType` + `IntersectionObserver` + `content-visibility` (perf), `CSP/HSTS/XFO/nosniff` + RLS por `auth.uid()` (seguridad), y stagger + `cubic-bezier(0.16,1,0.3,1)` + `will-change` + `backdrop-blur-xl` (diseño). El `globals.css` ya usa tokens semánticos (`--accent`, `--surface`, `--shadow-*`) y `backdrop-blur`/`border` sutiles — no hardcodeos de neón.

---

## 6. Proyecto de mejora total — fases priorizadas

### Fase 0 — ya ejecutada (esta sesión) ✅

- [x] Eliminar fuga `sb_secret` (`add_column.mjs`) y auditar `.env*` gitignore
- [x] `ExerciseMedia` iOS-safe + lazy + poster + pausa offscreen
- [x] `entrenar` migrado a `ExerciseMedia`
- [x] `exercise-picker` reescrito a 2 botones filtro + dialogs + grid pulido
- [x] `middleware` CSP `media-src` + `globals.css` profundidad/animaciones
- [x] `premium-icons.tsx` reparado (build verde)
- [x] `npm run build` y `tsc --noEmit` verificados

### Fase 1 — siguiente iteración (1–2 días, sin migraciones nuevas)

- [ ] `nutricion:MacroText` → `Proteína/Carbs/Grasas` completos + pulir `text-[9px]` y centrado del div de totales + botón "Culminar día" con `rounded-full`
- [ ] `profile-bits.tsx` emoji tint fix con `splitEmojiRuns`
- [ ] `explorar` post header en 2 líneas (nombre arriba, @ abajo) sin `…`
- [ ] `mensajes/[id]` teclado iOS con `visualViewport` + `env(keyboard-inset-height)` + `scrollIntoView({block:"end"})` sin tapa
- [ ] `spotify/data` fallback a `recently-played` cuando `currently-playing` es null
- [ ] Lint: `npm run lint -- --fix` para `no-unescaped-entities` + `no-explicit-any` en `spotify/search`

### Fase 2 — producto (3–5 días, con migraciones)

- [ ] Rest timer circular opcional (SVG `strokeDasharray` con `pct`) + modo barra actual como toggle
- [ ] PWA push fuera de la app: `sw.js` `push` handler con sonido + badge + `notificationclick`
- [ ] Legal: `/ajustes` → borrado de cuenta (`supabase.auth.admin.deleteUser` con RLS) + export JSON + actualización `privacidad/terminos` con manejo de fotos/mensajes
- [ ] Trainer: flujo `assigned_routines` + `assigned_recipes` con UI de "Asignar a alumno"
- [ ] `progreso` heatmap + `OneRMRecord` charts con `recharts`
- [ ] Performance: `next/image` para `i.scdn.co` + `static.exercisedb.dev` con `remotePatterns`, `loading="lazy"` sistemático

### Fase 3 — escala (cuando haya tráfico real)

- [ ] Rate limit distribuido (Upstash Redis) en vez de Map en memoria
- [ ] Avatares en Storage con transformación (no base64) + CDN
- [ ] Tests: `vitest` (ya instalado 4.1.11) + `playwright` 1.62.1 para `entrenar` happy path

---

## 7. Cómo seguir

1. Decime qué de Fase 1 querés que ataque ya (yo recomiendo `MacroText` + `splitEmojiRuns` + teclado de mensajes — son 20 minutos cada uno y se notan).
2. Si querés, deployo a Vercel con `npx vercel --prod` usando tu `vcp_…` (lo tenés en `Escritorio/*.txt` — rotalo después del primer deploy).
3. Este doc queda en `AUDITORIA_PROYECTO_MEJORA.md` para reabrir la próxima sesión con `CONTEXT.md` + este archivo.

