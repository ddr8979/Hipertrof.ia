import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import EXERCISES from "@/data/exercises-translated.json";

export async function GET() {
  try {
    // Promocionar administrador si ya existe
    await prisma.user.updateMany({
      where: { email: "carrizoaxel67@gmail.com" },
      data: { role: "ADMIN", isApproved: true }
    });

    // Obtener IDs de ejercicios no-custom antes de borrarlos
    const nonCustom = await prisma.exercise.findMany({
      where: { isCustom: false },
      select: { id: true },
    });
    const ids = nonCustom.map((e: any) => e.id);

    if (ids.length > 0) {
      // Borrar dependencias en cascada (por si SQLite no lo hace automáticamente)
      await prisma.workoutExercise.deleteMany({ where: { exerciseId: { in: ids } } });
      await prisma.exerciseLog.deleteMany({ where: { exerciseId: { in: ids } } });
      await prisma.oneRMRecord.deleteMany({ where: { exerciseId: { in: ids } } });
      // Ahora borrar los ejercicios del dataset viejo
      await prisma.exercise.deleteMany({ where: { id: { in: ids } } });
    }

    // Insertar los 246 ejercicios traducidos con WebM
    const data = (EXERCISES as any[]).map((ex) => ({
      name: ex.nombre,
      muscleGroup: ex.grupoMuscular,
      equipment: ex.equipamiento,
      gifUrl: ex.gifUrl,
      instructions: JSON.stringify(ex.instrucciones),
      isCustom: false,
    }));

    await prisma.exercise.createMany({ data });

    return NextResponse.json({ ok: true, seeded: data.length, deleted: ids.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
