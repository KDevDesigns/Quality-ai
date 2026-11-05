import { describe, expect, it } from "vitest";
import { buildActivityLog, type LogInput } from "@/lib/tickets/log";

const at = (min: number, sec = 0) => new Date(Date.UTC(2026, 9, 29, 1, min, sec));
const ana = { name: "Ana" };
const ben = { name: "Ben" };
const ev = (id: string, min: number, kind: string, extra: Partial<LogInput["events"][number]> = {}) => ({
  id, kind, field: null, from: null, to: null, note: null, createdAt: at(min), actor: ana, ...extra,
});

describe("buildActivityLog", () => {
  it("lists every movement oldest first with readable text", () => {
    const log = buildActivityLog({
      events: [
        ev("e1", 0, "CREATED"),
        ev("e2", 0, "ASSIGNEE", { to: "Ben" }),
        ev("e3", 5, "STATUS", { from: "NEW", to: "NEED_INFO", note: "Which month?", actor: ben }),
        ev("e4", 9, "FIELD", { field: "severity", from: "S3 Minor", to: "S1 Critical" }),
        ev("e5", 10, "FIELD", { field: "description" }),
        ev("e6", 12, "ASSIGNEE", { from: "Ben", to: "Cy" }),
        ev("e7", 13, "ASSIGNEE", { from: "Cy", to: null }),
        ev("e8", 20, "STATUS", { from: "FIXED", to: "CLOSED" }),
      ],
      comments: [
        { id: "c1", body: "October", createdAt: at(7), author: ana, attachments: [] },
        { id: "c2", body: "", createdAt: at(8), author: ana, attachments: [{}, {}] },
        { id: "c3", body: "See this", createdAt: at(11), author: ben, attachments: [{}] },
      ],
      attachments: [
        { id: "a1", createdAt: at(0, 0), uploader: ana },
        { id: "a2", createdAt: at(0, 0), uploader: ana },
      ],
    });
    expect(log.map((e) => `${e.who}: ${e.text}`)).toEqual([
      "Ana: filed this ticket",
      "Ana: added 2 screenshots",
      "Ana: assigned this to Ben",
      "Ben: moved this to Needs info",
      "Ana: replied",
      "Ana: posted 2 images",
      "Ana: changed the severity from S3 Minor to S1 Critical",
      "Ana: edited the description",
      "Ben: replied, with 1 image",
      "Ana: reassigned this from Ben to Cy",
      "Ana: unassigned Cy",
      "Ana: moved this to Closed",
    ]);
    expect(log[3].note).toBe("Which month?");
  });

  it("handles a ticket with nothing but its creation", () => {
    expect(buildActivityLog({ events: [ev("e1", 0, "CREATED")], comments: [], attachments: [] })).toHaveLength(1);
  });

  it("names videos", () => {
    const ana = { name: "Ana" };
    const at = new Date("2026-10-29T01:00:00Z");
    const log = buildActivityLog({
      events: [],
      comments: [
        { id: "c1", body: "", createdAt: at, author: ana, attachments: [{ kind: "VIDEO" }] },
        { id: "c2", body: "See", createdAt: at, author: ana, attachments: [{ kind: "IMAGE" }, { kind: "VIDEO" }] },
      ],
      attachments: [
        { id: "a1", kind: "IMAGE", createdAt: at, uploader: ana },
        { id: "a2", kind: "VIDEO", createdAt: at, uploader: ana },
      ],
    });
    expect(log.map((e) => e.text)).toEqual(["added 1 screenshot and a screen recording", "posted a video", "replied, with 1 image and a video"]);
  });
});
