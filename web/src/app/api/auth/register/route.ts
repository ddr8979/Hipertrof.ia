import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password, name, role, trainerId } = await req.json();

  if (!email || !password || !name)
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json({ error: "Email o Teléfono ya registrado" }, { status: 409 });

  const hash = await bcrypt.hash(password, 12);

  let resolvedRole = (role ?? "ATHLETE") as string;
  let isApproved = false;

  if (email.toLowerCase() === "carrizoaxel67@gmail.com") {
    resolvedRole = "OWNER";
    isApproved = true;
  }

  if (resolvedRole === "ATHLETE" && !trainerId) {
    return NextResponse.json({ error: "Debes seleccionar un Personal Trainer" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: hash,
      role: resolvedRole as any,
      isApproved,
      trainerId: resolvedRole === "ATHLETE" ? trainerId : null,
      profile: { create: {} },
    },
  });

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, isApproved: user.isApproved });
  return NextResponse.json({ ok: true, role: user.role, isPending: !user.isApproved });
}
