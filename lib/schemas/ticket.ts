import { z } from "zod";
import { TICKET_VIEWS, type TicketView } from "@/lib/tickets/board";
import { DEVICE_TYPES, PRIORITIES, SEVERITIES, TICKET_STATUSES, TICKET_TYPES } from "@/lib/tickets/workflow";
import { optionalText } from "./common";

const emptyToNull = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

const ticketFields = z.object({
  type: z.enum(TICKET_TYPES, "Pick a type"),
  title: z.string().trim().min(5, "At least 5 characters").max(150, "At most 150 characters"),
  description: z.string().trim().max(20000, "At most 20,000 characters"),
  areaId: emptyToNull,
  severity: z.union([z.enum(SEVERITIES), z.literal("")]).optional().transform((v) => (v ? v : null)),
  priority: z.enum(PRIORITIES).default("P3"),
  foundIn: optionalText(100),
  deviceType: z.union([z.enum(DEVICE_TYPES), z.literal("")]).nullish().transform((v) => (v ? v : null)),
});

/** Severity and device type only apply to bugs, so they are dropped for suggestions and improvements. */
const bugOnly = <T extends { type: string; severity: string | null; deviceType: string | null }>(v: T): T => (v.type === "BUG" ? v : { ...v, severity: null, deviceType: null });

export const ticketCreate = ticketFields.extend({ assigneeId: emptyToNull }).transform(bugOnly);
export type TicketCreate = z.infer<typeof ticketCreate>;

export const ticketEdit = ticketFields.transform(bugOnly);
export type TicketEdit = z.infer<typeof ticketEdit>;

export const commentInput = z.object({ body: z.string().trim().max(20000, "At most 20,000 characters") });

export const transitionInput = z.object({
  to: z.enum(TICKET_STATUSES),
  note: optionalText(5000),
  duplicateOf: z
    .string()
    .trim()
    .optional()
    .transform((v) => v?.replace(/^#/, "") ?? "")
    .refine((v) => v === "" || /^\d{1,9}$/.test(v), "Enter a ticket number, e.g. 12")
    .transform((v) => (v ? Number(v) : null)),
});
export type TransitionInput = z.infer<typeof transitionInput>;

export const TICKET_GROUPS = ["open", "done", "all"] as const;
export type TicketGroup = (typeof TICKET_GROUPS)[number];

const param = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "");

/** The ticket list's URL filters. Unknown or bad values fall back to the default instead of failing. */
export const ticketFilters = z.object({
  group: param.transform((v) => ((TICKET_GROUPS as readonly string[]).includes(v) ? (v as TicketGroup) : "open")),
  status: param.transform((v) => ((TICKET_STATUSES as readonly string[]).includes(v) ? (v as (typeof TICKET_STATUSES)[number]) : null)),
  type: param.transform((v) => ((TICKET_TYPES as readonly string[]).includes(v) ? (v as (typeof TICKET_TYPES)[number]) : null)),
  area: param.transform((v) => v || null),
  /** A user id, "me" or "none". */
  assignee: param.transform((v) => v || null),
  /** A user id or "me". */
  reporter: param.transform((v) => v || null),
  q: param.transform((v) => v.slice(0, 100)),
  page: param.transform((v) => Math.max(1, Math.min(10000, Number.parseInt(v, 10) || 1))),
  /** "list" or "board" when the address picks one; otherwise the page uses the one last picked (see lib/tickets/board). */
  view: param.transform((v) => ((TICKET_VIEWS as readonly string[]).includes(v) ? (v as TicketView) : null)),
});
export type TicketFilters = z.infer<typeof ticketFilters>;
