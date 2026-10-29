-- CreateTable
CREATE TABLE "DarProfile" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT,
    "position" TEXT,
    "coreFunctions" JSONB,
    "supportFunctions" JSONB,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DarProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DarReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "periodStart" TEXT NOT NULL,
    "periodEnd" TEXT NOT NULL,
    "cells" JSONB NOT NULL,
    "dateSubmitted" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DarReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DarReport_userId_periodStart_key" ON "DarReport"("userId", "periodStart");
