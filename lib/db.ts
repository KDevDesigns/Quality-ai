import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/lib/generated/prisma/client";

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env)");
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaCtor?: typeof PrismaClient };

// After `prisma generate` hot-reloads the client class, a cached instance would lack new models, so rebuild it.
export const db =
  globalForPrisma.prisma && globalForPrisma.prismaCtor === PrismaClient ? globalForPrisma.prisma : createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaCtor = PrismaClient;
}
