# Estrategia Offline-First

## Filosofía

> **El usuario puede entrenar en un sótano sin señal, en un avión, en el campo. La app no debe bloquear nunca.**

## Capas de persistencia

```
┌──────────────────────────────────────────┐
│  Capa 1: RAM (Zustand in-memory)         │  ← UI lee de acá
├──────────────────────────────────────────┤
│  Capa 2: localStorage / IndexedDB        │  ← Sobrevive a refresh
├──────────────────────────────────────────┤
│  Capa 3: Cola de sincronización          │  ← Workouts pendientes de subir
├──────────────────────────────────────────┤
│  Capa 4: Servidor (Supabase Postgres)    │  ← Source of truth final
└──────────────────────────────────────────┘
```

---

## Zustand Store: workoutStore

`src/entities/workout/model/workoutStore.ts`

```typescript
interface WorkoutStore {
  // Estado
  exercises: WorkoutExercise[]    // ejercicios de la sesión activa
  startTime: number | null        // timestamp del inicio
  isActive: boolean
  
  // Acciones (instantáneas, sin await)
  addExercise(exercise: Exercise): void
  addSet(exerciseId: string): void
  updateSet(setId: string, data: Partial<WorkoutSet>): void
  toggleComplete(setId: string): void
  removeSet(setId: string): void
  finishWorkout(name: string): Promise<WorkoutLog>
  cancelWorkout(): void
}
```

### Persistencia

```typescript
import { persist } from 'zustand/middleware'

export const useWorkoutStore = create(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'hypertrof-active-workout',
      storage: createJSONStorage(() => localStorage),
      // Solo persistir si hay sesión activa
      partialize: (state) => 
        state.isActive ? state : {}
    }
  )
)
```

---

## Flujo: agregar serie

```
Usuario tap "✓" en una serie
        ↓
toggleComplete(setId) → actualiza store
        ↓
Zustand notifica subscribers (componente)
        ↓
UI re-renderiza (checkmark aparece)
        ↓
Middleware persist() escribe a localStorage
        ↓
(sin await, sin red)
```

**Tiempo total: ~5ms**

---

## Flujo: finalizar workout

```
Usuario tap "Finalizar entrenamiento"
        ↓
finishWorkout("Push day")
        ↓
1. Capturar snapshot del store
2. Calcular duration = now - startTime
3. Construir payload WorkoutLog completo
4. POST /api/workouts/log (o server action)
5. Servidor crea WorkoutLog + WorkoutExercise + WorkoutSet
6. Si 200 OK: limpiar store
7. Si falla: guardar en "pending sync queue"
        ↓
Toast: "Entrenamiento guardado" o "Se subirá cuando haya red"
```

---

## Cola de sincronización

Para workouts creados offline que fallan al subir:

```typescript
// entities/workout/api/syncQueue.ts
interface PendingWorkout {
  id: string                    // local ID
  createdAt: number
  payload: WorkoutLogPayload
  retryCount: number
}

// Se ejecuta:
// - Al abrir la app con red
// - Cuando vuelve la conectividad (online event)
// - Cada 5 min si hay pendientes
export async function syncPendingWorkouts(): Promise<void>
```

---

## Conflict resolution

Si el usuario entrena offline y luego en otro dispositivo:

**Política: el último gana por timestamp**, pero preservamos todos los sets (no se borra nada).

```typescript
async function upsertWorkoutLog(local: WorkoutLog, remote: WorkoutLog | null) {
  if (!remote) return create(local)        // no existe, crear
  if (local.completedAt > remote.completedAt) return update(remote.id, local)
  return remote                              // remoto es más nuevo
}
```

---

## Service Worker

`web/public/sw.js` (pendiente de implementación completa):

```javascript
// Estrategia: cache-first para assets, network-first para API
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // Network first, fallback a cola
    event.respondWith(networkFirstWithQueue(event.request))
  } else {
    // Cache first
    event.respondFromCache(event.request)
  }
})
```

---

## Edge cases cubiertos

| Escenario | Comportamiento |
|-----------|---------------|
| Refresh durante workout | Zustand recupera desde localStorage |
| Cerrar pestaña | localStorage persiste |
| Perder conexión a mitad de workout | Sigue funcionando, sync al volver |
| Mismo workout en 2 devices | Merge por timestamp |
| Storage lleno (>5MB) | IndexedDB con cleanup automático |

---

## Métricas a monitorear

- **TTI (Time to Interactive)** offline: debe ser <500ms
- **Workouts sin sincronizar** en cola: alertar si >5
- **localStorage size**: alerta si >4MB