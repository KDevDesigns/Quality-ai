import { describe, expect, it } from "vitest";
import { pageList } from "@/lib/tickets/pager";

describe("pageList", () => {
  it("shows nothing for a single page", () => {
    expect(pageList(1, 1)).toEqual([]);
    expect(pageList(1, 0)).toEqual([]);
  });

  it("shows every page when there are few", () => {
    expect(pageList(1, 3)).toEqual([1, 2, 3]);
    expect(pageList(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("puts gaps around the current page when there are many", () => {
    expect(pageList(6, 12)).toEqual([1, "gap", 5, 6, 7, "gap", 12]);
    expect(pageList(1, 12)).toEqual([1, 2, "gap", 12]);
    expect(pageList(12, 12)).toEqual([1, "gap", 11, 12]);
  });

  it("shows a single missing page instead of a gap", () => {
    expect(pageList(4, 12)).toEqual([1, 2, 3, 4, 5, "gap", 12]);
  });

  it("keeps a page out of range inside the list", () => {
    expect(pageList(99, 4)).toEqual([1, 2, 3, 4]);
  });
});
