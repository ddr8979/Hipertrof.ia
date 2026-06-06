import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function POST(req: Request) {
  const body = (await req.json()) as { membershipId?: string };
  if (!body.membershipId) return NextResponse.json({ error: "membershipId is required" }, { status: 400 });

  const membership = await prisma.gymMembership.findUnique({
    where: { id: body.membershipId },
  });

  if (!membership) return NextResponse.json({ error: "membership not found" }, { status: 404 });

  const allowed = membership.status === "ACTIVE";

  const checkIn = await prisma.gymCheckIn.create({
    data: {
      gymId: membership.gymId,
      athleteId: membership.athleteId,
      allowed,
      statusAtTime: membership.status,
    },
  });

  return NextResponse.json({
    ok: true,
    allowed,
    color: allowed ? "green" : "red",
    message: allowed ? "Acceso permitido" : "Acceso bloqueado por estado de cuota",
    checkIn,
  });
}

