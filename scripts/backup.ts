// Nightly backup: a consistent copy of the SQLite database plus a mirror of the ticket uploads.
//   npm run backup                      (uses BACKUP_DIR from .env.local)
//   npm run backup -- --to "E:\qa-hub-backups" --keep 14
// Schedule it with Windows Task Scheduler; see docs/OPERATIONS.md.

import { config } from "dotenv";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";

config({ path: [".env.local", ".env"], quiet: true });

const { values } = parseArgs({ options: { to: { type: "string" }, keep: { type: "string", default: "14" } } });

async function main() {
  const dest = values.to ?? process.env.BACKUP_DIR;
  if (!dest) throw new Error("Set BACKUP_DIR in .env.local or pass --to <folder>.");
  const keep = Math.max(1, Number(values.keep) || 14);
  const dbDir = path.join(dest, "db");
  mkdirSync(dbDir, { recursive: true });

  // Local time, so the file names match the clock people see when choosing a snapshot to restore.
  const d = new Date();
  const p2 = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}`;
  const file = path.join(dbDir, `qa-hub-${stamp}.db`);
  if (existsSync(file)) throw new Error(`${file} already exists.`);

  // VACUUM INTO writes a consistent snapshot even while the app is running (WAL mode).
  const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }) });
  try {
    await db.$executeRawUnsafe(`VACUUM INTO '${file.replaceAll("'", "''")}'`);
  } finally {
    await db.$disconnect();
  }
  console.log(`Database → ${file}`);

  const old = readdirSync(dbDir).filter((n) => /^qa-hub-\d{8}-\d{4}\.db$/.test(n)).sort().slice(0, -keep);
  for (const n of old) rmSync(path.join(dbDir, n));
  if (old.length) console.log(`Removed ${old.length} backup${old.length === 1 ? "" : "s"} older than the last ${keep}.`);

  // Upload files never change after they are written (each has a unique name), so only new ones are copied.
  const uploads = process.env.UPLOAD_DIR;
  if (uploads && existsSync(uploads)) {
    cpSync(uploads, path.join(dest, "uploads"), { recursive: true, force: false, errorOnExist: false });
    console.log(`Uploads → ${path.join(dest, "uploads")}`);
  } else {
    console.log("No UPLOAD_DIR yet; skipped uploads.");
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
