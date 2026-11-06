import { Prisma, type PrismaClient } from "@/lib/generated/prisma/client";
import { buildCells, dayEntries, daysAttended, fillDefaults, fitCells, refillCells, type Activity, type DarCells } from "./autofill";
import { manilaDay, periodDays, periodRange, type Period, type PeriodDay } from "./period";
import { prefixFor } from "./autofill";
import { resolveHeader, type DarHeader, type DarProfileInput } from "./template";

// Prisma glue for DARs. Every read and write is for one person's own reports; nobody, admins included, reads
// another person's DAR. Takes the client as a parameter so tests can run it against a throwaway database.

export type DarUser = { id: string; name: string; role: string };

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
  async function header(user: DarUser): Promise<DarHeader> {
    return resolveHeader(await db.darProfile.findUnique({ where: { userId: user.id } }), user);
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
    return buildCells(h, dayEntries(await activity(user.id, p), days, prefixFor(user.role)), days);
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
    header,
    activity,

    async profile(userId: string) {
      return db.darProfile.findUnique({ where: { userId } });
    },

    /** Empty fields are stored as null and come back empty. */
    async saveProfile(userId: string, input: DarProfileInput): Promise<void> {
      const fns = (v: DarProfileInput["coreFunctions"]) => (v.length ? (v as Prisma.InputJsonValue) : Prisma.DbNull);
      const data = {
        fullName: input.fullName || null,
        position: input.position || null,
        department: input.department || null,
        unit: input.unit || null,
        confirmedByName: input.confirmedBy.name || null,
        confirmedByTitle: input.confirmedBy.title || null,
        notedByName: input.notedBy.name || null,
        notedByTitle: input.notedBy.title || null,
        coreFunctions: fns(input.coreFunctions),
        supportFunctions: fns(input.supportFunctions),
        // Left as it is when not given: once set, it can be changed but not emptied.
        firstPeriodStart: input.firstPeriodStart || undefined,
        // Left as it is when not given.
        periodScheme: input.periodScheme ?? undefined,
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

    /** Saves what they typed, shaped to the current functions and days. */
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

    /**
     * Saves imported day entries as the person's DARs for those periods, replacing any saved ones. Cells are shaped to
     * their current duty rows, as a save from the page is. Returns how many periods were written.
     */
    async importReports(user: DarUser, reports: { period: Period; cells: unknown; dateSubmitted: string | null }[]): Promise<number> {
      const h = await header(user);
      for (const r of reports) {
        const days = periodDays(r.period);
        const shape = buildCells(h, days.map(() => ""));
        // Days the sheet left blank or dashed take the defaults: REST DAY on weekends and holidays, "-" on work days.
        await write(user, r.period, fillDefaults(fitCells(r.cells, shape), days), r.dateSubmitted ?? manilaDay(now()));
      }
      return reports.length;
    },

    /** The periods this person has saved, newest first. */
    async list(userId: string) {
      return db.darReport.findMany({ where: { userId }, orderBy: { periodStart: "desc" }, select: { periodStart: true, periodEnd: true, updatedAt: true } });
    },
  };
}


export type DarStore = ReturnType<typeof darStore>;
