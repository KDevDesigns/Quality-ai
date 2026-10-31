import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LEGACY_TEMPLATE } from "@/lib/dar/template";

// Migration dar_own_details runs once on the live database: everyone who already had a DAR keeps what it showed.

const MIGRATION = "20261101000300_dar_own_details";
const dir = path.join(process.cwd(), "prisma", "migrations");
const sql = (name: string) => readFileSync(path.join(dir, name, "migration.sql"), "utf8");

let pg: PGlite;

beforeAll(async () => {
  pg = new PGlite();
  await pg.exec(`CREATE TABLE "_prisma_migrations" (id text PRIMARY KEY)`);
  for (const name of readdirSync(dir).filter((n) => /^\d+_/.test(n) && n < MIGRATION).sort()) await pg.exec(sql(name));

  const user = (id: string, role: string) =>
    pg.query(`INSERT INTO "User" (id, name, email, "passwordHash", role, "updatedAt") VALUES ($1, $1, $1 || '@x.ph', 'x', $2::"UserRole", now())`, [id, role]);
  await user("ana", "QA");
  await user("kev", "ADMIN");
  await user("dan", "DEV");
  // Ana set her own name and duties; Kevin only saved reports; Dan never used My DAR.
  await pg.query(`INSERT INTO "DarProfile" ("userId", "fullName", "coreFunctions", "updatedAt") VALUES ('ana', 'Ana Cruz', $1::jsonb, now())`, [
    JSON.stringify([{ duty: "Own", mfo: "", autofill: true }]),
  ]);
  await pg.query(`INSERT INTO "DarReport" (id, "userId", "periodStart", "periodEnd", cells, "updatedAt") VALUES ('r1', 'kev', '2026-10-16', '2026-10-31', '{}', now())`);
  await pg.query(`INSERT INTO "Setting" (key, value, "updatedAt") VALUES ('dar.template', $1::jsonb, now())`, [JSON.stringify({ unit: "QA Unit", position: "Analyst" })]);

  await pg.exec(sql(MIGRATION));
});

afterAll(async () => {
  await pg.close();
});

type Row = Record<string, unknown>;
const profile = async (id: string) => (await pg.query<Row>(`SELECT * FROM "DarProfile" WHERE "userId" = $1`, [id])).rows[0];

describe("migration dar_own_details", () => {
  it("copies the template into the details of everyone who had a DAR, keeping what they had set", async () => {
    expect(await profile("ana")).toMatchObject({
      fullName: "Ana Cruz",
      position: "Analyst",
      unit: "QA Unit",
      department: LEGACY_TEMPLATE.department,
      confirmedByName: LEGACY_TEMPLATE.confirmedBy.name,
      notedByTitle: LEGACY_TEMPLATE.notedBy.title,
      coreFunctions: [{ duty: "Own", mfo: "", autofill: true }],
      supportFunctions: LEGACY_TEMPLATE.supportFunctions,
    });
    expect(await profile("kev")).toMatchObject({ fullName: null, position: "Analyst", coreFunctions: LEGACY_TEMPLATE.coreFunctions });
  });

  it("leaves people who never used My DAR empty, and removes the template", async () => {
    expect(await profile("dan")).toBeUndefined();
    expect((await pg.query(`SELECT 1 FROM "Setting" WHERE key = 'dar.template'`)).rows).toHaveLength(0);
  });
});
