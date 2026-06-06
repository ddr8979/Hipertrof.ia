import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/server/db";

function getDaysDiff(d1Str: string, d2Str: string) {
  const date1 = new Date(d1Str + "T00:00:00");
  const date2 = new Date(d2Str + "T00:00:00");
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// GET — últimos 20 logs del atleta en sesión
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [logs, weekly] = await Promise.all([
    prisma.exerciseLog.findMany({
      where: { athleteId: session.id },
      include: { exercise: true },
      orderBy: { performedAt: "desc" },
      take: 20,
    }),
    prisma.exerciseLog.aggregate({
      where: { athleteId: session.id, performedAt: { gte: since } },
      _sum: { volumeKg: true },
    }),
  ]);

  return NextResponse.json({
    logs,
    weeklyVolumeKg: Math.round(weekly._sum.volumeKg ?? 0),
  });
}

// POST — registrar serie/sesión y calcular racha de asistencia
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { exerciseName, sets, reps, weightKg, unit } = await req.json();
  if (!exerciseName || !sets || !reps || weightKg == null) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  // Si está en libras, convertir a kg para almacenamiento uniforme
  const isLbs = unit === "lbs";
  const weightInKg = isLbs ? Number(weightKg) * 0.45359237 : Number(weightKg);

  // upsert exercise catalog
  const exercise = await prisma.exercise.upsert({
    where: { name: exerciseName },
    create: { name: exerciseName },
    update: {},
  });

  const volumeKg = sets * reps * weightInKg;

  const log = await prisma.exerciseLog.create({
    data: {
      athleteId: session.id,
      exerciseId: exercise.id,
      sets: Number(sets),
      reps: Number(reps),
      weightKg: Number(weightInKg),
      volumeKg,
    },
    include: { exercise: true },
  });

  // ── Registrar asistencia y calcular racha estilo TikTok ──
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Registrar asistencia de hoy si no existe
    await prisma.attendance.upsert({
      where: { userId_date: { userId: session.id, date: todayStr } },
      create: { userId: session.id, date: todayStr },
      update: {},
    });

    // Cargar todas las asistencias para calcular la racha
    const allAtt = await prisma.attendance.findMany({
      where: { userId: session.id },
      orderBy: { date: "desc" },
    });

    let currentStreak = 0;
    const uniqueDates = Array.from(new Set(allAtt.map(a => a.date))).sort().reverse();

    if (uniqueDates.length > 0) {
      const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const latest = uniqueDates[0];

      if (latest === todayStr || latest === yesterdayStr) {
        currentStreak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const diff = getDaysDiff(uniqueDates[i], uniqueDates[i + 1]);
          if (diff === 1) {
            currentStreak++;
          } else if (diff > 1) {
            break;
          }
        }
      }
    }

    // Actualizar racha en el perfil
    const profile = await prisma.profile.findUnique({
      where: { userId: session.id }
    });

    if (profile) {
      const maxStreak = Math.max(profile.maxStreak, currentStreak);
      await prisma.profile.update({
        where: { userId: session.id },
        data: { streak: currentStreak, maxStreak },
      });
    }
  } catch (err) {
    console.error("Error al calcular racha de asistencia:", err);
  }

  return NextResponse.json({ log });
}
