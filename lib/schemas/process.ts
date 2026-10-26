import { z } from "zod";
import { id, MODULE_CODES, optionalText } from "./common";

export const processStep = z.object({
  name: z.string().trim().min(1, "Step name is required").max(200),
  module: z.enum(MODULE_CODES).optional().nullable().transform((v) => v ?? null),
  handoff: z.boolean().default(false),
});

export type ProcessStep = z.infer<typeof processStep> & { order: number };

export const processInput = z.object({
  moduleId: id,
  name: z.string().trim().min(1, "Name is required").max(100),
  description: optionalText(),
  steps: z
    .array(processStep)
    .min(1, "Add at least one step")
    .transform((steps) => steps.map((s, i): ProcessStep => ({ ...s, order: i + 1 }))),
});

export type ProcessInput = z.infer<typeof processInput>;

export function readSteps(json: unknown): ProcessStep[] {
  const r = z.array(processStep.extend({ order: z.number().int() })).safeParse(json);
  return r.success ? [...r.data].sort((a, b) => a.order - b.order) : [];
}
