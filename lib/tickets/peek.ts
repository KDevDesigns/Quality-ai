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
  /** The browser's click count: 2 for the second click of a double-click, 0 for Enter. */
  detail: number;
};

/**
 * True when a click on a ticket link should open the panel: a plain primary click (or Enter) on a laptop-wide screen.
 * Phones, Ctrl/Cmd/Shift/Alt or middle clicks (a new tab or window), and the second click of a double-click keep going
 * to the ticket page.
 */
export function opensPeek(click: PeekClick, wide: boolean): boolean {
  if (!wide || click.defaultPrevented || click.button !== 0 || click.detail > 1) return false;
  return !(click.metaKey || click.ctrlKey || click.shiftKey || click.altKey);
}

/**
 * True when the panel is asked to close by the second click of a double-click. The first click opened the panel and put
 * its backdrop under the pointer, so the second lands there, which counts as a click outside. A double-click means "open
 * the ticket", so it goes to the ticket page instead. Esc, the X and Back only ever close.
 */
export function wantsFullPage(reason: string, clickCount: number): boolean {
  return reason === "outside-press" && clickCount > 1;
}

/** The ticket page behind a panel's URL: /tickets/29/peek gives /tickets/29. Anything else gives null. */
export function ticketPageOf(path: string): string | null {
  const m = /^\/tickets\/(\d{1,9})\/peek\/?$/.exec(path);
  return m ? `/tickets/${m[1]}` : null;
}
