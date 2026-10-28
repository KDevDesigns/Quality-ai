import { z } from "zod";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { MODULE_CODES } from "@/lib/schemas/common";

// Loads data/erp-areas.json into ErpArea. Matches by code first, then by name, so renaming a module in the file
// keeps its members. Takes the client as a parameter so tests can run it against a throwaway SQLite file.

const code = z.string().regex(/^[A-Z0-9][A-Z0-9-]{1,19}$/);
const subArea = z.object({ name: z.string().trim().min(1).max(100), code: code.optional() });
export const areaFile = z.object({
  modules: z
    .array(subArea.extend({ moduleCode: z.enum(MODULE_CODES).optional(), children: z.array(subArea).default([]) }))
    .min(1),
});
export type AreaFile = z.infer<typeof areaFile>;

export type ImportReport = { created: string[]; updated: string[]; removed: string[]; kept: string[] };

type Row = { id: string; parentId: string | null; name: string; code: string | null };

export async function importAreas(db: PrismaClient, input: unknown, { prune = false } = {}): Promise<ImportReport> {
  const file = areaFile.parse(input);
  const report: ImportReport = { created: [], updated: [], removed: [], kept: [] };
  const touched = new Set<string>();

  return db.$transaction(async (tx) => {
    const rows: Row[] = await tx.erpArea.findMany({ select: { id: true, parentId: true, name: true, code: true } });
    const find = (parentId: string | null, item: { name: string; code?: string }) =>
      (item.code ? rows.find((r) => r.code === item.code) : undefined) ??
      rows.find((r) => r.parentId === parentId && r.name.trim().toLowerCase() === item.name.trim().toLowerCase() && !touched.has(r.id));

    const upsert = async (parentId: string | null, item: { name: string; code?: string; moduleCode?: (typeof MODULE_CODES)[number] }, sortOrder: number) => {
      const label = parentId ? `  ${item.name}` : item.name;
      const data = { parentId, name: item.name, code: item.code ?? null, sortOrder, active: true, ...(parentId ? {} : { moduleCode: item.moduleCode ?? null }) };
      const existing = find(parentId, item);
      if (existing) {
        await tx.erpArea.update({ where: { id: existing.id }, data });
        touched.add(existing.id);
        report.updated.push(label);
        return existing.id;
      }
      const { id } = await tx.erpArea.create({ data, select: { id: true } });
      touched.add(id);
      rows.push({ id, parentId, name: item.name, code: item.code ?? null });
      report.created.push(label);
      return id;
    };

    for (const [i, m] of file.modules.entries()) {
      const id = await upsert(null, m, i * 10);
      for (const [j, c] of m.children.entries()) await upsert(id, c, j * 10);
    }

    // Areas no longer in the file: removed only with --prune and only when nobody is assigned, so no history is lost.
    const leftovers = await tx.erpArea.findMany({
      where: { id: { notIn: [...touched] } },
      select: { id: true, name: true, parentId: true, _count: { select: { members: true } } },
      orderBy: { parentId: { sort: "desc", nulls: "last" } }, // sub-modules first
    });
    for (const a of leftovers) {
      const childrenLeft = await tx.erpArea.count({ where: { parentId: a.id } });
      if (prune && a._count.members === 0 && childrenLeft === 0) {
        await tx.erpArea.delete({ where: { id: a.id } });
        report.removed.push(a.name);
      } else {
        report.kept.push(a.name);
      }
    }
    return report;
  });
}
