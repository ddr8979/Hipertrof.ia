import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET() {
  const total = await prisma.recipe.count();
  if (total === 0) {
    await prisma.recipe.create({
      data: {
        name: "Pollo con arroz y vegetales",
        calories: 620,
        proteinG: 42,
        carbsG: 70,
        fatsG: 18,
        description: "Receta base para volumen limpio",
      },
    });
  }

  const recipes = await prisma.recipe.findMany({ orderBy: { createdAt: "desc" }, take: 30 });
  return NextResponse.json({ recipes });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name?: string;
    calories?: number;
    proteinG?: number;
    carbsG?: number;
    fatsG?: number;
  };

  if (!body.name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const recipe = await prisma.recipe.create({
    data: {
      name: body.name.trim(),
      calories: Number(body.calories ?? 0),
      proteinG: Number(body.proteinG ?? 0),
      carbsG: Number(body.carbsG ?? 0),
      fatsG: Number(body.fatsG ?? 0),
      description: "Cargada desde MVP nutricion",
    },
  });

  return NextResponse.json({ ok: true, recipe });
}

