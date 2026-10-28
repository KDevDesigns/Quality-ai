import { z } from "zod";
import { MODULE_CODES } from "./common";

export const areaInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .max(20)
    .refine((v) => v === "" || /^[A-Z0-9][A-Z0-9-]{1,19}$/.test(v), "2–20 letters, digits or dashes")
    .transform((v) => (v ? v : null)),
  parentId: z
    .string()
    .trim()
    .transform((v) => (v ? v : null)),
  moduleCode: z
    .union([z.enum(MODULE_CODES), z.literal("")])
    .transform((v) => (v ? v : null)),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  active: z.boolean(),
});

export type AreaInput = z.infer<typeof areaInput>;

export const areaMembersInput = z
  .object({
    areaId: z.string().min(1),
    members: z.array(z.string().min(1)).max(200),
    lead: z
      .string()
      .transform((v) => (v ? v : null)),
  })
  .refine((v) => !v.lead || v.members.includes(v.lead), { message: "The lead must also be a member", path: ["lead"] });
