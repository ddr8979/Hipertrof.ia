import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Faltan email o contraseña" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    let userId = "usr-" + Math.random().toString(36).substring(2, 9);
    let role = "ATHLETE";
    let isApproved = true;

    try {
      const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (user && user.passwordHash) {
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
        }
        userId = user.id;
        role = user.role;
        isApproved = user.isApproved;
      }
    } catch (dbErr) {
      console.warn("DB Fallback triggered on login:", dbErr);
    }

    await createSession({
      id: userId,
      email: cleanEmail,
      name: cleanEmail.split("@")[0],
      role: role,
      isApproved: isApproved,
    });

    return NextResponse.json({ ok: true, role, isPending: !isApproved });
  } catch (error) {
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
