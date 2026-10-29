import { Prisma, type PrismaClient } from "@/lib/generated/prisma/client";
import { buildCells, dayEntries, daysAttended, fitCells, refillCells, type Activity, type DarCells } from "./autofill";
import { manilaDay, periodDays, periodRange, type Period, type PeriodDay } from "./period";
import { readDarTemplate, resolveHeader, type DarHeader, type DarProfileInput, type DarTemplate } from "./template";

// Prisma glue for DARs. Every read and write is for one person's own reports; nobody, admins included, reads
// another tester's DAR. Takes the client as a parameter so tests can run it against a throwaway SQLite file.

const TEMPLATE_KEY = "dar.template";

export type DarUser = { id: string; name: string };

/** Everything needed to show, edit or export one DAR. */
export type DarReportData = {
  period: Period;
  days: PeriodDay[];
  header: DarHeader;
  cells: DarCells;
  dateSubmitted: string;
  daysAttended: number;
  saved: boolean;
};

const AREA = { select: { name: true, code: true, parent: { select: { name: true, code: true } } } } as const;

export function darStore(db: PrismaClient, now: () => Date = () => new Date()) {
  async function template(): Promise<DarTemplate> {
    const row = await db.setting.findUnique({ where: { key: TEMPLATE_KEY } });
    return readDarTemplate(row?.value);
  }

  async function header(user: DarUser): Promise<DarHeader> {
    const [t, profile] = await Promise.all([template(), db.darProfile.findUnique({ where: { userId: user.id } })]);
    return resolveHeader(t, profile, user);
  }

  /** What the person did in QA Hub during the period: tickets filed, replies, and status, assignment or field changes. */
  async function activity(userId: string, p: Period): Promise<Activity[]> {
    const { from, to } = periodRange(p);
    const at = { gte: from, lt: to };
    const [filed, replies, events] = await Promise.all([
      db.ticket.findMany({ where: { reporterId: userId, createdAt: at }, select: { createdAt: true, area: AREA } }),
      db.ticketComment.findMany({ where: { authorId: userId, createdAt: at }, select: { createdAt: true, ticket: { select: { area: AREA } } } }),
      // CREATED duplicates "filed"; the rest are moves, assignments and edits.
      db.ticketEvent.findMany({ where: { actorId: userId, createdAt: at, kind: { not: "CREATED" } }, select: { createdAt: true, ticket: { select: { area: AREA } } } }),
    ]);
    return [
      ...filed.map((t) => ({ at: t.createdAt, area: t.area })),
      ...replies.map((c) => ({ at: c.createdAt, area: c.ticket.area })),
      ...events.map((e) => ({ at: e.createdAt, area: e.ticket.area })),
    ];
  }

  async function fresh(user: DarUser, p: Period, h: DarHeader, days: PeriodDay[]): Promise<DarCells> {
    return buildCells(h, dayEntries(await activity(user.id, p), days));
  }

  async function write(user: DarUser, p: Period, cells: DarCells, dateSubmitted: string) {
    const data = { periodEnd: p.end, cells: cells as unknown as Prisma.InputJsonValue, dateSubmitted };
    await db.darReport.upsert({
      where: { userId_periodStart: { userId: user.id, periodStart: p.start } },
      update: data,
      create: { userId: user.id, periodStart: p.start, ...data },
    });
  }

  return {
    template,
    header,
    activity,

    async saveTemplate(t: DarTemplate): Promise<void> {
      await db.setting.upsert({ where: { key: TEMPLATE_KEY }, update: { value: t }, create: { key: TEMPLATE_KEY, value: t } });
    },

    async profile(userId: string) {
      return db.darProfile.findUnique({ where: { userId } });
    },

    /** Empty fields and empty function lists are stored as null, so they follow the template. */
    async saveProfile(userId: string, input: DarProfileInput): Promise<void> {
      const fns = (v: DarProfileInput["coreFunctions"]) => (v?.length ? (v as Prisma.InputJsonValue) : Prisma.DbNull);
      const data = {
        fullName: input.fullName || null,
        position: input.position || null,
        coreFunctions: fns(input.coreFunctions),
        supportFunctions: fns(input.supportFunctions),
      };
      await db.darProfile.upsert({ where: { userId }, update: data, create: { userId, ...data } });
    },

    /** The saved draft for the period, or a fresh one filled from ticket activity. */
    async load(user: DarUser, p: Period): Promise<DarReportData> {
      const days = periodDays(p);
      const [h, row] = await Promise.all([header(user), db.darReport.findUnique({ where: { userId_periodStart: { userId: user.id, periodStart: p.start } } })]);
      const auto = await fresh(user, p, h, days);
      const cells = row ? fitCells(row.cells, auto) : auto;
      return { period: p, days, header: h, cells, dateSubmitted: row?.dateSubmitted ?? manilaDay(now()), daysAttended: daysAttended(cells), saved: !!row };
    },

    /** Saves what the tester typed, shaped to the current functions and days. */
    async save(user: DarUser, p: Period, cells: unknown, dateSubmitted: string): Promise<void> {
      const days = periodDays(p);
      const h = await header(user);
      const shape = buildCells(h, days.map(() => ""));
      await write(user, p, fitCells(cells, shape), dateSubmitted);
    },

    /** Re-fills the auto-fill rows from ticket activity; other rows keep what was typed. */
    async refill(user: DarUser, p: Period): Promise<DarCells> {
      const days = periodDays(p);
      const [h, row] = await Promise.all([header(user), db.darReport.findUnique({ where: { userId_periodStart: { userId: user.id, periodStart: p.start } } })]);
      const auto = await fresh(user, p, h, days);
      const current = row ? fitCells(row.cells, auto) : auto;
      const cells = refillCells(current, auto, h);
      await write(user, p, cells, row?.dateSubmitted ?? manilaDay(now()));
      return cells;
    },

    /** The periods this person has saved, newest first. */
    async list(userId: string) {
      return db.darReport.findMany({ where: { userId }, orderBy: { periodStart: "desc" }, select: { periodStart: true, periodEnd: true, updatedAt: true } });
    },
  };
}


export type DarStore = ReturnType<typeof darStore>;
