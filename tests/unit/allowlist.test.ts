import { describe, expect, it } from "vitest";
import { AllowlistError, assertUrlAllowed, isUrlAllowed, validateBaseUrl, type GuardEnv } from "@/lib/guard/allowlist";

const staging: GuardEnv = {
  name: "staging",
  isProduction: false,
  baseUrls: ["https://erp-staging.example.local", "https://portal.example.local/erp"],
  apiBaseUrl: "https://api-staging.example.local:8443/v1",
};

const allowed = (url: string, env = staging) => isUrlAllowed(url, env).ok;

describe("isUrlAllowed — accepts", () => {
  it.each([
    ["exact base", "https://erp-staging.example.local"],
    ["base with trailing slash", "https://erp-staging.example.local/"],
    ["deep path under a root base", "https://erp-staging.example.local/billing/accounts/123?tab=ledger#x"],
    ["explicit default port", "https://erp-staging.example.local:443/login"],
    ["uppercase host", "https://ERP-Staging.Example.LOCAL/login"],
    ["exact path base", "https://portal.example.local/erp"],
    ["path under a path base", "https://portal.example.local/erp/billing"],
    ["apiBaseUrl", "https://api-staging.example.local:8443/v1/bills"],
  ])("%s", (_label, url) => {
    expect(isUrlAllowed(url, staging)).toEqual({ ok: true });
  });
});

describe("isUrlAllowed — rejects", () => {
  it.each([
    ["production host", "https://erp.example.local/"],
    ["scheme downgrade", "http://erp-staging.example.local/"],
    ["different port", "https://erp-staging.example.local:8080/"],
    ["lookalike subdomain of attacker", "https://erp-staging.example.local.evil.com/"],
    ["subdomain of the base host", "https://admin.erp-staging.example.local/"],
    ["suffix host", "https://evil-erp-staging.example.local/"],
    ["userinfo trick", "https://erp-staging.example.local@evil.com/"],
    ["credentials on the real host", "https://user:pass@erp-staging.example.local/"],
    ["javascript: URL", "javascript:alert(1)"],
    ["file: URL", "file:///C:/Windows/win.ini"],
    ["relative URL", "/billing/accounts"],
    ["empty string", ""],
    ["path-prefix sibling", "https://portal.example.local/erp-evil/billing"],
    ["dot-segment escape", "https://portal.example.local/erp/../admin"],
    ["encoded-free escape outside path base", "https://portal.example.local/admin"],
    ["api host without api path", "https://api-staging.example.local:8443/admin"],
    ["api host default port", "https://api-staging.example.local/v1"],
    ["IDN lookalike (Cyrillic а)", "https://erp-st\u0430ging.example.local/"],
  ])("%s", (_label, url) => {
    const r = isUrlAllowed(url, staging);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.length).toBeGreaterThan(0);
  });

  it("rejects every URL when the environment is production", () => {
    const prod = { ...staging, name: "prod", isProduction: true };
    const r = isUrlAllowed("https://erp-staging.example.local/", prod);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/production/);
  });

  it("rejects when the allowlist is empty", () => {
    expect(allowed("https://erp-staging.example.local/", { name: "x", isProduction: false, baseUrls: [] })).toBe(false);
  });

  it("ignores malformed allowlist entries instead of matching them loosely", () => {
    const env: GuardEnv = { name: "x", isProduction: false, baseUrls: ["erp-staging.example.local", "ftp://erp-staging.example.local"] };
    expect(allowed("https://erp-staging.example.local/", env)).toBe(false);
  });
});

describe("assertUrlAllowed", () => {
  it("throws AllowlistError with the env name", () => {
    expect(() => assertUrlAllowed("https://evil.com", staging)).toThrow(AllowlistError);
    expect(() => assertUrlAllowed("https://evil.com", staging)).toThrow(/staging/);
  });

  it("does not throw for an allowed URL", () => {
    expect(() => assertUrlAllowed("https://erp-staging.example.local/x", staging)).not.toThrow();
  });
});

describe("validateBaseUrl", () => {
  it.each([
    ["https://erp-staging.example.local", true],
    ["http://10.0.0.5:8080/erp", true],
    ["erp-staging.example.local", false],
    ["ftp://erp-staging.example.local", false],
    ["https://u:p@erp-staging.example.local", false],
    ["https://erp-staging.example.local/?x=1", false],
  ])("%s -> %s", (url, ok) => {
    expect(validateBaseUrl(url).ok).toBe(ok);
  });
});
