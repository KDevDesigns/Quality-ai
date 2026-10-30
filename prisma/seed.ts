import "../scripts/env";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "../lib/db-client";
import { importAreas } from "../lib/areas/import";

const db = createClient();

async function main() {
  // The ERP module directory is loaded once; after that admins own it in Team & modules.
  if ((await db.erpArea.count()) > 0) {
    console.log(`Nothing to seed: the module directory already has ${await db.erpArea.count()} entries.`);
    return;
  }
  await importAreas(db, JSON.parse(readFileSync(path.join(process.cwd(), "data", "erp-areas.json"), "utf8")));
  console.log(`Seeded ${await db.erpArea.count()} modules and sub-modules from data/erp-areas.json.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
