import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { provider, email, name, idToken } = await req.json();

    if (!provider || !email) {
      return NextResponse.json({ error: "Faltan proveedor o email de la cuenta social" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name || cleanEmail.split("@")[0];

    // Upsert user based on social login email
    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: cleanName,
          passwordHash: `oauth-${provider.toLowerCase()}-protected`,
          role: "ATHLETE",
          isApproved: true,
          profile: { create: {} },
        },
      });
    }

    // Create session cookie
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isApproved: user.isApproved,
    });

    return NextResponse.json({ ok: true, role: user.role });
  } catch (error: any) {
    console.error("Error en OAuth social login:", error);
    return NextResponse.json({ error: "Error al procesar el inicio de sesión social" }, { status: 500 });
  }
}
