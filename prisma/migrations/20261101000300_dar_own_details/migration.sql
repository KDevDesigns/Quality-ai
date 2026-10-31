-- My DAR is for everyone now, and each person sets up their own report under My details; the shared admin template
-- (Setting "dar.template") is gone. Anyone who already had a DAR keeps exactly what it showed: the template's values
-- (the stored one over the built-in defaults) go into every field of their own details that was empty.

-- AlterTable
ALTER TABLE "DarProfile" ADD COLUMN     "confirmedByName" TEXT,
ADD COLUMN     "confirmedByTitle" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "notedByName" TEXT,
ADD COLUMN     "notedByTitle" TEXT,
ADD COLUMN     "unit" TEXT;

-- People with a saved DAR but no details of their own yet.
INSERT INTO "DarProfile" ("userId", "updatedAt")
SELECT DISTINCT "userId", CURRENT_TIMESTAMP FROM "DarReport"
ON CONFLICT ("userId") DO NOTHING;

WITH t AS (
  SELECT '{"position":"System Analyst","department":"Information and Communication Technology Department","unit":"Data Management Unit","confirmedBy":{"name":"Verlie S. Tuyor","title":"OIC, Data Management Unit"},"notedBy":{"name":"Engr. Anne Michelle S. Buagas","title":"Manager, Information and Communication Technology Department"},"coreFunctions":[{"duty":"Performs API testing, automation testing, and performance validation for ERP system (HR, Procurement (BUR), Property and Supply Management System (PSMS), Project Monitoring System (PrMS), DCWD Mobile Application and Leak Alert), including data validation, defect identification, and test documentation.","mfo":"• Gathering information of End-Users (PSMS)\n• Performs documentation and test reports\n• Create Test Cases for (ERP) Procurement, Property and Supply Management System (PSMS), DCWD Mobile Application and Leak Alert\n• Evaluated system speed, stability, and response using K-6 automation\n• Verified API''s function correctly and meet requirements","autofill":true}],"supportFunctions":[{"duty":"Assist in the accurate encoding of data submitted by end-users.","mfo":"Data entries on ERP (HR, Procurement, Property and Supply Management System (PSMS), DCWD Mobile Application and Leak Alert)","autofill":false},{"duty":"Reviews entered data for integrity, accuracy, completeness, and consistency on ERP (HR, PROCUREMENT (BUR), PSMS, PrMS, DCWD MOBILE APP and LEAK ALERT)","mfo":"Data entries on ERP (HR, Procurement, Property and Supply Management System (PSMS), DCWD Mobile Application and Leak Alert) has been correctly evaluated","autofill":true},{"duty":"Perform other related functions as may be required by the immediate supervisor","mfo":"Accomplishment Report","autofill":false}]}'::jsonb || COALESCE((SELECT "value" FROM "Setting" WHERE "key" = 'dar.template' AND jsonb_typeof("value") = 'object'), '{}'::jsonb) AS v
)
UPDATE "DarProfile" p SET
  "position"         = COALESCE(NULLIF(p."position", ''), t.v->>'position'),
  "department"       = t.v->>'department',
  "unit"             = t.v->>'unit',
  "confirmedByName"  = t.v->'confirmedBy'->>'name',
  "confirmedByTitle" = t.v->'confirmedBy'->>'title',
  "notedByName"      = t.v->'notedBy'->>'name',
  "notedByTitle"     = t.v->'notedBy'->>'title',
  "coreFunctions"    = CASE WHEN p."coreFunctions" IS NULL OR p."coreFunctions" = '[]'::jsonb THEN t.v->'coreFunctions' ELSE p."coreFunctions" END,
  "supportFunctions" = CASE WHEN p."supportFunctions" IS NULL OR p."supportFunctions" = '[]'::jsonb THEN t.v->'supportFunctions' ELSE p."supportFunctions" END
FROM t;

DELETE FROM "Setting" WHERE "key" = 'dar.template';
