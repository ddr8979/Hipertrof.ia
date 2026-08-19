import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { DEMO_EMAIL } from "@/lib/demo-user";
import { getOrCreateUser } from "@/server/user";

export async function GET() {
  const athlete = await getOrCreateUser(DEMO_EMAIL);
  const logs = await prisma.mealLog.findMany({
    where: { athleteId: athlete.id },
    include: { recipe: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const totals = logs.reduce(
    (acc, item) => {
      acc.calories += item.calories;
      acc.proteinG += item.proteinG ?? 0;
      acc.carbsG += item.carbsG ?? 0;
      acc.fatsG += item.fatsG ?? 0;
      return acc;
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatsG: 0 },
  );

  return NextResponse.json({ logs, totals });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    recipeId?: string;
    calories?: number;
    proteinG?: number;
    carbsG?: number;
    fatsG?: number;
    notes?: string;
  };

  const athlete = await getOrCreateUser(DEMO_EMAIL);

  const log = await prisma.mealLog.create({
    data: {
      athleteId: athlete.id,
      recipeId: body.recipeId,
      calories: Number(body.calories ?? 0),
      proteinG: Number(body.proteinG ?? 0),
      carbsG: Number(body.carbsG ?? 0),
      fatsG: Number(body.fatsG ?? 0),
      notes: body.notes?.trim(),
    },
    include: { recipe: true },
  });

  return NextResponse.json({ ok: true, log });
}

