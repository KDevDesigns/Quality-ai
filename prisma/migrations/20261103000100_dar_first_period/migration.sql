-- The first period of a person's DAR, its start date ("2026-11-01"), which their list of periods starts from. Empty until they set it.

-- AlterTable
ALTER TABLE "DarProfile" ADD COLUMN "firstPeriodStart" TEXT;
