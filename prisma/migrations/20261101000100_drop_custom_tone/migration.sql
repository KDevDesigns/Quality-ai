-- Own uploaded notification tones are gone (Storage space for little use): anyone who picked theirs gets Tone 1.
UPDATE "User" SET "notifyTone" = 'tone-1' WHERE "notifyTone" = 'custom';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "customTone";
