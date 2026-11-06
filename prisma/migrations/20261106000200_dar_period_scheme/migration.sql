-- Which half-month periods a person's DAR uses: "1-16" (1st-15th and 16th-end, the default when empty) or "3-18"
-- (3rd-17th and 18th-2nd of the next month, as on Job Order DARs). DarProfile already has RLS on.

-- AlterTable
ALTER TABLE "DarProfile" ADD COLUMN "periodScheme" TEXT;
