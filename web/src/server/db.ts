import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    adapter: new PrismaLibSql({
      // file: URL keeps local SQLite for development.
      url: process.env.DATABASE_URL ?? "file:./dev.db",
    }),
  });

if (process.env.NODE_ENV !== "production") globalThis.__prisma = prisma;

