import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getSession } from "@/lib/auth";
import { harrisBenedict, type ActivityLevel, type Sex } from "@/lib/harrisBenedict";

type Body = {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<Body>;
    if (!body.sex || !body.ageYears || !body.heightCm || !body.weightKg || !body.activity) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const result = harrisBenedict({
      sex: body.sex as Sex,
      ageYears: Number(body.ageYears),
      heightCm: Number(body.heightCm),
      weightKg: Number(body.weightKg),
      activity: body.activity as ActivityLevel,
    });

    const profile = await prisma.profile.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        sex: body.sex,
        ageYears: Number(body.ageYears),
        heightCm: Number(body.heightCm),
        weightKg: Number(body.weightKg),
        activity: body.activity,
        bmrKcal: result.bmrKcal,
        tdeeKcal: result.tdeeKcal,
        activityFactor: result.activityFactor,
      },
      update: {
        sex: body.sex,
        ageYears: Number(body.ageYears),
        heightCm: Number(body.heightCm),
        weightKg: Number(body.weightKg),
        activity: body.activity,
        bmrKcal: result.bmrKcal,
        tdeeKcal: result.tdeeKcal,
        activityFactor: result.activityFactor,
      },
    });

    return NextResponse.json({ ok: true, profile });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid input" }, { status: 400 });
  }
}

