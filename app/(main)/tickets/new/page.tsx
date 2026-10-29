import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { InlineAlert } from "@/components/inline-alert";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { can } from "@/lib/auth/permissions";
import { requireAction } from "@/lib/auth/session";
import { ticketFormOptions } from "../options";
import { TicketForm } from "../ticket-form";

export const metadata: Metadata = { title: "New ticket" };

export default function NewTicketPage() {
  return (
    <>
      <PageHeader title="New ticket" description="Report a bug, or suggest an improvement to the ERP. The developer you pick finds it under Assigned to me." />
      <Suspense fallback={<LoadingBlock />}>
        <NewTicket />
      </Suspense>
    </>
  );
}

async function NewTicket() {
  await connection();
  const me = await requireAction("tickets.create");
  const { areas, people } = await ticketFormOptions();
  return (
    <div className="grid gap-4">
      <InlineAlert tone="info">
        Screenshots often show customer names, account numbers and amounts. They stay on this office server and are never sent to any AI service.
      </InlineAlert>
      <Card>
        <CardContent>
          <TicketForm areas={areas} people={people} canAssign={can(me, "tickets.assign")} />
        </CardContent>
      </Card>
    </div>
  );
}
