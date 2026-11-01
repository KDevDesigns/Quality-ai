-- Designer: a tick-box on any account that lets it send UI/UX designs for approval.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "designer" BOOLEAN NOT NULL DEFAULT false;
