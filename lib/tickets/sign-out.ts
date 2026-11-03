import { removeAllDrafts } from "./draft";

/** Signing out in this browser: an unfinished ticket doesn't stay behind on a phone that may be shared. */
export function signOutHere(logout: () => Promise<void>): Promise<void> {
  try {
    removeAllDrafts(localStorage);
  } catch {
    // Browser storage can be unavailable; signing out still works.
  }
  return logout();
}
