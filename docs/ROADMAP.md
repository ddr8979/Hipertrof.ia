# Roadmap para terminar Hipertrof.ia

**Última actualización:** 2026-09-16
**Doc de referencia de bugs:** [`docs/architecture/06-diagnostico-rutinas-y-trainer.md`](./architecture/06-diagnostico-rutinas-y-trainer.md)
**Estado y seguridad:** [`docs/ESTADO-Y-PLAN.md`](./ESTADO-Y-PLAN.md)

---

## 0. Cómo leer esto

- Pensado para **una persona + IA**, ~15–20 h/semana. Si tu ritmo es otro,
  escalá las estimaciones (son en "semanas", no en fechas duras).
- Cada fase tiene **objetivo**, **alcance**, **Definition of Done (DoD)**,
  **dependencias** y **estimación**.
- Regla: **no se pasa a la fase siguiente sin cerrar el DoD de la actual.**
- Hay **3 tracks en paralelo**: Estabilidad, Seguridad y Features. Seguridad va
  solo en M0; después se reparte según haga falta.

---

## 1. Definición de "app terminada" (MVP lanzable)

Un usuario nuevo puede, sin ayuda:

- [ ] Registrarse, hacer onboarding y llegar al dashboard.
- [ ] Crear una rutina y **entrenar** guardando cargas e historial.
- [ ] Ver su progreso e historial.
- [ ] Un trainer puede invitar a un alumno, el alumno aceptar, y el trainer
      **asignarle una rutina** que el alumno ve y ejecuta.
- [ ] Mensajería básica trainer↔alumno con notificación push.
- [ ] Funciona instalada como PWA (iOS/Android) sin crashear.
- [ ] La base de datos se puede **recrear desde cero con las migraciones**
      (sin drift).
- [ ] Sin secretos expuestos y con entornos separados.

Todo lo demás (recetas asignadas, feed complejo, cursos, Spotify, billing) es
**post-MVP** o recortable.

---

## 2. Fases

### M0 — Cimientos (BLOQUEANTE) · ~1 semana

**Por qué primero:** hoy la DB de producción tiene tablas/RPC que **no existen en
las migraciones** (drift). Eso significa que no podés recrear el entorno, ni
testear, ni deployar limpio, ni hacer staging. Todo lo demás se apoya en esto.

**Alcance**
1. Seguridad express: rotar `service_role`, Google y Spotify; staging separado.
2. Formalizar el **drift** en migraciones: `direct_messages`, `assigned_recipes`,
   `push_subscriptions`, `spotify_tokens`, `star_balances`, `get_conversations`,
   `send_message`, bucket `dm-images` y las columnas de `profiles`.
3. Aplicar las 2 migraciones pendientes (`fix_assigned_routines_visibility`,
   `trainer_invites`).
4. Crear la DB de staging desde cero con las migraciones y verificar que la app
   arranca igual que prod.

**DoD**
- [ ] Staging recreada 100% desde `supabase/migrations/` y la app anda.
- [ ] `git grep`/`supabase db diff` sin objetos que falten.
- [ ] Secretos rotados y entornos separados.

**Depende de:** nada. **Es el cuello de botella real.**

---

### M1 — Núcleo de entrenamiento sólido · ~1.5 semanas

**Por qué:** es el corazón de la app y hoy tiene fugas de datos (duplicados,
huérfanos) por falta de transacciones.

**Alcance**
1. RPC transaccional `save_routine` (crear/editar rutina + ejercicios atómico).
2. RPC transaccional `finish_workout` (workout + ejercicios + series + logros).
3. Arreglar `target_reps` (hoy es `text` pero el código lo trata como número).
4. Repasar P0/P1 del doc 06 que toquen este flujo.
5. Estado de error visible en `/entrenar` (si la rutina asignada no carga, avisar).

**DoD**
- [ ] Se puede cortar la red a mitad de guardar y la DB no queda a medias.
- [ ] Reintentar no duplica series.
- [ ] Alumno abre rutina asignada y ejecuta sin sesión vacía.

**Depende de:** M0.

---

### M2 — Trainer completo · ~1 semana

**Por qué:** ya está el 70% (invitación/aceptación). Falta cerrar el ciclo.

**Alcance**
1. Trainer asigna rutina a alumno (usa `assigned_routines`) desde la UI.
2. Panel de alumnos: ver adherencia, último entrenamiento, rutina activa.
3. Asignar recetas (formalizada en M0).
4. Estados del vínculo claros: pending / active / terminated (+ cancelar/rechazar).

**DoD**
- [ ] Flujo completo trainer→alumno→entrena→trainer ve resultado.
- [ ] Sin insertar `active` sin consentimiento.

**Depende de:** M0, M1.

---

### M3 — Mensajería y notificaciones · ~1 semana

**Alcance**
1. `direct_messages` y RPCs ya migradas (M0) + UI estable.
2. Push real: registrar suscripción, enviar desde el flujo autenticado
   (endurecido, ver M0/seguridad).
3. Badge de no leídos, view-once, imágenes, reacciones.
4. Realtime con reconexión y sin duplicar mensajes.

**DoD**
- [ ] A y B se mandan mensajes; B recibe push con la app cerrada.
- [ ] Sin endpoints con secretos frágiles.

**Depende de:** M0.

---

### M4 — Nutrición · ~1 semana

**Alcance**
1. Recetas propias (crear/editar/foto) y catálogo.
2. `meal_logs` + cierre de día (`daily_entries`) + macros.
3. Recetas asignadas por trainer (`assigned_recipes`).

**DoD**
- [ ] Registrar comidas y ver macros del día.
- [ ] Trainer asigna receta y el alumno la ve.

**Depende de:** M0, M2 (asignación).

---

### M5 — Social / perfil · ~1 semana (recortable)

**Alcance**
1. Feed (posts de workout/logro/receta/rutina), likes y comentarios.
2. Perfiles públicos/privados y flags de privacidad.
3. Seguir / mejores amigos.

**DoD**
- [ ] Feed carga, se puede likear/comentar y respeta privacidad.

**Depende de:** M1 (workouts), M4 (recetas). **Recortable del MVP.**

---

### M6 — Monetización · ~1–1.5 semanas (post-MVP)

**Alcance**
1. Planes (free/plus/deluxe) y límites reales por plan.
2. Marketplace de cursos + inscripción + pago (hoy `paid` es manual).
3. Facturación.

**DoD**
- [ ] Un usuario free no accede a lo premium; el pago marca `paid`.

**Depende de:** M1–M5. **No bloquea el lanzamiento.**

---

### M7 — Lanzamiento · ~1 semana

**Alcance**
1. QA final en iPhone y Android (PWA instalada).
2. PWA/Capacitor: íconos, splash, permisos, SW sin cachear respuestas
   autenticadas.
3. Tests E2E de los flujos críticos (registro→entrenar→guardar).
4. Monitoreo de errores + backups con restore probado.
5. Checklist de `SECURITY.md` antes de cada release.

**DoD**
- [ ] 10 usuarios beta completan el flujo sin crashear.
- [ ] Rollback documentado.

**Depende de:** M0–M4 (M5/M6 opcionales).

---

## 3. Orden visual (dependencias)

```
M0 Cimientos ──► M1 Entrenamiento ──► M2 Trainer ──► M4 Nutrición ──┐
                   │                     │                          │
                   └──────────► M3 Mensajería                     │
                                                                   ▼
M0 ─────────────────────────────────────────────────────────► M7 Lanzamiento
M1 ──► M5 Social (recortable) ──────────────────────────────►
M1..M5 ──► M6 Monetización (post-MVP) ─────────────────────►
```

---

## 4. Qué NO hacer ahora (evitar scope creep)

- No agregar features nuevas hasta cerrar M0–M2.
- No refactorizar UI "porque sí": primero que funcione y no pierda datos.
- No reescribir el historial de git.
- No borrar `web-legacy/` si todavía te sirve de referencia (pero no lo subas).
- No implementar NFC (no viable en iOS desde PWA).

---

## 5. Cadencia semanal sugerida

- **Lunes:** elegir 3–5 tareas del milestone actual y escribirlas como checklist.
- **Miércoles:** checkpoint; si algo se trabó >1 día, recortar alcance.
- **Viernes:** cerrar DoD, actualizar este doc y `docs/ESTADO-Y-PLAN.md`,
  commitear.
- **Regla:** una fase no avanza al 80%; o cierra el DoD o se recorta el alcance
  explícitamente.

---

## 6. Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Drift no formalizado | Alto: no hay staging ni reproducibilidad | M0 antes que nada |
| Secretos sin rotar | Crítico | Rotar esta semana |
| Falta de transacciones | Pérdida de datos de entrenamiento | M1 (RPC) |
| Entorno de dev = prod | Riesgo de borrar datos reales | M0 (staging) |
| Scope creep (querer todo) | No terminar nunca | MVP de §1 + "no hacer" de §4 |
| `npm`/`next build` crash en tu entorno | No podés verificar builds | Usar Vercel/CI para build; typecheck local |

---

## 7. Próximo paso concreto (esta semana)

1. Rotar `service_role` + Google + Spotify (30 min).
2. Crear staging Supabase y apuntar `web/.env.local` ahí (1 h).
3. Escribir las migraciones del drift listado en M0 (3–4 h).
4. Recrear staging desde migraciones y probar la app (1–2 h).

Con eso cerraste M0 y ya tenés base para M1.
