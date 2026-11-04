// A finger moved across the ticket page: does it mean "next tab"? Pure function, unit-tested.

/** How far a finger must travel, in CSS pixels, so a tap or a small slip doesn't change tab. */
const MIN_DISTANCE = 60;

/**
 * 1 for the tab to the right (the finger moved left), -1 for the tab to the left, 0 when it wasn't a swipe. It must be mostly
 * sideways, so scrolling the page down never changes tab.
 */
export function swipeStep(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 2) return 0;
  return dx < 0 ? 1 : -1;
}
