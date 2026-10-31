import "server-only";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { createClient } from "@/lib/db-client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaCtor?: typeof PrismaClient };

// After `prisma generate` hot-reloads the client class, a cached instance would lack new models, so rebuild it.
function getClient(): PrismaClient {
  if (globalForPrisma.prisma && globalForPrisma.prismaCtor === PrismaClient) return globalForPrisma.prisma;
  const client = createClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaCtor = PrismaClient;
  return client;
}

// Built on first use, not on import: `next build` loads every route to read its config, and a build without
// DATABASE_URL (a Vercel preview) must not fail just for importing this file.
export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
