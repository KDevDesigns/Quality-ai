import { connection, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { exportFileName, toCsv, toXlsx } from "@/lib/test-design/export";
import { loadExportCases } from "@/lib/test-design/store";
import { aiWorkbenchAllowed } from "@/lib/workspace";

// Node.js runtime (CLAUDE.md rule 5): Cache Components always uses it and rejects a `runtime` export.

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** GET /test-design/export?format=xlsx|csv[&requirementId=…] — every non-obsolete case, or one requirement's. */
export async function GET(req: NextRequest) {
  if (!(await aiWorkbenchAllowed(await getCurrentUser()))) return Response.json({ error: "Not found" }, { status: 404 });
  await connection();
  const format = req.nextUrl.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const requirementId = req.nextUrl.searchParams.get("requirementId") || undefined;

  let base = "test-cases";
  if (requirementId) {
    const r = await db.requirement.findUnique({ where: { id: requirementId }, select: { title: true } });
    if (!r) return Response.json({ error: "Requirement not found" }, { status: 404 });
    base = r.title;
  }

  const cases = await loadExportCases(db, requirementId);
  const name = exportFileName(base, format);
  const headers = { "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" };

  if (format === "csv") return new Response(toCsv(cases), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" } });
  const buf = await toXlsx(cases);
  return new Response(new Uint8Array(buf), { headers: { ...headers, "Content-Type": XLSX_TYPE } });
}
