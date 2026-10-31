import { Prisma, type PrismaClient } from "@/lib/generated/prisma/client";
import { canSeeTicket, ticketScope, type Actor, type TicketStatus } from "@/lib/tickets/workflow";

// Unread tickets: the bell, the sidebar count and the red dots. A ticket you can see is unread when someone else
// changed it (lastActivityById) after you last opened it (TicketRead), or you never opened it. Your own actions never
// notify you, because they make you the last to act.

export type UnreadItem = { id: string; number: number; title: string; status: TicketStatus; lastActivityAt: Date; actorName: string | null };

/** The ticket-scope rule from workflow.ts as SQL on the alias `t`. */
function scopeSql(actor: Actor): Prisma.Sql {
  const s = ticketScope(actor);
  if (s === "all") return Prisma.sql`TRUE`;
  return "reporterId" in s ? Prisma.sql`t."reporterId" = ${s.reporterId}` : Prisma.sql`t."assigneeId" = ${s.assigneeId}`;
}

function unreadSql(actor: Actor): Prisma.Sql {
  return Prisma.sql`${scopeSql(actor)}
    AND t."lastActivityById" IS DISTINCT FROM ${actor.id}
    AND NOT EXISTS (
      SELECT 1 FROM "TicketRead" r WHERE r."ticketId" = t.id AND r."userId" = ${actor.id} AND r."readAt" >= t."lastActivityAt"
    )`;
}

export function notificationStore(db: PrismaClient, now: () => Date = () => new Date()) {
  return {
    /** How many tickets are unread, and the newest few for the bell. */
    async unread(actor: Actor, take = 8): Promise<{ count: number; items: UnreadItem[] }> {
      const rows = await db.$queryRaw<(UnreadItem & { total: bigint })[]>`
        SELECT t.id, t.number, t.title, t.status, t."lastActivityAt", u.name AS "actorName", count(*) OVER () AS total
        FROM "Ticket" t LEFT JOIN "User" u ON u.id = t."lastActivityById"
        WHERE ${unreadSql(actor)}
        ORDER BY t."lastActivityAt" DESC, t.number DESC
        LIMIT ${take}`;
      return { count: rows.length ? Number(rows[0].total) : 0, items: rows.map((r) => ({ id: r.id, number: r.number, title: r.title, status: r.status, lastActivityAt: r.lastActivityAt, actorName: r.actorName })) };
    },

    /**
     * The sidebar counts. Messages: replies by others you haven't seen (newer than when you last opened that ticket, or
     * any, if you never did), for My inbox. New tickets: filed by someone else and never opened by you, for Tickets.
     */
    async counts(actor: Actor): Promise<{ messages: number; newTickets: number }> {
      const [[m], [t]] = await Promise.all([
        db.$queryRaw<{ n: number }[]>`
          SELECT count(*)::int AS n FROM "TicketComment" c JOIN "Ticket" t ON t.id = c."ticketId"
          WHERE ${scopeSql(actor)} AND c."authorId" <> ${actor.id}
            AND NOT EXISTS (
              SELECT 1 FROM "TicketRead" r WHERE r."ticketId" = t.id AND r."userId" = ${actor.id} AND r."readAt" >= c."createdAt"
            )`,
        db.$queryRaw<{ n: number }[]>`
          SELECT count(*)::int AS n FROM "Ticket" t
          WHERE ${scopeSql(actor)} AND t."reporterId" <> ${actor.id}
            AND NOT EXISTS (SELECT 1 FROM "TicketRead" r WHERE r."ticketId" = t.id AND r."userId" = ${actor.id})`,
      ]);
      return { messages: m?.n ?? 0, newTickets: t?.n ?? 0 };
    },

    /** Unread replies per ticket, for the numbers on inbox conversations. */
    async unreadMessages(actor: Actor, ticketIds: string[]): Promise<Map<string, number>> {
      if (!ticketIds.length) return new Map();
      const rows = await db.$queryRaw<{ id: string; n: number }[]>`
        SELECT c."ticketId" AS id, count(*)::int AS n FROM "TicketComment" c JOIN "Ticket" t ON t.id = c."ticketId"
        WHERE c."ticketId" IN (${Prisma.join(ticketIds)}) AND ${scopeSql(actor)} AND c."authorId" <> ${actor.id}
          AND NOT EXISTS (
            SELECT 1 FROM "TicketRead" r WHERE r."ticketId" = t.id AND r."userId" = ${actor.id} AND r."readAt" >= c."createdAt"
          )
        GROUP BY c."ticketId"`;
      return new Map(rows.map((r) => [r.id, r.n]));
    },

    /** Every unread ticket's id, for the inbox's Unread filter. */
    async allUnreadIds(actor: Actor): Promise<string[]> {
      const rows = await db.$queryRaw<{ id: string }[]>`SELECT t.id FROM "Ticket" t WHERE ${unreadSql(actor)}`;
      return rows.map((r) => r.id);
    },

    /** Which of these tickets are unread, for the red dots on a list. */
    async unreadIds(actor: Actor, ticketIds: string[]): Promise<Set<string>> {
      if (!ticketIds.length) return new Set();
      const rows = await db.$queryRaw<{ id: string }[]>`
        SELECT t.id FROM "Ticket" t WHERE t.id IN (${Prisma.join(ticketIds)}) AND ${unreadSql(actor)}`;
      return new Set(rows.map((r) => r.id));
    },

    /** Opening a ticket marks it read. Ignored for a ticket the person can't see. */
    async markRead(actor: Actor, ticketId: string): Promise<void> {
      const t = await db.ticket.findUnique({ where: { id: ticketId }, select: { reporterId: true, assigneeId: true, status: true } });
      if (!t || !canSeeTicket(t, actor)) return;
      const readAt = now();
      await db.ticketRead.upsert({
        where: { userId_ticketId: { userId: actor.id, ticketId } },
        create: { userId: actor.id, ticketId, readAt },
        update: { readAt },
      });
    },

    /** Marks every ticket the person can see as read. */
    async markAllRead(actor: Actor): Promise<void> {
      await db.$executeRaw`
        INSERT INTO "TicketRead" ("userId", "ticketId", "readAt")
        SELECT ${actor.id}, t.id, ${now()} FROM "Ticket" t WHERE ${unreadSql(actor)}
        ON CONFLICT ("userId", "ticketId") DO UPDATE SET "readAt" = EXCLUDED."readAt"`;
    },
  };
}
