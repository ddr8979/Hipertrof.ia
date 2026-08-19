import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var __prisma: PrismaClient | undefined;
}

function getAdapter() {
  const dbUrl = process.env.DATABASE_URL || "file:prisma/dev.db";
  if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
    const pool = new Pool({ connectionString: dbUrl });
    return new PrismaPg(pool);
  }
  return new PrismaLibSql({ url: dbUrl });
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({ adapter: getAdapter() });

if (process.env.NODE_ENV !== "production") globalThis.__prisma = prisma;




