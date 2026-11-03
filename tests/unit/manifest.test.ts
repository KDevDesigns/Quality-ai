import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("web app manifest", () => {
  const m = manifest();

  it("installs as its own app across the whole site", () => {
    expect(m.id).toBe("/");
    expect(m.scope).toBe("/");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
  });

  it("has the icon sizes browsers need, and a maskable one for Android", () => {
    const icons = m.icons ?? [];
    expect(icons.filter((i) => i.purpose === "any").map((i) => i.sizes)).toEqual(["192x192", "512x512"]);
    expect(icons.some((i) => i.purpose === "maskable" && i.sizes === "512x512")).toBe(true);
  });

  it("only names icon files that exist", () => {
    for (const icon of m.icons ?? []) expect(existsSync(join(process.cwd(), "public", icon.src))).toBe(true);
  });
});
