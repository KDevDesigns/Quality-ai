import { z } from "zod";
import { MODULE_CODES, type ModuleCodeValue } from "@/lib/schemas/common";
import { normalizeTags, PRIORITIES, TECHNIQUES, TEST_TYPES, type TestCaseInput } from "@/lib/schemas/test-case";

const catalogCase = z.object({
  title: z.string().min(1).max(200),
  technique: z.enum(TECHNIQUES),
  priority: z.enum(PRIORITIES),
  type: z.enum(TEST_TYPES),
  preconditions: z.string().max(2000).optional(),
  steps: z.array(z.string().min(1).max(500)).min(1),
  expected: z.string().min(1).max(2000),
  tags: z.array(z.string()).default([]),
});

const catalogArea = z.object({
  title: z.string().min(1).max(200),
  module: z.enum(MODULE_CODES).nullable(),
  process: z.string().nullable(),
  summary: z.string().min(20),
  cases: z.array(catalogCase).min(1),
});

export const seedCatalog = z.object({ version: z.literal(1), source: z.string(), areas: z.array(catalogArea).min(1) });
export type SeedCatalog = z.infer<typeof seedCatalog>;

export type SeedRequirement = {
  title: string;
  text: string;
  moduleId: string | null;
  processId: string | null;
  cases: TestCaseInput[];
};

export interface CatalogStore {
  seedTitles(): Promise<Set<string>>;
  moduleIds(): Promise<Partial<Record<ModuleCodeValue, string>>>;
  processIds(): Promise<Record<string, string>>;
  createSeedRequirement(req: SeedRequirement): Promise<void>;
}

/** Imports PLAN §6.4 + BCA scenarios as seed requirements with DRAFT cases. Areas already imported (by title) are skipped. */
export async function importCatalog(raw: unknown, store: CatalogStore) {
  const catalog = seedCatalog.parse(raw);
  const [existing, modules, processes] = await Promise.all([store.seedTitles(), store.moduleIds(), store.processIds()]);

  let created = 0;
  let skipped = 0;
  let cases = 0;
  for (const area of catalog.areas) {
    if (existing.has(area.title)) {
      skipped++;
      continue;
    }
    const text = `${area.summary}\n\nSeed scenarios (${catalog.source}):\n${area.cases.map((c) => `- ${c.title}`).join("\n")}`;
    await store.createSeedRequirement({
      title: area.title,
      text,
      moduleId: area.module ? (modules[area.module] ?? null) : null,
      processId: area.process ? (processes[area.process] ?? null) : null,
      cases: area.cases.map((c) => ({ ...c, preconditions: c.preconditions ?? null, tags: normalizeTags(c.tags) })),
    });
    created++;
    cases += area.cases.length;
  }
  return { created, skipped, cases };
}
