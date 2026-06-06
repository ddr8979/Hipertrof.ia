import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET() {
  try {
    const trainers = await prisma.user.findMany({
      where: {
        role: { in: ["TRAINER", "ADMIN"] },
        isApproved: true,
        email: { not: "carrizoaxel67@gmail.com" },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ trainers });
  } catch (err) {
    return NextResponse.json({ error: "Error al cargar trainers" }, { status: 500 });
  }
}
