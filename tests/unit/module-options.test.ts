import { describe, expect, it } from "vitest";
import { moduleOptions } from "@/lib/areas/tree";

const areas = [
  { id: "b", name: "Billing", children: [{ id: "p", name: "Posting" }, { id: "c", name: "Collection" }] },
  { id: "m", name: "Meter Reading", children: [] },
];

describe("moduleOptions", () => {
  it("lists each module with its sub-modules under it, in order", () => {
    const groups = moduleOptions(areas, "whole module");
    expect(groups.map((g) => g.options.map((o) => `${o.tree.level}:${o.tree.name}`))).toEqual([["0:Billing", "1:Posting", "1:Collection"], ["0:Meter Reading"]]);
    expect(groups.every((g) => g.rule)).toBe(true);
  });

  it("names a chosen sub-module with the module it comes from", () => {
    const [billing] = moduleOptions(areas, "all");
    expect(billing.options.map((o) => o.label)).toEqual(["Billing (all)", "Billing › Posting", "Billing › Collection"]);
    expect(billing.options[0].tree).toEqual({ name: "Billing", level: 0, note: "all" });
  });
});
