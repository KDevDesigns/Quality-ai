"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useRef, type ComponentProps } from "react";
import { SquareArrowOutUpRightIcon, XIcon } from "lucide-react";
import { closeAllowed, CloseGuardProvider, useCloseGuardRef } from "@/components/close-guard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet";
import { MOBILE_QUERY } from "@/hooks/use-mobile";
import { opensPeek, peekHref, TICKET_TITLE_ID, ticketPageOf, wantsFullPage } from "@/lib/tickets/peek";

// A ticket opened from the board or the list on a laptop shows in a panel over it, so the board keeps its place, its
// scroll and its filters. The panel is the route /tickets/N/peek, intercepted into the @peek slot of tickets/layout.tsx:
// Back or Esc closes it, Forward opens it again. Phones, new-tab clicks and double-clicks still go to the ticket page.

/**
 * A link to a ticket that opens it in the panel on a laptop. Its href stays the ticket page, which phones, Ctrl/Cmd or
 * middle clicks and "Open in new tab" get, and so does a double-click whose second click lands here because the panel
 * hasn't shown yet (once it has, the second click lands on its backdrop: see TicketPeek).
 */
export function PeekLink({ number, onClick, ...props }: Omit<ComponentProps<typeof Link>, "href" | "onPointerEnter" | "onFocus"> & { number: number }) {
  const router = useRouter();
  const wide = () => !window.matchMedia(MOBILE_QUERY).matches;
  const prefetch = () => {
    if (wide()) router.prefetch(peekHref(number));
  };
  return (
    <Link
      {...props}
      href={`/tickets/${number}`}
      onPointerEnter={prefetch}
      onFocus={prefetch}
      onClick={(e) => {
        onClick?.(e);
        if (!opensPeek(e, wide())) return;
        e.preventDefault();
        router.push(peekHref(number), { scroll: false });
      }}
    />
  );
}

/**
 * The panel around the ticket. It slides in from the right; closing it goes Back, to the board as it was. The panel
 * itself needs nothing from the URL, so it's in the prefetched shell and opens at once; the ticket streams in.
 *
 * It is open exactly while its route is showing, never by state of its own. Next keeps a route you leave mounted but
 * hidden (React <Activity>, with Cache Components) and shows that same instance when you come back, so an "open" flag
 * set to false on closing would still be false the next time the same ticket opened, leaving the URL on the panel with
 * nothing on screen.
 */
export function TicketPeek({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const guard = useCloseGuardRef();
  // One Back per close, even if Esc is pressed twice before the board is back. Cleared each time the panel shows.
  const closing = useRef(false);
  useLayoutEffect(() => {
    closing.current = false;
  }, []);

  // However it closed (Esc, X, Back), the board behind still shows this ticket as unread: reading it doesn't refresh
  // other pages. So refresh once on the way out, unless the panel closed by going somewhere else (Open full page).
  useEffect(
    () => () => {
      setTimeout(() => {
        if (window.location.pathname === "/tickets") router.refresh();
      });
    },
    [router],
  );

  return (
    <Sheet
      open
      onOpenChange={(next, { reason, event }) => {
        // A half-written reply asks before it's thrown away.
        if (next || closing.current || !closeAllowed(guard)) return;
        closing.current = true;
        // A double-click on a card opens its page: the panel's URL is swapped for the page's, so Back is the board.
        const page = wantsFullPage(reason, event instanceof UIEvent ? event.detail : 0)
          ? ticketPageOf(window.location.pathname)
          : null;
        if (page) router.replace(page);
        else router.back();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-labelledby={TICKET_TITLE_ID}
        className="gap-0 bg-background data-[side=right]:w-[min(60rem,calc(100vw-2rem))] data-[side=right]:sm:max-w-none"
      >
        <div className="flex h-13 shrink-0 items-center gap-2 border-b border-line2 bg-card pr-3 pl-6">
          <Suspense fallback={<span className="flex-1 text-sm text-muted-foreground">Ticket</span>}>
            <PeekHeading />
          </Suspense>
          <SheetClose render={<Button variant="ghost" size="icon-sm" />}>
            <XIcon aria-hidden />
            <span className="sr-only">Close</span>
          </SheetClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 lg:px-8">
          <div className="space-y-6">
            <CloseGuardProvider value={guard}>{children}</CloseGuardProvider>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** "Ticket #128" and Open full page: the number comes from the URL, which is only known at request time. */
function PeekHeading() {
  const { number } = useParams<{ number: string }>();
  return (
    <>
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
        Ticket <span className="font-mono font-semibold text-ink2">#{number}</span>
      </span>
      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/tickets/${number}`} />}>
        <SquareArrowOutUpRightIcon aria-hidden /> Open full page
      </Button>
    </>
  );
}
