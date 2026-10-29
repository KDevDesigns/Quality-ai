import "server-only";
import { buildTree } from "@/lib/areas/tree";
import type { Role } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import type { AreaOption, AssigneeOption } from "./ticket-form";

/** Active modules and sub-modules, plus the developers and admins who can be assigned, with their areas. */
export async function ticketFormOptions(): Promise<{ areas: AreaOption[]; people: AssigneeOption[] }> {
  const [areas, users] = await Promise.all([
    db.erpArea.findMany({ where: { active: true }, select: { id: true, parentId: true, name: true, sortOrder: true } }),
    db.user.findMany({
      where: { active: true, role: { in: ["DEV", "ADMIN"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true, areas: { select: { areaId: true, isLead: true } } },
    }),
  ]);
  return {
    areas: buildTree(areas).map((m) => ({ id: m.id, name: m.name, children: m.children.map((c) => ({ id: c.id, name: c.name })) })),
    people: users.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role as Role,
      areaIds: u.areas.map((a) => a.areaId),
      leadAreaIds: u.areas.filter((a) => a.isLead).map((a) => a.areaId),
    })),
  };
}
