import { z } from "zod";

export const workspaceSettings = z.object({
  /** Shows the AI workbench (environments, processes, risks, test design, AI settings) to admins. Off by default. */
  aiWorkbench: z.boolean().default(false),
});

export type WorkspaceSettings = z.infer<typeof workspaceSettings>;

/** Stored JSON that no longer matches the schema falls back to the defaults instead of breaking every page. */
export function readWorkspaceSettings(value: unknown): WorkspaceSettings {
  const r = workspaceSettings.safeParse(value ?? {});
  return r.success ? r.data : workspaceSettings.parse({});
}
