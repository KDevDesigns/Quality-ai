import { connection } from "next/server";
import { cronAuthorized, dailyCleanup } from "@/lib/cron";
import { db } from "@/lib/db";
import { removeObjects } from "@/lib/uploads/storage";

// Called once a day by Vercel Cron (vercel.json). proxy.ts skips /api/cron, so the secret is the only check here.
// The query also counts as activity, which keeps a free Supabase project from pausing.

/** GET /api/cron/daily */
export async function GET(req: Request) {
  await connection();
  if (!cronAuthorized(req.headers.get("authorization"), process.env.CRON_SECRET)) return new Response("Unauthorized", { status: 401 });

  const result = await dailyCleanup(db);
  await removeObjects(result.staleFiles);
  console.log("[cron] daily clean-up:", result.removed);
  return Response.json(result.removed);
}
