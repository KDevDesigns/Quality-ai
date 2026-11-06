import { connection } from "next/server";
import { can } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { moduleReport, reportHtml } from "@/lib/tickets/report";
import { ticketStore } from "@/lib/tickets/store";

// Node.js runtime (CLAUDE.md rule 5): Cache Components always uses it and rejects a `runtime` export.

const tickets = ticketStore(db);

/** GET /tickets/report — every module's progress as a page to print or save as PDF. Numbers only, for anyone signed in. */
export async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword || !can(user, "tickets.view")) return new Response("Sign in to see the module report.", { status: 401 });

  const { areas, tickets: rows } = await tickets.reportRows();
  const html = reportHtml(moduleReport(areas, rows), { generatedAt: new Date(), by: user.name });
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
