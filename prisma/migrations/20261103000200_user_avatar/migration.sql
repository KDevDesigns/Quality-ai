-- A profile photo (a private Storage object, like attachments), and a number per account that picks its colours when it has
-- none (lib/avatar.ts). SERIAL gives everyone already here their own number, and each new account the next one.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarColor" SERIAL NOT NULL,
ADD COLUMN "avatarMime" TEXT,
ADD COLUMN "avatarName" TEXT,
ADD COLUMN "avatarSize" INTEGER;
