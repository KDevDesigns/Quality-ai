// The Team & modules page: which modules the search keeps, and which one is open. Pure functions, unit-tested.

export type DirectoryModule = { id: string; name: string; code: string | null; children: { name: string; code: string | null }[] };

/** Whether a module matches the search: its name or code, or one of its sub-modules' names or codes. Case-insensitive. */
export function matchesModule(m: DirectoryModule, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hit = (s: string | null) => !!s && s.toLowerCase().includes(q);
  return hit(m.name) || hit(m.code) || m.children.some((c) => hit(c.name) || hit(c.code));
}

/** The module to show on the right: the one in `?module=` if it is in the list, otherwise the first; null for an empty list. */
export function pickModule<T extends { id: string }>(list: T[], wanted: string | null | undefined): T | null {
  return list.find((m) => m.id === wanted) ?? list[0] ?? null;
}
