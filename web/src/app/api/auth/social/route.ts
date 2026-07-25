import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { provider, email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Falta el email" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name || cleanEmail.split("@")[0];
    let userId = "usr-" + Math.random().toString(36).substring(2, 9);
    let role = "ATHLETE";
    let isApproved = true;

    try {
      let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: cleanName,
            passwordHash: `oauth-${(provider || "social").toLowerCase()}-protected`,
            role: "ATHLETE",
            isApproved: true,
            profile: { create: {} },
          },
        });
      }
      userId = user.id;
      role = user.role;
      isApproved = user.isApproved;
    } catch (dbErr) {
      console.warn("DB Fallback triggered on social login:", dbErr);
    }

    await createSession({
      id: userId,
      email: cleanEmail,
      name: cleanName,
      role: role,
      isApproved: isApproved,
    });

    return NextResponse.json({ ok: true, role });
  } catch (error: any) {
    console.error("Error en social login:", error);
    return NextResponse.json({ error: "Error al autenticar" }, { status: 500 });
  }
}
