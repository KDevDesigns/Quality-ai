import { redirect, RedirectType } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";

// /tickets/N/peek is the ticket panel's URL (ticket-peek.tsx). Loaded on its own (a refresh, a pasted link) there's no
// board to show it over, so it goes to the ticket page.

export default function PeekFallback({ params }: PageProps<"/tickets/[number]/peek">) {
  return (
    <Suspense fallback={null}>
      <ToTicketPage params={params} />
    </Suspense>
  );
}

async function ToTicketPage({ params }: { params: Promise<{ number: string }> }): Promise<never> {
  const { number } = await params;
  await requireUser();
  redirect(/^\d{1,9}$/.test(number) ? `/tickets/${number}` : "/tickets", RedirectType.replace);
}
