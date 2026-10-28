export const ROLES = ["ADMIN", "QA", "DEV"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = { ADMIN: "Admin", QA: "QA tester", DEV: "Developer" };

/** Every permission check in the app goes through this matrix. Ticket actions are added in Phase 3.5b. */
const MATRIX = {
  "team.view": ["ADMIN", "QA", "DEV"],
  "areas.manage": ["ADMIN"],
  "users.manage": ["ADMIN"],
  "projects.manage": ["ADMIN"],
  "workspace.manage": ["ADMIN"],
  "aiWorkbench.use": ["ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Action = keyof typeof MATRIX;
export const ACTIONS = Object.keys(MATRIX) as Action[];

export function can(user: { role: Role } | null | undefined, action: Action): boolean {
  return !!user && (MATRIX[action] as readonly Role[]).includes(user.role);
}

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}
