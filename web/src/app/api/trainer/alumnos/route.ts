import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/server/db";

import bcrypt from "bcryptjs";

// GET /api/trainer/alumnos — lista atletas del trainer
export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN"))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const athletes = await prisma.user.findMany({
    where: {
      role: "ATHLETE",
      trainerId: session.role === "TRAINER" ? session.id : undefined,
    },
    include: {
      profile: true,
      assignedPrograms: {
        where: { active: true },
        include: { program: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ athletes });
}

// POST /api/trainer/alumnos — asignar o crear alumno
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "TRAINER" && session.role !== "ADMIN"))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const { email, name, password } = body;
    if (!email || !name)
      return NextResponse.json({ error: "Faltan email o nombre" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });

    const pass = password || "123456";
    const hash = await bcrypt.hash(pass, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hash,
        role: "ATHLETE",
        isApproved: true,
        trainerId: session.role === "TRAINER" ? session.id : undefined,
        profile: { create: {} },
      },
    });

    return NextResponse.json({ ok: true, athlete: user });
  }

  const { athleteId, programId } = body;
  if (!athleteId || !programId)
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  // upsert: si ya existe, reactiva
  const assignment = await prisma.athleteProgram.upsert({
    where: { athleteId_programId: { athleteId, programId } },
    create: { athleteId, programId, startDate: new Date(), active: true },
    update: { active: true, startDate: new Date() },
  });

  return NextResponse.json({ ok: true, assignment });
}
