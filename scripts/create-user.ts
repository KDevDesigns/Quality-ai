// Creates an account from the command line; this is how the first admin gets in. There is no open sign-up.
//   npm run user:create -- --admin --name "Juan Dela Cruz" --email juan@example.gov.ph
//   npm run user:create -- --role DEV --name "…" --email …
// Prints a temporary password once; it must be changed at first sign-in.

import "dotenv/config";
import { parseArgs } from "node:util";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../lib/generated/prisma/client";
import { generateTempPassword } from "../lib/auth/password";
import { isRole } from "../lib/auth/permissions";
import { authStore } from "../lib/auth/store";
import { userInput } from "../lib/schemas/user";

const { values } = parseArgs({
  options: {
    admin: { type: "boolean", default: false },
    role: { type: "string" },
    name: { type: "string" },
    email: { type: "string" },
  },
});

async function main() {
  const role = values.admin ? "ADMIN" : (values.role ?? "").toUpperCase();
  if (!isRole(role)) throw new Error("Pass --admin, or --role ADMIN|QA|DEV.");
  const parsed = userInput.safeParse({ name: values.name ?? "", email: values.email ?? "", role });
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => `--${i.path.join(".")}: ${i.message}`).join("\n"));

  const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }) });
  try {
    if (await db.user.findUnique({ where: { email: parsed.data.email } })) throw new Error(`An account for ${parsed.data.email} already exists.`);
    const password = generateTempPassword();
    await authStore(db).createUser({ ...parsed.data, password });
    console.log(`Created ${parsed.data.role} ${parsed.data.name} <${parsed.data.email}>`);
    console.log(`Temporary password (shown once, change it at first sign-in): ${password}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
