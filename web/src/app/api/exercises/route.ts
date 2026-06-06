import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/server/db";

// GET /api/exercises — buscar y filtrar ejercicios
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search    = searchParams.get("search") || "";
  const muscle    = searchParams.get("muscle") || "";
  const equipment = searchParams.get("equipment") || "";

  // Visibility: public OR created by this user
  const visibility = {
    OR: [
      { isCustom: false },
      { isCustom: true, authorId: session.id },
    ],
  };

  try {
    const rawExercises = await prisma.exercise.findMany({
      where: { OR: visibility.OR },
      orderBy: { name: "asc" },
    });

    const normalize = (str: string) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const searchNorm = normalize(search);

    const exercises = rawExercises.filter((ex) => {
      // Filtrado por texto insensible a mayúsculas y acentos
      if (search && !normalize(ex.name).includes(searchNorm)) return false;
      // Filtrado por grupo muscular
      if (muscle && ex.muscleGroup !== muscle) return false;
      // Filtrado por equipamiento
      if (equipment && ex.equipment !== equipment) return false;
      return true;
    });

    return NextResponse.json({ exercises });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/exercises — crear ejercicio personalizado
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const { name, muscleGroup, equipment, instructions, gifUrl } = await req.json();

    if (!name || !muscleGroup || !equipment) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // Capitalizar nombre
    const formattedName = name
      .trim()
      .split(" ")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    // Validar duplicado
    const existing = await prisma.exercise.findUnique({
      where: { name: formattedName }
    });

    if (existing) {
      return NextResponse.json({ error: "Ya existe un ejercicio con este nombre" }, { status: 409 });
    }

    const newExercise = await prisma.exercise.create({
      data: {
        name: formattedName,
        muscleGroup,
        equipment,
        instructions: instructions || "",
        gifUrl: gifUrl || null,
        isCustom: true,
        authorId: session.id
      }
    });

    return NextResponse.json({ ok: true, exercise: newExercise });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
