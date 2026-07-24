import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

declare global {
  var __prisma: PrismaClient | undefined;
}

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:prisma/dev.db",
});

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalThis.__prisma = prisma;



