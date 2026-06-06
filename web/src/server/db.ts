import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var __prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalThis.__prisma = prisma;

