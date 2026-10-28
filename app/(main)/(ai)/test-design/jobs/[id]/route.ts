import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { aiWorkbenchAllowed } from "@/lib/workspace";
import { toJobStatus } from "../../job-status";

// Node.js runtime (CLAUDE.md rule 5): Cache Components always uses it and rejects a `runtime` export.

export async function GET(_req: Request, ctx: RouteContext<"/test-design/jobs/[id]">) {
  if (!(await aiWorkbenchAllowed(await getCurrentUser()))) return Response.json({ error: "Not found" }, { status: 404 });
  await connection();
  const { id } = await ctx.params;
  const job = await db.generationJob.findUnique({ where: { id } });
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
  return Response.json(toJobStatus(job), { headers: { "Cache-Control": "no-store" } });
}
