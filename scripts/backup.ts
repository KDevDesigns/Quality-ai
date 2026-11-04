// Nightly backup from Supabase to this PC: the whole database as one JSON file, plus every screenshot and video.
//   npm run backup                        (into Documents\QA Hub Backups, or BACKUP_DIR from .env.local)
//   npx tsx scripts/backup.ts --to "E:\QA Hub Backups" --keep 14
// Schedule it with Windows Task Scheduler; see docs/OPERATIONS.md. Restore with scripts/restore.ts.

import "./env";
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { snapshotFiles, takeSnapshot } from "../lib/backup";
import { createClient } from "../lib/db-client";
import { attachmentsBucket } from "./storage";

const { values } = parseArgs({ options: { to: { type: "string" }, keep: { type: "string", default: "14" } } });

const DB_FILE = /^QA Hub database \d{4}-\d{2}-\d{2} \d{4}\.json$/;

const README = `QA Hub backups
==============

Database\\  One file per night: "QA Hub database <date> <time>.json". The newest ones are kept, older ones are deleted.
Files\\     Every screenshot and video attached to a ticket and every profile photo, in the same folders as in Supabase Storage.

These hold ticket data (customer names, account numbers, amounts). Don't share or upload them anywhere.

To restore into a new, empty Supabase project, see "Backups" in docs/OPERATIONS.md:
  npx tsx scripts/restore.ts --file "<this folder>\\Database\\QA Hub database <date> <time>.json"
`;

async function main() {
  const root = values.to ?? process.env.BACKUP_DIR ?? path.join(os.homedir(), "Documents", "QA Hub Backups");
  const keep = Math.max(1, Number(values.keep) || 14);
  const dbDir = path.join(root, "Database");
  const filesDir = path.join(root, "Files");
  mkdirSync(dbDir, { recursive: true });
  mkdirSync(filesDir, { recursive: true });
  writeFileSync(path.join(root, "READ ME.txt"), README.replaceAll("\n", "\r\n"));

  // Local time, so the file names match the clock people see when choosing one to restore.
  const d = new Date();
  const p2 = (n: number) => String(n).padStart(2, "0");
  const name = `QA Hub database ${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}${p2(d.getMinutes())}.json`;
  const file = path.join(dbDir, name);
  if (existsSync(file)) throw new Error(`${file} already exists.`);

  const db = createClient();
  const snapshot = await takeSnapshot(db, d).finally(() => db.$disconnect());
  writeFileSync(`${file}.part`, JSON.stringify(snapshot));
  renameSync(`${file}.part`, file);
  const t = snapshot.tables;
  console.log(`Database → ${file}`);
  console.log(`  ${t.user.length} accounts, ${t.ticket.length} tickets, ${t.ticketComment.length} replies, ${t.attachment.length} attachments, ${t.darReport.length} DARs`);

  const old = readdirSync(dbDir).filter((n) => DB_FILE.test(n)).sort().slice(0, -keep);
  for (const n of old) rmSync(path.join(dbDir, n));
  if (old.length) console.log(`Removed ${old.length} database backup${old.length === 1 ? "" : "s"} older than the last ${keep}.`);

  // Files never change after upload (each has a unique name), so only new ones are downloaded.
  const bucket = attachmentsBucket();
  let copied = 0;
  let bytes = 0;
  const failed: string[] = [];
  for (const f of snapshotFiles(snapshot)) {
    const dest = path.join(filesDir, ...f.storedName.split("/"));
    if (existsSync(dest)) continue;
    const { data, error } = await bucket.download(f.storedName);
    if (error || !data) {
      failed.push(`${f.storedName} (${error?.message ?? "no data"})`);
      continue;
    }
    mkdirSync(path.dirname(dest), { recursive: true });
    const buf = Buffer.from(await data.arrayBuffer());
    writeFileSync(`${dest}.part`, buf);
    renameSync(`${dest}.part`, dest);
    copied++;
    bytes += buf.length;
  }
  console.log(`Files → ${filesDir}: ${copied} new (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
  if (failed.length) {
    console.error(`Couldn't download ${failed.length} file${failed.length === 1 ? "" : "s"}:\n  ${failed.join("\n  ")}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
