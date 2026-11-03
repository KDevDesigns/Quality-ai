-- What a bug happened on: COMPUTER, ANDROID, IPHONE or TABLET (lib/tickets/workflow.ts). Empty on older tickets.

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "deviceType" TEXT;
