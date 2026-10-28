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

/** "Billing & Collection › Meter Reading", or just the module name. */
export function areaPath(area: { name: string; parent?: { name: string } | null }): string {
  return area.parent ? `${area.parent.name} › ${area.name}` : area.name;
}
