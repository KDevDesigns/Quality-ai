import { readFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { can } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { darXlsx } from "@/lib/dar/excel";
import { parsePeriod, periodFileLabel } from "@/lib/dar/period";
import { darStore } from "@/lib/dar/store";
import { nameInitials } from "@/lib/dar/template";
import { db } from "@/lib/db";

// Node.js runtime (CLAUDE.md rule 5): Cache Components always uses it and rejects a `runtime` export.
// The seal is read from public/; next.config.ts traces it into this route's Vercel function.

const dar = darStore(db);

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** GET /dar/export?period=2026-10-16&format=xlsx — the signed-in tester's own DAR for that period, as Excel. */
export async function GET(req: Request) {
  await connection();
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword || !can(user, "dar.use")) return new Response("Sign in as a QA tester to download your DAR.", { status: 401 });

  const url = new URL(req.url);
  const period = parsePeriod(url.searchParams.get("period") ?? "");
  const format = url.searchParams.get("format");
  if (!period || format !== "xlsx") return new Response("Pick a period and a format.", { status: 400 });

  const report = await dar.load(user, period);
  const seal = await readFile(path.join(process.cwd(), "public", "dcwd-seal.png")).catch(() => undefined);

  const body = await darXlsx(report, seal);

  const name = `DAR - ${nameInitials(report.header.name) || "QA"} - ${periodFileLabel(period)}.${format}`;
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
