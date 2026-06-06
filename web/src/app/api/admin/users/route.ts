import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/server/db";

async function requireAdmin(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TRAINER" && session.role !== "OWNER")) {
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
    if (session.role === "TRAINER") {
      whereClause.role = "ATHLETE";
      whereClause.trainerId = session.id;
    } else if (session.role === "OWNER" || session.role === "ADMIN") {
      whereClause.role = { in: ["ATHLETE", "TRAINER"] };
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

// PATCH /api/admin/users — aprueba, rechaza o cambia el rol de un usuario
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "TRAINER" && session.role !== "OWNER")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { userId, approved, role } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId es requerido" }, { status: 400 });
  }

  // Solo ADMIN y OWNER pueden cambiar roles
  if (role && session.role !== "ADMIN" && session.role !== "OWNER") {
    return NextResponse.json({ error: "No autorizado para cambiar roles" }, { status: 403 });
  }

  const updateData: any = {};
  if (typeof approved === "boolean") updateData.isApproved = approved;
  if (role) updateData.role = role;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, isApproved: true },
  });

  return NextResponse.json({ ok: true, user });
}

// DELETE /api/admin/users — elimina un usuario por completo
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "OWNER")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId es requerido" }, { status: 400 });
  }

  if (userId === session.id) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return NextResponse.json({ ok: true });
}
