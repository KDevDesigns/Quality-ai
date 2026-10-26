-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "task" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OK',
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "costMicroUsd" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "redacted" BOOLEAN NOT NULL DEFAULT false,
    "redactionCount" INTEGER NOT NULL DEFAULT 0,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "jobId" TEXT
);
INSERT INTO "new_AuditLog" ("at", "id", "model", "provider", "redacted", "sensitive", "task", "tokensIn", "tokensOut") SELECT "at", "id", "model", "provider", "redacted", "sensitive", "task", "tokensIn", "tokensOut" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE INDEX "AuditLog_at_idx" ON "AuditLog"("at");
CREATE INDEX "AuditLog_provider_at_idx" ON "AuditLog"("provider", "at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
