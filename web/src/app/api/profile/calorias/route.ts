import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { harrisBenedict, type ActivityLevel, type Sex } from "@/lib/harrisBenedict";

type Body = {
  email: string;
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Body>;

  if (!body.email || typeof body.email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  try {
    const result = harrisBenedict({
      sex: body.sex as Sex,
      ageYears: Number(body.ageYears),
      heightCm: Number(body.heightCm),
      weightKg: Number(body.weightKg),
      activity: body.activity as ActivityLevel,
    });

    const user = await prisma.user.upsert({
      where: { email: body.email },
      create: { email: body.email },
      update: {},
    });

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
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

