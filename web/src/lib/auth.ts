import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "hypertrofia-dev-secret-change-in-prod"
);
const COOKIE = "ht_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: "ATHLETE" | "TRAINER" | "GYM_OWNER" | "ADMIN" | "OWNER";
  isApproved: boolean;
};

// ── Sign a JWT and set cookie ────────────────────────────────
export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

// ── Read and verify session from cookie ─────────────────────
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    const base = payload as unknown as SessionUser;
    // Always hydrate role & isApproved from DB so changes take effect without re-login
    const fresh = await prisma.user.findUnique({
      where: { id: base.id },
      select: { role: true, isApproved: true, name: true },
    });
    if (!fresh) return null;
    return {
      ...base,
      role: fresh.role as SessionUser["role"],
      isApproved: fresh.isApproved,
      name: fresh.name,
    };
  } catch {
    return null;
  }
}

// ── Destroy session ──────────────────────────────────────────
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

// ── Get full user from DB via session ───────────────────────
export async function getSessionUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.id },
    include: { profile: true },
  });
}
