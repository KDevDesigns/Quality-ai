-- Outside work hours, device notifications can now arrive silently instead of only "with sound" or "not at all".
-- People who had "Only notify me during work hours" on keep getting nothing outside their hours (NONE).

-- CreateEnum
CREATE TYPE "OffHoursPush" AS ENUM ('SOUND', 'SILENT', 'NONE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "offHoursPush" "OffHoursPush" NOT NULL DEFAULT 'SOUND';
UPDATE "User" SET "offHoursPush" = 'NONE' WHERE "pushWorkHoursOnly";
ALTER TABLE "User" DROP COLUMN "pushWorkHoursOnly";
