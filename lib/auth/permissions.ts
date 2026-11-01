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
  /** Your own Daily Accomplishment Report, set up under My details. Each person sees only their own, admins included. */
  "dar.use": ["QA", "DEV", "ADMIN"],
  /** Sending UI/UX designs for approval: no role has it by itself, only the Designer tick-box (FLAG_GRANTS). */
  "designs.create": [],
  /** Every design review, not just the ones you design or approve. */
  "designs.viewAll": ["ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Action = keyof typeof MATRIX;
export const ACTIONS = Object.keys(MATRIX) as Action[];

/** Ticked on the account in Admin → Users, on top of the role. */
type Flag = "designer";

/** Actions an account's tick-box grants whatever its role. */
const FLAG_GRANTS: Partial<Record<Action, Flag>> = { "designs.create": "designer" };

export function can(user: { role: Role; designer?: boolean } | null | undefined, action: Action): boolean {
  if (!user) return false;
  const flag = FLAG_GRANTS[action];
  return (MATRIX[action] as readonly Role[]).includes(user.role) || (!!flag && user[flag] === true);
}

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}
