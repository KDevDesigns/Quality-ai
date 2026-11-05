-- What kind of work a ticket is, counted by Module progress on the Dashboard. Optional in the database: tickets filed before
-- this stay empty ("Not tagged yet") until a developer tags them. createTicket requires it on every new ticket.

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('FRONT_END', 'BACK_END', 'UI_UX');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "category" "TicketCategory";
