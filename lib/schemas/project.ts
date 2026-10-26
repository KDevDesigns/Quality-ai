import { z } from "zod";
import { optionalText } from "./common";

export const projectInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: optionalText(),
});

export type ProjectInput = z.infer<typeof projectInput>;
