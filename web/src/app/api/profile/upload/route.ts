import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/server/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No se proporcionó ninguna imagen" }, { status: 400 });

    // Validar formato base64
    const match = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) return NextResponse.json({ error: "Formato de imagen inválido" }, { status: 400 });

    // Validar tamaño antes de guardar (la compresión en cliente produce <15 KB)
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > 100 * 1024) {
      return NextResponse.json({ error: "La imagen excede el límite de tamaño de 100 KB" }, { status: 400 });
    }

    // Guardar el string base64 directamente en la base de datos (serverless-safe, costo cero)
    await prisma.profile.update({
      where: { userId: session.id },
      data: { avatarUrl: image },
    });

    return NextResponse.json({ ok: true, avatarUrl: image });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
