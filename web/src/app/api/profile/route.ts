import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/server/db";
import { mifflinStJeor } from "@/shared/lib/mifflinStJeor";

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

// PATCH /api/profile — actualiza datos físicos + preferencias alimentarias
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const {
    name, sex, ageYears, heightCm, weightKg, activity,
    // Preferencias alimentarias
    dietType, dietGoal, foodLikes, foodDislikes, favoriteMeals,
  } = await req.json();

  // Fetch existing profile to merge and avoid overwriting with zeros
  const existingProfile = await prisma.profile.findUnique({
    where: { userId: session.id }
  });

  const finalSex = sex !== undefined ? sex : existingProfile?.sex;
  const finalAge = (ageYears !== undefined && ageYears !== null && ageYears !== 0) ? Number(ageYears) : existingProfile?.ageYears;
  const finalHeight = (heightCm !== undefined && heightCm !== null && heightCm !== 0) ? Number(heightCm) : existingProfile?.heightCm;
  const finalWeight = (weightKg !== undefined && weightKg !== null && weightKg !== 0) ? Number(weightKg) : existingProfile?.weightKg;
  const finalActivity = activity !== undefined ? activity : existingProfile?.activity;

  let bmrKcal: number | undefined;
  let tdeeKcal: number | undefined;
  let activityFactor: number | undefined;

  if (finalSex && finalAge && finalHeight && finalWeight && finalActivity) {
    const result = mifflinStJeor({
      sex: finalSex as any,
      ageYears: finalAge,
      heightCm: finalHeight,
      weightKg: finalWeight,
      activity: finalActivity as any,
    });
    bmrKcal = result.bmrKcal;
    tdeeKcal = result.tdeeKcal;
    activityFactor = result.activityFactor;
  }

  const profileData: Record<string, any> = {};
  if (sex !== undefined) profileData.sex = sex;
  if (ageYears !== undefined && ageYears !== null && ageYears !== 0) profileData.ageYears = Number(ageYears);
  if (heightCm !== undefined && heightCm !== null && heightCm !== 0) profileData.heightCm = Number(heightCm);
  if (weightKg !== undefined && weightKg !== null && weightKg !== 0) profileData.weightKg = Number(weightKg);
  if (activity !== undefined) profileData.activity = activity;

  if (bmrKcal !== undefined) profileData.bmrKcal = bmrKcal;
  if (tdeeKcal !== undefined) profileData.tdeeKcal = tdeeKcal;
  if (activityFactor !== undefined) profileData.activityFactor = activityFactor;

  if (dietType !== undefined)    profileData.dietType    = dietType;
  if (dietGoal !== undefined)    profileData.dietGoal    = dietGoal;
  if (foodLikes !== undefined)   profileData.foodLikes   = typeof foodLikes === "string" ? foodLikes : JSON.stringify(foodLikes);
  if (foodDislikes !== undefined) profileData.foodDislikes = typeof foodDislikes === "string" ? foodDislikes : JSON.stringify(foodDislikes);
  if (favoriteMeals !== undefined) profileData.favoriteMeals = typeof favoriteMeals === "string" ? favoriteMeals : JSON.stringify(favoriteMeals);

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({ where: { id: session.id }, data: { name } }),
    prisma.profile.upsert({
      where: { userId: session.id },
      create: { userId: session.id, ...profileData },
      update: profileData,
    }),
  ]);

  return NextResponse.json({ ok: true, user: updatedUser });
}

// POST /api/profile — Entrenador asigna calificaciones y medallas a un alumno
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN" && session.role !== "OWNER")) {
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
