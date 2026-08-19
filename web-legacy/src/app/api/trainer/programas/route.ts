import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/server/db";

// GET /api/trainer/programas — todos los programas para el dropdown de asignación
export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN" && session.role !== "OWNER"))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const programs = await prisma.trainingProgram.findMany({
    where: { trainerId: session.id },
    select: {
      id: true,
      name: true,
      description: true,
      workouts: {
        select: {
          id: true,
          name: true,
          exercises: {
            select: {
              id: true,
              targetSets: true,
              targetReps: true,
              restSec: true,
              groupName: true,
              color: true,
              orderLabel: true,
              targetWeight: true,
              weightUnit: true,
              isSuperSet: true,
              exercise: { select: { name: true } }
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ programs });
}

// POST — crear programa completo
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN" && session.role !== "OWNER"))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { name, description, workouts } = await req.json();
  if (!name) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });

  const program = await prisma.trainingProgram.create({
    data: { 
      name, 
      description, 
      trainerId: session.id,
      workouts: workouts && workouts.length > 0 ? {
        create: workouts.map((w: any) => ({
          name: w.name,
          exercises: {
            create: w.exercises.map((ex: any, idx: number) => ({
              targetSets: ex.sets,
              targetReps: ex.reps,
              restSec: ex.rest,
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
                  create: { name: ex.name }
                }
              }
            }))
          }
        }))
      } : undefined
    },
  });

  return NextResponse.json({ program });
}

// DELETE /api/trainer/programas — eliminar un programa de entrenamiento
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN" && session.role !== "OWNER"))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  try {
    const { programId } = await req.json();
    if (!programId) return NextResponse.json({ error: "Falta programId" }, { status: 400 });

    // Verificar si el programa pertenece al entrenador (si es TRAINER)
    if (session.role === "TRAINER") {
      const existing = await prisma.trainingProgram.findUnique({
        where: { id: programId },
        select: { trainerId: true }
      });
      if (existing && existing.trainerId !== session.id) {
        return NextResponse.json({ error: "No tienes permiso para eliminar este programa" }, { status: 403 });
      }
    }

    await prisma.trainingProgram.delete({
      where: { id: programId }
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
