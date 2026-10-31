-- Unread tickets (bell, sidebar count, red dots) and forgot-password requests.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "resetRequestedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "lastActivityById" TEXT;

-- Existing tickets: treat the reporter as the last to act, so nothing old shows up as new for them.
UPDATE "Ticket" SET "lastActivityById" = "reporterId";

-- CreateTable
CREATE TABLE "TicketRead" (
    "userId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketRead_pkey" PRIMARY KEY ("userId","ticketId")
);

-- CreateIndex
CREATE INDEX "TicketRead_ticketId_idx" ON "TicketRead"("ticketId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_lastActivityById_fkey" FOREIGN KEY ("lastActivityById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketRead" ADD CONSTRAINT "TicketRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketRead" ADD CONSTRAINT "TicketRead_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Like every table: no access through Supabase's public API (CLAUDE.md rule 6).
ALTER TABLE "TicketRead" ENABLE ROW LEVEL SECURITY;
