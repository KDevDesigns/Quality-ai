-- "Notify me silently" is gone from My account (D7). Accounts that chose it move to "Don't notify me": both mean no
-- noise outside work hours, and the bell and My inbox keep everything. A data change only: the SILENT enum value stays
-- defined, so nothing else changes and older backups still restore.
UPDATE "User" SET "offHoursPush" = 'NONE' WHERE "offHoursPush" = 'SILENT';
