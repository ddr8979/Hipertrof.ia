import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/server/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q          = searchParams.get("q") ?? "";
  const category   = searchParams.get("category") ?? "";      // desayuno|almuerzo|cena|snack|postre
  const dietType   = searchParams.get("dietType") ?? "";      // vegano|vegetariano|sin_gluten|omnivoro
  const tag        = searchParams.get("tag") ?? "";           // tag específico
  const maxKcal    = Number(searchParams.get("maxKcal") ?? 0);
  const targetKcal = Number(searchParams.get("targetKcal") ?? 0);
  const range      = Number(searchParams.get("range") ?? 300);

  const where: Record<string, any> = {};

  if (category) where.category = category;
  if (maxKcal > 0) where.calories = { lte: maxKcal };
  if (targetKcal > 0) where.calories = { gte: targetKcal - range, lte: targetKcal + range };

  let recipes = await prisma.recipe.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  // Filtros en memoria (por JSON fields y texto)
  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const qn = normalize(q);

  recipes = recipes.filter((r) => {
    if (q && !normalize(r.name).includes(qn) && !normalize(r.description ?? "").includes(qn)) return false;

    if (dietType) {
      try {
        const dt: string[] = JSON.parse(r.dietTypes ?? "[]");
        if (!dt.includes(dietType)) return false;
      } catch { return false; }
    }

    if (tag) {
      try {
        const tags: string[] = JSON.parse(r.tags ?? "[]");
        if (!tags.some((t) => t.includes(normalize(tag)))) return false;
      } catch { return false; }
    }

    return true;
  });

  return NextResponse.json({ recipes });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "name requerido" }, { status: 400 });

  const recipe = await prisma.recipe.create({
    data: {
      name: body.name.trim(),
      calories: Number(body.calories ?? 0),
      proteinG: Number(body.proteinG ?? 0),
      carbsG: Number(body.carbsG ?? 0),
      fatsG: Number(body.fatsG ?? 0),
      description: body.description ?? "",
      category: body.category ?? "almuerzo",
      imageEmoji: body.imageEmoji ?? "🍽️",
    },
  });

  return NextResponse.json({ ok: true, recipe });
}
