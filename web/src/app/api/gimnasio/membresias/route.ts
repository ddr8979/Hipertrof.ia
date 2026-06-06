import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { DEMO_EMAIL } from "@/lib/demo-user";
import { getOrCreateUser } from "@/server/user";

async function getOrCreateGym() {
  const owner = await getOrCreateUser(DEMO_EMAIL);
  const existing = await prisma.gym.findFirst({ where: { ownerId: owner.id } });
  if (existing) return existing;
  return prisma.gym.create({ data: { name: "Hipertrof Gym Centro", city: "Montevideo", ownerId: owner.id } });
}

export async function GET() {
  const gym = await getOrCreateGym();
  const total = await prisma.gymMembership.count({ where: { gymId: gym.id } });
  if (total === 0) {
    const athlete = await getOrCreateUser("socio.demo@hipertrof.ia");
    await prisma.gymMembership.create({
      data: {
        gymId: gym.id,
        athleteId: athlete.id,
        status: "ACTIVE",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const memberships = await prisma.gymMembership.findMany({
    where: { gymId: gym.id },
    include: { athlete: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ gym, memberships });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; status?: "ACTIVE" | "PENDING" | "OVERDUE" | "BLOCKED" };
  if (!body.email?.trim()) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const gym = await getOrCreateGym();
  const athlete = await getOrCreateUser(body.email.trim());

  const membership = await prisma.gymMembership.upsert({
    where: { gymId_athleteId: { gymId: gym.id, athleteId: athlete.id } },
    create: {
      gymId: gym.id,
      athleteId: athlete.id,
      status: body.status ?? "PENDING",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    update: { status: body.status ?? "PENDING" },
  });

  return NextResponse.json({ ok: true, membership });
}

