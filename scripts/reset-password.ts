// Gives an account a new temporary password from the command line: the way back in when the only admin is locked out.
//   npx tsx scripts/reset-password.ts --email juan@davao-water.gov.ph
// Prints the temporary password once; it must be changed at first sign-in. Signs the account out everywhere.

import "./env";
import { parseArgs } from "node:util";
import { createClient } from "../lib/db-client";
import { generateTempPassword } from "../lib/auth/password";
import { authStore, normalizeEmail } from "../lib/auth/store";

const { values } = parseArgs({ options: { email: { type: "string" } } });

async function main() {
  if (!values.email) throw new Error("Pass --email of the account to reset.");
  const db = createClient();
  try {
    const user = await db.user.findUnique({ where: { email: normalizeEmail(values.email) }, select: { id: true, name: true, role: true } });
    if (!user) throw new Error(`There is no account for ${values.email}.`);
    const password = generateTempPassword();
    const auth = authStore(db);
    await auth.setPassword(user.id, password, true);
    await auth.deleteUserSessions(user.id);
    console.log(`Reset the password of ${user.role} ${user.name} <${normalizeEmail(values.email)}> and signed them out everywhere.`);
    console.log(`Temporary password (shown once, change it at first sign-in): ${password}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
