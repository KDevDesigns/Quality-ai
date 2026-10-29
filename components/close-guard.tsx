"use client";

import { createContext, useContext, useEffect, useRef, type RefObject } from "react";

// Lets something inside a dialog stop it from closing (X button, Esc, a click outside), for example the temporary
// password box until the admin has copied or seen the password. The dialog owns the ref and checks it in
// onOpenChange; the content registers its check with useCloseGuard.

type Check = () => boolean;
type GuardRef = RefObject<Check | null>;

const CloseGuardContext = createContext<GuardRef | null>(null);

export const CloseGuardProvider = CloseGuardContext.Provider;

export function useCloseGuardRef(): GuardRef {
  return useRef<Check | null>(null);
}

/** For a dialog's onOpenChange: true when the close should go ahead. On false, the dialog cancels the close. */
export function closeAllowed(ref: GuardRef): boolean {
  return ref.current ? ref.current() : true;
}

/** Registers `check` with the nearest guarded dialog. `check` returns false to keep the dialog open. */
export function useCloseGuard(check: Check) {
  const ref = useContext(CloseGuardContext);
  useEffect(() => {
    if (!ref) return;
    ref.current = check;
    return () => {
      ref.current = null;
    };
  }, [ref, check]);
}
