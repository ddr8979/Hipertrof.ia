import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/server/db";

// GET /api/profile — devuelve perfil del usuario en sesión con asistencias
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      profile: true,
      attendances: {
        select: { date: true },
        orderBy: { date: "asc" }
      }
    },
  });
  return NextResponse.json({ user });
}

// PATCH /api/profile — actualiza datos físicos del propio atleta + recalcula BMR/TDEE
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { name, sex, ageYears, heightCm, weightKg, activity } = await req.json();

  // recalculate Harris-Benedict if we have all fields
  let bmrKcal: number | undefined;
  let tdeeKcal: number | undefined;
  let activityFactor: number | undefined;

  const FACTORS: Record<string, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, extra: 1.9,
  };

  if (sex && ageYears && heightCm && weightKg && activity) {
    const bmr = sex === "male"
      ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears
      : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * ageYears;
    activityFactor = FACTORS[activity] ?? 1.2;
    bmrKcal = Math.round(bmr);
    tdeeKcal = Math.round(bmr * activityFactor);
  }

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({ where: { id: session.id }, data: { name } }),
    prisma.profile.upsert({
      where: { userId: session.id },
      create: { userId: session.id, sex, ageYears, heightCm, weightKg, activity, bmrKcal, tdeeKcal, activityFactor },
      update: { sex, ageYears, heightCm, weightKg, activity, bmrKcal, tdeeKcal, activityFactor },
    }),
  ]);

  return NextResponse.json({ ok: true, user: updatedUser });
}

// POST /api/profile — Entrenador asigna calificaciones y medallas a un alumno
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  try {
    const { athleteId, grade, medals } = await req.json();
    if (!athleteId) {
      return NextResponse.json({ error: "Falta el ID del atleta" }, { status: 400 });
    }

    // Actualizar el perfil del atleta
    const updatedProfile = await prisma.profile.update({
      where: { userId: athleteId },
      data: {
        grade: grade !== undefined ? grade : undefined,
        medals: medals !== undefined ? medals : undefined,
      }
    });

    return NextResponse.json({ ok: true, profile: updatedProfile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
