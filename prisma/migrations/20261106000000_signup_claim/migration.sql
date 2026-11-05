-- A sign-up request remembered by the browser that made it (Step F, revised). The browser keeps a random secret in a
-- cookie; only its SHA-256 is stored here. After approval, that browser alone can get the temporary password, at most
-- once a minute (claimAt). Both are cleared once the person chooses their own password. Optional, so existing accounts
-- are untouched. No new table, so row-level security is unchanged.
ALTER TABLE "User" ADD COLUMN "claimHash" TEXT;
ALTER TABLE "User" ADD COLUMN "claimAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "User_claimHash_key" ON "User"("claimHash");
