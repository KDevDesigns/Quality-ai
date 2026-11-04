// Loads a backup made by scripts/backup.ts into an EMPTY Supabase project: the database, then any file Storage lacks.
//   npx tsx scripts/restore.ts --file "C:\Users\me\Documents\QA Hub Backups\Database\QA Hub database 2026-10-31 0030.json"
// First point .env.local at the new project and run `npm run db:deploy` (not the seed). Everyone signs in again after.

import "./env";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { parseSnapshot, restoreSnapshot, snapshotFiles } from "../lib/backup";
import { createClient } from "../lib/db-client";
import { attachmentsBucket } from "./storage";

const { values } = parseArgs({ options: { file: { type: "string" }, files: { type: "string" } } });

async function main() {
  if (!values.file) throw new Error('Pass --file "<backup folder>\\Database\\QA Hub database ….json".');
  const snapshot = parseSnapshot(JSON.parse(readFileSync(values.file, "utf8")));
  // The backup keeps files in <backup folder>\Files, next to the Database folder.
  const filesDir = values.files ?? path.join(path.dirname(path.dirname(path.resolve(values.file))), "Files");
  console.log(`Backup taken ${new Date(snapshot.takenAt).toLocaleString()}`);

  const db = createClient();
  const counts = await restoreSnapshot(db, snapshot).finally(() => db.$disconnect());
  console.log("Database restored:", Object.entries(counts).map(([t, n]) => `${t} ${n}`).join(", "));

  const bucket = attachmentsBucket();
  let uploaded = 0;
  const missing: string[] = [];
  const failed: string[] = [];
  for (const f of snapshotFiles(snapshot)) {
    const src = path.join(filesDir, ...f.storedName.split("/"));
    if (!existsSync(src)) {
      missing.push(f.storedName);
      continue;
    }
    const { error } = await bucket.upload(f.storedName, readFileSync(src), { contentType: f.mime, upsert: false });
    if (!error) uploaded++;
    else if (!/exists|duplicate/i.test(error.message)) failed.push(`${f.storedName} (${error.message})`);
  }
  console.log(`Files: ${uploaded} uploaded to Storage; the rest were already there.`);
  if (missing.length) console.error(`Not in ${filesDir}, so those files won't open:\n  ${missing.join("\n  ")}`);
  if (failed.length) console.error(`Upload failed:\n  ${failed.join("\n  ")}`);
  if (missing.length || failed.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
