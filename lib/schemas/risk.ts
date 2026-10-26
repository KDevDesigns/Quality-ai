import { z } from "zod";
import { id, optionalText } from "./common";

/** ISO/IEC 25010:2023 product quality characteristics. */
export const ISO25010_CHARACTERISTICS = [
  "Functional suitability",
  "Performance efficiency",
  "Compatibility",
  "Interaction capability",
  "Reliability",
  "Security",
  "Maintainability",
  "Flexibility",
  "Safety",
] as const;

const level = z.coerce.number().int("Must be a whole number").min(1, "Min 1").max(5, "Max 5");

export const riskInput = z.object({
  moduleId: id,
  processId: optionalText(100),
  title: z.string().trim().min(1, "Title is required").max(200),
  characteristic: z.enum(ISO25010_CHARACTERISTICS),
  likelihood: level,
  impact: level,
  mitigation: optionalText(),
});

export type RiskInput = z.infer<typeof riskInput>;
