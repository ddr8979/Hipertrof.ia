import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { harrisBenedict, activityOptions } from "@/lib/harrisBenedict";
import type { Sex, ActivityLevel } from "@/lib/harrisBenedict";
import { prisma } from "@/server/db";

// Epley formula: 1RM = weight * (1 + reps/30)
function epley1RM(weightKg: number, reps: number) {
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30));
}

// % of 1RM for given reps
function percentFor1RM(reps: number) {
  const table: Record<number, number> = {
    1: 100, 2: 95, 3: 93, 4: 90, 5: 87, 6: 85,
    7: 83, 8: 80, 10: 75, 12: 70, 15: 65, 20: 60,
  };
  const closest = Object.keys(table)
    .map(Number)
    .reduce((a, b) => (Math.abs(b - reps) < Math.abs(a - reps) ? b : a));
  return table[closest];
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const { mode } = body;

  if (mode === "calories") {
    const { sex, ageYears, heightCm, weightKg, activity } = body;
    if (!sex || !ageYears || !heightCm || !weightKg || !activity)
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    const result = harrisBenedict({
      sex: sex as Sex,
      ageYears: Number(ageYears),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      activity: activity as ActivityLevel,
    });

    const bulk = Math.round(result.tdeeKcal * 1.1);
    const cut  = Math.round(result.tdeeKcal * 0.85);

    return NextResponse.json({
      ...result,
      bulk,
      cut,
      activityOptions,
      proteinG: Math.round(Number(weightKg) * 2.2),
    });
  }

  if (mode === "1rm") {
    const { weightKg, reps, exerciseId, unit } = body;
    if (!weightKg || !reps || !exerciseId)
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    const isLbs = unit === "lbs";
    const weightInKg = isLbs ? Number(weightKg) * 0.45359237 : Number(weightKg);

    const maxKg = epley1RM(weightInKg, Number(reps));
    const max = isLbs ? Math.round(maxKg / 0.45359237) : Math.round(maxKg);

    // Guardar registro en base de datos
    await prisma.oneRMRecord.create({
      data: {
        userId: session.id,
        exerciseId,
        weightKg: weightInKg,
        reps: Number(reps),
        oneRM: maxKg,
        unit: unit || "kg"
      }
    });

    // Obtener historial de 1RM para este ejercicio
    const rawHistory = await prisma.oneRMRecord.findMany({
      where: { userId: session.id, exerciseId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const history = rawHistory.map(h => {
      const displayWeight = isLbs ? Math.round(h.weightKg / 0.45359237) : Math.round(h.weightKg);
      const displayOneRM = isLbs ? Math.round(h.oneRM / 0.45359237) : Math.round(h.oneRM);
      return {
        id: h.id,
        createdAt: h.createdAt,
        weight: displayWeight,
        reps: h.reps,
        oneRM: displayOneRM,
        unit: unit || "kg"
      };
    });

    // Build percentage table
    const table = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15].map((r) => ({
      reps: r,
      percent: percentFor1RM(r),
      weight: Math.round(max * (percentFor1RM(r)! / 100)),
    }));

    return NextResponse.json({ oneRM: max, table, history });
  }

  return NextResponse.json({ error: "Modo inválido" }, { status: 400 });
}
