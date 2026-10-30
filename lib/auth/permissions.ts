export const ROLES = ["ADMIN", "QA", "DEV"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = { ADMIN: "Admin", QA: "QA tester", DEV: "Developer" };

/** Every permission check in the app goes through this matrix. Per-ticket rules (assignee, reporter) are in lib/tickets/workflow.ts. */
const MATRIX = {
  "team.view": ["ADMIN", "QA", "DEV"],
  /** Opening the ticket pages. Which tickets each person sees is decided by ticketScope in lib/tickets/workflow.ts. */
  "tickets.view": ["ADMIN", "QA", "DEV"],
  /** Every ticket, not just your own. */
  "tickets.viewAll": ["ADMIN"],
  /** Filing, editing and deleting tickets is for QA testers (their own) and admins. */
  "tickets.create": ["ADMIN", "QA"],
  "tickets.delete": ["ADMIN", "QA"],
  "tickets.comment": ["ADMIN", "QA", "DEV"],
  "tickets.assign": ["ADMIN", "QA"],
  "tickets.resolve": ["ADMIN", "DEV"],
  "tickets.verify": ["ADMIN", "QA"],
  "areas.manage": ["ADMIN"],
  "users.manage": ["ADMIN"],
  "projects.manage": ["ADMIN"],
  "workspace.manage": ["ADMIN"],
  /** Your own Daily Accomplishment Report. Nobody else, admins included, sees a tester's DAR. */
  "dar.use": ["QA"],
  /** The DAR template: department, unit, signatories and the duties and MFOs. */
  "dar.template": ["ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Action = keyof typeof MATRIX;
export const ACTIONS = Object.keys(MATRIX) as Action[];

export function can(user: { role: Role } | null | undefined, action: Action): boolean {
  return !!user && (MATRIX[action] as readonly Role[]).includes(user.role);
}

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}
