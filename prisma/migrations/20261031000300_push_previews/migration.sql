-- Device notifications: whether a person's show the ticket title, message and photo (on) or only the short form.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "pushPreviews" BOOLEAN NOT NULL DEFAULT true;
