"use server";

import { revalidatePath } from "next/cache";
import { placementError } from "@/lib/areas/tree";
import { requireAction } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fromDbError, fromZodError, text, type FormState } from "@/lib/form";
import { areaInput, areaMembersInput } from "@/lib/schemas/area";

function duplicateCode(e: unknown): FormState | null {
  return (e as { code?: unknown } | null)?.code === "P2002"
    ? { ok: false, message: "Please fix the highlighted fields.", fieldErrors: { code: ["Another area already uses this code"] } }
    : null;
}

export async function saveArea(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAction("areas.manage");
  const parsed = areaInput.safeParse({
    name: text(fd, "name"),
    code: text(fd, "code"),
    parentId: text(fd, "parentId"),
    moduleCode: text(fd, "moduleCode"),
    sortOrder: text(fd, "sortOrder") || 0,
    active: fd.get("active") === "on",
  });
  if (!parsed.success) return fromZodError(parsed.error);

  const id = text(fd, "id") || undefined;
  const areas = await db.erpArea.findMany({ select: { id: true, parentId: true, name: true, sortOrder: true } });
  const problem = placementError(areas, { id, parentId: parsed.data.parentId, name: parsed.data.name });
  if (problem) return { ok: false, message: problem };

  try {
    if (id) await db.erpArea.update({ where: { id }, data: parsed.data });
    else await db.erpArea.create({ data: parsed.data });
  } catch (e) {
    return duplicateCode(e) ?? fromDbError(e);
  }
  revalidatePath("/team");
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteArea(id: string): Promise<FormState> {
  await requireAction("areas.manage");
  if (await db.erpArea.count({ where: { parentId: id } })) {
    return { ok: false, message: "Delete or move its sub-modules first." };
  }
  try {
    await db.erpArea.delete({ where: { id } });
  } catch (e) {
    return fromDbError(e);
  }
  revalidatePath("/team");
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function saveAreaMembers(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAction("areas.manage");
  const parsed = areaMembersInput.safeParse({
    areaId: text(fd, "areaId"),
    members: fd.getAll("member").filter((v): v is string => typeof v === "string"),
    lead: text(fd, "lead"),
  });
  if (!parsed.success) return fromZodError(parsed.error);
  const { areaId, members, lead } = parsed.data;

  const users = await db.user.findMany({ where: { id: { in: members } }, select: { id: true, role: true } });
  if (users.length !== new Set(members).size) return { ok: false, message: "Someone in the list no longer exists. Refresh the page." };
  if (lead && users.find((u) => u.id === lead)?.role === "QA") return { ok: false, message: "The lead must be a developer or an admin." };

  try {
    await db.$transaction([
      db.areaMember.deleteMany({ where: { areaId } }),
      db.areaMember.createMany({ data: [...new Set(members)].map((userId) => ({ areaId, userId, isLead: userId === lead })) }),
    ]);
  } catch (e) {
    return fromDbError(e);
  }
  revalidatePath("/team");
  revalidatePath("/admin/users");
  return { ok: true };
}
