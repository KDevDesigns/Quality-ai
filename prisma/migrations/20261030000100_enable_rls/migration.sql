-- Supabase publishes the public schema through its REST API, and the anon key is not a secret.
-- Row level security with no policies means that API can read and write nothing. QA Hub reaches the database only
-- through Prisma as the table owner, which RLS does not restrict.
ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimitHit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ErpArea" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AreaMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TicketComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TicketEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PendingUpload" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DarProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DarReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
