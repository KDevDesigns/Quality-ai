-- Device notifications (Web Push): one row per browser or phone, and each person's work hours.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "pushWorkHoursOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "workStartMin" INTEGER NOT NULL DEFAULT 420,
ADD COLUMN "workEndMin" INTEGER NOT NULL DEFAULT 1080,
ADD COLUMN "workDays" INTEGER NOT NULL DEFAULT 62;

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" TIMESTAMP(3),

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Like every table: no access through Supabase's public API (CLAUDE.md rule 6).
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
