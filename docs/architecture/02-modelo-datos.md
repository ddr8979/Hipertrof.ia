# Modelo de Datos (Prisma)

## Diagrama de relaciones

```
┌─────────────┐
│    User     │
│  (rol)      │
└──────┬──────┘
       │
       ├──────┐
       │      │
       ▼      ▼
┌──────────────┐  ┌─────────────────┐
│TrainerClient │  │   Routine       │
│ (status)     │  │ (template)      │
└──────────────┘  └────────┬────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │RoutineExercise│
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Exercise    │
                    │ (gifUrl)      │
                    └───────────────┘

┌─────────────┐
│  User       │
└──────┬──────┘
       │
       │ crea al finalizar
       ▼
┌──────────────┐
│  WorkoutLog  │
└──────┬───────┘
       │
       ├──────┐
       │      │
       ▼      ▼
┌────────────┐ ┌──────────────┐
│WorkoutExer.│ │   Set logs   │
└────────────┘ └──────────────┘
```

---

## Entidades

### User
```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  passwordHash    String?
  name            String?
  role            Role     @default(ATHLETE)  // ATHLETE | TRAINER
  streakCount     Int      @default(0)
  lastWorkoutAt   DateTime?
  
  // Relations
  routines        Routine[]
  workoutLogs     WorkoutLog[]
  trainerLinks    TrainerClient[] @relation("TrainerLinks")
  athleteLinks    TrainerClient[] @relation("AthleteLinks")
}

enum Role {
  ATHLETE
  TRAINER
}
```

### TrainerClient
```prisma
model TrainerClient {
  id          String              @id @default(cuid())
  trainerId   String
  athleteId   String
  status      TrainerClientStatus @default(PENDING)  // PENDING | ACTIVE | TERMINATED
  startedAt   DateTime?
  endedAt     DateTime?
  
  trainer     User @relation("TrainerLinks", fields: [trainerId], references: [id])
  athlete     User @relation("AthleteLinks", fields: [athleteId], references: [id])
}
```

### Exercise (catálogo)
```prisma
model Exercise {
  id              String   @id @default(cuid())
  name            String
  gifUrl          String?  // URL al GIF demostrativo
  primaryMuscle   String   // Pecho, Espalda, etc.
  equipment       String?  // Barra, mancuerna, máquina
  isCustom        Boolean  @default(false)
  createdById   String?
  
  routineExercises  RoutineExercise[]
  workoutExercises  WorkoutExercise[]
}
```

### Routine (plantilla)
```prisma
model Routine {
  id           String   @id @default(cuid())
  name         String
  description  String?
  createdById  String
  
  createdBy    User              @relation(fields: [createdById], references: [id])
  exercises    RoutineExercise[]
  assigned     AssignedRoutine[]
}

model RoutineExercise {
  id          String  @id @default(cuid())
  routineId   String
  exerciseId  String
  order       Int     // posición en la rutina
  targetSets  Int
  targetReps  String  // "8-12" o "al fallo"
  
  routine     Routine  @relation(fields: [routineId], references: [id])
  exercise    Exercise @relation(fields: [exerciseId], references: [id])
}

model AssignedRoutine {
  id          String   @id @default(cuid())
  routineId   String
  athleteId   String
  assignedAt  DateTime @default(now())
  startsAt    DateTime?
  endsAt      DateTime?
  
  routine     Routine @relation(fields: [routineId], references: [id])
}
```

### WorkoutLog (sesión completada)
```prisma
model WorkoutLog {
  id          String   @id @default(cuid())
  userId      String
  name        String   // "Push day", "Legs A", etc.
  duration    Int      // segundos
  completedAt DateTime @default(now())
  
  user        User             @relation(fields: [userId], references: [id])
  exercises   WorkoutExercise[]
}

model WorkoutExercise {
  id           String  @id @default(cuid())
  workoutLogId String
  exerciseId   String
  order        Int
  
  workoutLog   WorkoutLog    @relation(fields: [workoutLogId], references: [id])
  exercise     Exercise      @relation(fields: [exerciseId], references: [id])
  sets         WorkoutSet[]
}

model WorkoutSet {
  id               String  @id @default(cuid())
  workoutExerciseId String
  setNumber        Int
  weight           Float   // kg
  reps             Int
  rpe              Float?  // 1-10, esfuerzo percibido
  completed        Boolean @default(false)
  
  workoutExercise  WorkoutExercise @relation(fields: [workoutExerciseId], references: [id])
}
```

---

## Migraciones

```bash
cd ~/Documentos/HIPERTROFIA/web

# Crear migración
npx prisma migrate dev --name nombre_cambio

# Aplicar en producción
npx prisma migrate deploy

# Reset DB local (CUIDADO, borra todo)
npx prisma migrate reset

# Generar cliente
npx prisma generate

# Inspeccionar DB visualmente
npx prisma studio
```

---

## Datos derivados (no en DB)

Estos se calculan en runtime:
- **1RM estimado** — fórmula Epley: `peso × (1 + reps/30)`
- **Volumen total** — suma de `weight × reps` de todas las sets
- **Racha activa** — `streakCount` actualizado al guardar cada workout
- **Progreso por ejercicio** — `max(weight)` histórico