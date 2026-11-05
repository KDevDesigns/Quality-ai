// The activity log on each ticket: every movement in one list with exact times, built from the timeline events,
// the replies and the attachments, so older tickets get a full log too. Pure function, unit-tested.

import { STATUS_LABELS, type TicketStatus } from "./workflow";

export type LogInput = {
  events: { id: string; kind: string; field: string | null; from: string | null; to: string | null; note: string | null; createdAt: Date; actor: { name: string } }[];
  comments: { id: string; body: string; createdAt: Date; author: { name: string }; attachments: { kind?: string }[] }[];
  /** Attachments added with the ticket itself (not with a reply). */
  attachments: { id: string; kind?: string; createdAt: Date; uploader: { name: string } }[];
};

export type LogEntry = { id: string; at: Date; who: string; kind: "created" | "status" | "assignee" | "field" | "reply" | "attachment"; text: string; note?: string };

const status = (s: string | null) => (s ? (STATUS_LABELS[s as TicketStatus] ?? s) : "?");
const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

/** "2 images", "a video", "1 screenshot and a screen recording". */
function describeFiles(files: { kind?: string }[], image = "image", video = "video"): string {
  const videos = files.filter((f) => f.kind === "VIDEO").length;
  const images = files.length - videos;
  return [images ? plural(images, image) : "", videos ? (videos === 1 ? `a ${video}` : plural(videos, video)) : ""].filter(Boolean).join(" and ");
}

export function buildActivityLog(t: LogInput): LogEntry[] {
  const out: LogEntry[] = [];

  for (const e of t.events) {
    const base = { id: e.id, at: e.createdAt, who: e.actor.name };
    if (e.kind === "CREATED") out.push({ ...base, kind: "created", text: "filed this ticket" });
    else if (e.kind === "STATUS") out.push({ ...base, kind: "status", text: `moved this to ${status(e.to)}`, note: e.note ?? undefined });
    else if (e.kind === "ASSIGNEE") {
      const text = !e.to ? `unassigned ${e.from ?? "the developer"}` : e.from ? `reassigned this from ${e.from} to ${e.to}` : `assigned this to ${e.to}`;
      out.push({ ...base, kind: "assignee", text });
    } else if (e.kind === "FIELD") {
      const text = e.field === "description" ? "edited the description" : `changed the ${e.field} from ${e.from ?? "none"} to ${e.to ?? "none"}`;
      out.push({ ...base, kind: "field", text });
    }
  }

  for (const c of t.comments) {
    const files = describeFiles(c.attachments);
    const text = c.body ? (files ? `replied, with ${files}` : "replied") : `posted ${files}`;
    out.push({ id: c.id, at: c.createdAt, who: c.author.name, kind: "reply", text });
  }

  // Files posted together (same person, same second) are one entry.
  const groups = new Map<string, { id: string; at: Date; who: string; files: { kind?: string }[] }>();
  for (const a of t.attachments) {
    const key = `${a.uploader.name}@${Math.floor(a.createdAt.getTime() / 1000)}`;
    const g = groups.get(key);
    if (g) g.files.push(a);
    else groups.set(key, { id: a.id, at: a.createdAt, who: a.uploader.name, files: [a] });
  }
  for (const g of groups.values()) out.push({ id: g.id, at: g.at, who: g.who, kind: "attachment", text: `added ${describeFiles(g.files, "screenshot", "screen recording")}` });

  // Oldest first; at the same moment, "filed" comes before what was filed with it.
  const order: Record<LogEntry["kind"], number> = { created: 0, attachment: 1, assignee: 2, field: 3, status: 4, reply: 5 };
  return out.sort((a, b) => a.at.getTime() - b.at.getTime() || order[a.kind] - order[b.kind]);
}
