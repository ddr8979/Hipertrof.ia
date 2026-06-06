import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password, name, role } = await req.json();

  if (!email || !password || !name)
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });

  const hash = await bcrypt.hash(password, 12);

  let resolvedRole = (role ?? "ATHLETE") as string;
  let isApproved = resolvedRole === "TRAINER" || resolvedRole === "ADMIN";

  if (email.toLowerCase() === "carrizoaxel67@gmail.com") {
    resolvedRole = "ADMIN";
    isApproved = true;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: hash,
      role: resolvedRole as any,
      isApproved,
      profile: { create: {} },
    },
  });

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, isApproved: user.isApproved });
  return NextResponse.json({ ok: true, role: user.role, isPending: !user.isApproved });
}
