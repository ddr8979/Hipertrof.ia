import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password)
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash)
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok)
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, isApproved: user.isApproved });
  return NextResponse.json({ ok: true, role: user.role, isPending: !user.isApproved });
}
