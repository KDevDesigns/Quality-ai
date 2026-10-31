-- Notification sounds: each person's chosen tone, and their own uploaded tone (a Storage object name).

-- AlterTable
ALTER TABLE "User" ADD COLUMN "notifyTone" TEXT NOT NULL DEFAULT 'tone-1',
ADD COLUMN "customTone" TEXT;
