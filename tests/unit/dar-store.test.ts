import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { REST_DAY } from "@/lib/dar/autofill";
import { darXlsx } from "@/lib/dar/excel";
import { darStore, type DarUser } from "@/lib/dar/store";
import { createTestDb } from "./helpers/test-db";

let db: PrismaClient;
let cleanup: () => Promise<void>;
let ana: DarUser, ben: DarUser;
let bca: string, rsp: string;

const OCT = { start: "2026-10-01", end: "2026-10-15" };
/** 10:00 in Manila on that October day. */
const day = (d: number) => new Date(Date.UTC(2026, 9, d, 2));
const now = () => new Date("2026-10-16T01:00:00Z");

beforeAll(async () => {
  ({ db, cleanup } = await createTestDb());
});
afterAll(async () => {
  await cleanup();
});

beforeEach(async () => {
  await db.darReport.deleteMany();
  await db.darProfile.deleteMany();
  await db.setting.deleteMany({ where: { key: "dar.template" } });
  await db.ticket.deleteMany();
  await db.erpArea.deleteMany({ where: { parentId: { not: null } } });
  await db.erpArea.deleteMany();
  await db.user.deleteMany();
  const mk = async (name: string) => {
    const u = await db.user.create({ data: { name, email: `${name.toLowerCase()}@x.ph`, passwordHash: "x", role: "QA" } });
    return { id: u.id, name };
  };
  ana = await mk("Ana");
  ben = await mk("Ben");
  bca = (await db.erpArea.create({ data: { name: "Billing & Collection", code: "BCA" } })).id;
  const hr = (await db.erpArea.create({ data: { name: "HR", code: "HR" } })).id;
  rsp = (await db.erpArea.create({ data: { name: "Recruitment", code: "HR-RSP", parentId: hr } })).id;

  // Ana files a BCA ticket on Oct 1 and replies on an HR-RSP ticket on Oct 5; Ben files one on Oct 2.
  let n = 0;
  const ticket = (reporterId: string, areaId: string, at: Date) =>
    db.ticket.create({ data: { number: ++n, type: "BUG", title: "T", description: "D", reporterId, areaId, createdAt: at, lastActivityAt: at } });
  await ticket(ana.id, bca, day(1));
  const other = await ticket(ben.id, rsp, day(2));
  await db.ticketComment.create({ data: { ticketId: other.id, authorId: ana.id, body: "hi", createdAt: day(5) } });
  await db.ticketEvent.create({ data: { ticketId: other.id, actorId: ana.id, kind: "STATUS", from: "FIXED", to: "VERIFIED", createdAt: day(5) } });
});

describe("darStore", () => {
  it("fills a fresh report from the tester's own activity only", async () => {
    const s = darStore(db, now);
    const r = await s.load(ana, OCT);
    expect(r.saved).toBe(false);
    expect(r.days).toHaveLength(15);
    expect(r.cells.core[0][0]).toBe("QA - BCA");
    expect(r.cells.core[0][1]).toBe(REST_DAY); // Ben's ticket, not Ana's
    expect(r.cells.core[0][4]).toBe("QA - HR-RSP");
    expect(r.cells.support[0].every((c) => c === "")).toBe(true); // not an auto-fill row
    expect(r.cells.support[1][0]).toBe("QA - BCA");
    expect(r.daysAttended).toBe(2);
    expect(r.dateSubmitted).toBe("2026-10-16");

    expect((await s.load(ben, OCT)).cells.core[0][1]).toBe("QA - HR-RSP");
  });

  it("saves edits per person and keeps them apart", async () => {
    const s = darStore(db, now);
    const r = await s.load(ana, OCT);
    r.cells.core[0][2] = "HR201";
    r.cells.support[0][2] = "Encoding";
    await s.save(ana, OCT, { ...r.cells, core: [[...r.cells.core[0], "too many"]] }, "2026-10-17");

    const again = await s.load(ana, OCT);
    expect(again.saved).toBe(true);
    expect(again.cells.core[0][2]).toBe("HR201");
    expect(again.cells.core[0]).toHaveLength(15);
    expect(again.dateSubmitted).toBe("2026-10-17");
    expect(again.daysAttended).toBe(3);
    expect((await s.load(ben, OCT)).saved).toBe(false);
    expect(await s.list(ana.id)).toHaveLength(1);
    expect(await s.list(ben.id)).toHaveLength(0);

    // Refill replaces the auto-fill rows only.
    const cells = await s.refill(ana, OCT);
    expect(cells.core[0][2]).toBe(REST_DAY);
    expect(cells.support[0][2]).toBe("Encoding");
  });

  it("uses the tester's own details over the template, and the template's after a reset", async () => {
    const s = darStore(db, now);
    await s.saveTemplate({ ...(await s.template()), unit: "QA Unit" });
    await s.saveProfile(ana.id, { fullName: "Ana B. Cruz", position: "", coreFunctions: [{ duty: "Mine", mfo: "", autofill: false }], supportFunctions: null });
    let h = await s.header(ana);
    expect(h).toMatchObject({ name: "Ana B. Cruz", position: "System Analyst", unit: "QA Unit" });
    expect(h.core.map((f) => f.duty)).toEqual(["Mine"]);
    expect((await s.load(ana, OCT)).cells.core[0][0]).toBe(""); // own row isn't auto-filled

    await s.saveProfile(ana.id, { fullName: "", position: "Tester", coreFunctions: null, supportFunctions: null });
    h = await s.header(ana);
    expect(h).toMatchObject({ name: "Ana", position: "Tester" });
    expect(h.core[0].autofill).toBe(true);
  });

  it("writes an Excel file with the header, the days and every row", async () => {
    const s = darStore(db, now);
    const r = await s.load(ana, OCT);
    const files = unzipSync(new Uint8Array(await darXlsx(r, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))));
    const all = Object.values(files).map((f) => strFromU8(f)).join("\n");
    for (const text of ["DAVAO CITY WATER DISTRICT", "Name of PBE :", "Oct 01, 2026 to Oct 15, 2026", "2 Days", "QA - BCA", "A.) CORE FUNCTIONS", "B.) SUPPORT FUNCTION", "Noted by:"]) {
      expect(all).toContain(text);
    }
    expect(all).toContain("OCT\n1\nTHU");
    expect(all).toMatch(/<mergeCell /); // merged header and label cells
    // Long bond (8.5 × 13 in, Excel paper 14), landscape, fitted to one page, with the workbook's own fills.
    expect(all).toContain('<pageSetup paperSize="14" orientation="landscape" fitToWidth="1" fitToHeight="1"/>');
    expect(all).toContain('<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>');
    expect(all.match(/<pageSetup /g)).toHaveLength(1);
    expect(all).toContain('<pageMargins left="0.5" right="0.5" top="0.5" bottom="0.5" header="0" footer="0"/>');
    expect(all).toMatch(/FFCC99/i);
    expect(all).toMatch(/FBD4B4/i);
    expect(Object.keys(files).some((f) => f.startsWith("xl/media/"))).toBe(true); // the seal
    expect(all).not.toMatch(/<f>/); // no formulas
  });
});
