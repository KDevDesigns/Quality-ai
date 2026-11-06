import type { Metadata } from "next";
import { Suspense } from "react";
import { TicketPageSkeleton } from "@/components/skeletons";
import { TicketView } from "./ticket-view";

// The ticket's own page. The ticket itself is in ticket-view.tsx, shared with the panel over the board and the list.

export const metadata: Metadata = { title: "Ticket" };

export default function TicketPage({ params }: PageProps<"/tickets/[number]">) {
  return (
    <Suspense fallback={<TicketPageSkeleton />}>
      <TicketView params={params} mode="page" />
    </Suspense>
  );
}
