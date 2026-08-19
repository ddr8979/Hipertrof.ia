import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";

const COOKIE_NAME = "ht_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET no está definido en producción");
    }
    return new TextEncoder().encode("hipertrofia-super-secret-jwt-key-2026-xK9mP3qZ");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  isApproved: boolean;
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_INSECURE !== "1" && process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export const TRAINER_ROLES = ["TRAINER", "ADMIN", "OWNER"] as const;
export const STAFF_ROLES = ["ADMIN", "OWNER"] as const;

export function isTrainer(role?: string | null) {
  return !!role && (TRAINER_ROLES as readonly string[]).includes(role);
}

export function isStaff(role?: string | null) {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

/** Devuelve el usuario de la sesión verificado contra la DB, o null. */
export async function getAuthUser() {
  const session = await getSession();
  if (!session) return null;
  try {
    return await prisma.user.findUnique({ where: { id: session.id } });
  } catch {
    return null;
  }
}
