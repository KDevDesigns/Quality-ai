import { describe, expect, it } from "vitest";
import { backTarget, isTabRoot, mobileTabFor, mobileTabs, mobileTitle } from "@/components/nav";

describe("phone navigation", () => {
  it("gives every role the same five tabs, Inbox in the middle as the main one", () => {
    for (const role of ["QA", "DEV", "ADMIN"] as const) {
      const tabs = mobileTabs(role);
      expect(tabs.map((t) => t.label)).toEqual(["Home", "Tickets", "Inbox", "DAR", "Settings"]);
      expect(tabs[2].main).toBe(true);
    }
  });

  it("shows the bottom bar only on a tab's own page", () => {
    for (const p of ["/", "/tickets", "/dar", "/settings"]) expect(isTabRoot(p, false)).toBe(true);
    expect(isTabRoot("/inbox", false)).toBe(true);
    expect(isTabRoot("/inbox", true)).toBe(false); // an open conversation
    for (const p of ["/tickets/12", "/tickets/new", "/dar/setup", "/account", "/team", "/admin/users"]) expect(isTabRoot(p, false)).toBe(false);
  });

  it("lights Settings for the pages reached from it", () => {
    expect(mobileTabFor("/account")).toBe("/settings");
    expect(mobileTabFor("/team")).toBe("/settings");
    expect(mobileTabFor("/admin/users")).toBe("/settings");
    expect(mobileTabFor("/tickets/12")).toBe("/tickets");
    expect(mobileTabFor("/dar/setup")).toBe("/dar");
    expect(mobileTabFor("/")).toBe("/");
  });

  it("goes back up to the parent page, named", () => {
    expect(backTarget("/tickets/12")).toEqual({ href: "/tickets", label: "Tickets" });
    expect(backTarget("/tickets/new")).toEqual({ href: "/tickets", label: "Tickets" });
    expect(backTarget("/dar/setup")).toEqual({ href: "/dar", label: "My DAR" });
    expect(backTarget("/inbox")).toEqual({ href: "/inbox", label: "Inbox" });
    expect(backTarget("/account")).toEqual({ href: "/settings", label: "Settings" });
    expect(backTarget("/admin/users")).toEqual({ href: "/settings", label: "Settings" });
  });

  it("titles inner pages briefly", () => {
    const q = (s = "") => new URLSearchParams(s);
    expect(mobileTitle("/tickets/128", q())).toBe("#128");
    expect(mobileTitle("/inbox", q("t=42"))).toBe("#42");
    expect(mobileTitle("/tickets/new", q())).toBe("New ticket");
    expect(mobileTitle("/account", q("tab=sound"))).toBe("Sound");
    expect(mobileTitle("/account", q())).toBe("My account");
    expect(mobileTitle("/team", q())).toBe("Team & modules");
  });
});
