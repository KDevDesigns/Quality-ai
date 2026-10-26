import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/lib/generated/prisma/client";

/** A throwaway SQLite database with every migration applied. Never touches prisma/dev.db. */
export async function createTestDb() {
  const dir = mkdtempSync(path.join(tmpdir(), "qa-ai-test-"));
  const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${path.join(dir, "test.db")}` }) });

  const migrations = path.join(process.cwd(), "prisma", "migrations");
  for (const name of readdirSync(migrations).filter((n) => /^\d+_/.test(n)).sort()) {
    const sql = readFileSync(path.join(migrations, name, "migration.sql"), "utf8");
    for (const stmt of sql.split(/;\s*\r?\n/).map((s) => s.trim()).filter((s) => s && !/^(--[^\n]*\n?)+$/.test(s))) {
      await db.$executeRawUnsafe(stmt);
    }
  }

  return {
    db,
    async cleanup() {
      await db.$disconnect();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
