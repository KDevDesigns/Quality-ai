// Undo and redo for the markup editor: the list of shapes after each change. Immutable, so React state can hold it.

export type History<T> = { past: T[][]; present: T[]; future: T[][] };

export const emptyHistory = <T>(): History<T> => ({ past: [], present: [], future: [] });

/** A new state; whatever was undone before is gone. */
export function push<T>(h: History<T>, next: T[]): History<T> {
  return { past: [...h.past, h.present], present: next, future: [] };
}

export function undo<T>(h: History<T>): History<T> {
  if (!h.past.length) return h;
  return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] };
}

export function redo<T>(h: History<T>): History<T> {
  if (!h.future.length) return h;
  return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
}

export const canUndo = <T>(h: History<T>) => h.past.length > 0;
export const canRedo = <T>(h: History<T>) => h.future.length > 0;
