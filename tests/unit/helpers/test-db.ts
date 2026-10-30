import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@/lib/generated/prisma/client";

/** A throwaway in-memory Postgres (PGlite) with every migration applied. Never touches Supabase. */
export async function createTestDb() {
  const pg = new PGlite();
  // Prisma creates this table itself before migrating; the RLS migration expects it.
  await pg.exec(`CREATE TABLE "_prisma_migrations" (id text PRIMARY KEY)`);

  const migrations = path.join(process.cwd(), "prisma", "migrations");
  for (const name of readdirSync(migrations).filter((n) => /^\d+_/.test(n)).sort()) {
    await pg.exec(readFileSync(path.join(migrations, name, "migration.sql"), "utf8"));
  }

  const db = new PrismaClient({ adapter: new PrismaPGlite(pg) });
  return {
    db,
    async cleanup() {
      await db.$disconnect();
      await pg.close();
    },
  };
}
