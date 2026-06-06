import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/server/db";

// GET — todos los programas del trainer + los del atleta si es ATHLETE
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  if (session.role === "TRAINER" || session.role === "ADMIN") {
    const programs = await prisma.trainingProgram.findMany({
      where: { trainerId: session.id },
      include: {
        workouts: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { orderIndex: "asc" }
            }
          },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ programs });
  }

  // Athlete: only assigned programs
  const assigned = await prisma.athleteProgram.findMany({
    where: { athleteId: session.id, active: true },
    include: {
      program: {
        include: {
          workouts: {
            include: {
              exercises: {
                include: { exercise: true },
                orderBy: { orderIndex: "asc" }
              }
            },
            orderBy: { createdAt: "asc" }
          }
        }
      },
    },
  });
  return NextResponse.json({ programs: assigned.map((a) => a.program) });
}

// POST — crear programa (solo trainer/admin)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN"))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { name, description, workouts } = await req.json();
  if (!name) return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });

  const program = await prisma.trainingProgram.create({
    data: {
      name,
      description,
      trainerId: session.id,
      workouts: workouts?.length
        ? {
            create: workouts.map((w: any) => ({
              name: w.name,
              dayOfWeek: w.dayOfWeek,
              exercises: w.exercises?.length
                ? {
                    create: w.exercises.map((ex: any, idx: number) => ({
                      targetSets: ex.targetSets ?? 3,
                      targetReps: ex.targetReps ?? "8-12",
                      restSec: ex.restSec ?? 90,
                      orderIndex: idx,
                      groupName: ex.groupName || null,
                      color: ex.color || null,
                      orderLabel: ex.orderLabel || null,
                      targetWeight: ex.targetWeight ? Number(ex.targetWeight) : null,
                      weightUnit: ex.weightUnit || "kg",
                      isSuperSet: ex.isSuperSet === true || ex.isSuperSet === 'true',
                      exercise: {
                        connectOrCreate: {
                          where: { name: ex.name },
                          create: {
                            name: ex.name,
                            muscleGroup: ex.muscleGroup || "Otros",
                            equipment: ex.equipment || "Otro",
                            gifUrl: ex.gifUrl || null
                          }
                        }
                      }
                    }))
                  }
                : undefined,
            })),
          }
        : undefined,
    },
    include: { workouts: true },
  });

  return NextResponse.json({ program });
}

// PUT — reordenar ejercicios de un workout (accesible para atleta y trainer)
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const { workoutId, exerciseIds } = await req.json();
    if (!workoutId || !Array.isArray(exerciseIds)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Actualizar orderIndex en lote mediante transacciones
    const updates = exerciseIds.map((exerciseId: string, idx: number) =>
      prisma.workoutExercise.updateMany({
        where: { workoutId, exerciseId },
        data: { orderIndex: idx }
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
