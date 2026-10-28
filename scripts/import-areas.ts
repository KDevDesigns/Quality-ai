// Loads or re-syncs the ERP module directory from data/erp-areas.json.
//   npm run areas:import               add new modules, update existing ones (matched by code, then name)
//   npm run areas:import -- --prune    also remove modules no longer in the file, if nobody is assigned to them

import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";
import { importAreas } from "../lib/areas/import";

const { values } = parseArgs({ options: { prune: { type: "boolean", default: false } } });

async function main() {
  const json = JSON.parse(readFileSync(path.join(process.cwd(), "data", "erp-areas.json"), "utf8"));
  const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }) });
  try {
    const r = await importAreas(db, json, { prune: values.prune });
    const show = (title: string, list: string[]) => list.length && console.log(`${title} (${list.length}):\n${list.map((n) => `  ${n}`).join("\n")}`);
    show("Created", r.created);
    show("Updated", r.updated);
    show("Removed", r.removed);
    show(values.prune ? "Kept (people are assigned; move them first)" : "Not in the file (rerun with --prune to remove empty ones)", r.kept);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
