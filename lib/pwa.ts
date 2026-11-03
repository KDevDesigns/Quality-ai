// Facts about how QA Hub is running on this device, for the Install card and device notifications. Pure functions: tests
// pass a stand-in for the browser's navigator and window.

type Nav = { userAgent: string; maxTouchPoints: number; standalone?: boolean };

/** iPhones and iPads, including an iPad asking for desktop sites, which calls itself a Mac. */
export const isIos = (nav: Nav = navigator) => /iPhone|iPad|iPod/.test(nav.userAgent) || (nav.userAgent.includes("Macintosh") && nav.maxTouchPoints > 1);

export const isWindows = (nav: Nav = navigator) => nav.userAgent.includes("Windows");

/** Running from its own icon instead of a browser tab. */
export const isInstalled = (win: { matchMedia(query: string): { matches: boolean }; navigator: Nav } = window) =>
  win.matchMedia("(display-mode: standalone)").matches || win.navigator.standalone === true;

type BadgeNav = { setAppBadge?(count: number): Promise<void>; clearAppBadge?(): Promise<void> };

/** The unread count on the installed app's icon. Browsers without badges, or a tab that isn't installed, just ignore it. */
export function showBadge(count: number, nav: BadgeNav = navigator) {
  (count > 0 ? nav.setAppBadge?.(count) : nav.clearAppBadge?.())?.catch(() => {});
}
