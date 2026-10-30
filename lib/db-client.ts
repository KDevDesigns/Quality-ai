import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * A Prisma client for Supabase Postgres. The app and the scripts both build theirs here, so the adapter is set in one
 * place. The app passes DATABASE_URL (the transaction pooler, port 6543, `?pgbouncer=true`), which suits serverless
 * functions that open and drop connections all the time.
 */
export function createClient(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}
