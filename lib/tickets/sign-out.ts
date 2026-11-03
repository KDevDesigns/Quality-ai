import { showBadge } from "@/lib/pwa";
import { removeAllDrafts } from "./draft";

/** Signing out in this browser: an unfinished ticket or the unread count doesn't stay behind on a phone that may be shared. */
export function signOutHere(logout: () => Promise<void>): Promise<void> {
  showBadge(0);
  try {
    removeAllDrafts(localStorage);
  } catch {
    // Browser storage can be unavailable; signing out still works.
  }
  return logout();
}
