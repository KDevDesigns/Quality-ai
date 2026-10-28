import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/lib/generated/prisma/client";

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env)");
  // Wait up to 5 s for a lock instead of failing, now that several people write at once.
  const client = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url, timeout: 5000 }) });
  // WAL lets readers and a writer work at the same time. The mode is stored in the database file, so this is a one-time switch.
  client.$queryRawUnsafe("PRAGMA journal_mode = WAL").catch((e) => console.error(`[db] couldn't enable WAL: ${e instanceof Error ? e.message : e}`));
  return client;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaCtor?: typeof PrismaClient };

// After `prisma generate` hot-reloads the client class, a cached instance would lack new models, so rebuild it.
export const db =
  globalForPrisma.prisma && globalForPrisma.prismaCtor === PrismaClient ? globalForPrisma.prisma : createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaCtor = PrismaClient;
}
