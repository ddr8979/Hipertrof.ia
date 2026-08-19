import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { DEMO_EMAIL } from "@/lib/demo-user";
import { getOrCreateUser } from "@/server/user";

export async function GET() {
  const total = await prisma.course.count();
  if (total === 0) {
    const trainer = await getOrCreateUser(DEMO_EMAIL);
    await prisma.course.create({
      data: {
        title: "Curso hipertrofia 12 semanas",
        description: "Entrenamiento + nutricion + seguimiento",
        priceUyu: 1000,
        status: "PUBLISHED",
        trainerId: trainer.id,
      },
    });
  }

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { trainer: true },
    take: 20,
  });
  return NextResponse.json({ courses });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { title?: string; description?: string; priceUyu?: number; email?: string };
  if (!body.title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const trainer = await getOrCreateUser(body.email ?? DEMO_EMAIL);
  const course = await prisma.course.create({
    data: {
      title: body.title.trim(),
      description: body.description?.trim(),
      priceUyu: Number(body.priceUyu ?? 0),
      status: "PUBLISHED",
      trainerId: trainer.id,
    },
  });
  return NextResponse.json({ ok: true, course });
}

