// The ERP area directory is two levels deep: module → sub-module. Pure functions, unit-tested.

export type AreaNode = { id: string; parentId: string | null; name: string; sortOrder: number };
export type AreaTree<T extends AreaNode> = (T & { children: T[] })[];

const byOrder = (a: AreaNode, b: AreaNode) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

export function buildTree<T extends AreaNode>(areas: T[]): AreaTree<T> {
  const tops = areas.filter((a) => a.parentId === null).sort(byOrder);
  return tops.map((t) => ({ ...t, children: areas.filter((a) => a.parentId === t.id).sort(byOrder) }));
}

/** Why the area can't be saved where it is, or null when it can. `input.id` is set when editing. */
export function placementError(areas: AreaNode[], input: { id?: string; parentId: string | null; name: string }): string | null {
  if (input.parentId) {
    if (input.parentId === input.id) return "An area can't be inside itself.";
    const parent = areas.find((a) => a.id === input.parentId);
    if (!parent) return "The parent module no longer exists. Refresh the page.";
    if (parent.parentId !== null) return "Sub-modules can't have sub-modules. Pick a top-level module.";
    if (input.id && areas.some((a) => a.parentId === input.id)) return "This module has sub-modules, so it must stay top-level.";
  }
  const name = input.name.trim().toLowerCase();
  const clash = areas.some((a) => a.id !== input.id && a.parentId === input.parentId && a.name.trim().toLowerCase() === name);
  if (clash) return input.parentId ? "This module already has a sub-module with that name." : "A module with that name already exists.";
  return null;
}

/** The sort order that places a new area after its siblings (steps of 10, so admins can slot one in between). */
export function nextSortOrder(areas: AreaNode[], parentId: string | null, excludeId?: string): number {
  const siblings = areas.filter((a) => a.parentId === parentId && a.id !== excludeId);
  return siblings.length ? Math.min(999, Math.max(...siblings.map((a) => a.sortOrder)) + 10) : 0;
}

/**
 * A dropdown's choices as a tree: each module in bold with `wholeNote` beside it, its sub-modules joined under it. Once chosen, a
 * sub-module shows with its module ("Billing › Posting"), so it's clear where it came from even when two share a name.
 */
export function moduleOptions(areas: { id: string; name: string; children: { id: string; name: string }[] }[], wholeNote: string) {
  return areas.map((m) => ({
    rule: true,
    options: [
      { value: m.id, label: `${m.name} (${wholeNote})`, tree: { name: m.name, level: 0 as const, note: wholeNote } },
      ...m.children.map((c) => ({ value: c.id, label: areaPath({ name: c.name, parent: m }), tree: { name: c.name, level: 1 as const } })),
    ],
  }));
}

/** "Billing & Collection › Meter Reading", or just the module name. */
export function areaPath(area: { name: string; parent?: { name: string } | null }): string {
  return area.parent ? `${area.parent.name} › ${area.name}` : area.name;
}
