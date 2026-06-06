import { prisma } from "@/server/db";

export async function getOrCreateUser(email: string) {
  return prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
  });
}

