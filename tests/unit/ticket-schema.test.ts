import { describe, expect, it } from "vitest";
import { ticketCreate, ticketEdit, ticketFilters, transitionInput } from "@/lib/schemas/ticket";

const base = { type: "BUG", title: "Bill total wrong", description: "Steps…", areaId: "a1", category: "BACK_END", uploadIds: ["u1"], severity: "S2", priority: "P2", foundIn: "", assigneeId: "" };

describe("ticket schemas", () => {
  it("parses a new bug and turns empty fields into null", () => {
    expect(ticketCreate.parse(base)).toEqual({
      type: "BUG",
      title: "Bill total wrong",
      description: "Steps…",
      areaId: "a1",
      category: "BACK_END",
      uploadIds: ["u1"],
      severity: "S2",
      priority: "P2",
      foundIn: null, deviceType: null,
      assigneeId: null,
    });
  });

  it("refuses a new ticket with no module, category or attachment, each with its own message", () => {
    const errors = (over: object) => ticketCreate.safeParse({ ...base, ...over }).error?.flatten().fieldErrors;
    expect(errors({ areaId: "" })).toEqual({ areaId: ["Choose a module"] });
    expect(errors({ category: "" })).toEqual({ category: ["Choose a category"] });
    expect(errors({ category: "DESIGN" })).toEqual({ category: ["Choose a category"] });
    expect(errors({ uploadIds: [] })).toEqual({ uploadIds: ["Add at least one screenshot or video."] });
  });

  it("leaves module free when editing, for older tickets", () => {
    expect(ticketEdit.parse({ ...base, areaId: "" }).areaId).toBeNull();
  });

  it("drops severity for suggestions and improvements", () => {
    expect(ticketCreate.parse({ ...base, type: "SUGGESTION" }).severity).toBeNull();
    expect(ticketEdit.parse({ ...base, type: "IMPROVEMENT" }).severity).toBeNull();
  });

  it("lets the description be empty, but not too long", () => {
    expect(ticketCreate.parse({ ...base, description: "   " }).description).toBe("");
    expect(ticketEdit.parse({ ...base, description: "" }).description).toBe("");
    expect(ticketCreate.safeParse({ ...base, description: "x".repeat(20001) }).success).toBe(false);
  });

  it("rejects short titles and unknown values", () => {
    expect(ticketCreate.safeParse({ ...base, title: "Bug" }).success).toBe(false);
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
    expect(ticketFilters.parse({})).toEqual({ group: "open", status: null, type: null, area: null, category: null, assignee: null, reporter: null, q: "", page: 1, view: null });
    expect(ticketFilters.parse({ group: "done", status: "FIXED", type: "BUG", assignee: "me", page: "3", q: ["#4", "x"] })).toMatchObject({
      group: "done",
      status: "FIXED",
      type: "BUG",
      assignee: "me",
      page: 3,
      q: "#4",
    });
    expect(ticketFilters.parse({ group: "weird", status: "nope", page: "-5" })).toMatchObject({ group: "open", status: null, page: 1 });
    expect(ticketFilters.parse({ category: "UI_UX" }).category).toBe("UI_UX");
    expect(ticketFilters.parse({ category: "none" }).category).toBe("none");
    expect(ticketFilters.parse({ category: "design" }).category).toBeNull();
    expect(ticketFilters.parse({ view: "board" }).view).toBe("board");
    expect(ticketFilters.parse({ view: "gantt" }).view).toBeNull();
    expect(ticketFilters.parse({ status: "TO_START" }).status).toBe("TO_START");
  });
});
