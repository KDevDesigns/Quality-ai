// Opening a ticket from the board or the list in a panel over it, instead of on its own page. Pure functions, unit-tested.
// The panel lives at its own URL, /tickets/N/peek, not /tickets/N: Next intercepts a route before its normal routing, so
// intercepting /tickets/N would also catch /tickets/new and every other link between ticket pages.

/** The id of the ticket's heading, which the panel names itself after. */
export const TICKET_TITLE_ID = "ticket-title";

/** The panel's URL. Loaded on its own (a refresh, a pasted link) it redirects to the ticket page. */
export function peekHref(number: number): string {
  return `/tickets/${number}/peek`;
}

/** The parts of a click that decide where it goes. */
export type PeekClick = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
};

/**
 * True when a click on a ticket link should open the panel: a plain primary click (or Enter) on a laptop-wide screen.
 * Phones, and Ctrl/Cmd/Shift/Alt or middle clicks (a new tab or window), keep going to the ticket page.
 */
export function opensPeek(click: PeekClick, wide: boolean): boolean {
  if (!wide || click.defaultPrevented || click.button !== 0) return false;
  return !(click.metaKey || click.ctrlKey || click.shiftKey || click.altKey);
}
