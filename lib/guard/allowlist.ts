export type GuardEnv = {
  name: string;
  isProduction: boolean;
  baseUrls: readonly string[];
  apiBaseUrl?: string | null;
};

export type GuardResult = { ok: true } | { ok: false; reason: string };

export class AllowlistError extends Error {
  constructor(
    public readonly url: string,
    public readonly envName: string,
    reason: string,
  ) {
    super(`Blocked by allowlist for environment "${envName}": ${reason}`);
    this.name = "AllowlistError";
  }
}

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

function parseAbsolute(raw: string): URL | null {
  try {
    return new URL(raw.trim());
  } catch {
    return null;
  }
}

function trimTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export function validateBaseUrl(raw: string): GuardResult {
  const u = parseAbsolute(raw);
  if (!u) return { ok: false, reason: `"${raw}" is not an absolute URL` };
  if (!ALLOWED_PROTOCOLS.has(u.protocol)) return { ok: false, reason: `"${raw}" must use http or https` };
  if (u.username || u.password) return { ok: false, reason: `"${raw}" must not contain credentials` };
  if (u.search || u.hash) return { ok: false, reason: `"${raw}" must not contain a query or fragment` };
  return { ok: true };
}

function matchesBase(target: URL, base: URL): boolean {
  // URL.origin lowercases the host, punycodes IDNs and drops default ports, so this is an exact origin match.
  if (target.origin !== base.origin) return false;
  const basePath = trimTrailingSlash(base.pathname);
  if (basePath === "/") return true;
  // pathname is already normalized ("/erp/../admin" -> "/admin"), so a prefix check cannot be escaped with dot segments.
  return target.pathname === basePath || target.pathname.startsWith(basePath + "/");
}

export function isUrlAllowed(url: string, env: GuardEnv): GuardResult {
  if (env.isProduction) {
    return { ok: false, reason: `"${env.name}" is a production environment and can never be a test target` };
  }

  const target = parseAbsolute(url);
  if (!target) return { ok: false, reason: "not an absolute URL" };
  if (!ALLOWED_PROTOCOLS.has(target.protocol)) return { ok: false, reason: `protocol ${target.protocol} is not allowed` };
  if (target.username || target.password) return { ok: false, reason: "URLs with embedded credentials are not allowed" };

  const entries = [...env.baseUrls, ...(env.apiBaseUrl ? [env.apiBaseUrl] : [])];
  const bases = entries.filter((e) => validateBaseUrl(e).ok).map((e) => new URL(e.trim()));
  if (bases.length === 0) return { ok: false, reason: `environment "${env.name}" has no valid allowlisted base URLs` };

  if (bases.some((b) => matchesBase(target, b))) return { ok: true };
  return { ok: false, reason: `${target.origin}${target.pathname} is outside the allowlist of "${env.name}"` };
}

export function assertUrlAllowed(url: string, env: GuardEnv): void {
  const r = isUrlAllowed(url, env);
  if (!r.ok) throw new AllowlistError(url, env.name, r.reason);
}
