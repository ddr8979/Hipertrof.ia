import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { DEMO_EMAIL } from "@/lib/demo-user";
import { getOrCreateUser } from "@/server/user";

export async function GET() {
  const athlete = await getOrCreateUser(DEMO_EMAIL);
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { athleteId: athlete.id },
    include: { course: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ enrollments });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { courseId?: string };
  if (!body.courseId) return NextResponse.json({ error: "courseId is required" }, { status: 400 });

  const athlete = await getOrCreateUser(DEMO_EMAIL);
  const enrollment = await prisma.courseEnrollment.upsert({
    where: { courseId_athleteId: { courseId: body.courseId, athleteId: athlete.id } },
    create: {
      courseId: body.courseId,
      athleteId: athlete.id,
      paid: true,
      paidAt: new Date(),
    },
    update: {
      paid: true,
      paidAt: new Date(),
    },
    include: { course: true },
  });

  return NextResponse.json({
    ok: true,
    enrollment,
    message: "Pago simulado completado. Ya tenes acceso al curso.",
  });
}

