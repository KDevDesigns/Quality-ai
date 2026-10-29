import { describe, expect, it } from "vitest";
import { ticketCreate, ticketEdit, ticketFilters, transitionInput } from "@/lib/schemas/ticket";

const base = { type: "BUG", title: "Bill total wrong", description: "Steps…", areaId: "", severity: "S2", priority: "P2", foundIn: "", assigneeId: "" };

describe("ticket schemas", () => {
  it("parses a new bug and turns empty fields into null", () => {
    expect(ticketCreate.parse(base)).toEqual({
      type: "BUG",
      title: "Bill total wrong",
      description: "Steps…",
      areaId: null,
      severity: "S2",
      priority: "P2",
      foundIn: null,
      assigneeId: null,
    });
  });

  it("drops severity for suggestions and improvements", () => {
    expect(ticketCreate.parse({ ...base, type: "SUGGESTION" }).severity).toBeNull();
    expect(ticketEdit.parse({ ...base, type: "IMPROVEMENT" }).severity).toBeNull();
  });

  it("rejects short titles, empty descriptions and unknown values", () => {
    expect(ticketCreate.safeParse({ ...base, title: "Bug" }).success).toBe(false);
    expect(ticketCreate.safeParse({ ...base, description: "   " }).success).toBe(false);
    expect(ticketCreate.safeParse({ ...base, type: "TASK" }).success).toBe(false);
    expect(ticketCreate.safeParse({ ...base, severity: "S9" }).success).toBe(false);
  });

  it("parses transitions with an optional duplicate number", () => {
    expect(transitionInput.parse({ to: "DUPLICATE", note: "", duplicateOf: "#12" })).toEqual({ to: "DUPLICATE", note: null, duplicateOf: 12 });
    expect(transitionInput.parse({ to: "FIXED" })).toEqual({ to: "FIXED", note: null, duplicateOf: null });
    expect(transitionInput.safeParse({ to: "DUPLICATE", duplicateOf: "twelve" }).success).toBe(false);
    expect(transitionInput.safeParse({ to: "DONE" }).success).toBe(false);
  });

  it("reads list filters from the URL with safe defaults", () => {
    expect(ticketFilters.parse({})).toEqual({ group: "open", status: null, type: null, area: null, assignee: null, reporter: null, q: "", page: 1 });
    expect(ticketFilters.parse({ group: "done", status: "FIXED", type: "BUG", assignee: "me", page: "3", q: ["#4", "x"] })).toMatchObject({
      group: "done",
      status: "FIXED",
      type: "BUG",
      assignee: "me",
      page: 3,
      q: "#4",
    });
    expect(ticketFilters.parse({ group: "weird", status: "nope", page: "-5" })).toMatchObject({ group: "open", status: null, page: 1 });
  });
});
