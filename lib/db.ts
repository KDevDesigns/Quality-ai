import "server-only";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { createClient } from "@/lib/db-client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaCtor?: typeof PrismaClient };

// After `prisma generate` hot-reloads the client class, a cached instance would lack new models, so rebuild it.
export const db =
  globalForPrisma.prisma && globalForPrisma.prismaCtor === PrismaClient ? globalForPrisma.prisma : createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaCtor = PrismaClient;
}
