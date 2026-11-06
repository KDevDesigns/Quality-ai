import { Suspense } from "react";
import { TicketPageSkeleton } from "@/components/skeletons";
import { TicketView } from "../../../[number]/ticket-view";
import { TicketPeek } from "../../../ticket-peek";

// /tickets/N/peek opened from the board or the list: the ticket in a panel over it. TicketView checks the session and
// that the ticket is one this person may see, as the ticket page does.

export default function TicketPeekPage({ params }: { params: Promise<{ number: string }> }) {
  return (
    <TicketPeek>
      <Suspense fallback={<TicketPageSkeleton />}>
        <TicketView params={params} mode="peek" />
      </Suspense>
    </TicketPeek>
  );
}
