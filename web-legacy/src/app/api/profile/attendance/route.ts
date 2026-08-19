import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/server/db";

function getDaysDiff(d1Str: string, d2Str: string) {
  const date1 = new Date(d1Str + "T00:00:00");
  const date2 = new Date(d2Str + "T00:00:00");
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// POST /api/profile/attendance — toggle de asistencia para una fecha
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { date } = await req.json();
  if (!date) return NextResponse.json({ error: "Fecha requerida" }, { status: 400 });

  try {
    // Buscar si ya existe la asistencia para esta fecha
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: session.id,
          date,
        },
      },
    });

    let attended = false;

    if (existing) {
      // Eliminar asistencia
      await prisma.attendance.delete({
        where: {
          id: existing.id,
        },
      });
    } else {
      // Crear asistencia
      await prisma.attendance.create({
        data: {
          userId: session.id,
          date,
        },
      });
      attended = true;
    }

    // Cargar todas las asistencias actualizadas para recalcular la racha
    const allAtt = await prisma.attendance.findMany({
      where: { userId: session.id },
      orderBy: { date: "desc" },
    });

    let currentStreak = 0;
    const uniqueDates = Array.from(new Set(allAtt.map((a) => a.date))).sort().reverse();

    if (uniqueDates.length > 0) {
      const todayStr = new Date().toISOString().slice(0, 10);
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

    // Actualizar racha y racha máxima en el perfil
    const profile = await prisma.profile.findUnique({
      where: { userId: session.id },
    });

    let updatedStreak = currentStreak;
    let updatedMaxStreak = currentStreak;

    if (profile) {
      updatedMaxStreak = Math.max(profile.maxStreak, currentStreak);
      await prisma.profile.update({
        where: { userId: session.id },
        data: {
          streak: currentStreak,
          maxStreak: updatedMaxStreak,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      attended,
      attendances: allAtt,
      streak: updatedStreak,
      maxStreak: updatedMaxStreak,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
