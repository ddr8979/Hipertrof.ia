import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET() {
  const notifications = await prisma.whatsappNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ notifications });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { userId?: string; phone?: string; message?: string; reason?: string };
  if (!body.userId || !body.phone || !body.message) {
    return NextResponse.json({ error: "userId, phone and message are required" }, { status: 400 });
  }

  const notification = await prisma.whatsappNotification.create({
    data: {
      userId: body.userId,
      phone: body.phone,
      message: body.message,
      reason: body.reason ?? "payment_reminder",
      sent: true,
      sentAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    notification,
    note: "MVP stub: este endpoint simula envio, luego se conecta con proveedor real.",
  });
}

