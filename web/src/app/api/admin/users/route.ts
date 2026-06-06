import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/server/db";

async function requireAdmin(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TRAINER")) {
    return null;
  }
  return session;
}

// GET /api/admin/users?pending=true — lista usuarios (todos o solo pendientes)
export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const onlyPending = req.nextUrl.searchParams.get("pending") === "true";

  let whereClause: any = {};
  if (onlyPending) {
    whereClause.isApproved = false;
    whereClause.role = "ATHLETE";
    if (session.role === "TRAINER") {
      whereClause.trainerId = session.id;
    }
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isApproved: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

// PATCH /api/admin/users — aprueba o rechaza un usuario
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TRAINER")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { userId, approved } = await req.json();
  if (!userId || typeof approved !== "boolean") {
    return NextResponse.json({ error: "userId y approved son requeridos" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isApproved: approved },
    select: { id: true, name: true, email: true, isApproved: true },
  });

  return NextResponse.json({ ok: true, user });
}
